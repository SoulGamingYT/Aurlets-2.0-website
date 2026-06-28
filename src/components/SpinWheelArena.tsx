import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCw, 
  Settings, 
  Users, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  CheckCircle, 
  Crown, 
  Trophy, 
  UserMinus,
  Sparkles,
  HelpCircle,
  ToggleLeft,
  X,
  FileText
} from 'lucide-react';

interface SpinWheelArenaProps {
  playerName: string;
  isLoggedIn: boolean;
  points: number;
  setPoints?: React.Dispatch<React.SetStateAction<number>>;
  showNotice?: (msg: string, type: 'success' | 'error' | 'info') => void;
  isAdmin: boolean;
  userDiscordId: string;
}

const SEGMENT_PRESETS = [
  {
    name: '🏆 Standard AP Rewards',
    segments: ['50 AP', '100 AP', 'No Prize', '500 AP', '10 AP', 'Jackpot 🏆']
  },
  {
    name: '⚡ High Risk / Chaos',
    segments: ['1000 AP', 'No Prize', '-500 AP', '2500 AP', 'Double AP', 'Lose All 💀']
  },
  {
    name: '🎭 Fun Social Forfeits',
    segments: ['Sing a Song 🎤', 'Tell a Joke 🤡', 'Do 10 Pushups 💪', 'Give 100 AP 🎁', 'Truth or Dare 🤫', 'Safe Zone 🛡️']
  },
  {
    name: '🪙 Simple Coin Flip',
    segments: ['HEADS', 'TAILS']
  }
];

export default function SpinWheelArena({
  playerName,
  isLoggedIn,
  points,
  setPoints,
  showNotice,
  isAdmin,
  userDiscordId
}: SpinWheelArenaProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'elimination'>('live');

  // --- LIVE SPIN STATE ---
  const [liveConfig, setLiveConfig] = useState<{
    visibleToPublic: boolean;
    allowedDiscordIds: string[];
    segments: string[];
  }>({
    visibleToPublic: true,
    allowedDiscordIds: [],
    segments: ['50 AP', '100 AP', 'No Prize', '500 AP', '10 AP', 'Jackpot 🏆']
  });
  const [isAllowedToSpin, setIsAllowedToSpin] = useState<boolean>(false);
  const [isSpinningLive, setIsSpinningLive] = useState<boolean>(false);
  const [liveLandedSegment, setLiveLandedSegment] = useState<string | null>(null);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Live Config form states
  const [newSegmentText, setNewSegmentText] = useState<string>('');
  const [whitelistedIdText, setWhitelistedIdText] = useState<string>('');

  // --- ELIMINATION SPIN STATE ---
  const [eliminationState, setEliminationState] = useState<{
    prize: string;
    participants: Array<{ name: string; discordId: string }>;
    remainingParticipants: Array<{ name: string; discordId: string }>;
    lastEliminated: { name: string; discordId: string } | null;
    winner: { name: string; discordId: string } | null;
    isFinished: boolean;
    history: string[];
  }>({
    prize: '1000 AP',
    participants: [],
    remainingParticipants: [],
    lastEliminated: null,
    winner: null,
    isFinished: false,
    history: []
  });
  const [isSpinningElim, setIsSpinningElim] = useState<boolean>(false);
  const [elimLandedUser, setElimLandedUser] = useState<string | null>(null);

  // Elimination setup form states
  const [elimPrizeInput, setElimPrizeInput] = useState<string>('1000 AP');
  const [elimPlayersInput, setElimPlayersInput] = useState<string>('');

  // Canvas References
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const elimCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation values
  const liveRotationAngleRef = useRef<number>(0);
  const elimRotationAngleRef = useRef<number>(0);

  // Color generator for wheel segments
  const getSegmentColors = (count: number) => {
    const baseColors = [
      '#db2777', '#f43f5e', '#7c3aed', '#2563eb', '#059669', 
      '#d97706', '#dc2626', '#0d9488', '#4f46e5', '#0891b2'
    ];
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };

  // --- FETCH CONFIGS ---
  const fetchLiveState = async () => {
    try {
      const headers: Record<string, string> = {};
      if (isAdmin) {
        headers['x-admin-discord-id'] = userDiscordId;
        headers['x-admin-username'] = playerName;
      }
      const res = await fetch(`/api/games/spin/state?discordId=${encodeURIComponent(userDiscordId)}`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setLiveConfig({
          visibleToPublic: data.spinGame.visibleToPublic,
          allowedDiscordIds: data.spinGame.allowedDiscordIds || [],
          segments: data.spinGame.segments || []
        });
        setIsAllowedToSpin(data.isAllowedToSpin || isAdmin);
      } else if (isAdmin) {
        setIsAllowedToSpin(true);
      }
    } catch (err) {
      console.error('Error fetching live spin state:', err);
      if (isAdmin) {
        setIsAllowedToSpin(true);
      }
    }
  };

  const fetchElimState = async () => {
    try {
      const res = await fetch('/api/games/elimination/state');
      if (res.ok) {
        const data = await res.json();
        setEliminationState(data.eliminationGame);
        setElimPrizeInput(data.eliminationGame.prize || '1000 AP');
      }
    } catch (err) {
      console.error('Error fetching elimination state:', err);
    }
  };

  useEffect(() => {
    fetchLiveState();
    fetchElimState();
    const interval = setInterval(() => {
      fetchLiveState();
      fetchElimState();
    }, 5000);
    return () => clearInterval(interval);
  }, [userDiscordId, isAdmin, playerName]);

  // Redraw canvases on state change
  useEffect(() => {
    drawLiveWheel();
  }, [liveConfig.segments]);

  useEffect(() => {
    drawElimWheel();
  }, [eliminationState.remainingParticipants]);

  // --- CANVAS WHEEL DRAWERS ---
  const drawLiveWheel = () => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = Math.min(width, height) / 2 - 8;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    const segments = liveConfig.segments;
    const count = segments.length;
    if (count === 0) return;

    const angleStep = (Math.PI * 2) / count;
    const colors = getSegmentColors(count);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(liveRotationAngleRef.current);

    for (let i = 0; i < count; i++) {
      const startAngle = i * angleStep;
      const endAngle = startAngle + angleStep;

      // Draw segment slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#09090b';
      ctx.stroke();

      // Draw segment label
      ctx.save();
      ctx.rotate(startAngle + angleStep / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(segments[i], radius - 15, 0);
      ctx.restore();
    }

    // Outer border
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#27272a';
    ctx.stroke();

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ec4899';
    ctx.stroke();

    ctx.restore();
  };

  const drawElimWheel = () => {
    const canvas = elimCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = Math.min(width, height) / 2 - 8;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    const rem = eliminationState.remainingParticipants || [];
    const count = rem.length;
    if (count === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#09090b';
      ctx.fill();
      ctx.strokeStyle = '#27272a';
      ctx.stroke();

      ctx.fillStyle = '#52525b';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO PARTICIPANTS', cx, cy);
      return;
    }

    const angleStep = (Math.PI * 2) / count;
    const colors = getSegmentColors(count);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(elimRotationAngleRef.current);

    for (let i = 0; i < count; i++) {
      const startAngle = i * angleStep;
      const endAngle = startAngle + angleStep;

      // Draw segment slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#09090b';
      ctx.stroke();

      // Draw segment label
      ctx.save();
      ctx.rotate(startAngle + angleStep / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(rem[i].name, radius - 15, 0);
      ctx.restore();
    }

    // Outer ring border
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#27272a';
    ctx.stroke();

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#f43f5e';
    ctx.stroke();

    ctx.restore();
  };

  // --- ANIMATE SPIN ACTIONS ---
  const animateLiveSpin = (targetIndex: number, rewardLabel: string, endCallback: () => void) => {
    const segments = liveConfig.segments;
    const count = segments.length;
    const angleStep = (Math.PI * 2) / count;

    const targetSliceAngle = targetIndex * angleStep + angleStep / 2;
    const stopAngle = -Math.PI / 2 - targetSliceAngle;

    const extraSpins = 6 + Math.random() * 2;
    const finalAngle = stopAngle + extraSpins * Math.PI * 2;

    const duration = 5000;
    const startTime = performance.now();
    const startAngle = liveRotationAngleRef.current % (Math.PI * 2);

    const anim = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (finalAngle - startAngle) * easeProgress;
      
      liveRotationAngleRef.current = currentAngle;
      drawLiveWheel();

      if (progress < 1) {
        requestAnimationFrame(anim);
      } else {
        liveRotationAngleRef.current = finalAngle;
        drawLiveWheel();
        endCallback();
      }
    };
    requestAnimationFrame(anim);
  };

  const animateElimSpin = (targetIndex: number, endCallback: () => void) => {
    const rem = eliminationState.remainingParticipants || [];
    const count = rem.length;
    const angleStep = (Math.PI * 2) / count;

    const targetSliceAngle = targetIndex * angleStep + angleStep / 2;
    const stopAngle = -Math.PI / 2 - targetSliceAngle;

    const extraSpins = 6 + Math.random() * 2;
    const finalAngle = stopAngle + extraSpins * Math.PI * 2;

    const duration = 5000;
    const startTime = performance.now();
    const startAngle = elimRotationAngleRef.current % (Math.PI * 2);

    const anim = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (finalAngle - startAngle) * easeProgress;
      
      elimRotationAngleRef.current = currentAngle;
      drawElimWheel();

      if (progress < 1) {
        requestAnimationFrame(anim);
      } else {
        elimRotationAngleRef.current = finalAngle;
        drawElimWheel();
        endCallback();
      }
    };
    requestAnimationFrame(anim);
  };

  // --- TRIGGER LIVE PRIZE SPIN ---
  const handleTriggerLiveSpin = async () => {
    if (isSpinningLive) return;
    setIsSpinningLive(true);
    setLiveLandedSegment(null);

    try {
      const res = await fetch('/api/games/spin/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': isAdmin ? userDiscordId : '',
          'x-admin-username': isAdmin ? playerName : ''
        },
        body: JSON.stringify({
          discordId: userDiscordId,
          username: playerName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showNotice?.(data.error || 'Failed to trigger spin.', 'error');
        setIsSpinningLive(false);
        return;
      }

      const { segmentIndex, segment, farmerPoints } = data;
      
      animateLiveSpin(segmentIndex, segment, () => {
        setIsSpinningLive(false);
        setLiveLandedSegment(segment);
        if (farmerPoints !== undefined && setPoints) {
          setPoints(farmerPoints);
        }
        showNotice?.(`🎉 Landed on ${segment}!`, 'success');
        setLiveLog(prev => [`Landed on ${segment}! (Points updated)`, ...prev.slice(0, 9)]);
        fetchLiveState();
      });

    } catch (err: any) {
      showNotice?.(err.message || 'Error triggering live spin.', 'error');
      setIsSpinningLive(false);
    }
  };

  // --- SAVE LIVE PRIZE CONFIG ---
  const handleSaveLiveConfig = async (updatedConfig = liveConfig) => {
    try {
      const res = await fetch('/api/admin/games/spin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': userDiscordId,
          'x-admin-username': playerName
        },
        body: JSON.stringify({
          visibleToPublic: updatedConfig.visibleToPublic,
          allowedDiscordIds: updatedConfig.allowedDiscordIds,
          segments: updatedConfig.segments
        })
      });

      if (res.ok) {
        showNotice?.('Settings applied and saved to server!', 'success');
        fetchLiveState();
      } else {
        const data = await res.json();
        showNotice?.(data.error || 'Failed to save configuration.', 'error');
      }
    } catch (err: any) {
      showNotice?.(err.message || 'Error saving Live Config.', 'error');
    }
  };

  const handleApplyPreset = (presetSlices: string[]) => {
    const nextConfig = {
      ...liveConfig,
      segments: presetSlices
    };
    setLiveConfig(nextConfig);
    handleSaveLiveConfig(nextConfig);
    showNotice?.('Loaded and applied preset reward slices!', 'success');
  };

  const handleAddSegment = () => {
    if (!newSegmentText.trim()) return;
    const nextConfig = {
      ...liveConfig,
      segments: [...liveConfig.segments, newSegmentText.trim()]
    };
    setLiveConfig(nextConfig);
    setNewSegmentText('');
    handleSaveLiveConfig(nextConfig);
  };

  const handleRemoveSegment = (indexToRemove: number) => {
    if (liveConfig.segments.length <= 2) {
      showNotice?.('A wheel must have at least 2 segments.', 'error');
      return;
    }
    const nextConfig = {
      ...liveConfig,
      segments: liveConfig.segments.filter((_, idx) => idx !== indexToRemove)
    };
    setLiveConfig(nextConfig);
    handleSaveLiveConfig(nextConfig);
  };

  const handleAddWhitelist = () => {
    if (!whitelistedIdText.trim()) return;
    if (liveConfig.allowedDiscordIds.includes(whitelistedIdText.trim())) {
      showNotice?.('Discord ID already in list.', 'info');
      return;
    }
    const nextConfig = {
      ...liveConfig,
      allowedDiscordIds: [...liveConfig.allowedDiscordIds, whitelistedIdText.trim()]
    };
    setLiveConfig(nextConfig);
    setWhitelistedIdText('');
    handleSaveLiveConfig(nextConfig);
  };

  const handleRemoveWhitelist = (id: string) => {
    const nextConfig = {
      ...liveConfig,
      allowedDiscordIds: liveConfig.allowedDiscordIds.filter(i => i !== id)
    };
    setLiveConfig(nextConfig);
    handleSaveLiveConfig(nextConfig);
  };

  const handleTogglePublicVisibility = () => {
    const nextConfig = {
      ...liveConfig,
      visibleToPublic: !liveConfig.visibleToPublic
    };
    setLiveConfig(nextConfig);
    handleSaveLiveConfig(nextConfig);
  };

  // --- TRIGGER ELIMINATION SPIN ---
  const handleTriggerElimSpin = async () => {
    if (isSpinningElim) return;
    setIsSpinningElim(true);
    setElimLandedUser(null);

    try {
      const res = await fetch('/api/admin/games/elimination/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': userDiscordId,
          'x-admin-username': playerName
        }
      });

      const data = await res.json();
      if (!res.ok) {
        showNotice?.(data.error || 'Failed to spin elimination wheel.', 'error');
        setIsSpinningElim(false);
        return;
      }

      const { eliminatedUser, winner, eliminationGame } = data;
      const prevRemaining = eliminationState.remainingParticipants || [];
      const index = prevRemaining.findIndex(p => p.name === eliminatedUser.name);

      if (index === -1) {
        setEliminationState(eliminationGame);
        setIsSpinningElim(false);
        return;
      }

      animateElimSpin(index, () => {
        setIsSpinningElim(false);
        setElimLandedUser(eliminatedUser.name);
        setEliminationState(eliminationGame);
        if (winner) {
          showNotice?.(`🏆 ${winner.name} wins the raffle!`, 'success');
        } else {
          showNotice?.(`🎯 ${eliminatedUser.name} was eliminated!`, 'info');
        }
        fetchElimState();
      });

    } catch (err: any) {
      showNotice?.(err.message || 'Error spinning elimination wheel.', 'error');
      setIsSpinningElim(false);
    }
  };

  // --- SETUP ELIMINATION GAME ---
  const handleSetupElimination = async () => {
    const rawLines = elimPlayersInput.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedParticipants = rawLines.map(line => {
      const parts = line.split(':');
      const name = parts[0].trim();
      const discordId = parts[1] ? parts[1].trim() : '';
      return { name, discordId };
    });

    if (parsedParticipants.length < 2) {
      showNotice?.('Please provide at least 2 players.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/games/elimination/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': userDiscordId,
          'x-admin-username': playerName
        },
        body: JSON.stringify({
          prize: elimPrizeInput,
          participants: parsedParticipants
        })
      });

      if (res.ok) {
        showNotice?.('Elimination raffle live! Wheel populated.', 'success');
        setElimPlayersInput('');
        fetchElimState();
      } else {
        const data = await res.json();
        showNotice?.(data.error || 'Failed to setup elimination raffle.', 'error');
      }
    } catch (err: any) {
      showNotice?.(err.message || 'Error setting up elimination raffle.', 'error');
    }
  };

  // --- RESET ELIMINATION GAME ---
  const handleResetElimination = async () => {
    try {
      const res = await fetch('/api/admin/games/elimination/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': userDiscordId,
          'x-admin-username': playerName
        }
      });
      if (res.ok) {
        showNotice?.('Raffle reset successfully.', 'success');
        fetchElimState();
      } else {
        const data = await res.json();
        showNotice?.(data.error || 'Failed to reset raffle.', 'error');
      }
    } catch (err: any) {
      showNotice?.(err.message || 'Error resetting raffle.', 'error');
    }
  };

  // --- FETCH ACTIVE USERS FROM LEADERBOARD ---
  const handleFetchActiveLeaderboardUsers = async () => {
    try {
      const res = await fetch('/api/leaderboards');
      if (res.ok) {
        const data = await res.json();
        const list = data.apLeaderboard || [];
        if (list.length === 0) {
          showNotice?.('No players found on active leaderboards yet.', 'info');
          return;
        }
        const formatted = list.map((p: any) => `${p.name}:${p.discordUsername || ''}`).join('\n');
        setElimPlayersInput(formatted);
        showNotice?.(`Loaded ${list.length} players from server leaderboard!`, 'success');
      } else {
        showNotice?.('Could not fetch server leaderboard.', 'error');
      }
    } catch (err) {
      showNotice?.('Error contacting leaderboard API.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Title & Beautiful Intro Badge */}
      <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-pink-500 uppercase tracking-wider bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-full inline-block">
            Fortune & fate event hub
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">Interactive Spin Arena</h2>
          <p className="text-zinc-400 text-xs">
            Participate in live prize draws, or host high-stake elimination raffles where survivors compete.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start shrink-0">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-pink-600 text-white shadow shadow-pink-500/15'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" /> Prize Wheel
          </button>
          <button
            onClick={() => setActiveTab('elimination')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'elimination'
                ? 'bg-pink-600 text-white shadow shadow-pink-500/15'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserMinus className="w-3.5 h-3.5" /> Survivor Raffle
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: THE ACTIVE WHEEL */}
        <div className="lg:col-span-7 bg-zinc-950/70 border border-zinc-900 p-6 rounded-2xl flex flex-col items-center space-y-6 shadow-2xl relative overflow-hidden min-h-[500px] justify-center">
          
          {/* Neon Glow Circle Background */}
          <div className="absolute w-80 h-80 bg-pink-500/5 blur-[80px] rounded-full pointer-events-none -translate-y-6" />

          {/* Header Info */}
          <div className="w-full flex justify-between items-center text-xs border-b border-zinc-900 pb-3 z-10">
            {activeTab === 'live' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${liveConfig.visibleToPublic ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    {liveConfig.visibleToPublic ? 'Publicly Visible' : 'Admin Private Wheel'}
                  </span>
                </div>
                <div className="text-zinc-500 font-mono text-[10px]">
                  Slices: {liveConfig.segments.length}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <Crown className="w-3.5 h-3.5 text-rose-500 animate-bounce" style={{ animationDuration: '3s' }} />
                  <span className="font-mono text-[10px] tracking-wider uppercase">RAFFLE PRIZE: {eliminationState.prize}</span>
                </div>
                <div className="text-zinc-500 font-mono text-[10px]">
                  Survivors: {eliminationState.remainingParticipants.length} / {eliminationState.participants.length}
                </div>
              </>
            )}
          </div>

          {/* Pointer & Wheel Arena */}
          <div className="relative pt-4 z-10 select-none">
            {/* Elegant physical pointer */}
            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] drop-shadow-[0_4px_10px_rgba(236,72,153,0.4)] ${
              activeTab === 'live' ? 'border-t-pink-500' : 'border-t-rose-500'
            }`} />
            
            <canvas
              ref={activeTab === 'live' ? liveCanvasRef : elimCanvasRef}
              width={340}
              height={340}
              className="max-w-full rounded-full bg-zinc-900/60 shadow-[0_0_50px_rgba(0,0,0,0.6)] ring-4 ring-zinc-900"
            />
          </div>

          {/* Activation & Settings triggers */}
          <div className="w-full flex flex-col items-center space-y-3 z-10 pt-2">
            {activeTab === 'live' ? (
              <>
                {isAllowedToSpin ? (
                  <button
                    onClick={handleTriggerLiveSpin}
                    disabled={isSpinningLive}
                    className="w-full max-w-sm py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black uppercase tracking-wider text-xs transition-all shadow-lg hover:shadow-pink-500/20 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <RotateCw className={`w-4 h-4 ${isSpinningLive ? 'animate-spin' : ''}`} />
                    {isSpinningLive ? 'Spinning Wheel...' : 'Trigger Spin !'}
                  </button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center space-y-1 max-w-sm w-full">
                    <ShieldAlert className="w-4 h-4 text-amber-500 mx-auto" />
                    <div className="text-[11px] font-bold text-white">Spin Lock Enabled</div>
                    <p className="text-[10px] text-zinc-500">
                      You are not whitelisted to spin this wheel. Request access from an admin.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {isAdmin ? (
                  <div className="flex gap-2.5 w-full max-w-sm">
                    <button
                      onClick={handleTriggerElimSpin}
                      disabled={isSpinningElim || eliminationState.remainingParticipants.length <= 1}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black uppercase tracking-wider text-xs transition-all shadow-lg active:scale-95 disabled:opacity-30 flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className={`w-4 h-4 ${isSpinningElim ? 'animate-spin' : ''}`} />
                      Eliminate Slices!
                    </button>
                    <button
                      onClick={handleResetElimination}
                      className="px-4 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-bold"
                    >
                      Reset Raffle
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-zinc-500 text-xs py-1">
                    Only administrators can trigger the elimination spins. Watch the live raffle survivors!
                  </div>
                )}
              </>
            )}

            {/* Quick Admin Settings Toggle Button */}
            {isAdmin && (
              <button
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className="text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 mt-1"
              >
                <Settings className={`w-3.5 h-3.5 ${showSettingsDrawer ? 'rotate-45' : ''} transition-transform`} />
                {showSettingsDrawer ? 'Hide Control Panel Settings' : 'Configure Slices, Presets & Whitelist'}
              </button>
            )}
          </div>

          {/* Results Alerts */}
          <AnimatePresence mode="wait">
            {activeTab === 'live' && liveLandedSegment && !isSpinningLive && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center w-full max-w-sm space-y-1 z-10"
              >
                <CheckCircle className="w-5 h-5 text-pink-400 mx-auto" />
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Wheel Reward Winner</div>
                <h4 className="text-base font-black text-white">{liveLandedSegment}</h4>
              </motion.div>
            )}

            {activeTab === 'elimination' && elimLandedUser && !isSpinningElim && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-center space-y-1 z-10"
              >
                <UserMinus className="w-5 h-5 text-rose-500 mx-auto" />
                <div className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest">Eliminated segment</div>
                <h4 className="text-base font-black text-rose-400 truncate">{elimLandedUser}</h4>
                <p className="text-[10px] text-zinc-500">
                  Removed from the raffle. Surviving players continue to the next spin!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Winner Board */}
          {activeTab === 'elimination' && eliminationState.isFinished && eliminationState.winner && (
            <div className="w-full max-w-sm p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/20 text-center space-y-3 relative overflow-hidden z-10">
              <Trophy className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
              <div className="space-y-1 relative">
                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Raffle Winner
                </span>
                <h4 className="text-xl font-black text-white truncate pt-1">{eliminationState.winner.name}</h4>
                <p className="text-[11px] text-zinc-400">
                  Claimed the grand prize of <strong className="text-amber-400 font-bold">{eliminationState.prize}</strong>!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SETTINGS PANEL OR INFORMATION FEED */}
        <div className="lg:col-span-5 space-y-6">

          {/* SETTINGS DRAWER / CONTROL CENTER FOR ADMINS */}
          {isAdmin && showSettingsDrawer && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-5 shadow-2xl relative"
            >
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-pink-500" /> Admin Control Panel
                </h4>
                <button 
                  onClick={() => setShowSettingsDrawer(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* LIVE WHEEL CONFIG SETTINGS */}
              {activeTab === 'live' && (
                <div className="space-y-4">
                  {/* Public visibility toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <div className="text-left space-y-0.5">
                      <span className="text-xs font-bold text-white">Public Visibility</span>
                      <p className="text-[10px] text-zinc-500">Allow players to view this wheel in their browser</p>
                    </div>
                    <button
                      onClick={handleTogglePublicVisibility}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        liveConfig.visibleToPublic ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {liveConfig.visibleToPublic ? '🟢 Visible' : '⚪ Hidden'}
                    </button>
                  </div>

                  {/* Slices Presets Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Quick Reward Presets</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SEGMENT_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleApplyPreset(p.segments)}
                          className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-[10px] font-bold text-left truncate transition-all active:scale-95"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Slices list and Add form */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Custom Slices ({liveConfig.segments.length})</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 500 AP"
                        value={newSegmentText}
                        onChange={(e) => setNewSegmentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSegment()}
                        className="flex-grow px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                      />
                      <button
                        onClick={handleAddSegment}
                        className="px-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-28 overflow-y-auto space-y-1.5 border border-zinc-900 p-2 rounded-xl bg-zinc-900/20">
                      {liveConfig.segments.map((seg, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-zinc-900/40 border border-zinc-850 p-1.5 rounded-lg text-xs text-white">
                          <span className="font-mono text-[11px]">{seg}</span>
                          <button onClick={() => handleRemoveSegment(idx)} className="text-zinc-500 hover:text-rose-500 p-0.5 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Whitelist Settings */}
                  <div className="space-y-2 pt-2 border-t border-zinc-900">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Allowed Discord IDs ({liveConfig.allowedDiscordIds.length})</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 123456789012"
                        value={whitelistedIdText}
                        onChange={(e) => setWhitelistedIdText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddWhitelist()}
                        className="flex-grow px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                      />
                      <button
                        onClick={handleAddWhitelist}
                        className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-24 overflow-y-auto space-y-1 border border-zinc-900 p-2 rounded-xl bg-zinc-900/20">
                      {liveConfig.allowedDiscordIds.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic p-1">No IDs whitelisted (Admins always allowed)</p>
                      ) : (
                        liveConfig.allowedDiscordIds.map((id, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-zinc-900/40 border border-zinc-850 p-1.5 rounded-lg text-[10px] font-mono text-zinc-300">
                            <span>{id}</span>
                            <button onClick={() => handleRemoveWhitelist(id)} className="text-zinc-500 hover:text-rose-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SURVIVOR RAFFLE SETUP SETTINGS */}
              {activeTab === 'elimination' && (
                <div className="space-y-4">
                  {/* Prize Info input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Raffle Prize Reward</label>
                    <input
                      type="text"
                      placeholder="e.g. 1000 AP"
                      value={elimPrizeInput}
                      onChange={(e) => setElimPrizeInput(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                    />
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      If the prize contains &quot;AP&quot;, the system automatically awards points to the champion on completion!
                    </p>
                  </div>

                  {/* Bulk player entries input with quick loading */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Enter Contestants</label>
                      <button
                        onClick={handleFetchActiveLeaderboardUsers}
                        className="text-[9px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-bold underline transition-colors"
                      >
                        ⚡ Fetch From Active Leaderboard
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      placeholder="Username:DiscordID&#10;PlayerTwo:89234801&#10;PlayerThree"
                      value={elimPlayersInput}
                      onChange={(e) => setElimPlayersInput(e.target.value)}
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500 transition-colors font-mono"
                    />
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      Add one contestant per line. Format is <code>Username:DiscordID</code> or just plain <code>Username</code> if they don&apos;t have a Discord ID linked yet.
                    </p>
                  </div>

                  <button
                    onClick={handleSetupElimination}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                  >
                    Deploy New Raffle Wheel
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ACTIVE STATUS / RAFFLE CONTESTANTS LIST (VISITOR SIDEBAR) */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-900 space-y-4 shadow-xl">
            {activeTab === 'live' ? (
              <>
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider border-b border-zinc-900 pb-2">
                  Lobby Live Updates
                </h4>
                {liveLog.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No spins logged in this session yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-40 overflow-y-auto">
                    {liveLog.map((log, idx) => (
                      <div key={idx} className="text-xs text-zinc-400 flex gap-2 items-start">
                        <span className="text-pink-500 shrink-0">▶</span>
                        <span className="font-mono text-[11px]">{log}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-900/60 text-[11px] text-zinc-500 leading-relaxed">
                  <span className="text-zinc-300 font-bold block mb-1">How it works:</span>
                  Admins set up the wheel and whitelist participants. Once whitelisted, you can click "Trigger Spin" to claim AP coins or special community rewards immediately.
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Survivors ({eliminationState.remainingParticipants.length})
                  </h4>
                  {eliminationState.participants.length > 0 && (
                    <span className="text-[10px] font-mono text-zinc-500 font-bold">
                      Initial: {eliminationState.participants.length}
                    </span>
                  )}
                </div>

                {eliminationState.remainingParticipants.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No raffle configured currently. Setup players first.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 bg-zinc-900/15 rounded-xl border border-zinc-900">
                    {eliminationState.remainingParticipants.map((p, idx) => (
                      <div 
                        key={idx} 
                        className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-850 text-xs font-medium text-white truncate flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* History list for elimination */}
                <div className="space-y-2 pt-3 border-t border-zinc-900">
                  <h4 className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wider">
                    Elimination Feed
                  </h4>
                  {(eliminationState.history || []).length === 0 ? (
                    <p className="text-[10px] text-zinc-600 italic">Rounds will log below as contestants fall.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[10px] text-zinc-400 p-2 bg-zinc-900/10 rounded-lg">
                      {eliminationState.history.slice().reverse().map((h, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 py-0.5 border-b border-zinc-900/40 last:border-0">
                          <span className="text-rose-500 shrink-0">■</span>
                          <span 
                            className="text-zinc-400 truncate"
                            dangerouslySetInnerHTML={{ __html: h.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
