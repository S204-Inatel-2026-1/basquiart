import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send } from 'lucide-react';
import { Comment, User } from '../types';
import { api } from '../services/api';

export const CommentsSection = ({
  artworkId,
  user,
  onCommentAdded,
  useBackendComments = false,
}: {
  artworkId: number;
  user: User | null;
  onCommentAdded?: () => void;
  useBackendComments?: boolean;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = () => {
    setLoading(true);

    if (useBackendComments) {
      api.posts.listComments(artworkId)
        .then(data => {
          setComments(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching comments:', err);
          setLoading(false);
        });
      return;
    }

    fetch(`/api/artworks/${artworkId}/comments`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch comments');
        return res.json();
      })
      .then(data => {
        setComments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching comments:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComments();
  }, [artworkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    setError('');
    try {
      if (useBackendComments) {
        await api.posts.createComment(artworkId, newComment);
        setNewComment('');
        fetchComments();
        if (onCommentAdded) onCommentAdded();
        return;
      }

      const res = await fetch(`/api/artworks/${artworkId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, content: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
        if (onCommentAdded) onCommentAdded();
      } else {
        const err = await res.json();
        setError((err as { error?: string }).error || 'Erro ao postar comentário');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro de conexão ao postar comentário');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-ink/5">
      <h4 className="font-serif text-lg mb-6 flex items-center gap-2">
        <MessageSquare size={16} className="text-gold" /> Diálogo
      </h4>

      <div className="space-y-6 mb-8 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar scroll-smooth">
        {comments.map(comment => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4 p-3 rounded-2xl hover:bg-ink/[0.02] transition-colors"
          >
            <img src={comment.avatar_url} className="w-8 h-8 rounded-full border border-ink/5 flex-shrink-0" alt="" />
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-ink">{comment.username}</span>
                <span className="text-[9px] text-muted uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm font-sans text-muted leading-relaxed">{comment.content}</p>
            </div>
          </motion.div>
        ))}
        {comments.length === 0 && !loading && (
          <div className="py-12 text-center">
            <p className="text-xs text-muted italic font-serif">Nenhum diálogo ainda. Seja o primeiro a falar.</p>
          </div>
        )}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder=""
            className="w-full bg-paper/50 border border-ink/10 rounded-full py-3 px-6 pr-12 text-sm font-sans focus:outline-none focus:border-gold/50 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gold hover:text-ink transition-colors disabled:opacity-30"
          >
            <Send size={18} />
          </button>
          {error && <p className="mt-2 text-red-500 text-xs font-sans">{error}</p>}
        </form>
      )}
    </div>
  );
};
