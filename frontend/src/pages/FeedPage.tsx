import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trophy, Heart, MessageSquare, Trash2 } from 'lucide-react';
import { Artwork, Group, User } from '../types';
import { api } from '../services/api';
import { RatingModal } from '../components/RatingModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { CommentsSection } from '../components/CommentsSection';
import { BidModal } from '../components/BidModal';
import { cardMotion, interactiveCardMotion, staggerContainer, subtleButtonMotion } from '../lib/motion';

export const FeedPage = ({
  user,
  groupId,
  groupName,
  groupRole,
  userId,
  userName,
  onNavigateToSubmit,
  onArtistClick,
}: {
  user: User | null;
  groupId?: number;
  groupName?: string;
  groupRole?: Group['role'];
  userId?: number;
  userName?: string;
  onNavigateToSubmit: () => void;
  onArtistClick: (id: number, name: string) => void;
}) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingTarget, setRatingTarget] = useState<Artwork | null>(null);
  const [bidTarget, setBidTarget] = useState<Artwork | null>(null);
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [likingPostIds, setLikingPostIds] = useState<number[]>([]);
  const [deletingPostIds, setDeletingPostIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Artwork | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const isBackendGroupFeed = Boolean(groupId);
  const usesBackendPosts = Boolean(user && !userId);
  const canDeletePost = (artwork: Artwork) =>
    Boolean(usesBackendPosts && user && (user.id === artwork.user_id || groupRole === 'OWNER'));

  const requestDeletePost = (artwork: Artwork) => {
    if (!canDeletePost(artwork)) return;
    setDeleteTarget(artwork);
    setDeleteError('');
  };

  const closeDeleteModal = () => {
    if (deleteTarget && deletingPostIds.includes(deleteTarget.id)) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const handleDeletePost = async () => {
    if (!deleteTarget || !canDeletePost(deleteTarget)) return;
    if (deletingPostIds.includes(deleteTarget.id)) return;

    const postId = deleteTarget.id;
    setDeleteError('');
    setDeletingPostIds(prev => [...prev, postId]);
    try {
      await api.posts.deletePost(postId);
      setArtworks(prev => prev.filter(item => item.id !== postId));
      if (openComments === postId) {
        setOpenComments(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      setDeleteError(err instanceof Error ? err.message : 'Não foi possível excluir esta publicação.');
    } finally {
      setDeletingPostIds(prev => prev.filter(id => id !== postId));
    }
  };

  const handleToggleLike = async (artwork: Artwork) => {
    if (!usesBackendPosts || !user) return;
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

    if (!groupId && !userId && user) {
      api.posts.listFeed()
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

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-20 text-center font-serif text-3xl animate-pulse text-muted"
      >
        Curando Galeria...
      </motion.div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 sm:p-12">
      {groupName ? (
        <div className="mb-16 text-center">
          <h1 className="font-serif text-6xl mb-4">{groupName}</h1>
          <div className="flex flex-col items-center gap-4">
            <div className="inline-block px-4 py-1 rounded-full border border-gold/30 text-gold font-sans text-[10px] tracking-[0.2em] uppercase font-semibold">Coleção Exclusiva</div>
            <motion.button {...subtleButtonMotion} onClick={onNavigateToSubmit} className="mt-4 elegant-btn-primary py-2 px-6 text-xs">
              <Plus size={14} className="mr-2" /> ENVIAR PARA ESTE COLETIVO
            </motion.button>
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

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className={`grid gap-8 ${isBackendGroupFeed ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}
      >
        {artworks.map((art) => (
          <motion.div
            key={art.id}
            variants={cardMotion}
            {...interactiveCardMotion}
            viewport={{ once: true }}
            className="soft-card group flex flex-col"
          >
            <div className="p-4 flex items-center justify-between bg-card">
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

            <div className="p-6 bg-card flex-grow">
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

              <AnimatePresence initial={false}>
                {openComments === art.id && (
                  <CommentsSection
                    artworkId={art.id}
                    user={user}
                    onCommentAdded={fetchArt}
                    useBackendComments={usesBackendPosts}
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="p-5 bg-paper/50 border-t border-ink/5 flex flex-wrap justify-between items-center gap-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 font-serif text-xl">
                  <Trophy size={16} className="text-gold" />
                  {art.total_points}
                </div>

                <motion.button
                  {...subtleButtonMotion}
                  onClick={() => setOpenComments(openComments === art.id ? null : art.id)}
                  className="flex items-center gap-1.5 font-sans text-[9px] tracking-widest text-muted uppercase hover:text-gold transition-colors"
                >
                  <MessageSquare size={12} /> Diálogo ({art.comment_count || 0})
                </motion.button>
                {usesBackendPosts && (
                  <motion.button
                    {...subtleButtonMotion}
                    onClick={() => void handleToggleLike(art)}
                    disabled={likingPostIds.includes(art.id)}
                    className={`flex items-center gap-1.5 font-sans text-[9px] tracking-widest uppercase transition-colors ${art.has_liked ? 'text-red-500' : 'text-muted hover:text-red-500'} disabled:opacity-40`}
                  >
                    <Heart size={12} fill={art.has_liked ? 'currentColor' : 'none'} /> Curtidas ({art.like_count || 0})
                  </motion.button>
                )}
                {isBackendGroupFeed && user && (
                  <motion.button
                    {...subtleButtonMotion}
                    onClick={() => setBidTarget(art)}
                    className="flex items-center gap-1.5 font-sans text-[9px] tracking-widest uppercase text-muted hover:text-gold transition-colors"
                    title="Dar um lance por esta obra"
                  >
                    <Gavel size={12} /> Lance
                  </motion.button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {canDeletePost(art) && (
                  <motion.button
                    {...subtleButtonMotion}
                    onClick={() => requestDeletePost(art)}
                    disabled={deletingPostIds.includes(art.id)}
                    className="flex items-center gap-1.5 font-sans text-[9px] tracking-widest uppercase text-red-500 hover:text-ink transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={12} /> {deletingPostIds.includes(art.id) ? 'Excluindo...' : 'Excluir'}
                  </motion.button>
                )}

                {user && user.id !== art.user_id && (
                  <motion.button
                    {...subtleButtonMotion}
                    onClick={() => setRatingTarget(art)}
                    className="elegant-btn-outline text-[10px] py-1.5 px-4 tracking-widest uppercase font-bold"
                  >
                    Avaliar
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {artworks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-32 text-center"
        >
          <p className="font-serif text-2xl text-muted italic">A galeria aguarda sua primeira pincelada.</p>
        </motion.div>
      )}

      <AnimatePresence>
        {ratingTarget && user && (
          <RatingModal
            artwork={ratingTarget}
            user={user}
            onClose={() => setRatingTarget(null)}
            onRated={fetchArt}
            useBackendRating={usesBackendPosts}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            title="Excluir Publicação"
            description="Esta ação remove a publicação do coletivo e não pode ser desfeita."
            itemName={deleteTarget.title}
            loading={deletingPostIds.includes(deleteTarget.id)}
            error={deleteError}
            onCancel={closeDeleteModal}
            onConfirm={() => void handleDeletePost()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bidTarget && user && (
          <BidModal
            artwork={bidTarget}
            user={user}
            onClose={() => setBidTarget(null)}
            onChanged={fetchArt}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
