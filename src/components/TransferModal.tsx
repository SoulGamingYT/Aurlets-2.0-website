import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Coins, ShieldAlert, ArrowRight, CheckCircle } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderName: string;
  senderPoints: number;
  onTransferSuccess: (newPoints: number, message: string) => void;
  showNotice: (message: string, type: 'success' | 'error') => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  senderName,
  senderPoints,
  onTransferSuccess,
  showNotice
}: TransferModalProps) {
  const [targetInput, setTargetInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = parseInt(amountInput, 10);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetInput.trim()) {
      setError('Recipient search term (Discord ID, Username, or Nickname) is required.');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive integer.');
      return;
    }

    if (parsedAmount > senderPoints) {
      setError(`Insufficient balance. You have ${senderPoints} AP.`);
      return;
    }

    if (parsedAmount > 300) {
      setError('Maximum daily transfer limit is 300 Aura Points.');
      return;
    }

    setIsConfirming(true);
  };

  const handleConfirmTransfer = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/transfer-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderName,
          targetInput: targetInput.trim(),
          amount: parsedAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Point transfer failed.');
      }

      onTransferSuccess(data.newPoints, data.message || 'Points transferred successfully.');
      showNotice(data.message || 'Points transferred successfully.', 'success');
      
      // Reset form and close
      setTargetInput('');
      setAmountInput('');
      setIsConfirming(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during transfer.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-900/30 text-purple-400">
              <Send className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Transfer Aura Points</h2>
              <p className="text-[10px] text-zinc-500 font-mono">Send AP to friends & players</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Ribbon */}
        <div className="px-6 py-2 bg-purple-950/20 border-b border-zinc-900/50 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">Your Current Balance</span>
          <span className="text-purple-400 font-bold flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" />
            {senderPoints} AP
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {!isConfirming ? (
              <motion.form
                key="input-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleNextStep}
                className="space-y-4"
              >
                {/* Target Recipient Input */}
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Recipient User
                  </label>
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="Enter nickname, Discord ID or username"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-sans"
                    disabled={loading}
                    required
                  />
                  <p className="text-[10px] text-zinc-500 mt-1 font-sans">
                    The recipient must have logged in or synchronized to the website at least once.
                  </p>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Transfer Amount (AP)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      placeholder="e.g. 100"
                      min="1"
                      max="300"
                      className="w-full pl-3.5 pr-14 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                      disabled={loading}
                      required
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 font-bold">
                      MAX 300
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1.5 text-[10px] text-zinc-500">
                    <span>Limit: max 300 AP per day</span>
                    <button
                      type="button"
                      onClick={() => setAmountInput(Math.min(300, senderPoints).toString())}
                      className="text-purple-400 hover:underline font-mono"
                    >
                      Use Max
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Next Step Action */}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="confirm-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 text-center"
              >
                {/* Confirmation Alert */}
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-left space-y-3">
                  <div className="flex items-center gap-2.5 text-zinc-400 text-xs">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    <span>Please confirm the transfer details below:</span>
                  </div>

                  <div className="border-t border-zinc-900 pt-2.5 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-mono">Recipient:</span>
                      <span className="text-white font-bold">{targetInput}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-mono">Amount to Send:</span>
                      <span className="text-purple-400 font-bold font-mono">{parsedAmount} AP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-mono">Remaining Balance:</span>
                      <span className="text-zinc-400 font-mono">{senderPoints - parsedAmount} AP</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl text-left flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Confirm Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsConfirming(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-all"
                    disabled={loading}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleConfirmTransfer}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirm Send <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
