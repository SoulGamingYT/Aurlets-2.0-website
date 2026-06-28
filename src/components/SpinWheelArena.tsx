import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCw, 
  Settings, 
  Users, 
  Award, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  CheckCircle, 
  Crown, 
  Flame, 
  Trophy, 
  UserCheck, 
  Wrench, 
  UserMinus,
  RefreshCw
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

interface Segment {
  label: string;
  color: string;
}

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
  const [showLiveConfig, setShowLiveConfig] = useState<boolean>(false);

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
      '#ec4899', '#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', 
      '#f59e0b', '#ef4444', '#14b8a6', '#6366f1', '#06b6d4'
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
    const radius = Math.min(width, height) / 2 - 10;
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
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#18181b';
      ctx.stroke();

      // Draw segment label
      ctx.save();
      ctx.rotate(startAngle + angleStep / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(segments[i], radius - 15, 0);
      ctx.restore();
    }

    // Outer ring border
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#27272a';
    ctx.stroke();

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fbbf24';
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
    const radius = Math.min(width, height) / 2 - 10;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    const rem = eliminationState.remainingParticipants || [];
    const count = rem.length;
    if (count === 0) {
      // Empty wheel state
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#18181b';
      ctx.fill();
      ctx.strokeStyle = '#27272a';
      ctx.stroke();

      ctx.fillStyle = '#71717a';
      ctx.font = '12px monospace';
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
      ctx.strokeStyle = '#18181b';
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
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#27272a';
    ctx.stroke();

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    ctx.restore();
  };

  // --- ANIMATE SPIN ACTIONS ---
  const animateLiveSpin = (targetIndex: number, rewardLabel: string, endCallback: () => void) => {
    const segments = liveConfig.segments;
    const count = segments.length;
    const angleStep = (Math.PI * 2) / count;

    // Calculate angle to align selected segment with the 12 o'clock indicator (which is -Math.PI/2)
    // Canvas arc starts at 3 o'clock (0 rad) and goes clockwise.
    // So the pointer is at -Math.PI / 2.
    // Target angle of slice middle is startAngle + angleStep / 2.
    const targetSliceAngle = targetIndex * angleStep + angleStep / 2;
    const stopAngle = -Math.PI / 2 - targetSliceAngle;

    const extraSpins = 6 + Math.random() * 2; // spins count
    const finalAngle = stopAngle + extraSpins * Math.PI * 2;

    const duration = 5000;
    const startTime = performance.now();
    const startAngle = liveRotationAngleRef.current % (Math.PI * 2);

    const anim = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out
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

    const extraSpins = 6 + Math.random() * 2; // spins count
    const finalAngle = stopAngle + extraSpins * Math.PI * 2;

    const duration = 5000;
    const startTime = performance.now();
    const startAngle = elimRotationAngleRef.current % (Math.PI * 2);

    const anim = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out
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
      
      // Animate rotation to land on segmentIndex
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
  const handleSaveLiveConfig = async () => {
    try {
      const res = await fetch('/api/admin/games/spin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': userDiscordId,
          'x-admin-username': playerName
        },
        body: JSON.stringify({
          visibleToPublic: liveConfig.visibleToPublic,
          allowedDiscordIds: liveConfig.allowedDiscordIds,
          segments: liveConfig.segments
        })
      });

      if (res.ok) {
        showNotice?.('Live Prize Wheel configuration successfully saved!', 'success');
        setShowLiveConfig(false);
        fetchLiveState();
      } else {
        const data = await res.json();
        showNotice?.(data.error || 'Failed to save configuration.', 'error');
      }
    } catch (err: any) {
      showNotice?.(err.message || 'Error saving Live Config.', 'error');
    }
  };

  // Add a slice segment to state
  const handleAddSegment = () => {
    if (!newSegmentText.trim()) return;
    setLiveConfig(prev => ({
      ...prev,
      segments: [...prev.segments, newSegmentText.trim()]
    }));
    setNewSegmentText('');
  };

  const handleRemoveSegment = (indexToRemove: number) => {
    if (liveConfig.segments.length <= 2) {
      showNotice?.('A wheel must have at least 2 segments.', 'error');
      return;
    }
    setLiveConfig(prev => ({
      ...prev,
      segments: prev.segments.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Add Discord ID to Whitelist
  const handleAddWhitelist = () => {
    if (!whitelistedIdText.trim()) return;
    if (liveConfig.allowedDiscordIds.includes(whitelistedIdText.trim())) {
      showNotice?.('Discord ID is already whitelisted.', 'info');
      return;
    }
    setLiveConfig(prev => ({
      ...prev,
      allowedDiscordIds: [...prev.allowedDiscordIds, whitelistedIdText.trim()]
    }));
    setWhitelistedIdText('');
  };

  const handleRemoveWhitelist = (id: string) => {
    setLiveConfig(prev => ({
      ...prev,
      allowedDiscordIds: prev.allowedDiscordIds.filter(i => i !== id)
    }));
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
      
      // Find the index of the eliminated user in the current remaining participants list
      const prevRemaining = eliminationState.remainingParticipants || [];
      const index = prevRemaining.findIndex(p => p.name === eliminatedUser.name);

      if (index === -1) {
        // Fallback if index mismatch
        setEliminationState(eliminationGame);
        setIsSpinningElim(false);
        return;
      }

      // Animate to index
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
      showNotice?.('Please provide at least 2 players in "Username:DiscordID" format.', 'error');
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
        showNotice?.('Elimination raffle setup successful! Ready to spin.', 'success');
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
        showNotice?.('Raffle reset completed successfully.', 'success');
        fetchElimState();
      } else {
        const data = await res.json();
        showNotice?.(data.error || 'Failed to reset raffle.', 'error');
      }
    } catch (err: any) {
      showNotice?.(err.message || 'Error resetting raffle.', 'error');
    }
  };

  return (
    <div className="space-y-8 text-left animate-fade-in max-w-6xl mx-auto">
      {/* Back Button */}
      
      {/* Title & Description */}
      <div className="border-b border-zinc-900 pb-4">
        <span className="text-xs font-mono font-bold text-pink-500 uppercase tracking-widest bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full inline-block mb-3">
          Wheel of Fortune
        </span>
        <h2 className="text-3xl font-black text-white tracking-tight">Spin the Wheel Arena</h2>
        <p className="text-zinc-400 text-xs mt-1">
          Participate in live interactive events, claim prize rewards, or watch elimination raffles where the last player standing takes the grand prize!
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 self-start max-w-xs">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'live'
              ? 'bg-pink-600 text-white shadow shadow-pink-500/15'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <RotateCw className="w-4 h-4" /> Live Prize Spin
        </button>
        <button
          onClick={() => setActiveTab('elimination')}
          className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'elimination'
              ? 'bg-pink-600 text-white shadow shadow-pink-500/15'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <UserMinus className="w-4 h-4" /> Elimination Raffle
        </button>
      </div>

      {/* --- LIVE PRIZE SPIN TAB --- */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Wheel Display Panel */}
          <div className="lg:col-span-7 bg-zinc-950/40 p-6 rounded-2xl border border-zinc-900 flex flex-col items-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${liveConfig.visibleToPublic ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">
                {liveConfig.visibleToPublic ? 'PUBLIC LIVE SPIN' : 'ADMIN PRIVATE'}
              </span>
            </div>

            {/* Pointer Indicator */}
            <div className="relative pt-6">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-500 drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]" />
              <canvas
                ref={liveCanvasRef}
                width={360}
                height={360}
                className="max-w-full rounded-full bg-zinc-900 shadow-2xl ring-4 ring-zinc-850/80"
              />
            </div>

            {/* Interaction Buttons */}
            <div className="w-full flex flex-col items-center space-y-3">
              {isAllowedToSpin ? (
                <button
                  onClick={handleTriggerLiveSpin}
                  disabled={isSpinningLive}
                  className="px-10 py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black uppercase tracking-wider text-sm transition-all shadow-lg active:scale-95 disabled:opacity-40 flex items-center gap-2"
                >
                  <RotateCw className={`w-5 h-5 ${isSpinningLive ? 'animate-spin' : ''}`} />
                  {isSpinningLive ? 'Spinning...' : 'Spin the Wheel!'}
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center space-y-1 max-w-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-500 mx-auto" />
                  <div className="text-xs font-bold text-white">Spin Lock Engaged</div>
                  <p className="text-[10px] text-zinc-500">
                    Only admins or whitelisted Discord IDs can spin this wheel. Contact an administrator to add your ID.
                  </p>
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => setShowLiveConfig(!showLiveConfig)}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {showLiveConfig ? 'Hide Wheel Config' : 'Configure Wheel Slices & Whitelist'}
                </button>
              )}
            </div>

            {/* Results Alert */}
            <AnimatePresence>
              {liveLandedSegment && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center w-full max-w-sm space-y-1"
                >
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                  <div className="text-xs text-zinc-400 uppercase tracking-wider font-mono font-bold">Wheel Result</div>
                  <h4 className="text-lg font-black text-white">{liveLandedSegment}</h4>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Config & Audit Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            {/* Show Config Area for Admin if selected */}
            {isAdmin && showLiveConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 space-y-5"
              >
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-pink-500" /> Admin Configurator
                  </h4>
                </div>

                {/* Visible to Public Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-zinc-800">
                  <div className="text-left space-y-0.5">
                    <span className="text-xs font-bold text-white">Live Spin Status</span>
                    <p className="text-[10px] text-zinc-500">Allow public players to see the wheel in games page.</p>
                  </div>
                  <button
                    onClick={() => setLiveConfig(prev => ({ ...prev, visibleToPublic: !prev.visibleToPublic }))}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      liveConfig.visibleToPublic ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {liveConfig.visibleToPublic ? '🟢 Public' : '⚪ Private'}
                  </button>
                </div>

                {/* Edit Slices */}
                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Edit Wheel Slices ({liveConfig.segments.length})</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 500 AP"
                      value={newSegmentText}
                      onChange={(e) => setNewSegmentText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                    />
                    <button
                      onClick={handleAddSegment}
                      className="p-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1.5 border border-zinc-900 p-2 rounded-xl bg-zinc-950">
                    {liveConfig.segments.map((seg, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-900/40 border border-zinc-850 p-2 rounded-lg text-xs text-white">
                        <span>{seg}</span>
                        <button onClick={() => handleRemoveSegment(idx)} className="text-zinc-500 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit Whitelisted IDs */}
                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Allowed Discord IDs ({liveConfig.allowedDiscordIds.length})</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 1234567890123456"
                      value={whitelistedIdText}
                      onChange={(e) => setWhitelistedIdText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                    />
                    <button
                      onClick={handleAddWhitelist}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-24 overflow-y-auto space-y-1.5 border border-zinc-900 p-2 rounded-xl bg-zinc-950">
                    {liveConfig.allowedDiscordIds.map((id, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-900/40 border border-zinc-850 p-2 rounded-lg text-[10px] font-mono text-white">
                        <span>{id}</span>
                        <button onClick={() => handleRemoveWhitelist(id)} className="text-zinc-500 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveLiveConfig}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  Apply Live Settings
                </button>
              </motion.div>
            )}

            {/* Local History log */}
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">Lobby Activity Log</h4>
              {liveLog.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">No spins recorded in this session yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-40 overflow-y-auto">
                  {liveLog.map((log, idx) => (
                    <div key={idx} className="text-xs text-zinc-400 flex gap-2 items-start">
                      <span className="text-pink-500">▶</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ELIMINATION RAFFLE TAB --- */}
      {activeTab === 'elimination' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Wheel Display Panel */}
          <div className="lg:col-span-7 bg-zinc-950/40 p-6 rounded-2xl border border-zinc-900 flex flex-col items-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-[10px] font-mono text-rose-400 font-bold">
              <Crown className="w-3.5 h-3.5 text-rose-500" />
              <span>RAFFLE PRIZE: {eliminationState.prize}</span>
            </div>

            {/* Pointer Indicator */}
            <div className="relative pt-6">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-rose-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]" />
              <canvas
                ref={elimCanvasRef}
                width={360}
                height={360}
                className="max-w-full rounded-full bg-zinc-900 shadow-2xl ring-4 ring-zinc-850/80"
              />
            </div>

            {/* Controls */}
            <div className="w-full flex flex-col items-center space-y-3">
              {isAdmin ? (
                <div className="flex gap-2.5">
                  <button
                    onClick={handleTriggerElimSpin}
                    disabled={isSpinningElim || eliminationState.remainingParticipants.length <= 1}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black uppercase tracking-wider text-xs transition-all shadow-lg active:scale-95 disabled:opacity-40 flex items-center gap-2"
                  >
                    <RotateCw className={`w-4 h-4 ${isSpinningElim ? 'animate-spin' : ''}`} />
                    Eliminate Slices!
                  </button>
                  <button
                    onClick={handleResetElimination}
                    className="px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-bold"
                  >
                    Reset Game
                  </button>
                </div>
              ) : (
                <div className="text-center text-zinc-500 text-xs">
                  Only administrators can trigger the elimination spins. Watch the live raffle below.
                </div>
              )}
            </div>

            {/* Result Alerts */}
            <AnimatePresence mode="wait">
              {elimLandedUser && !isSpinningElim && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-center space-y-1.5"
                >
                  <UserMinus className="w-6 h-6 text-rose-500 mx-auto animate-pulse" />
                  <div className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Landed segment (Eliminated!)</div>
                  <h4 className="text-xl font-black text-rose-400 truncate">{elimLandedUser}</h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    This player has been removed from the wheel. The survivors will spin again until only one remains!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Winner Board */}
            {eliminationState.isFinished && eliminationState.winner && (
              <div className="w-full max-w-md p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 text-center space-y-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-pulse" />
                <Trophy className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
                <div className="space-y-1 relative">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    Grand Champion
                  </span>
                  <h4 className="text-2xl font-black text-white truncate pt-1">{eliminationState.winner.name}</h4>
                  <p className="text-xs text-zinc-400">
                    Claimed the grand prize of <strong className="text-amber-400">{eliminationState.prize}</strong>!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Setup / History Logs Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            {/* Setup Form for Admin */}
            {isAdmin && (
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 space-y-5">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                  <Users className="w-4 h-4 text-rose-500" /> Setup Elimination Game
                </h4>

                {/* Prize */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Raffle Prize Reward</label>
                  <input
                    type="text"
                    placeholder="e.g. 1000 AP"
                    value={elimPrizeInput}
                    onChange={(e) => setElimPrizeInput(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Entering a prize with &quot;AP&quot; (e.g. 500 AP) will automatically credit the winner on completion.
                  </p>
                </div>

                {/* Players input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Enter Players (One per line)</label>
                  <textarea
                    rows={4}
                    placeholder="Username:DiscordID&#10;PlayerTwo:12345678&#10;PlayerThree"
                    value={elimPlayersInput}
                    onChange={(e) => setElimPlayersInput(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Format: <strong>Username:DiscordID</strong> (e.g. <code>Wumpus:24389025</code>) or just a plain username.
                  </p>
                </div>

                <button
                  onClick={handleSetupElimination}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  Deploy Raffle Wheel
                </button>
              </div>
            )}

            {/* Remaining players list */}
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">Remaining Players ({eliminationState.remainingParticipants.length})</h4>
              </div>

              {eliminationState.remainingParticipants.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">No raffle currently configured.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {eliminationState.remainingParticipants.map((p, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-zinc-900/30 border border-zinc-850 text-xs font-medium text-white truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Logs */}
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">Raffle State History</h4>
              {(eliminationState.history || []).length === 0 ? (
                <p className="text-xs text-zinc-600 italic">No rounds spun yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-44 overflow-y-auto font-mono text-[10px] text-zinc-400">
                  {eliminationState.history.slice().reverse().map((h, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-zinc-900/10 border border-zinc-900/40 flex items-start gap-1.5">
                      <span className="text-rose-500 shrink-0">■</span>
                      <span dangerouslySetInnerHTML={{ __html: h.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
