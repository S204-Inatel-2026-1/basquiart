import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, LogOut, Settings as SettingsIcon, Search } from 'lucide-react';
import { User } from '../types';

export const Navbar = ({
  user,
  onLogout,
  setPage,
  page,
  onLogoClick,
  onSearch,
}: {
  user: User | null;
  onLogout: () => void;
  setPage: (p: string) => void;
  page: string;
  onLogoClick: () => void;
  onSearch: (q: string) => void;
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-ink/5 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-8">
        <div
          className="font-serif text-3xl tracking-tight cursor-pointer hover:text-gold transition-colors whitespace-nowrap"
          onClick={onLogoClick}
        >
          Basquiart-Se
        </div>

        {user && (
          <div className="hidden md:flex relative items-center">
            <Search size={16} className="absolute left-4 text-muted" />
            <input
              type="text"
              placeholder=""
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onSearch(searchQuery);
                }
              }}
              className="bg-ink/5 border-none rounded-full py-2 pl-10 pr-4 text-sm font-sans w-64 focus:ring-1 focus:ring-gold/30 transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {user ? (
          <>
            <button
              onClick={() => setPage('groups')}
              className={`p-2 hover:text-gold transition-colors rounded-full ${page === 'groups' ? 'text-gold' : 'text-muted'}`}
              title="Grupos"
            >
              <Users size={20} />
            </button>
            <button onClick={() => setPage('submit')} className="elegant-btn-primary text-sm">
              <Plus size={16} /> <span className="hidden sm:inline">ENVIAR ARTE</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-8 h-8 rounded-full border border-ink/10"
                />
                <span className="hidden sm:inline font-medium text-sm tracking-wide">{user.username}</span>
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-4 w-48 bg-white soft-card shadow-xl border border-ink/5 py-2 z-20"
                    >
                      <button
                        onClick={() => { setPage('settings'); setShowDropdown(false); }}
                        className="w-full px-4 py-3 text-left text-sm font-sans hover:bg-paper flex items-center gap-3 transition-colors"
                      >
                        <SettingsIcon size={16} className="text-muted" /> Configurações
                      </button>
                      <button
                        onClick={() => { onLogout(); setShowDropdown(false); }}
                        className="w-full px-4 py-3 text-left text-sm font-sans hover:bg-red-50 text-red-500 flex items-center gap-3 transition-colors"
                      >
                        <LogOut size={16} /> Sair
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : null}
      </div>
    </nav>
  );
};
