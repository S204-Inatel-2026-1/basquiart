import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trophy, Heart, MessageSquare } from 'lucide-react';
import { Artwork, User } from '../types';
import { api } from '../services/api';
import { RatingModal } from '../components/RatingModal';
import { CommentsSection } from '../components/CommentsSection';

export const FeedPage = ({
  user,
  groupId,
  groupName,
  userId,
  userName,
  onNavigateToSubmit,
  onArtistClick,
}: {
  user: User | null;
  groupId?: number;
  groupName?: string;
  userId?: number;
  userName?: string;
  onNavigateToSubmit: () => void;
  onArtistClick: (id: number, name: string) => void;
}) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingTarget, setRatingTarget] = useState<Artwork | null>(null);
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [likingPostIds, setLikingPostIds] = useState<number[]>([]);
  const isBackendGroupFeed = Boolean(groupId);

  const handleToggleLike = async (artwork: Artwork) => {
    if (!isBackendGroupFeed || !user) return;
    if (likingPostIds.includes(artwork.id)) return;

    setLikingPostIds(prev => [...prev, artwork.id]);
    try {
      const response = await api.posts.toggleLike(artwork.id);
      setArtworks(prev => prev.map(item => {
        if (item.id !== artwork.id) return item;

        const currentlyLiked = Boolean(item.has_liked);
        const currentlyCount = item.like_count || 0;
        const nextLiked = response.liked;
        const nextCount = nextLiked
          ? (currentlyLiked ? currentlyCount : currentlyCount + 1)
          : (currentlyLiked ? Math.max(0, currentlyCount - 1) : currentlyCount);

        return { ...item, has_liked: nextLiked, like_count: nextCount };
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLikingPostIds(prev => prev.filter(id => id !== artwork.id));
    }
  };

  const fetchArt = () => {
    setLoading(true);

    if (groupId && user) {
      api.posts.listByGroup(groupId)
        .then(data => setArtworks(data))
        .catch(err => { console.error(err); setArtworks([]); })
        .finally(() => setLoading(false));
      return;
    }

    if (user) {
      api.posts.listPublic(1, 10, userId)
        .then(data => setArtworks(data))
        .catch(err => { console.error(err); setArtworks([]); })
        .finally(() => setLoading(false));
      return;
    }

    let url = '/api/artworks';
    if (groupId) url = `/api/artworks?group_id=${groupId}`;
    else if (userId) url = `/api/artworks?user_id=${userId}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setArtworks(data))
      .catch(err => { console.error(err); setArtworks([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArt();
  }, [groupId, userId, user?.id]);

  if (loading) return <div className="p-20 text-center font-serif text-3xl animate-pulse text-muted">Curando Galeria...</div>;

  return (
    <div className="max-w-[1600px] mx-auto p-6 sm:p-12">
      {groupName ? (
        <div className="mb-16 text-center">
          <h1 className="font-serif text-6xl mb-4">{groupName}</h1>
          <div className="flex flex-col items-center gap-4">
            <div className="inline-block px-4 py-1 rounded-full border border-gold/30 text-gold font-sans text-[10px] tracking-[0.2em] uppercase font-semibold">Coleção Exclusiva</div>
            <button onClick={onNavigateToSubmit} className="mt-4 elegant-btn-primary py-2 px-6 text-xs">
              <Plus size={14} className="mr-2" /> ENVIAR PARA ESTE COLETIVO
            </button>
          </div>
        </div>
      ) : userName ? (
        <div className="mb-16 text-center">
          <h1 className="font-serif text-6xl mb-4">Estúdio de {userName}</h1>
        </div>
      ) : (
        <div className="mb-16 text-center">
          <h1 className="font-serif text-6xl mb-4">A Galeria</h1>
        </div>
      )}

      <div className={`grid gap-8 ${isBackendGroupFeed ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {artworks.map((art) => (
          <motion.div
            key={art.id}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="soft-card group flex flex-col"
          >
            <div className="p-4 flex items-center justify-between bg-white">
              <button
                onClick={() => onArtistClick(art.user_id, art.username)}
                className="flex items-center gap-3 hover:text-gold transition-colors"
              >
                <img src={art.avatar_url} className="w-8 h-8 rounded-full border border-ink/5" alt="" />
                <span className="font-sans text-xs font-semibold tracking-wide">{art.username}</span>
              </button>
              <span className="text-[10px] text-muted font-sans uppercase tracking-widest">{new Date(art.created_at).toLocaleDateString()}</span>
            </div>

            <div className="aspect-[4/5] bg-zinc-50 relative overflow-hidden">
              <img
                src={art.image_url}
                alt={art.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-8 backdrop-blur-[2px]">
                <p className="text-paper text-sm text-center font-serif italic leading-relaxed">{art.description}</p>
              </div>
            </div>

            <div className="p-6 bg-white flex-grow">
              <h3 className="font-serif text-2xl mb-6 tracking-tight">{art.title}</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-[9px] font-sans font-bold tracking-widest text-muted uppercase mb-1">Técnica</div>
                  <div className="font-serif text-lg text-gold">{art.technique_score}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-sans font-bold tracking-widest text-muted uppercase mb-1">Autenticidade</div>
                  <div className="font-serif text-lg text-gold">{art.authenticity_score}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-sans font-bold tracking-widest text-muted uppercase mb-1">Criatividade</div>
                  <div className="font-serif text-lg text-gold">{art.creativity_score}</div>
                </div>
              </div>

              {openComments === art.id && (
                <CommentsSection
                  artworkId={art.id}
                  user={user}
                  onCommentAdded={fetchArt}
                  useBackendComments={isBackendGroupFeed}
                />
              )}
            </div>

            <div className="p-5 bg-paper/50 border-t border-ink/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 font-serif text-xl">
                  <Trophy size={16} className="text-gold" />
                  {art.total_points}
                </div>

                <button
                  onClick={() => setOpenComments(openComments === art.id ? null : art.id)}
                  className="flex items-center gap-1.5 font-sans text-[9px] tracking-widest text-muted uppercase hover:text-gold transition-colors"
                >
                  <MessageSquare size={12} /> Diálogo ({art.comment_count || 0})
                </button>
                {isBackendGroupFeed && (
                  <button
                    onClick={() => void handleToggleLike(art)}
                    disabled={likingPostIds.includes(art.id)}
                    className={`flex items-center gap-1.5 font-sans text-[9px] tracking-widest uppercase transition-colors ${art.has_liked ? 'text-red-500' : 'text-muted hover:text-red-500'} disabled:opacity-40`}
                  >
                    <Heart size={12} fill={art.has_liked ? 'currentColor' : 'none'} /> Curtidas ({art.like_count || 0})
                  </button>
                )}
              </div>

              {user && user.id !== art.user_id && (
                <button
                  onClick={() => setRatingTarget(art)}
                  className="elegant-btn-outline text-[10px] py-1.5 px-4 tracking-widest uppercase font-bold"
                >
                  Avaliar
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {artworks.length === 0 && (
        <div className="py-32 text-center">
          <p className="font-serif text-2xl text-muted italic">A galeria aguarda sua primeira pincelada.</p>
        </div>
      )}

      {ratingTarget && user && (
        <RatingModal
          artwork={ratingTarget}
          user={user}
          onClose={() => setRatingTarget(null)}
          onRated={fetchArt}
          useBackendRating={isBackendGroupFeed}
        />
      )}
    </div>
  );
};
