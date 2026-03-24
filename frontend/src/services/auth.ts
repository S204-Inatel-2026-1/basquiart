const TOKEN_KEY = 'basquiart_jwt_token';
const USER_KEY = 'basquiart_user';

export interface AuthUser {
  id: number;
  username: string;
  createdAt?: string;
  avatar_url?: string;
}

export const authService = {
  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },

  clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  saveUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser(): AuthUser | null {
    const value = localStorage.getItem(USER_KEY);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },

  decodeToken(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  isTokenExpired(token: string): boolean {
    const decoded = authService.decodeToken(token);
    const exp = decoded?.exp;

    if (typeof exp !== 'number') {
      return true;
    }

    return Date.now() >= exp * 1000;
  },
};
