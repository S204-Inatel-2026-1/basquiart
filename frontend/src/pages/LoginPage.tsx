import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from '../types';
import { api } from '../services/api';
import { authService } from '../services/auth';

export const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState<'login' | 'register' | null>(null);
  const [error, setError] = useState('');

  const handleAuth = async (action: 'login' | 'register') => {
    if (!username || !password) return;

    setError('');
    setLoadingAction(action);
    try {
      const result =
        action === 'login'
          ? await api.auth.login(username, password)
          : await api.auth.register(username, password);

      authService.saveToken(result.JWT);
      if (result.refresh_token) {
        authService.saveRefreshToken(result.refresh_token);
      }

      const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
      const decoded = authService.decodeToken(result.JWT);
      const userFromTokenId = Number(decoded?.sub ?? 0);

      const user: User = result.user
        ? {
            ...result.user,
            avatar_url: result.user.avatar_url || fallbackAvatar,
          }
        : {
            id: Number.isFinite(userFromTokenId) ? userFromTokenId : 0,
            username,
            avatar_url: fallbackAvatar,
          };

      authService.saveUser(user);
      onLogin(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(action === 'login' ? 'Falha ao entrar.' : 'Falha ao cadastrar.');
      }
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAuth('login');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full p-10 bg-white soft-card"
      >
        <h1 className="font-serif text-5xl mb-2 text-center">Bem-vindo</h1>
        <p className="text-muted text-center mb-10 font-sans text-sm tracking-wide">Entre no estúdio para compartilhar sua visão.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Nome de usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="elegant-input"
              placeholder=""
              aria-label="Nome de usuário"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="elegant-input"
              placeholder=""
              aria-label="Senha"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-xs font-sans">{error}</p>
          )}
          <button
            type="submit"
            disabled={Boolean(loadingAction)}
            className="w-full elegant-btn-primary py-4 text-lg"
          >
            {loadingAction === 'login' ? 'Entrando...' : 'Entrar no Estúdio'}
          </button>
          <button
            type="button"
            onClick={() => void handleAuth('register')}
            disabled={Boolean(loadingAction)}
            className="w-full elegant-btn-outline py-4 text-lg"
          >
            {loadingAction === 'register' ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        <p className="mt-8 font-sans text-[10px] text-center text-muted tracking-wide uppercase">
          * Use a mesma senha para entrar novamente.
        </p>
      </motion.div>
    </div>
  );
};
