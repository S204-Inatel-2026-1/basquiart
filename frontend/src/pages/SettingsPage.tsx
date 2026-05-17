import React from 'react';
import { motion } from 'motion/react';
import { Upload } from 'lucide-react';
import { User } from '../types';

export const SettingsPage = ({
  user,
  onLogout,
  onUpdateUser,
}: {
  user: User;
  onLogout: () => void;
  onUpdateUser: (u: User) => void;
}) => {
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

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-12">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white soft-card p-10 sm:p-16"
      >
        <h1 className="font-serif text-5xl mb-8">Configurações</h1>

        <div className="space-y-12">
          <div className="flex items-center gap-8 pb-12 border-b border-ink/5">
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
              <label htmlFor="avatar-upload" className="mt-2 inline-block elegant-btn-outline text-[10px] py-1.5 px-4 tracking-widest uppercase font-bold cursor-pointer">
                Alterar Foto
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-sans text-[10px] tracking-widest font-bold text-muted uppercase">Preferências da Conta</h3>
            <div className="flex justify-between items-center p-4 bg-paper/30 rounded-2xl border border-ink/5">
              <span className="font-sans text-sm font-medium">Perfil Público</span>
              <div className="w-12 h-6 bg-gold rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-paper/30 rounded-2xl border border-ink/5">
              <span className="font-sans text-sm font-medium">Notificações por E-mail</span>
              <div className="w-12 h-6 bg-ink/10 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button onClick={onLogout} className="w-full elegant-btn-outline border-red-200 text-red-500 hover:bg-red-50">
              SAIR DO ESTÚDIO
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
