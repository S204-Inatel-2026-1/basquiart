import { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard } from 'lucide-react';
import { Bid } from '../types';
import { api } from '../services/api';
import { modalBackdropMotion, modalPanelMotion, subtleButtonMotion } from '../lib/motion';

export const PaymentModal = ({
  bid,
  onClose,
  onPaid,
}: {
  bid: Bid;
  onClose: () => void;
  onPaid: () => void;
}) => {
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.bids.pay(bid.id, { cardholderName, cardNumber, expiry, cvv });
      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao processar o pagamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div {...modalBackdropMotion} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <motion.div {...modalPanelMotion} className="bg-card soft-card p-10 max-w-sm w-full">
        <h3 className="font-serif text-3xl mb-2 flex items-center gap-2">
          <CreditCard size={22} className="text-gold" /> Pagamento
        </h3>
        <p className="text-muted text-sm mb-8">
          Lance aceito: <span className="text-gold font-semibold">R$ {bid.amount.toFixed(2)}</span>
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Nome no cartão"
            className="elegant-input"
          />
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="Número do cartão"
            maxLength={19}
            className="elegant-input"
          />
          <div className="flex gap-4">
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/AA"
              maxLength={7}
              className="elegant-input"
            />
            <input
              type="text"
              inputMode="numeric"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="CVV"
              maxLength={4}
              className="elegant-input"
            />
          </div>

          <p className="text-[10px] text-muted italic">Pagamento simulado para fins de demonstração. Nenhum valor real será cobrado.</p>

          {error && <p className="text-red-500 text-xs font-sans">{error}</p>}

          <div className="flex gap-4 mt-6">
            <motion.button {...subtleButtonMotion} onClick={onClose} className="flex-1 elegant-btn-outline">CANCELAR</motion.button>
            <motion.button {...subtleButtonMotion} onClick={() => void handlePay()} disabled={submitting} className="flex-1 elegant-btn-primary">
              {submitting ? '...' : 'PAGAR'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
