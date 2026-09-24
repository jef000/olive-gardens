const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

class TokenManager {
  private expiresAt = 0;
  private refreshTimer: number | undefined;

  markAuthenticated(): void {
    this.expiresAt = Date.now() + ACCESS_TOKEN_LIFETIME_MS;
  }

  markRefreshed(): void {
    this.markAuthenticated();
  }

  needsRefresh(): boolean {
    return this.expiresAt > 0 && this.expiresAt - Date.now() < REFRESH_THRESHOLD_MS;
  }

  clearTokens(): void {
    this.expiresAt = 0;
    this.stopRefreshTimer();
  }

  startRefreshTimer(onRefresh: () => Promise<void>): void {
    this.stopRefreshTimer();
    this.refreshTimer = window.setInterval(() => {
      if (this.needsRefresh()) void onRefresh();
    }, 60_000);
  }

  stopRefreshTimer(): void {
    if (this.refreshTimer !== undefined) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;
