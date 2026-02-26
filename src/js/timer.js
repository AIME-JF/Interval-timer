/**
 * 精确倒计时引擎
 * 基于 Date.now() 差值计算，避免 setInterval 漂移
 */
class Timer {
    constructor() {
        this.duration = 0;        // 总时长 (ms)
        this.remaining = 0;       // 剩余时间 (ms)
        this.startTime = 0;       // 开始时间戳
        this.pausedRemaining = 0; // 暂停时的剩余时间
        this.rafId = null;
        this.isPaused = false;
        this.isRunning = false;

        // 回调
        this.onTick = null;       // (remainingMs) => void
        this.onComplete = null;   // () => void
    }

    /**
     * 启动倒计时
     * @param {number} durationMs - 倒计时时长（毫秒）
     */
    start(durationMs) {
        this.duration = durationMs;
        this.remaining = durationMs;
        this.startTime = Date.now();
        this.isPaused = false;
        this.isRunning = true;
        this._tick();
    }

    /**
     * 暂停倒计时
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        this.isPaused = true;
        this.pausedRemaining = this.remaining;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    /**
     * 恢复倒计时
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        this.isPaused = false;
        this.startTime = Date.now();
        this.duration = this.pausedRemaining;
        this.remaining = this.pausedRemaining;
        this._tick();
    }

    /**
     * 重置倒计时
     */
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.remaining = 0;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    /**
     * 获取进度 (0 -> 1)
     */
    getProgress() {
        if (this.duration === 0) return 0;
        return 1 - (this.remaining / this.duration);
    }

    /**
     * 内部计时循环
     */
    _tick() {
        const elapsed = Date.now() - this.startTime;
        this.remaining = Math.max(0, this.duration - elapsed);

        if (this.onTick) {
            this.onTick(this.remaining);
        }

        if (this.remaining <= 0) {
            this.isRunning = false;
            if (this.onComplete) {
                this.onComplete();
            }
            return;
        }

        this.rafId = requestAnimationFrame(() => this._tick());
    }
}
