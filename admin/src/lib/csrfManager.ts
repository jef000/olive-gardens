class CSRFManager {
  private token: string | null = null;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }
}

export const csrfManager = new CSRFManager();
export default csrfManager;
