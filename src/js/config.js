/**
 * 配置管理模块
 * 处理配置加载、保存和今日记录管理
 */
class ConfigManager {
    constructor() {
        this.config = {
            medicines: ['玻璃酸钠滴眼液', '氯替泼诺混悬滴眼液', '聚乙二醇滴眼液', '环孢素滴眼液'],
            intervalMinutes: 5,
            dailySessions: 4,
            soundEnabled: true,
            todayRecord: { date: '', completedSessions: 0 }
        };
    }

    /**
     * 从主进程加载配置
     */
    async load() {
        try {
            const saved = await window.electronAPI.loadConfig();
            this.config = { ...this.config, ...saved };
            this._checkDateReset();
        } catch (e) {
            console.warn('加载配置失败，使用默认值:', e);
        }
        return this.config;
    }

    /**
     * 保存配置到主进程
     */
    async save() {
        try {
            await window.electronAPI.saveConfig(this.config);
        } catch (e) {
            console.error('保存配置失败:', e);
        }
    }

    /**
     * 检查日期是否需要重置今日记录
     */
    _checkDateReset() {
        const today = new Date().toISOString().split('T')[0];
        if (this.config.todayRecord.date !== today) {
            this.config.todayRecord = { date: today, completedSessions: 0 };
            this.save();
        }
    }

    /**
     * 完成一轮用药
     */
    completeSession() {
        const today = new Date().toISOString().split('T')[0];
        this.config.todayRecord.date = today;
        this.config.todayRecord.completedSessions++;
        this.save();
    }

    /**
     * 重置今日记录
     */
    resetToday() {
        const today = new Date().toISOString().split('T')[0];
        this.config.todayRecord = { date: today, completedSessions: 0 };
        this.save();
    }

    /**
     * 获取今日已完成次数
     */
    getCompletedSessions() {
        this._checkDateReset();
        return this.config.todayRecord.completedSessions;
    }

    /**
     * 获取间隔时间（毫秒）
     */
    getIntervalMs() {
        return this.config.intervalMinutes * 60 * 1000;
    }

    /**
     * 获取药物列表
     */
    getMedicines() {
        return this.config.medicines;
    }

    /**
     * 更新配置项
     */
    update(key, value) {
        this.config[key] = value;
    }
}
