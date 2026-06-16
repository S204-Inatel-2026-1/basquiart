import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { modalBackdropMotion, modalPanelMotion, subtleButtonMotion } from '../lib/motion';

export const DeleteConfirmModal = ({
  title,
  description,
  itemName,
  confirmLabel = 'EXCLUIR',
  loading = false,
  error = '',
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  itemName?: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  return (
    <motion.div
      {...modalBackdropMotion}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <motion.div
        {...modalPanelMotion}
        className="bg-card soft-card p-10 w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle size={20} />
          </div>
          <h3 className="font-serif text-3xl">{title}</h3>
        </div>

        <p className="font-sans text-sm leading-relaxed text-muted">{description}</p>

        {itemName && (
          <div className="mt-6 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
            <p className="font-sans text-xs font-semibold tracking-wide text-ink">{itemName}</p>
          </div>
        )}

        {error && <p className="mt-6 font-sans text-xs text-red-500">{error}</p>}

        <div className="mt-8 flex gap-4">
          <motion.button
            {...subtleButtonMotion}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 elegant-btn-outline disabled:opacity-40"
          >
            CANCELAR
          </motion.button>
          <motion.button
            {...subtleButtonMotion}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-full bg-red-500 px-6 py-3 font-sans text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-ink disabled:opacity-40"
          >
            {loading ? 'EXCLUINDO...' : confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
