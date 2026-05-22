import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Share2 } from 'lucide-react';
import { Group, User } from '../types';
import { api } from '../services/api';
import { itemMotion, panelMotion, staggerContainer } from '../lib/motion';

export const SubmitPage = ({
  user,
  groupId,
  onComplete,
}: {
  user: User;
  groupId?: number;
  onComplete: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>(groupId ? 'private' : 'public');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(groupId || null);

  useEffect(() => {
    api.groups.listMine()
      .then(groups => {
        setUserGroups(groups);
        if (groupId) {
          setSelectedGroupId(groupId);
        } else if (!selectedGroupId && groups.length > 0) {
          setSelectedGroupId(groups[0].id);
        }
      })
      .catch(err => { console.error(err); setUserGroups([]); });
  }, [user.id, groupId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (visibility === 'private' && (!selectedGroupId || !imageFile)) return;
    if (visibility === 'public' && !image) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      if (visibility === 'private' && selectedGroupId && imageFile) {
        await api.posts.createInGroup(selectedGroupId, { title, description, image: imageFile });
        onComplete();
        return;
      }

      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
          group_ids: [],
          title,
          description,
          image_url: image,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Falha ao publicar.');
      }

      onComplete();
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : 'Erro ao publicar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 sm:p-12">
<<<<<<< Updated upstream
      <motion.div {...panelMotion} className="bg-white soft-card p-10 sm:p-16">
=======
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card soft-card p-10 sm:p-16"
      >
>>>>>>> Stashed changes
        <div className="text-center mb-16">
          <h1 className="font-serif text-6xl mb-4">Compartilhe Sua Visão</h1>
          <p className="text-muted font-sans text-sm tracking-wide">Contribua com sua última obra-prima para o coletivo.</p>
        </div>

        <motion.form
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
        >
          <motion.div variants={itemMotion} className="space-y-10 flex flex-col items-center">
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full max-w-[280px] aspect-square rounded-3xl border border-dashed border-ink/10 bg-paper/50 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 hover:border-gold/30 transition-all relative overflow-hidden group"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              {image ? (
                <img src={image} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <>
                  <Upload size={32} className="mb-4 text-muted group-hover:text-gold transition-colors" />
                  <span className="font-sans text-[9px] tracking-[0.2em] font-bold uppercase text-muted group-hover:text-gold">Enviar Arte</span>
                </>
              )}
              <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </motion.div>

            <motion.div variants={itemMotion} className="w-full bg-paper/50 p-8 rounded-3xl border border-ink/5">
              <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
                <Share2 size={18} className="text-gold" /> Visibilidade
              </h3>

              <div className="flex gap-4 mb-8">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex-1 py-3 rounded-xl font-sans text-[10px] tracking-widest font-bold uppercase transition-all ${visibility === 'public' ? 'bg-gold text-ink' : 'bg-card text-muted border border-ink/5'}`}
                >
                  Público
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex-1 py-3 rounded-xl font-sans text-[10px] tracking-widest font-bold uppercase transition-all ${visibility === 'private' ? 'bg-gold text-ink' : 'bg-card text-muted border border-ink/5'}`}
                >
                  Privado
                </button>
              </div>

              {visibility === 'private' && (
                <div className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Selecionar Coletivo</label>
                  <select
                    value={selectedGroupId || ''}
                    onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                    className="elegant-input"
                  >
                    {userGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                    {userGroups.length === 0 && <option disabled>Nenhum grupo participado</option>}
                  </select>
                </div>
              )}
            </motion.div>
          </motion.div>

          <motion.div variants={staggerContainer} className="space-y-8">
            <motion.div variants={itemMotion} className="space-y-2">
              <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="elegant-input"
                placeholder=""
                required
              />
            </motion.div>

            <motion.div variants={itemMotion} className="space-y-2">
              <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Manifesto / Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="elegant-input min-h-[150px]"
                placeholder=""
              />
            </motion.div>

            {submitError && (
              <motion.p variants={itemMotion} className="text-red-500 text-sm font-sans">{submitError}</motion.p>
            )}

            <motion.div variants={itemMotion} className="pt-8">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={
                  submitting ||
                  !title ||
                  (visibility === 'private'
                    ? !selectedGroupId || !imageFile
                    : !image)
                }
                className="w-full elegant-btn-primary py-5 text-lg"
              >
                {submitting ? 'Publicando...' : 'Publicar na Galeria'}
              </motion.button>
              <p className="mt-6 font-sans text-[10px] text-muted text-center tracking-widest uppercase italic">
                * A avaliação por pares começará após a publicação.
              </p>
            </motion.div>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};
