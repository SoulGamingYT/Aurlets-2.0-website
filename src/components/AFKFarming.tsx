import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, UserCheck, Flame, Sparkles, LogIn, Trophy, Award, Moon, Coffee } from 'lucide-react';
import { DiscordIcon } from './Icons';
import { Tooltip } from './Tooltip';

interface LeaderboardUser {
  name: string;
  points: number;
  avatarUrl: string;
}

interface AFKFarmingProps {
  nickname: string;
  setNickname: React.Dispatch<React.SetStateAction<string>>;
  avatarUrl: string;
  setAvatarUrl: React.Dispatch<React.SetStateAction<string>>;
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenAuthModal: () => void;
}

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0s';
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  let parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
};

export default function AFKFarming({
  nickname,
  avatarUrl,
  points,
  setPoints,
  isLoggedIn,
  onOpenAuthModal
}: AFKFarmingProps) {
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isFarming, setIsFarming] = useState<boolean>(isLoggedIn);
  
  const timerRef = useRef<any>(null);

  // Real-time live leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  // AFK Users list
  interface AfkUser {
    name: string;
    avatarUrl: string;
    isAfk: boolean;
    afkSince: number;
    afkReason: string;
  }
  const [afkUsersList, setAfkUsersList] = useState<AfkUser[]>([]);

  // Loaded dynamically from localStorage
  const [userColor, setUserColor] = useState<string | null>(null);
  const [hasFrame, setHasFrame] = useState<boolean>(false);
  const [userFrameColor, setUserFrameColor] = useState<string>('#a855f7');

  useEffect(() => {
    const syncStyles = () => {
      setUserColor(localStorage.getItem('aurlets_unlocked_color'));
      setHasFrame(localStorage.getItem('aurlets_unlocked_frame') === 'true');
      setUserFrameColor(localStorage.getItem('aurlets_frame_color') || '#a855f7');
    };
    syncStyles();
    window.addEventListener('storage', syncStyles);
    return () => window.removeEventListener('storage', syncStyles);
  }, []);

  // Auto-start farming if logged in
  useEffect(() => {
    if (isLoggedIn) {
      setIsFarming(true);
    } else {
      setIsFarming(false);
    }
  }, [isLoggedIn]);

  // Fetch Live Leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/afk/leaderboard');
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            setLeaderboard(data);
          }
        }
      } catch (err) {
        console.warn('Error fetching AFK leaderboard:', err);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch AFK Users list
  useEffect(() => {
    const fetchAfkList = async () => {
      try {
        const res = await fetch('/api/afk/list');
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            setAfkUsersList(data);
          }
        }
      } catch (err) {
        console.warn('Error fetching AFK users list:', err);
      }
    };

    fetchAfkList();
    const interval = setInterval(fetchAfkList, 4000);
    return () => clearInterval(interval);
  }, []);

  // Send Heartbeat Ping to Server
  useEffect(() => {
    if (isFarming && isLoggedIn && nickname) {
      const sendPing = async () => {
        try {
          await fetch('/api/afk/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nickname, points, avatarUrl })
          });
        } catch (err) {
          console.warn('Error sending AFK ping:', err);
        }
      };

      sendPing();
      const interval = setInterval(sendPing, 5000);
      return () => clearInterval(interval);
    }
  }, [isFarming, isLoggedIn, nickname, points, avatarUrl]);

  // Farming Timer Loop (1 minute = 60s)
  useEffect(() => {
    if (isFarming && isLoggedIn) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Earn points!
            setPoints((p) => p + 1);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFarming, isLoggedIn, setPoints]);

  const handleResetScore = () => {
    if (window.confirm('Are you sure you want to reset your Aura Points to 0?')) {
      setPoints(0);
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Header Info */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          💤 AFK Aura Farming
        </h2>
        <p className="text-zinc-400 text-sm">
          Keep this page open in the background to continuously farm Aura Points for your profile. 🚀
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Farming Panel */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {!isLoggedIn ? (
              /* Simulated login card */
              <motion.div
                key="login-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-2xl space-y-6 max-w-md mx-auto text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mx-auto border border-purple-500/20">
                  <UserCheck className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="text-center space-y-1.5">
                  <h3 className="text-lg font-bold text-white">Identify to Start Farming</h3>
                  <p className="text-xs text-zinc-400">
                    Connect your Discord account or set up a custom Guest profile to enter the farm and save your leaderboard points!
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Tooltip content="Sign in via Discord or as guest to unlock leaderboards & shop" position="top">
                    <button
                      onClick={onOpenAuthModal}
                      className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all text-xs uppercase tracking-wider active:scale-95 flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" /> Connect Your Profile
                    </button>
                  </Tooltip>
                </div>
              </motion.div>
            ) : (
              /* Active Farming Panel */
              <motion.div
                key="farming-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 rounded-3xl bg-radial from-slate-900 via-zinc-950 to-black border border-zinc-800/80 shadow-2xl text-center space-y-8 relative overflow-hidden"
              >
                {/* Visual Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Profile Display */}
                <div className="flex flex-col items-center space-y-3 relative z-10">
                  <div className="relative">
                    <img 
                      src={avatarUrl} 
                      alt={nickname} 
                      className="w-16 h-16 rounded-full object-cover shadow-lg relative z-10" 
                      style={hasFrame ? {
                        border: `2.5px solid ${userFrameColor}`,
                        boxShadow: `0 0 16px ${userFrameColor}80, inset 0 0 8px ${userFrameColor}40`
                      } : {
                        border: '2.5px solid var(--color-purple-500)'
                      }}
                      referrerPolicy="no-referrer"
                    />
                    {hasFrame && (
                      <div className="absolute inset-0 rounded-full animate-ping pointer-events-none opacity-30 z-0" style={{ border: `2px solid ${userFrameColor}` }} />
                    )}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full z-20" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 
                      className="text-lg font-bold flex items-center gap-1.5 justify-center"
                      style={userColor ? { color: userColor } : { color: 'var(--color-white)' }}
                    >
                      {nickname} <Sparkles className="w-4 h-4 text-purple-400" />
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest font-semibold">Live farming...</p>
                  </div>
                </div>

                {/* Counter & Clock */}
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-zinc-500">Your Aura Points</span>
                    <p className="text-3xl font-black text-emerald-400 font-mono">{points}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-zinc-500">Next Point In</span>
                    <p className="text-3xl font-black text-rose-400 font-mono flex items-center justify-center gap-1.5">
                      <Clock className="w-5 h-5 text-rose-400/80 animate-pulse" /> {timeLeft}s
                    </p>
                  </div>
                </div>

                 {/* Action Controls */}
                <div className="flex justify-center gap-4 relative z-10 pt-2">
                  <Tooltip content={isFarming ? "Temporarily halt farming points" : "Start accumulating points automatically"} position="top">
                    <button
                      onClick={() => setIsFarming(!isFarming)}
                      className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow ${
                        isFarming 
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isFarming ? 'Pause Session' : 'Resume Session'}
                    </button>
                  </Tooltip>
                  
                  <Tooltip content="Reset your points balance back to 0" position="top">
                    <button
                      onClick={handleResetScore}
                      className="px-6 py-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 hover:border-rose-900 text-rose-300 text-xs font-bold transition-all active:scale-95"
                    >
                      Reset Score
                    </button>
                  </Tooltip>
                </div>

                {/* Simulated Google AdSpace */}
                <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-900 text-center font-mono text-[10px] text-zinc-600 max-w-sm mx-auto select-none pointer-events-none">
                  [ ADVERTISEMENT SPACE ]<br />
                  Support the server by letting this ad load
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar: Leaderboard & AFK Users */}
        <div className="lg:col-span-4 space-y-6">
          {/* Global Leaderboard Panel */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Top Aura Farmers
            </h3>

            <div className="space-y-3.5">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs font-mono">
                  No active farmers right now.
                </div>
              ) : (
                leaderboard.map((user, idx) => (
                  <div 
                    key={user.name} 
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      idx === 0 
                        ? 'bg-yellow-500/5 border-yellow-500/20' 
                        : idx === 1 
                          ? 'bg-zinc-400/5 border-zinc-400/10' 
                          : 'bg-zinc-900/45 border-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Position number */}
                      <span className={`w-5 shrink-0 text-center font-bold font-mono text-xs ${
                        idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-400' : 'text-zinc-500'
                      }`}>
                        {idx + 1}
                      </span>
                      
                      {/* Avatar */}
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full object-cover shrink-0 animate-[pulse_3s_infinite]" 
                        style={user.name === nickname && hasFrame ? {
                          border: `1.5px solid ${userFrameColor}`,
                          boxShadow: `0 0 8px ${userFrameColor}80`
                        } : {
                          border: '1px solid var(--color-zinc-800)'
                        }}
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Name */}
                      <span 
                        className="text-xs font-bold truncate"
                        style={user.name === nickname && userColor ? { color: userColor } : { color: 'var(--color-zinc-100)' }}
                      >
                        {user.name}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400 shrink-0">
                      <Flame className="w-3.5 h-3.5 fill-emerald-400/10" /> {user.points} pts
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="text-[10px] text-zinc-500 text-center font-mono">
              Leaderboard updates live as members farm aura on the server. Join today to get your name listed!
            </p>
          </div>

          {/* AFK Status Users Panel */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400 animate-pulse" /> Currently AFK
            </h3>

            <div className="space-y-3.5">
              {afkUsersList.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs font-mono">
                  No users are currently AFK.
                </div>
              ) : (
                afkUsersList.map((user) => (
                  <div 
                    key={user.name} 
                    className="p-3 rounded-xl border bg-zinc-900/45 border-zinc-800/40 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar */}
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Name */}
                        <span className="text-xs font-bold text-zinc-100 truncate">
                          {user.name}
                        </span>
                      </div>

                      {/* AFK Duration */}
                      <span className="text-[10px] font-mono text-zinc-400 font-medium">
                        {formatDuration(Date.now() - user.afkSince)}
                      </span>
                    </div>

                    {/* Reason */}
                    <div className="text-xs font-medium text-amber-400/90 pl-10 leading-relaxed break-words flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 shrink-0 text-amber-500/80" />
                      <span>{user.afkReason}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="text-[10px] text-zinc-500 text-center font-mono">
              Users set AFK via Discord or using the bot. Sending a message clears AFK status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
