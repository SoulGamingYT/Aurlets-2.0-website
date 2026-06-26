import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Clock, UserPlus, Copy, Check, Award, Gift, Share2, HelpCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface LeaderboardPlayer {
  name: string;
  points?: number;
  streak?: number;
  timeOnWebsite?: number; // in seconds
  invites?: number;
  avatarUrl?: string;
  discordUsername?: string;
}

interface LeaderboardsData {
  ap: LeaderboardPlayer[];
  streak: LeaderboardPlayer[];
  time: LeaderboardPlayer[];
  invites: LeaderboardPlayer[];
}

interface LeaderboardsProps {
  isLoggedIn: boolean;
  nickname: string;
  onOpenAuthModal: () => void;
  showNotice: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function Leaderboards({
  isLoggedIn,
  nickname,
  onOpenAuthModal,
  showNotice
}: LeaderboardsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ap' | 'streak' | 'time' | 'invites'>('ap');
  const [leaderboards, setLeaderboards] = useState<LeaderboardsData>({
    ap: [],
    streak: [],
    time: [],
    invites: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [userStats, setUserStats] = useState<{
    invites: number;
    streak: number;
    timeOnWebsite: number;
    invitedBy?: string;
  }>({
    invites: 0,
    streak: 0,
    timeOnWebsite: 0
  });

  const fetchLeaderboards = async () => {
    try {
      const res = await fetch('/api/leaderboards');
      if (res.ok) {
        const data = await res.json();
        setLeaderboards(data);
      }
    } catch (err) {
      console.error('Error fetching leaderboards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSpecificStats = async () => {
    if (!isLoggedIn || !nickname) return;
    try {
      // Find the user's specific record from the server
      const res = await fetch(`/api/afk/leaderboard`);
      if (res.ok) {
        const list = await res.json();
        // Since AFK leaderboard list contains all synced farmers, let's look up our current player
        // Wait, does the backend have an endpoint to get a single farmer? No, but we can query the list or filter on client
        // Let's retrieve from api/leaderboards directly as we fetched it
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaderboards();
    const interval = setInterval(fetchLeaderboards, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update user stats whenever leaderboards change or user logs in
  useEffect(() => {
    if (isLoggedIn && nickname) {
      // Find our record in the lists
      const apRecord = leaderboards.ap.find(x => x.name.toLowerCase() === nickname.toLowerCase());
      const streakRecord = leaderboards.streak.find(x => x.name.toLowerCase() === nickname.toLowerCase());
      const timeRecord = leaderboards.time.find(x => x.name.toLowerCase() === nickname.toLowerCase());
      const invitesRecord = leaderboards.invites.find(x => x.name.toLowerCase() === nickname.toLowerCase());

      // Let's also do a quiet sync query or fetch from server if possible, or just use what we found in active leaderboards
      setUserStats({
        invites: invitesRecord?.invites || 0,
        streak: streakRecord?.streak || 0,
        timeOnWebsite: timeRecord?.timeOnWebsite || 0
      });
    }
  }, [leaderboards, isLoggedIn, nickname]);

  const inviteLink = isLoggedIn && nickname 
    ? `${window.location.origin}/?ref=${encodeURIComponent(nickname)}`
    : `${window.location.origin}`;

  const handleCopyInvite = () => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    showNotice('Your custom invite link was copied to clipboard! 📋', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '0m';
    const d = Math.floor(seconds / (24 * 3600));
    const h = Math.floor((seconds % (24 * 3600)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    let parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m}m`);
    if (parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
  };

  const getActiveList = () => {
    switch (activeSubTab) {
      case 'ap': return leaderboards.ap;
      case 'streak': return leaderboards.streak;
      case 'time': return leaderboards.time;
      case 'invites': return leaderboards.invites;
      default: return [];
    }
  };

  const getMetricLabel = (player: LeaderboardPlayer) => {
    switch (activeSubTab) {
      case 'ap': return `${player.points ?? 0} AP`;
      case 'streak': return `🔥 ${player.streak ?? 0} Days`;
      case 'time': return formatTime(player.timeOnWebsite);
      case 'invites': return `${player.invites ?? 0} Invited`;
      default: return '';
    }
  };

  const activeList = getActiveList();

  return (
    <div className="space-y-8 max-w-5xl mx-auto" id="leaderboards-container">
      {/* Premium Header */}
      <div className="text-center space-y-3 py-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-800/40 text-purple-400 text-[10px] font-bold font-mono tracking-wider uppercase">
          <Trophy className="w-3.5 h-3.5" /> High Scores & Rankings
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
          Community Hall of Fame
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          The ultimate ranking dashboard. Earn Aura Points, claim daily rewards consistently, invite friends, and actively browse the webapp to secure your spot at the top!
        </p>
      </div>

      {/* Grid: Left Column Invite System, Right Column Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* INVITE FRIENDS / PERSONAL STATS PANEL */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Custom Invite Link Card */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden space-y-5">
            {/* Ambient Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-600/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Invite Friends & Earn AP</h3>
                <p className="text-zinc-500 text-xs mt-1">
                  Share your referral link. For each active user who registers via your link, you get rewarded instantly!
                </p>
              </div>
            </div>

            {/* Reward Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">You Receive</span>
                <span className="text-sm font-black text-purple-400 font-mono">+20 AP</span>
              </div>
              <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Friend Receives</span>
                <span className="text-sm font-black text-pink-400 font-mono">+10 AP</span>
              </div>
            </div>

            {/* Copy Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Your Referral Link</label>
              {isLoggedIn ? (
                <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-zinc-900 rounded-2xl pl-3">
                  <span className="text-xs font-mono text-zinc-400 truncate flex-1 select-all select-none">
                    {inviteLink}
                  </span>
                  <button
                    onClick={handleCopyInvite}
                    className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl text-center space-y-2.5">
                  <p className="text-xs text-zinc-400 leading-snug">Connect your Discord or setup nickname to generate your custom invite link and start earning rewards!</p>
                  <button
                    onClick={onOpenAuthModal}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all inline-flex items-center gap-1.5"
                  >
                    Connect Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Your Profile Performance Stats */}
          {isLoggedIn && (
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" /> Your Hall of Fame Progress
              </h4>
              <div className="grid grid-cols-3 gap-3">
                
                <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-900/40 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block leading-tight">Daily Streak</span>
                  <div>
                    <span className="text-lg font-black text-white font-mono block mt-1">
                      {userStats.streak} <span className="text-xs text-orange-500">🔥</span>
                    </span>
                    <span className="text-[9px] text-zinc-500 block leading-none">days active</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-900/40 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block leading-tight">Time On Site</span>
                  <div>
                    <span className="text-xs font-black text-white font-mono block mt-2 truncate">
                      {formatTime(userStats.timeOnWebsite)}
                    </span>
                    <span className="text-[9px] text-zinc-500 block leading-none">elapsed time</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-900/40 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block leading-tight">Total Invites</span>
                  <div>
                    <span className="text-lg font-black text-white font-mono block mt-1">
                      {userStats.invites} <span className="text-xs text-purple-400">👥</span>
                    </span>
                    <span className="text-[9px] text-zinc-500 block leading-none">referred</span>
                  </div>
                </div>

              </div>

              {/* Bonus summary info */}
              <div className="bg-purple-950/10 border border-purple-900/20 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-purple-300">
                <Gift className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  You have earned <span className="font-bold text-white font-mono">{userStats.invites * 20} AP</span> from invite-based referrals. Invite more friends to keep racking up AP!
                </span>
              </div>
            </div>
          )}

        </div>

        {/* FOUR-CATEGORY LEADERBOARDS LIST */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sub Tab Switcher */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-900/40 border border-zinc-900 rounded-2xl">
            <button
              onClick={() => setActiveSubTab('ap')}
              className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'ap'
                  ? 'bg-purple-600 text-white shadow shadow-purple-500/15'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Aura Points
            </button>
            <button
              onClick={() => setActiveSubTab('streak')}
              className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'streak'
                  ? 'bg-purple-600 text-white shadow shadow-purple-500/15'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Daily Streak
            </button>
            <button
              onClick={() => setActiveSubTab('time')}
              className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'time'
                  ? 'bg-purple-600 text-white shadow shadow-purple-500/15'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Time Browsed
            </button>
            <button
              onClick={() => setActiveSubTab('invites')}
              className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'invites'
                  ? 'bg-purple-600 text-white shadow shadow-purple-500/15'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Top Inviters
            </button>
          </div>

          {/* Table list card */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl overflow-hidden min-h-[400px] flex flex-col justify-between">
            {isLoading ? (
              <div className="p-20 text-center text-xs font-mono text-zinc-500 animate-pulse flex-1 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                Loading Rankings data...
              </div>
            ) : activeList.length === 0 ? (
              <div className="p-20 text-center text-xs text-zinc-500 font-mono flex-1 flex items-center justify-center">
                No rankings recorded for this category yet. Be the first to secure a spot!
              </div>
            ) : (
              <div className="divide-y divide-zinc-900/50">
                {activeList.map((player, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  const isCurrentUser = isLoggedIn && nickname && player.name.toLowerCase() === nickname.toLowerCase();

                  return (
                    <div
                      key={index}
                      className={`px-5 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                        isCurrentUser 
                          ? 'bg-purple-950/10 border-l-2 border-purple-500' 
                          : 'hover:bg-zinc-900/10'
                      }`}
                    >
                      {/* Left: rank + player details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-7 h-7 flex items-center justify-center font-black font-mono text-xs shrink-0">
                          {rank === 1 ? (
                            <span className="text-xl">🥇</span>
                          ) : rank === 2 ? (
                            <span className="text-xl">🥈</span>
                          ) : rank === 3 ? (
                            <span className="text-xl">🥉</span>
                          ) : (
                            <span className="text-zinc-500">#{rank}</span>
                          )}
                        </div>

                        {/* Player Avatar */}
                        <img
                          src={player.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80'}
                          alt={player.name}
                          className="w-8 h-8 rounded-lg object-cover border border-zinc-900 shrink-0"
                          referrerPolicy="no-referrer"
                        />

                        {/* Nickname & Discord tags */}
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-white truncate flex items-center gap-1.5">
                            {player.name}
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[9px] text-purple-400 font-bold uppercase tracking-wider scale-90">
                                You
                              </span>
                            )}
                          </span>
                          {player.discordUsername && (
                            <span className="block text-[10px] text-zinc-500 font-mono font-semibold truncate leading-none mt-0.5">
                              @{player.discordUsername}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Metric Score */}
                      <div className="shrink-0 text-right font-mono font-bold text-xs text-white">
                        <span className={`px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-900 ${
                          isTopThree ? 'text-purple-400 border-purple-500/15 font-black bg-purple-950/5' : 'text-zinc-300'
                        }`}>
                          {getMetricLabel(player)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer with hint */}
            <div className="p-4 bg-zinc-900/10 border-t border-zinc-900/40 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>Updated live every 15 seconds</span>
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-300 cursor-help">
                <HelpCircle className="w-3.5 h-3.5" /> How to claim?
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
