import type { User } from '../types';
import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export type AuthResponse = {
  JWT: string;
  user?: User;
};

function withAvatar<T extends User>(user: T): T {
  return {
    ...user,
    avatar_url:
      user.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`,
  };
}

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function requestWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authService.getToken();
  const headers = new Headers(options.headers);

  if (token) {
    if (authService.isTokenExpired(token)) {
      authService.clearAuth();
      throw new Error('Sessao expirada. Faca login novamente.');
    }

    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    authService.clearAuth();
    throw new Error('Nao autorizado. Faca login novamente.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as { detail?: string }));
    throw new Error(errorData.detail || `API error: ${response.statusText}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}

async function jsonRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  return requestWithAuth<T>(endpoint, {
    ...options,
    headers,
  });
}

export const authApi = {
  async register(username: string, password: string): Promise<AuthResponse> {
    const response = await jsonRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    return {
      ...response,
      user: response.user ? withAvatar(response.user) : undefined,
    };
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await jsonRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    return {
      ...response,
      user: response.user ? withAvatar(response.user) : undefined,
    };
  },
};

export const api = {
  auth: authApi,
};
