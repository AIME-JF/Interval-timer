/**
 * 间隔时钟 - 应用主逻辑
 * 管理用药状态机、UI 更新和用户交互
 */

// ============================================
// 状态枚举
// ============================================
const State = {
    IDLE: 'idle',
    WAITING: 'waiting',
    COUNTING: 'counting',
    ALERT: 'alert',
    COMPLETE: 'complete'
};

// ============================================
// 应用类
// ============================================
class App {
    constructor() {
        this.state = State.IDLE;
        this.currentMedicineIndex = 0;  // 当前药物索引 (0-3)
        this.timer = new Timer();
        this.configManager = new ConfigManager();
        this.settingsVisible = false;
        this.isAlwaysOnTop = true;

        // 环形进度条参数
        this.ringCircumference = 2 * Math.PI * 52; // SVG 半径 52

        // DOM 缓存
        this.els = {};

        this.init();
    }

    async init() {
        await this.configManager.load();
        this.cacheElements();
        this.bindEvents();
        this.setupTimer();
        this.updateIdleView();
        this.setupKeyboard();
        await this.initPinState();
    }

    async initPinState() {
        if (window.electronAPI) {
            this.isAlwaysOnTop = await window.electronAPI.getAlwaysOnTop();
            this.updatePinButton();
        }
    }

    updatePinButton() {
        const btn = this.els['btn-pin'];
        if (btn) {
            if (this.isAlwaysOnTop) {
                btn.classList.add('active');
                btn.title = '已置顶';
            } else {
                btn.classList.remove('active');
                btn.title = '未置顶';
            }
        }
    }

    // ============================================
    // DOM 操作
    // ============================================

    cacheElements() {
        const ids = [
            'state-idle', 'state-waiting', 'state-counting', 'state-alert', 'state-complete',
            'progress-count', 'medicine-index', 'medicine-name',
            'counting-index', 'timer-text', 'timer-ring-progress', 'next-medicine-name',
            'alert-index', 'alert-medicine-name',
            'complete-progress',
            'btn-start', 'btn-confirm', 'btn-pause', 'btn-confirm-next', 'btn-back',
            'btn-minimize', 'btn-close', 'btn-toggle-settings', 'btn-pin',
            'settings-panel', 'interval-slider', 'interval-value', 'medicine-list',
            'sound-toggle', 'btn-save-settings', 'btn-reset-today', 'main-view',
            'btn-settings-back'
        ];
        ids.forEach(id => {
            this.els[id] = document.getElementById(id);
        });
    }

    showState(stateName) {
        ['idle', 'waiting', 'counting', 'alert', 'complete'].forEach(s => {
            const el = this.els[`state-${s}`];
            if (el) el.classList.toggle('hidden', s !== stateName);
        });

        // 动态调整窗口大小
        const heights = {
            idle: 150,
            waiting: 180,
            counting: 260,
            alert: 200,
            complete: 170
        };
        const height = heights[stateName] || 180;
        if (window.electronAPI) {
            window.electronAPI.resizeWindow(280, height);
        }
    }

    // ============================================
    // 事件绑定
    // ============================================

    bindEvents() {
        // 开始用药
        this.els['btn-start'].addEventListener('click', () => this.startSession());

        // 确认已滴药（等待状态）
        this.els['btn-confirm'].addEventListener('click', () => this.confirmDrop());

        // 暂停/恢复倒计时
        this.els['btn-pause'].addEventListener('click', () => this.togglePause());

        // 确认已滴药（提醒状态）
        this.els['btn-confirm-next'].addEventListener('click', () => this.confirmDrop());

        // 返回空闲
        this.els['btn-back'].addEventListener('click', () => this.backToIdle());

        // 标题栏按钮
        this.els['btn-minimize'].addEventListener('click', () => {
            if (window.electronAPI) {
                window.electronAPI.minimizeWindow();
            }
        });

        this.els['btn-close'].addEventListener('click', () => {
            window.close(); // main.js 里 close 事件会 prevent 并 hide 到托盘
        });

        // 置顶切换
        this.els['btn-pin'].addEventListener('click', async () => {
            if (window.electronAPI) {
                this.isAlwaysOnTop = await window.electronAPI.toggleAlwaysOnTop();
                this.updatePinButton();
            }
        });

        // 设置切换
        this.els['btn-toggle-settings'].addEventListener('click', () => this.toggleSettings());

        // 间隔时间滑块
        this.els['interval-slider'].addEventListener('input', (e) => {
            this.els['interval-value'].textContent = `${e.target.value} 分钟`;
        });

        // 返回按钮（关闭设置不保存，丢弃修改）
        this.els['btn-settings-back'].addEventListener('click', async () => {
            await this.configManager.load();  // 重新加载配置，丢弃内存中的修改
            this.toggleSettings();
        });

        // 保存设置
        this.els['btn-save-settings'].addEventListener('click', () => this.saveSettings());

        // 重置今日记录
        this.els['btn-reset-today'].addEventListener('click', () => {
            this.configManager.resetToday();
            this.timer.reset();
            this.state = State.IDLE;
            this.toggleSettings();
            this.updateIdleView();
        });

        // 全局快捷键（来自主进程）
        if (window.electronAPI) {
            window.electronAPI.onShortcut((action) => {
                if (action === 'confirm') {
                    this.handleConfirmShortcut();
                }
            });
        }
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.settingsVisible) {
                e.preventDefault();
                this.handleConfirmShortcut();
            }
            if (e.code === 'Escape') {
                if (this.settingsVisible) {
                    this.toggleSettings();
                } else if (this.state === State.COUNTING) {
                    this.togglePause();
                }
            }
        });
    }

    handleConfirmShortcut() {
        switch (this.state) {
            case State.IDLE:
                this.startSession();
                break;
            case State.WAITING:
                this.confirmDrop();
                break;
            case State.ALERT:
                this.confirmDrop();
                break;
            case State.COMPLETE:
                this.backToIdle();
                break;
        }
    }

    // ============================================
    // 倒计时相关
    // ============================================

    setupTimer() {
        this.timer.onTick = (remainingMs) => {
            this.updateTimerDisplay(remainingMs);
        };

        this.timer.onComplete = () => {
            this.onTimerComplete();
        };
    }

    updateTimerDisplay(remainingMs) {
        const totalSeconds = Math.ceil(remainingMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        this.els['timer-text'].textContent = timeStr;

        // 更新环形进度条
        const progress = this.timer.getProgress();
        const offset = this.ringCircumference * (1 - progress);
        this.els['timer-ring-progress'].style.strokeDasharray = this.ringCircumference;
        this.els['timer-ring-progress'].style.strokeDashoffset = offset;
    }

    // ============================================
    // 提示音
    // ============================================

    playNotificationSound() {
        if (!this.configManager.config.soundEnabled) return;

        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // 第一声 "叮"
            this._playTone(audioCtx, 800, 0, 0.15);
            // 第二声 "叮"（更高一点）
            this._playTone(audioCtx, 1000, 0.25, 0.15);

            // 清理
            setTimeout(() => audioCtx.close(), 1000);
        } catch (e) {
            console.warn('播放提示音失败:', e);
        }
    }

    _playTone(audioCtx, freq, startTime, duration) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);

        // 柔和的包络
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);

        oscillator.start(audioCtx.currentTime + startTime);
        oscillator.stop(audioCtx.currentTime + startTime + duration);
    }

    // ============================================
    // 状态转换逻辑
    // ============================================

    /**
     * 开始一轮用药（空闲 → 等待滴药）
     */
    startSession() {
        this.currentMedicineIndex = 0;
        this.state = State.WAITING;
        this.updateWaitingView();
        this.showState('waiting');
    }

    /**
     * 确认已滴药（等待/提醒 → 倒计时 或 完成）
     */
    confirmDrop() {
        const medicines = this.configManager.getMedicines();
        const isLastMedicine = this.currentMedicineIndex >= medicines.length - 1;

        if (isLastMedicine) {
            // 最后一种药，本轮完成
            this.configManager.completeSession();
            this.state = State.COMPLETE;
            this.updateCompleteView();
            this.showState('complete');
            return;
        }

        // 还有下一种药，进入倒计时
        this.state = State.COUNTING;
        this.updateCountingView();
        this.showState('counting');

        // 启动倒计时
        const intervalMs = this.configManager.getIntervalMs();
        this.timer.start(intervalMs);
    }

    /**
     * 倒计时结束（倒计时 → 提醒）
     */
    onTimerComplete() {
        this.currentMedicineIndex++;
        this.state = State.ALERT;
        this.updateAlertView();
        this.showState('alert');

        // 播放提示音
        this.playNotificationSound();

        // 闪烁任务栏
        if (window.electronAPI) {
            window.electronAPI.flashWindow();
        }

        // 系统通知
        this.showSystemNotification();
    }

    /**
     * 暂停/恢复倒计时
     */
    togglePause() {
        if (this.timer.isPaused) {
            this.timer.resume();
            this.els['btn-pause'].textContent = '暂停';
        } else {
            this.timer.pause();
            this.els['btn-pause'].textContent = '继续';
        }
    }

    /**
     * 返回空闲状态
     */
    backToIdle() {
        this.timer.reset();
        this.state = State.IDLE;
        this.updateIdleView();
        this.showState('idle');
    }

    // ============================================
    // 视图更新
    // ============================================

    updateIdleView() {
        const completed = this.configManager.getCompletedSessions();
        const total = this.configManager.config.dailySessions;
        this.els['progress-count'].textContent = `${completed} / ${total} 次`;
    }

    updateWaitingView() {
        const medicines = this.configManager.getMedicines();
        this.els['medicine-index'].textContent = `第 ${this.currentMedicineIndex + 1} 种`;
        this.els['medicine-name'].textContent = medicines[this.currentMedicineIndex];
    }

    updateCountingView() {
        const medicines = this.configManager.getMedicines();
        this.els['counting-index'].textContent = `第 ${this.currentMedicineIndex + 1} 种 已完成`;

        // 下一种药名
        if (this.currentMedicineIndex + 1 < medicines.length) {
            this.els['next-medicine-name'].textContent = medicines[this.currentMedicineIndex + 1];
        }

        // 重置进度条
        this.els['timer-ring-progress'].style.strokeDasharray = this.ringCircumference;
        this.els['timer-ring-progress'].style.strokeDashoffset = this.ringCircumference;
    }

    updateAlertView() {
        const medicines = this.configManager.getMedicines();
        this.els['alert-index'].textContent = `第 ${this.currentMedicineIndex + 1} 种`;
        this.els['alert-medicine-name'].textContent = medicines[this.currentMedicineIndex];

        // 判断是否是最后一种
        if (this.currentMedicineIndex >= medicines.length - 1) {
            this.els['btn-confirm-next'].querySelector('span:last-child').textContent = '已滴药，完成本轮';
        } else {
            this.els['btn-confirm-next'].querySelector('span:last-child').textContent = '已滴药，开始计时';
        }
    }

    updateCompleteView() {
        const completed = this.configManager.getCompletedSessions();
        const total = this.configManager.config.dailySessions;
        this.els['complete-progress'].textContent = `${completed} / ${total} 次`;
    }

    // ============================================
    // 系统通知
    // ============================================

    showSystemNotification() {
        const medicines = this.configManager.getMedicines();
        const name = medicines[this.currentMedicineIndex];
        new Notification('间隔时钟 ⏰', {
            body: `请滴第 ${this.currentMedicineIndex + 1} 种眼药水：${name}`,
            silent: true // 使用自定义提示音
        });
    }

    // ============================================
    // 设置面板
    // ============================================

    toggleSettings() {
        this.settingsVisible = !this.settingsVisible;
        this.els['settings-panel'].classList.toggle('hidden', !this.settingsVisible);
        this.els['main-view'].classList.toggle('hidden', this.settingsVisible);

        if (this.settingsVisible) {
            this.populateSettings();
            this._resizeSettingsWindow();
        } else {
            // 恢复当前状态的窗口大小
            this.showState(this.state);
        }
    }

    _resizeSettingsWindow() {
        if (window.electronAPI) {
            const medicineCount = this.configManager.config.medicines.length;
            // 基础高度 + 每个药水项 32px
            const height = Math.min(500, 230 + medicineCount * 32);
            window.electronAPI.resizeWindow(280, height);
        }
    }

    populateSettings() {
        const config = this.configManager.config;

        // 间隔时间
        this.els['interval-slider'].value = config.intervalMinutes;
        this.els['interval-value'].textContent = `${config.intervalMinutes} 分钟`;

        // 提示音
        this.els['sound-toggle'].checked = config.soundEnabled;

        // 药物列表
        this._renderMedicineList();
    }

    _renderMedicineList() {
        const config = this.configManager.config;
        const listEl = this.els['medicine-list'];
        listEl.innerHTML = '';
        const total = config.medicines.length;

        config.medicines.forEach((name, i) => {
            const div = document.createElement('div');
            div.className = 'medicine-input';
            div.innerHTML = `
                <span class="medicine-input-label">${i + 1}.</span>
                <input type="text" value="${name}" data-index="${i}" class="medicine-name-input">
                <div class="medicine-actions">
                    <button class="medicine-action-btn btn-move-up" data-index="${i}" title="上移" ${i === 0 ? 'disabled' : ''}>↑</button>
                    <button class="medicine-action-btn btn-move-down" data-index="${i}" title="下移" ${i === total - 1 ? 'disabled' : ''}>↓</button>
                    <button class="medicine-action-btn btn-delete" data-index="${i}" title="删除" ${total <= 1 ? 'disabled' : ''}>✕</button>
                </div>
            `;
            listEl.appendChild(div);
        });

        // 添加药水按钮
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add-medicine';
        addBtn.innerHTML = '＋ 添加药水';
        addBtn.addEventListener('click', () => this._addMedicine());
        listEl.appendChild(addBtn);

        // 绑定操作按钮事件
        listEl.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', () => this._moveMedicine(parseInt(btn.dataset.index), -1));
        });
        listEl.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', () => this._moveMedicine(parseInt(btn.dataset.index), 1));
        });
        listEl.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => this._removeMedicine(parseInt(btn.dataset.index)));
        });
    }

    _syncMedicineInputsToConfig() {
        const inputs = document.querySelectorAll('.medicine-name-input');
        inputs.forEach((input) => {
            const idx = parseInt(input.dataset.index);
            if (input.value.trim()) {
                this.configManager.config.medicines[idx] = input.value.trim();
            }
        });
    }

    _addMedicine() {
        this._syncMedicineInputsToConfig();
        this.configManager.config.medicines.push('新药水');
        this._renderMedicineList();
        this._resizeSettingsWindow();
    }

    _removeMedicine(index) {
        if (this.configManager.config.medicines.length <= 1) return;
        this._syncMedicineInputsToConfig();
        this.configManager.config.medicines.splice(index, 1);
        this._renderMedicineList();
        this._resizeSettingsWindow();
    }

    _moveMedicine(index, direction) {
        const medicines = this.configManager.config.medicines;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= medicines.length) return;
        this._syncMedicineInputsToConfig();
        // 交换
        [medicines[index], medicines[newIndex]] = [medicines[newIndex], medicines[index]];
        this._renderMedicineList();
    }

    saveSettings() {
        const config = this.configManager.config;

        // 间隔时间
        config.intervalMinutes = parseInt(this.els['interval-slider'].value);

        // 提示音
        config.soundEnabled = this.els['sound-toggle'].checked;

        // 药物名称 — 从输入框收集，过滤空值
        const inputs = document.querySelectorAll('.medicine-name-input');
        const newMedicines = [];
        inputs.forEach((input) => {
            const val = input.value.trim();
            if (val) newMedicines.push(val);
        });
        if (newMedicines.length > 0) {
            config.medicines = newMedicines;
        }

        this.configManager.save();

        // 保存后立即中断当前流程，回到空闲
        this.timer.reset();
        this.state = State.IDLE;
        this.toggleSettings();
        this.updateIdleView();
    }
}

// ============================================
// 启动应用
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
