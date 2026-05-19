import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Users, Plus, ArrowLeft } from 'lucide-react';
import { User, Group } from './types';
import { authService } from './services/auth';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { FeedPage } from './pages/FeedPage';
import { GroupsPage } from './pages/GroupsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SubmitPage } from './pages/SubmitPage';
import { pageMotion, subtleButtonMotion } from './lib/motion';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const token = authService.getToken();
    if (!token || authService.isTokenExpired(token)) {
      authService.clearAuth();
      return null;
    }
    const savedUser = authService.getUser();
    if (!savedUser) return null;
    return {
      id: savedUser.id,
      username: savedUser.username,
      role: savedUser.role,
      avatar_url:
        savedUser.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(savedUser.username)}`,
    };
  });

  const [page, setPage] = useState(() => (authService.isAuthenticated() ? 'feed' : 'login'));
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const handleLogin = (u: User) => {
    const customAvatar = localStorage.getItem(`basquiart_avatar_${u.id}`);
    if (customAvatar) u = { ...u, avatar_url: customAvatar };
    setUser(u);
    authService.saveUser(u);
    setPage('feed');
  };

  const handleUpdateUser = (u: User) => {
    setUser(u);
    authService.saveUser(u);
  };

  const handleLogout = () => {
    setUser(null);
    authService.clearAuth();
    setPage('login');
  };

  const navigateToGroup = (g: Group) => {
    setSelectedGroup(g);
    setPage('group-feed');
  };

  const navigateToArtist = (id: number, name: string) => {
    setSelectedArtistId(id);
    setSelectedArtistName(name);
    setPage('artist-profile');
  };

  const navigateToFeed = () => {
    setSelectedGroup(null);
    setSelectedArtistId(null);
    setPage('feed');
  };

  return (
    <div className="min-h-screen bg-gallery-white selection:bg-neon-green selection:text-brutal-black">
      <Navbar
        user={user}
        onLogout={handleLogout}
        setPage={setPage}
        page={page}
        onLogoClick={navigateToFeed}
        onSearch={(q) => { setGlobalSearchQuery(q); setPage('groups'); }}
      />

      <main className="pb-20">
        <AnimatePresence mode="wait">
          {page === 'login' && !user && (
            <motion.div key="login" {...pageMotion}>
              <LoginPage onLogin={handleLogin} />
            </motion.div>
          )}

          {page === 'feed' && (
            <motion.div key="feed" {...pageMotion}>
              <FeedPage user={user} onNavigateToSubmit={() => setPage('submit')} onArtistClick={navigateToArtist} />
            </motion.div>
          )}

          {page === 'artist-profile' && selectedArtistId && (
            <motion.div key="artist-profile" {...pageMotion}>
              <div className="max-w-6xl mx-auto px-4 pt-8">
                <button onClick={navigateToFeed} className="flex items-center gap-2 font-mono text-xs font-bold hover:text-gold transition-colors">
                  <ArrowLeft size={14} /> VOLTAR PARA GALERIA
                </button>
              </div>
              <FeedPage
                user={user}
                userId={selectedArtistId}
                userName={selectedArtistName || ''}
                onNavigateToSubmit={() => setPage('submit')}
                onArtistClick={navigateToArtist}
              />
            </motion.div>
          )}

          {page === 'group-feed' && selectedGroup && (
            <motion.div key="group-feed" {...pageMotion}>
              <div className="max-w-6xl mx-auto px-4 pt-8">
                <button onClick={() => setPage('groups')} className="flex items-center gap-2 font-mono text-xs font-bold hover:text-gold transition-colors">
                  <ArrowLeft size={14} /> VOLTAR PARA GRUPOS
                </button>
              </div>
              <FeedPage
                user={user}
                groupId={selectedGroup.id}
                groupName={selectedGroup.name}
                onNavigateToSubmit={() => setPage('submit')}
                onArtistClick={navigateToArtist}
              />
            </motion.div>
          )}

          {page === 'groups' && user && (
            <motion.div key="groups" {...pageMotion}>
              <GroupsPage user={user} onSelectGroup={navigateToGroup} initialSearchQuery={globalSearchQuery} />
            </motion.div>
          )}

          {page === 'submit' && user && (
            <motion.div key="submit" {...pageMotion}>
              <SubmitPage user={user} groupId={selectedGroup?.id} onComplete={() => setPage(selectedGroup ? 'group-feed' : 'feed')} />
            </motion.div>
          )}

          {page === 'settings' && user && (
            <motion.div key="settings" {...pageMotion}>
              <SettingsPage user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {user && (
        <motion.div
          initial={{ opacity: 0, y: 24, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-8 left-1/2 z-50 sm:hidden"
        >
          <div className="bg-ink/90 backdrop-blur-md text-paper rounded-full shadow-2xl p-2 flex gap-2 border border-paper/10">
            <motion.button {...subtleButtonMotion} onClick={() => setPage('feed')} className={`p-4 rounded-full transition-colors ${page === 'feed' ? 'bg-gold text-ink' : 'hover:bg-paper/10'}`}>
              <LayoutGrid size={20} />
            </motion.button>
            <motion.button {...subtleButtonMotion} onClick={() => setPage('groups')} className={`p-4 rounded-full transition-colors ${page === 'groups' || page === 'group-feed' ? 'bg-gold text-ink' : 'hover:bg-paper/10'}`}>
              <Users size={20} />
            </motion.button>
            <motion.button {...subtleButtonMotion} onClick={() => setPage('submit')} className={`p-4 rounded-full transition-colors ${page === 'submit' ? 'bg-gold text-ink' : 'hover:bg-paper/10'}`}>
              <Plus size={20} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
