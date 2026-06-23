import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Gavel } from 'lucide-react';
import { Artwork, Bid, User } from '../types';
import { api } from '../services/api';
import { itemMotion, modalBackdropMotion, modalPanelMotion, staggerContainer, subtleButtonMotion } from '../lib/motion';
import { PaymentModal } from './PaymentModal';

const statusLabel: Record<Bid['status'], string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  rejected: 'Rejeitado',
  paid: 'Pago',
};

export const BidModal = ({
  artwork,
  user,
  onClose,
  onChanged,
}: {
  artwork: Artwork;
  user: User;
  onClose: () => void;
  onChanged: () => void;
}) => {
  const isAuthor = user.id === artwork.user_id;

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [payingBid, setPayingBid] = useState<Bid | null>(null);

  const fetchBids = () => {
    setLoading(true);
    api.bids.listForPost(artwork.id)
      .then(setBids)
      .catch(err => { console.error(err); setBids([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBids();
  }, [artwork.id]);

  const handlePlaceBid = async () => {
    const value = Number(amount.replace(',', '.'));
    if (!value || value <= 0) {
      setError('Informe um valor válido.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.bids.create(artwork.id, value);
      setAmount('');
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar o lance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (bid: Bid) => {
    setError('');
    try {
      await api.bids.accept(bid.id);
      fetchBids();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao aceitar o lance.');
    }
  };

  const handleReject = async (bid: Bid) => {
    setError('');
    try {
      await api.bids.reject(bid.id);
      fetchBids();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao rejeitar o lance.');
    }
  };

  return (
    <motion.div {...modalBackdropMotion} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <motion.div {...modalPanelMotion} className="bg-card soft-card p-10 max-w-md w-full">
        <h3 className="font-serif text-3xl mb-2 flex items-center gap-2">
          <Gavel size={22} className="text-gold" /> Lances pela Obra
        </h3>
        <p className="text-muted text-sm mb-8">
          {isAuthor
            ? 'Avalie os lances recebidos e aceite o que preferir.'
            : 'Faça um lance pela obra. Se o artista aceitar, você poderá efetuar o pagamento aqui mesmo.'}
        </p>

        {!isAuthor && (
          <div className="mb-8 flex gap-3">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Valor do lance (R$)"
              className="elegant-input"
            />
            <motion.button
              {...subtleButtonMotion}
              onClick={() => void handlePlaceBid()}
              disabled={submitting}
              className="elegant-btn-primary px-6 whitespace-nowrap"
            >
              {submitting ? '...' : 'DAR LANCE'}
            </motion.button>
          </div>
        )}

        {error && <p className="text-red-500 text-xs font-sans mb-4">{error}</p>}

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {loading && <p className="text-xs text-muted italic">Carregando lances...</p>}
          {!loading && bids.length === 0 && (
            <p className="text-xs text-muted italic">Nenhum lance até agora.</p>
          )}
          {bids.map((bid) => (
            <motion.div key={bid.id} variants={itemMotion} className="p-4 bg-paper/30 rounded-2xl border border-ink/5 flex items-center justify-between gap-3">
              <div>
                {(isAuthor || bid.bidder_id === user.id) && (
                  <p className="font-sans text-xs font-semibold">
                    {bid.bidder_id === user.id ? 'Você' : bid.bidder_username}
                  </p>
                )}
                <p className="font-serif text-lg text-gold">R$ {bid.amount.toFixed(2)}</p>
                <p className="font-sans text-[10px] uppercase tracking-widest text-muted">{statusLabel[bid.status]}</p>
              </div>

              {isAuthor && bid.status === 'pending' && (
                <div className="flex gap-2">
                  <motion.button {...subtleButtonMotion} onClick={() => void handleAccept(bid)} className="elegant-btn-primary text-[10px] py-1.5 px-3">
                    Aceitar
                  </motion.button>
                  <motion.button {...subtleButtonMotion} onClick={() => void handleReject(bid)} className="elegant-btn-outline text-[10px] py-1.5 px-3">
                    Rejeitar
                  </motion.button>
                </div>
              )}

              {!isAuthor && bid.bidder_id === user.id && bid.status === 'accepted' && (
                <motion.button {...subtleButtonMotion} onClick={() => setPayingBid(bid)} className="elegant-btn-primary text-[10px] py-1.5 px-3">
                  Pagar
                </motion.button>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.button {...subtleButtonMotion} onClick={onClose} className="w-full elegant-btn-outline mt-8">
          FECHAR
        </motion.button>
      </motion.div>

      {payingBid && (
        <PaymentModal
          bid={payingBid}
          onClose={() => setPayingBid(null)}
          onPaid={() => {
            setPayingBid(null);
            fetchBids();
            onChanged();
          }}
        />
      )}
    </motion.div>
  );
};
