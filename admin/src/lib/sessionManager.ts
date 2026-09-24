export interface SessionManagerOptions {
  timeoutMs?: number;
  warningMs?: number;
  onWarning: (remainingMs: number) => void;
  onTimeout: () => void;
  extend: () => Promise<void>;
}

class SessionManager {
  private timeoutId: number | undefined;
  private warningId: number | undefined;
  private options: SessionManagerOptions | null = null;

  start(options: SessionManagerOptions): void {
    this.stop();
    this.options = options;
    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach((event) => window.addEventListener(event, this.resetTimer, { passive: true }));
    this.resetTimer();
  }

  stop(): void {
    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach((event) => window.removeEventListener(event, this.resetTimer));
    if (this.timeoutId !== undefined) window.clearTimeout(this.timeoutId);
    if (this.warningId !== undefined) window.clearTimeout(this.warningId);
    this.timeoutId = undefined;
    this.warningId = undefined;
    this.options = null;
  }

  resetTimer = (): void => {
    if (!this.options) return;
    const timeoutMs = this.options.timeoutMs ?? 30 * 60 * 1000;
    const warningMs = this.options.warningMs ?? 2 * 60 * 1000;
    if (this.timeoutId !== undefined) window.clearTimeout(this.timeoutId);
    if (this.warningId !== undefined) window.clearTimeout(this.warningId);
    this.warningId = window.setTimeout(() => this.options?.onWarning(warningMs), timeoutMs - warningMs);
    this.timeoutId = window.setTimeout(() => this.options?.onTimeout(), timeoutMs);
  };

  async extendSession(): Promise<void> {
    if (!this.options) return;
    await this.options.extend();
    this.resetTimer();
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
