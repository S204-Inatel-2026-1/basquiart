import React from 'react';
import { motion } from 'motion/react';
import { Upload, Check } from 'lucide-react';
import { User } from '../types';
<<<<<<< Updated upstream
import { itemMotion, panelMotion, staggerContainer, subtleButtonMotion } from '../lib/motion';
=======
import { useTheme, ThemeName } from '../contexts/ThemeContext';

const themes: { name: ThemeName; label: string; description: string; preview: { bg: string; accent: string; text: string; pattern: React.ReactNode } }[] = [
  {
    name: 'dark',
    label: 'Noite Digital',
    description: 'Escuro com padroes geometricos',
    preview: {
      bg: '#0a0a0f',
      accent: '#c5a059',
      text: '#e8e8e8',
      pattern: (
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
          <rect x="10" y="10" width="25" height="25" fill="none" stroke="#fff" strokeWidth="0.5" />
          <rect x="45" y="30" width="15" height="15" fill="none" stroke="#fff" strokeWidth="0.3" />
          <rect x="65" y="55" width="20" height="20" fill="none" stroke="#fff" strokeWidth="0.5" />
          <rect x="20" y="60" width="10" height="10" fill="none" stroke="#fff" strokeWidth="0.3" />
          <circle cx="30" cy="45" r="1" fill="#fff" />
          <circle cx="55" cy="20" r="0.8" fill="#fff" />
          <circle cx="80" cy="40" r="1.2" fill="#fff" />
          <circle cx="15" cy="80" r="0.6" fill="#fff" />
          <circle cx="70" cy="85" r="1" fill="#fff" />
          <line x1="10" y1="35" x2="45" y2="35" stroke="#fff" strokeWidth="0.2" />
          <line x1="60" y1="55" x2="60" y2="30" stroke="#fff" strokeWidth="0.2" />
        </svg>
      ),
    },
  },
  {
    name: 'beige',
    label: 'Pergaminho',
    description: 'Bege com toque oriental',
    preview: {
      bg: '#fcfaf7',
      accent: '#c5a059',
      text: '#1a1a1a',
      pattern: (
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 100 100">
          {/* branch */}
          <path d="M 5 30 Q 25 25 40 35 Q 55 45 70 30" fill="none" stroke="#5a3a1a" strokeWidth="0.8" />
          <path d="M 40 35 Q 45 20 50 15" fill="none" stroke="#5a3a1a" strokeWidth="0.5" />
          {/* cherry blossoms */}
          <circle cx="50" cy="15" r="3" fill="#c06060" opacity="0.6" />
          <circle cx="55" cy="18" r="2.5" fill="#d07070" opacity="0.5" />
          <circle cx="70" cy="30" r="3" fill="#c06060" opacity="0.6" />
          <circle cx="74" cy="27" r="2" fill="#d07070" opacity="0.4" />
          {/* mountains */}
          <path d="M 0 80 L 30 55 L 60 75 L 100 50 L 100 100 L 0 100 Z" fill="#8a7a6a" opacity="0.08" />
          <path d="M 0 90 L 40 65 L 80 85 L 100 70 L 100 100 L 0 100 Z" fill="#8a7a6a" opacity="0.05" />
        </svg>
      ),
    },
  },
  {
    name: 'white',
    label: 'Jardim Botanico',
    description: 'Branco com padroes florais',
    preview: {
      bg: '#ffffff',
      accent: '#7b9e6b',
      text: '#1a1a1a',
      pattern: (
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 100 100">
          {/* roses / leaves */}
          <ellipse cx="20" cy="25" rx="12" ry="8" fill="none" stroke="#999" strokeWidth="0.5" />
          <ellipse cx="20" cy="25" rx="8" ry="5" fill="none" stroke="#999" strokeWidth="0.4" />
          <path d="M 20 33 Q 18 45 22 55" fill="none" stroke="#999" strokeWidth="0.4" />
          <ellipse cx="70" cy="65" rx="14" ry="9" fill="none" stroke="#999" strokeWidth="0.5" />
          <ellipse cx="70" cy="65" rx="9" ry="6" fill="none" stroke="#999" strokeWidth="0.4" />
          <path d="M 70 74 Q 68 82 72 92" fill="none" stroke="#999" strokeWidth="0.4" />
          {/* small leaves */}
          <path d="M 50 10 Q 55 15 50 20 Q 45 15 50 10" fill="none" stroke="#aaa" strokeWidth="0.4" />
          <path d="M 85 30 Q 90 35 85 40 Q 80 35 85 30" fill="none" stroke="#aaa" strokeWidth="0.4" />
          <path d="M 35 75 Q 40 80 35 85 Q 30 80 35 75" fill="none" stroke="#aaa" strokeWidth="0.4" />
        </svg>
      ),
    },
  },
];
>>>>>>> Stashed changes

export const SettingsPage = ({
  user,
  onLogout,
  onUpdateUser,
}: {
  user: User;
  onLogout: () => void;
  onUpdateUser: (u: User) => void;
}) => {
  const { theme, setTheme } = useTheme();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      localStorage.setItem(`basquiart_avatar_${user.id}`, base64);
      onUpdateUser({ ...user, avatar_url: base64 });
    };
    reader.readAsDataURL(file);
  };

  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleCopyUserId = async () => {
    try {
      await navigator.clipboard.writeText(String(user.id));
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    } finally {
      window.setTimeout(() => setCopyStatus('idle'), 1800);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-12">
<<<<<<< Updated upstream
      <motion.div {...panelMotion} className="bg-white soft-card p-10 sm:p-16">
        <h1 className="font-serif text-5xl mb-8">Configurações</h1>
=======
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card soft-card p-10 sm:p-16"
      >
        <h1 className="font-serif text-5xl mb-8">Configuracoes</h1>
>>>>>>> Stashed changes

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-12">
          <motion.div variants={itemMotion} className="flex items-center gap-8 pb-12 border-b border-ink/5">
            <div className="relative group">
              <img src={user.avatar_url} alt={user.username} className="w-24 h-24 rounded-full border-2 border-gold/20 p-1 object-cover" />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload size={20} className="text-white" />
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <h2 className="font-serif text-3xl">{user.username}</h2>
              <p className="text-muted font-sans text-sm tracking-wide">Membro desde {new Date().getFullYear()}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-sans text-[11px] tracking-widest font-semibold text-muted uppercase">
                  Meu ID: {user.id}
                </span>
                <motion.button
                  {...subtleButtonMotion}
                  type="button"
                  onClick={() => void handleCopyUserId()}
                  className="elegant-btn-outline text-[9px] py-1.5 px-3 tracking-widest uppercase font-bold"
                >
                  Copiar ID
                </motion.button>
                {copyStatus === 'success' && (
                  <span className="text-[10px] font-sans font-semibold text-green-600">Copiado!</span>
                )}
                {copyStatus === 'error' && (
                  <span className="text-[10px] font-sans font-semibold text-red-500">Falha ao copiar.</span>
                )}
              </div>
              <label htmlFor="avatar-upload" className="mt-2 inline-block elegant-btn-outline text-[10px] py-1.5 px-4 tracking-widest uppercase font-bold cursor-pointer">
                Alterar Foto
              </label>
            </div>
          </motion.div>

<<<<<<< Updated upstream
          <motion.div variants={itemMotion} className="space-y-6">
            <h3 className="font-sans text-[10px] tracking-widest font-bold text-muted uppercase">Preferências da Conta</h3>
=======
          {/* Theme Selector */}
          <div className="space-y-6">
            <h3 className="font-sans text-[10px] tracking-widest font-bold text-muted uppercase">Tema Visual</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {themes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name)}
                  className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                    theme === t.name
                      ? 'border-gold shadow-lg scale-[1.02]'
                      : 'border-transparent hover:border-ink/10'
                  }`}
                >
                  {/* Preview card */}
                  <div
                    className="relative h-32 w-full overflow-hidden"
                    style={{ backgroundColor: t.preview.bg }}
                  >
                    {t.preview.pattern}
                    {theme === t.name && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: t.preview.accent }}>
                        <Check size={14} color={t.preview.bg} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-left" style={{ backgroundColor: t.preview.bg }}>
                    <p className="font-serif text-sm font-medium" style={{ color: t.preview.text }}>
                      {t.label}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: t.preview.accent }}>
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-sans text-[10px] tracking-widest font-bold text-muted uppercase">Preferencias da Conta</h3>
>>>>>>> Stashed changes
            <div className="flex justify-between items-center p-4 bg-paper/30 rounded-2xl border border-ink/5">
              <span className="font-sans text-sm font-medium">Perfil Publico</span>
              <div className="w-12 h-6 bg-gold rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-paper/30 rounded-2xl border border-ink/5">
              <span className="font-sans text-sm font-medium">Notificacoes por E-mail</span>
              <div className="w-12 h-6 bg-ink/10 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </motion.div>

<<<<<<< Updated upstream
          <motion.div variants={itemMotion} className="pt-8">
            <motion.button
              {...subtleButtonMotion}
              onClick={onLogout}
              className="w-full elegant-btn-outline border-red-200 text-red-500 hover:bg-red-50"
            >
              SAIR DO ESTÚDIO
            </motion.button>
          </motion.div>
        </motion.div>
=======
          <div className="pt-8">
            <button onClick={onLogout} className="w-full elegant-btn-outline border-red-200 text-red-500 hover:bg-red-50">
              SAIR DO ESTUDIO
            </button>
          </div>
        </div>
>>>>>>> Stashed changes
      </motion.div>
    </div>
  );
};
