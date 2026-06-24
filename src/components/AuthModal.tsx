import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Key, Sparkles, User, ExternalLink } from 'lucide-react';
import { DiscordIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscordLogin: () => void;
  onCustomLogin: (name: string, avatar: string) => void;
  discordConfigured: boolean;
}

export default function AuthModal({
  isOpen,
  onClose,
  onDiscordLogin,
  onCustomLogin,
  discordConfigured
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'discord' | 'custom' | 'setup'>('discord');
  
  // Custom login state
  const [customName, setCustomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80');

  const premadeAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop&q=80'
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      onCustomLogin(customName.trim(), selectedAvatar);
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
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl overflow-hidden z-10"
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
            <p className="text-xs text-zinc-500 mt-1">Choose how you want to access the farm & games.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs switcher */}
        <div className="flex gap-1 p-1 bg-zinc-900/60 rounded-xl border border-zinc-900/80 mb-6">
          <button
            onClick={() => setActiveTab('discord')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'discord'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DiscordIcon className="w-3.5 h-3.5 fill-current" />
            Discord Auth
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Guest Play
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'setup'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Keys Setup
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[220px]">
          {/* Discord Auth Tab */}
          {activeTab === 'discord' && (
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
                      To run the real Discord login, the host must configure the <code className="px-1.5 py-0.5 bg-amber-500/10 text-amber-200 rounded font-mono text-[10px]">DISCORD_CLIENT_ID</code> and <code className="px-1.5 py-0.5 bg-amber-500/10 text-amber-200 rounded font-mono text-[10px]">DISCORD_CLIENT_SECRET</code> environment variables in AI Studio settings.
                    </p>
                  </div>

                  <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-900/10 text-xs text-zinc-400 leading-normal space-y-2 text-center">
                    <p>
                      🔒 To ensure security and prevent account impersonation, Discord simulation logins have been disabled.
                    </p>
                    <p className="font-semibold text-purple-400">
                      Please use the "Guest Play" tab above to create a custom profile and enter the farm arena!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guest Play Tab */}
          {activeTab === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400">Enter a Nickname</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PakistanAuraFarmer"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-purple-500 focus:outline-none text-sm text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">Select Profile Avatar</label>
                <div className="flex gap-3 justify-center">
                  {premadeAvatars.map((av) => {
                    const isSelected = selectedAvatar === av;
                    return (
                      <button
                        type="button"
                        key={av}
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-12 h-12 rounded-full border-2 transition-all p-0.5 ${
                          isSelected ? 'border-purple-500 scale-105' : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <img src={av} alt="Avatar Selection" className="w-full h-full rounded-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!customName.trim()}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Enter Arena
              </button>
            </form>
          )}

          {/* Keys Setup Tab */}
          {activeTab === 'setup' && (
            <div className="space-y-4 text-xs text-zinc-400 leading-relaxed">
              <p>
                To enable authentic logins for your community users via their actual Discord accounts, please follow these steps:
              </p>
              
              <ol className="list-decimal list-inside space-y-2 pl-1 bg-zinc-900/30 p-3 rounded-lg border border-zinc-900">
                <li>Go to the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-purple-400 font-bold hover:underline inline-flex items-center gap-0.5">Discord Developer Portal <ExternalLink className="w-3 h-3" /></a></li>
                <li>Create a "New Application" and copy its Client ID and Secret.</li>
                <li>In the OAuth2 section of your Discord Application, add these exact redirect URLs:</li>
              </ol>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 font-mono text-[10px]">
                <div className="space-y-1">
                  <div className="text-zinc-500 font-bold">DEV APP REDIRECT:</div>
                  <div className="text-purple-300 break-all bg-zinc-900/80 p-1.5 rounded border border-zinc-800 select-all">
                    https://ais-dev-mi5isjwmxcwzz2wnkckp6y-950813206559.asia-east1.run.app/api/auth/discord/callback
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-zinc-500 font-bold">SHARED APP REDIRECT:</div>
                  <div className="text-purple-300 break-all bg-zinc-900/80 p-1.5 rounded border border-zinc-800 select-all">
                    https://ais-pre-mi5isjwmxcwzz2wnkckp6y-950813206559.asia-east1.run.app/api/auth/discord/callback
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400 shrink-0" />
                <p className="text-[10px] text-zinc-300">
                  Finally, set <code className="text-purple-300 font-bold">DISCORD_CLIENT_ID</code> and <code className="text-purple-300 font-bold">DISCORD_CLIENT_SECRET</code> inside the workspace's Secrets settings panel.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
