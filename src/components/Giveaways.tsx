import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gift, Calendar, Award, MessageSquare, Gamepad2, Plus, Sparkles, Check, AlertCircle, Trophy, Trash, RefreshCw } from 'lucide-react';

interface Giveaway {
  id: string;
  prizeType: 'role' | 'ap' | 'minecraft' | 'other';
  prizeName: string;
  rewardValue?: number;
  requirements: {
    discordMessages?: number;
    gamesPlayed?: number;
  };
  participants: string[];
  winner?: string;
  startedBy: string;
  startedAt: number;
  endedAt?: number;
  status: 'active' | 'ended';
}

interface GiveawaysProps {
  isLoggedIn: boolean;
  nickname: string;
  isAdmin: boolean;
  discordUserId?: string;
  showNotice: (msg: string, type: 'success' | 'error' | 'info') => void;
  onOpenAuthModal: () => void;
}

export default function Giveaways({
  isLoggedIn,
  nickname,
  isAdmin,
  discordUserId = '',
  showNotice,
  onOpenAuthModal
}: GiveawaysProps) {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User Stats (to check requirements)
  const [userStats, setUserStats] = useState({
    discordMessages: 0,
    gamesPlayed: 0
  });

  // Create Form State
  const [prizeType, setPrizeType] = useState<'role' | 'ap' | 'minecraft' | 'other'>('ap');
  const [prizeName, setPrizeName] = useState('');
  const [rewardValue, setRewardValue] = useState('');
  const [reqMessages, setReqMessages] = useState('');
  const [reqGames, setReqGames] = useState('');

  const fetchGiveaways = async () => {
    try {
      const res = await fetch('/api/giveaways');
      if (res.ok) {
        const data = await res.json();
        setGiveaways(data || []);
      }
    } catch (err) {
      console.error('Error fetching giveaways:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!isLoggedIn || !nickname) return;
    try {
      const res = await fetch(`/api/user/sync?name=${encodeURIComponent(nickname)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.farmer) {
          setUserStats({
            discordMessages: data.farmer.discordMessagesCount || 0,
            gamesPlayed: data.farmer.totalGamesPlayed || 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  useEffect(() => {
    fetchGiveaways();
    fetchUserStats();
    const interval = setInterval(() => {
      fetchGiveaways();
    }, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn, nickname]);

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizeName.trim()) {
      showNotice('Please enter a prize name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/giveaways/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prizeType,
          prizeName: prizeName.trim(),
          rewardValue: rewardValue ? parseInt(rewardValue, 10) : undefined,
          reqMessages: reqMessages ? parseInt(reqMessages, 10) : undefined,
          reqGames: reqGames ? parseInt(reqGames, 10) : undefined,
          adminUsername: nickname || 'Admin',
          adminDiscordId: discordUserId
        })
      });

      if (res.ok) {
        showNotice(`🎉 Giveaway for ${prizeName} successfully started!`, 'success');
        setPrizeName('');
        setRewardValue('');
        setReqMessages('');
        setReqGames('');
        fetchGiveaways();
      } else {
        const errData = await res.json();
        showNotice(errData.error || 'Failed to create giveaway.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotice('Network error creating giveaway.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterGiveaway = async (giveawayId: string) => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }

    try {
      const res = await fetch('/api/giveaways/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: giveawayId, name: nickname })
      });

      if (res.ok) {
        showNotice('🎉 You have entered the giveaway! Good luck!', 'success');
        fetchGiveaways();
      } else {
        const errData = await res.json();
        showNotice(errData.error || 'Failed to enter giveaway.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotice('Network error entering giveaway.', 'error');
    }
  };

  const handleEndGiveaway = async (giveawayId: string) => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/giveaways/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: giveawayId,
          adminDiscordId: discordUserId,
          adminUsername: nickname || 'Admin'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.winner) {
          showNotice(`🏆 Winner drawn! Congratulations to ${data.winner}!`, 'success');
        } else {
          showNotice('Giveaway ended, but there were no participants.', 'info');
        }
        fetchGiveaways();
      } else {
        const errData = await res.json();
        showNotice(errData.error || 'Failed to end giveaway.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotice('Network error ending giveaway.', 'error');
    }
  };

  return (
    <div id="giveaways-section-container" className="space-y-8 max-w-5xl mx-auto text-left">
      {/* Header Banner */}
      <div className="text-center space-y-3 py-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-800/40 text-purple-400 text-[10px] font-bold font-mono tracking-wider uppercase">
          <Gift className="w-3.5 h-3.5 animate-bounce" /> Community Giveaways
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
          Aura Giveaways & Prizes
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Participate in active giveaways hosted by server team and admins. Meet the message activity or gaming benchmarks to enter!
        </p>
      </div>

      {/* User Stats Overview (Requirements check) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 space-y-6">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1.5">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono text-zinc-400">
                Your Giveaway Stats
              </h3>
              <p className="text-xs text-zinc-500">
                These statistics determine your eligibility for high-tier giveaways. Keep chatting on Discord and playing Arcade games to unlock entry!
              </p>
            </div>

            {isLoggedIn ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="text-xs text-zinc-400 font-medium block">Discord Messages</span>
                      <span className="text-[10px] text-zinc-500">Persistent log</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-lg text-white">
                    {userStats.discordMessages}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                      <Gamepad2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="text-xs text-zinc-400 font-medium block">Games Played</span>
                      <span className="text-[10px] text-zinc-500">Arcade sessions</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-lg text-white">
                    {userStats.gamesPlayed}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-zinc-900/40 border border-zinc-900 rounded-2xl text-center space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Connect your Discord profile or sync nicknames to view your live stats and check giveaway requirements.
                </p>
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all w-full"
                >
                  Connect Profile
                </button>
              </div>
            )}
          </div>

          {/* Admin Panel Creator */}
          {isAdmin && (
            <form onSubmit={handleCreateGiveaway} className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div className="border-b border-zinc-900 pb-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-400" /> Create Giveaway
                </h3>
                <p className="text-[10px] text-zinc-500">Host a cross-platform (Web + Discord) giveaway</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Prize Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ap', 'role', 'minecraft', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPrizeType(type)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all uppercase ${
                        prizeType === type
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Prize Name</label>
                <input
                  type="text"
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  placeholder="e.g. VIP Custom Role, 5000 Aura Points"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {prizeType === 'ap' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Aura Points Reward Value</label>
                  <input
                    type="number"
                    value={rewardValue}
                    onChange={(e) => setRewardValue(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] font-mono text-purple-400 uppercase block">Requirements (Optional)</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Min Discord Msgs</label>
                    <input
                      type="number"
                      value={reqMessages}
                      onChange={(e) => setReqMessages(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Min Games Played</label>
                    <input
                      type="number"
                      value={reqGames}
                      onChange={(e) => setReqGames(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-950/20"
              >
                <Plus className="w-4 h-4" /> Start Giveaway
              </button>
            </form>
          )}
        </div>

        {/* Giveaways List Space (8 Columns) */}
        <div className="md:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h3 className="font-bold text-white text-base">Active & Ended Giveaways</h3>
            <button
              onClick={fetchGiveaways}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-20 border border-zinc-900/50 bg-zinc-950/10 rounded-3xl text-center text-xs font-mono text-zinc-500 animate-pulse flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              Loading Giveaways database...
            </div>
          ) : giveaways.length === 0 ? (
            <div className="p-16 border border-dashed border-zinc-850 bg-zinc-950/10 rounded-3xl text-center space-y-3">
              <Gift className="w-12 h-12 text-zinc-700 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">No Active Giveaways</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  There are currently no giveaways running or completed. Check back soon or request an Admin to start one!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {giveaways.map((g) => {
                const isEnded = g.status === 'ended';
                const hasEntered = isLoggedIn && g.participants.includes(nickname);
                
                // Requirements satisfied checks
                const msgsReqMet = !g.requirements?.discordMessages || userStats.discordMessages >= g.requirements.discordMessages;
                const gamesReqMet = !g.requirements?.gamesPlayed || userStats.gamesPlayed >= g.requirements.gamesPlayed;
                const reqsMet = msgsReqMet && gamesReqMet;

                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative rounded-3xl border p-6 overflow-hidden flex flex-col justify-between gap-5 transition-all ${
                      isEnded
                        ? 'bg-zinc-950/20 border-zinc-900 opacity-70'
                        : hasEntered
                        ? 'bg-purple-950/10 border-purple-500/20 shadow-lg shadow-purple-950/5'
                        : 'bg-zinc-900/40 border-zinc-850/80 shadow-md hover:border-zinc-800'
                    }`}
                  >
                    {/* Ribbon Accent */}
                    <div className={`absolute top-0 left-0 w-full h-[3px] ${isEnded ? 'bg-zinc-800' : hasEntered ? 'bg-purple-500' : 'bg-amber-500/40'}`} />

                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${isEnded ? 'bg-zinc-800 text-zinc-400' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {g.prizeType}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">ID: {g.id}</span>
                        </div>
                        <h4 className="text-lg font-black text-white leading-snug">
                          {g.prizeName}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Started by **{g.startedBy}**</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isEnded ? (
                          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-400 text-xs font-mono font-bold uppercase tracking-wider">
                            Ended
                          </div>
                        ) : hasEntered ? (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Entered
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Active
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Requirements block */}
                    {!isEnded && (g.requirements?.discordMessages || g.requirements?.gamesPlayed) && (
                      <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl space-y-1.5">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Requirements to enter:</span>
                        <div className="flex flex-wrap gap-4 text-xs">
                          {g.requirements.discordMessages && (
                            <div className="flex items-center gap-1.5 font-mono">
                              <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="text-zinc-400">Msgs:</span>
                              <span className={msgsReqMet ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                                {userStats.discordMessages}/{g.requirements.discordMessages}
                              </span>
                            </div>
                          )}

                          {g.requirements.gamesPlayed && (
                            <div className="flex items-center gap-1.5 font-mono">
                              <Gamepad2 className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="text-zinc-400">Games:</span>
                              <span className={gamesReqMet ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                                {userStats.gamesPlayed}/{g.requirements.gamesPlayed}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer elements */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-zinc-900 pt-4 mt-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                        <span>Participants:</span>
                        <span className="font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                          {g.participants?.length || 0}
                        </span>
                      </div>

                      {isEnded ? (
                        <div className="p-3 bg-zinc-900/20 border border-zinc-900 rounded-2xl flex items-center gap-2.5 w-full sm:w-auto">
                          <Trophy className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                          <div className="text-left text-xs">
                            <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Winner drawn</span>
                            <span className="font-black text-white">{g.winner || 'No entries (Rolled none)'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          {isAdmin && (
                            <button
                              onClick={() => handleEndGiveaway(g.id)}
                              className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-300 text-xs font-bold transition-all"
                            >
                              End & Draw Winner
                            </button>
                          )}

                          {!hasEntered ? (
                            <button
                              onClick={() => handleEnterGiveaway(g.id)}
                              disabled={isLoggedIn && !reqsMet}
                              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow"
                            >
                              {reqsMet ? 'Enter Giveaway' : 'Locked (Reqs Not Met)'}
                            </button>
                          ) : (
                            <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-500 text-xs font-bold font-mono uppercase">
                              Registered
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
