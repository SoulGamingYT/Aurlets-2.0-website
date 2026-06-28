import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Sparkles } from 'lucide-react';
import { DiscordIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscordLogin: () => void;
  onCustomLogin: (name: string, avatar: string) => void;
  onSimulateDiscordLogin?: (name: string, id: string) => void;
  discordConfigured: boolean;
}

export default function AuthModal({
  isOpen,
  onClose,
  onDiscordLogin,
  onCustomLogin,
  onSimulateDiscordLogin,
  discordConfigured
}: AuthModalProps) {
  // Simulated Discord state
  const [simulatedUsername, setSimulatedUsername] = useState('');
  const [simulatedId, setSimulatedId] = useState('840560998011502593');

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (simulatedUsername.trim() && onSimulateDiscordLogin) {
      onSimulateDiscordLogin(simulatedUsername.trim(), simulatedId.trim());
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
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl overflow-hidden z-10"
      >
        {/* Background Radial Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Connect to Aurlets
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Authenticate via Discord to synchronize your profile.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Discord Auth Body */}
        <div className="space-y-5">
          {discordConfigured ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-zinc-300 text-sm leading-relaxed text-center">
                🔒 Real Discord OAuth is fully configured on this Cloud Run container! Clicking connect will securely authorize your Discord profile.
              </div>
              <button
                onClick={onDiscordLogin}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all active:scale-98 flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/10"
              >
                <DiscordIcon className="w-5 h-5 fill-white" />
                Authorize Discord Login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Alert Banner */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <ShieldAlert className="w-4 h-4" /> Real OAuth Credentials Missing
                </div>
                <p>
                  Real Discord OAuth is not configured. But you can still log in using the simulated Discord login below to unlock and test all Discord integration features!
                </p>
              </div>

              {/* Simulated Discord Login */}
              <form onSubmit={handleSimulatedSubmit} className="space-y-4 p-4 border border-zinc-900 rounded-2xl bg-zinc-900/10">
                <div className="text-center pb-2 border-b border-zinc-900/60">
                  <span className="text-xs font-bold text-indigo-400 block">⚡ Simulated Discord Login Mode</span>
                  <span className="text-[10px] text-zinc-500">Allows full testing of Discord integrations & roles</span>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono text-zinc-400">Simulated Discord Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PakistanAuraFarmer"
                    value={simulatedUsername}
                    onChange={(e) => setSimulatedUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-purple-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono text-zinc-400">Simulated Discord User ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 840560998011502593"
                    value={simulatedId}
                    onChange={(e) => setSimulatedId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-purple-500 focus:outline-none text-xs text-white font-mono"
                  />
                  <span className="text-[9px] text-zinc-500 block leading-tight">
                    💡 Use ID <code className="px-1 bg-zinc-900 text-purple-400 rounded font-mono">840560998011502593</code> to simulate the main Admin role.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!simulatedUsername.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <DiscordIcon className="w-4 h-4 fill-white" />
                  Login via Simulated Discord
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
