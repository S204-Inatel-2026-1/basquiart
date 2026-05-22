import { useState } from 'react';
import { motion } from 'motion/react';
import { Artwork, User } from '../types';
import { api } from '../services/api';
import { itemMotion, modalBackdropMotion, modalPanelMotion, staggerContainer, subtleButtonMotion } from '../lib/motion';

export const RatingModal = ({
  artwork,
  user,
  onClose,
  onRated,
  useBackendRating,
}: {
  artwork: Artwork;
  user: User;
  onClose: () => void;
  onRated: () => void;
  useBackendRating: boolean;
}) => {
  const [scores, setScores] = useState({ technique: 5, authenticity: 5, creativity: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (useBackendRating) {
        await api.posts.rate(artwork.id, scores);
      } else {
        const response = await fetch(`/api/artworks/${artwork.id}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, ...scores }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({} as { error?: string }));
          throw new Error((errorData as { error?: string }).error || 'Falha ao avaliar a arte.');
        }
      }

      onRated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao avaliar a arte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div {...modalBackdropMotion} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <motion.div
<<<<<<< Updated upstream
        {...modalPanelMotion}
        className="bg-white soft-card p-10 max-w-md w-full"
=======
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card soft-card p-10 max-w-md w-full"
>>>>>>> Stashed changes
      >
        <h3 className="font-serif text-3xl mb-2">Avaliar Obra</h3>
        <p className="text-muted text-sm mb-8">Forneça sua avaliação honesta através de três pilares.</p>
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
          {(['technique', 'authenticity', 'creativity'] as const).map((key) => (
            <motion.div key={key} variants={itemMotion}>
              <div className="flex justify-between font-sans text-[10px] tracking-widest font-semibold uppercase mb-3">
                <span className="text-muted">
                  {key === 'technique' ? 'Técnica' : key === 'authenticity' ? 'Autenticidade' : 'Criatividade'}
                </span>
                <span className="text-gold">{scores[key]}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={scores[key]}
                onChange={(e) => setScores({ ...scores, [key]: parseInt(e.target.value) })}
                className="w-full accent-gold h-1.5 bg-ink/5 rounded-full appearance-none cursor-pointer"
              />
            </motion.div>
          ))}
          {error && <p className="text-red-500 text-xs font-sans">{error}</p>}
          <motion.div variants={itemMotion} className="flex gap-4 mt-10">
            <motion.button {...subtleButtonMotion} onClick={onClose} className="flex-1 elegant-btn-outline">CANCELAR</motion.button>
            <motion.button {...subtleButtonMotion} onClick={handleSubmit} disabled={submitting} className="flex-1 elegant-btn-primary">
              {submitting ? '...' : 'ENVIAR AVALIAÇÃO'}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
