import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Play, Users, Send, CheckCircle, HelpCircle, Trophy, RefreshCw, AlertCircle, Heart, Coins, Sparkles, ArrowLeft, RotateCw, Landmark, Grid, LayoutGrid, Link2 } from 'lucide-react';
import { Tooltip } from './Tooltip';
import SlidePuzzle from './SlidePuzzle';

interface GameLog {
  id: string;
  msg: string;
  type: 'info' | 'success' | 'danger' | 'warning';
}

interface Player {
  name: string;
  score: number;
  lives?: number;
  lastSubmit?: number;
}

interface AuraGamesProps {
  playerName: string;
  isLoggedIn: boolean;
  onOpenAuthModal: () => void;
  points?: number;
  setPoints?: React.Dispatch<React.SetStateAction<number>>;
  showNotice?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AuraGames({ 
  playerName: propPlayerName, 
  isLoggedIn, 
  onOpenAuthModal,
  points = 0,
  setPoints,
  showNotice
}: AuraGamesProps) {
  const [playerId] = useState(() => {
    let id = localStorage.getItem('aurlets_player_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('aurlets_player_id', id);
    }
    return id;
  });

  const [playerName, setPlayerName] = useState(() => {
    return propPlayerName || localStorage.getItem('aurlets_name') || 'AuraFarmer_' + Math.floor(Math.random() * 900 + 100);
  });

  // Keep internal playerName synchronized with props
  useEffect(() => {
    if (propPlayerName) {
      setPlayerName(propPlayerName);
    }
  }, [propPlayerName]);

  const [activeGame, setActiveGame] = useState<'math' | 'kotd' | 'betting' | 'puzzle' | null>(null);

  // Rules visibility states
  const [showMathRules, setShowMathRules] = useState<boolean>(false);
  const [showKotdRules, setShowKotdRules] = useState<boolean>(false);
  const [showCasinoRules, setShowCasinoRules] = useState<boolean>(false);

  // --- BETTING MINIGAMES STATE ---
  const [betAmount, setBetAmount] = useState<string>('50');
  const [coinChoice, setCoinChoice] = useState<'heads' | 'tails'>('heads');
  const [betHistory, setBetHistory] = useState<{ id: string; game: string; bet: number; result: string; payout: number; won: boolean; time: string }[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
  const [slotReels, setSlotReels] = useState<string[]>(['🍒', '🍋', '🍇']);
  const [slotsRolling, setSlotsRolling] = useState<boolean>(false);
  const [activeCasinoTab, setActiveCasinoTab] = useState<'coinflip' | 'slots'>('coinflip');
  const [lastWinMessage, setLastWinMessage] = useState<string | null>(null);

  // --- MATHS GAME STATE ---
  const [mathPlaying, setMathPlaying] = useState<boolean>(false);
  const [mathQuestion, setMathQuestion] = useState<string>('Waiting for players...');
  const [userMathAns, setUserMathAns] = useState<string>('');
  const [mathTimeLeft, setMathTimeLeft] = useState<number>(15);
  const [mathPlayers, setMathPlayers] = useState<any[]>([]);
  const [mathLogs, setMathLogs] = useState<GameLog[]>([]);
  const [mathLobbyJoined, setMathLobbyJoined] = useState<boolean>(false);

  // --- KOTD GAME STATE ---
  const [kotdPlaying, setKotdPlaying] = useState<boolean>(false);
  const [kotdUsername, setKotdUsername] = useState<string>(playerName);
  const [kotdUserAns, setKotdUserAns] = useState<string>('');
  const [kotdError, setKotdError] = useState<string>('');
  const [kotdLobbyJoined, setKotdLobbyJoined] = useState<boolean>(false);
  const [kotdTimeLeft, setKotdTimeLeft] = useState<number>(30);
  const [kotdPlayers, setKotdPlayers] = useState<any[]>([]);
  const [kotdLogs, setKotdLogs] = useState<GameLog[]>([]);
  const [kotdRound, setKotdRound] = useState<number>(1);

  // Synchronize playerName with localStorage changes
  useEffect(() => {
    const savedName = localStorage.getItem('aurlets_name');
    if (savedName) {
      setPlayerName(savedName);
      setKotdUsername(savedName);
    }
  }, [activeGame]);

  // Handle lobby invite links from query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameParam = urlParams.get('game');
    if (gameParam && ['math', 'kotd', 'betting', 'puzzle'].includes(gameParam)) {
      setActiveGame(gameParam as any);
      
      // Auto-join the lobby if it is math
      if (gameParam === 'math') {
        const joinLobby = async () => {
          try {
            await fetch('/api/game/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: playerId, name: playerName, game: 'math' })
            });
            setMathLobbyJoined(true);
          } catch (err) {
            console.error('Error auto-joining Maths lobby via link:', err);
          }
        };
        joinLobby();
      }
      
      // Clean up URL parameters so they don't clutter the address bar
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      
      showNotice?.(`Joined ${gameParam === 'math' ? 'Multithread Maths Arena' : gameParam === 'kotd' ? 'King of Diamonds' : gameParam === 'puzzle' ? 'Slide Puzzle' : 'Betting Casino'} lobby via invite link! 🎮`, 'success');
    }
  }, [playerId, playerName]);

  const handleCopyInvite = (game: string) => {
    const link = `${window.location.origin}${window.location.pathname}?game=${game}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        showNotice?.(`Copied ${game === 'math' ? 'Multithread Maths Arena' : game === 'kotd' ? 'King of Diamonds' : game === 'puzzle' ? 'Slide Puzzle' : 'Betting Casino'} invite link to clipboard! 🔗`, 'success');
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
        showNotice?.('Failed to copy invite link. Please try again.', 'error');
      });
  };

  // --- REAL-TIME SERVER POLLING ---
  useEffect(() => {
    if (!activeGame) return;

    const syncGameState = async () => {
      try {
        const query = new URLSearchParams({
          id: playerId,
          name: playerName,
          game: activeGame
        });
        const res = await fetch(`/api/game/state?${query.toString()}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (activeGame === 'math') {
              setMathPlaying(data.math.playing);
              setMathQuestion(data.math.question);
              setMathTimeLeft(data.math.timeLeft);
              setMathPlayers(data.math.players);
              setMathLogs(data.math.logs);
            } else if (activeGame === 'kotd') {
              setKotdPlaying(data.kotd.playing);
              setKotdRound(data.kotd.round);
              setKotdTimeLeft(data.kotd.timeLeft);
              setKotdPlayers(data.kotd.players);
              setKotdLogs(data.kotd.logs);
            }
          }
        }
      } catch (err) {
        console.error('Error syncing game state:', err);
      }
    };

    // Poll every 1 second
    syncGameState();
    const interval = setInterval(syncGameState, 1000);
    return () => clearInterval(interval);
  }, [activeGame, playerId, playerName]);

  // --- MATHS LOBBY HANDLERS ---
  const startMathGame = async () => {
    // Explicitly join the live math lobby
    try {
      await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, name: playerName, game: 'math' })
      });
      setMathLobbyJoined(true);
    } catch (err) {
      console.error('Error joining Maths lobby:', err);
    }
  };

  const submitMathAnswer = async () => {
    if (!userMathAns.trim() || !mathPlaying) return;
    try {
      await fetch('/api/game/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, value: userMathAns.trim(), game: 'math' })
      });
      setUserMathAns('');
    } catch (err) {
      console.error('Error submitting Maths answer:', err);
    }
  };

  const stopMathGame = async () => {
    try {
      await fetch('/api/game/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, game: 'math' })
      });
    } catch (err) {}
    setMathLobbyJoined(false);
    setActiveGame(null);
  };

  // --- KOTD LOBBY HANDLERS ---
  const joinKotdLobby = async () => {
    const finalName = kotdUsername.trim() || playerName;
    if (!finalName) return;
    setPlayerName(finalName);
    localStorage.setItem('aurlets_name', finalName);

    try {
      await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, name: finalName, game: 'kotd' })
      });
      setKotdLobbyJoined(true);
    } catch (err) {
      console.error('Error joining KOTD lobby:', err);
    }
  };

  const submitKotdNumber = async () => {
    if (!kotdUserAns.trim() || !kotdPlaying) return;
    const num = parseFloat(kotdUserAns);
    if (isNaN(num) || num < 0 || num > 100) {
      setKotdError('Please enter a valid number between 0 and 100');
      return;
    }
    setKotdError('');
    try {
      await fetch('/api/game/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, value: num, game: 'kotd' })
      });
      setKotdUserAns('');
    } catch (err) {
      console.error('Error submitting KOTD strategy:', err);
    }
  };

  const stopKotdGame = async () => {
    try {
      await fetch('/api/game/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, game: 'kotd' })
      });
    } catch (err) {}
    setKotdLobbyJoined(false);
    setActiveGame(null);
  };

  // --- COIN FLIP HANDLER ---
  const handleCoinFlip = async () => {
    if (isRolling || slotsRolling) return;
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }

    const bet = Math.floor(Number(betAmount));
    if (isNaN(bet) || bet < 5) {
      showNotice?.('Minimum bet is 5 Aura Points!', 'error');
      return;
    }

    if (points < bet) {
      showNotice?.(`Insufficient balance! You only have ${points} AP.`, 'error');
      return;
    }

    setIsRolling(true);
    setCoinResult(null);
    setLastWinMessage(null);

    try {
      const res = await fetch('/api/game/bet/coinflip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, betAmount: bet, choice: coinChoice })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete coinflip.');
      }

      // Wait 1200ms to allow the flip animation to spin suspensefully
      setTimeout(() => {
        setCoinResult(data.result);
        setIsRolling(false);
        setPoints?.(data.newPoints);
        setLastWinMessage(data.message);
        
        // Notify
        showNotice?.(data.message, data.win ? 'success' : 'error');

        // History entry
        setBetHistory(prev => [
          {
            id: 'b_' + Math.random().toString(36).substring(2, 11),
            game: `Coin Flip (${coinChoice.toUpperCase()})`,
            bet,
            result: data.result.toUpperCase(),
            payout: data.win ? bet * 2 : 0,
            won: data.win,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev
        ]);
      }, 1200);

    } catch (err: any) {
      setIsRolling(false);
      showNotice?.(err.message || 'Error occurred during coinflip.', 'error');
    }
  };

  // --- SLOTS HANDLER ---
  const handleSpinSlots = async () => {
    if (isRolling || slotsRolling) return;
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }

    const bet = Math.floor(Number(betAmount));
    if (isNaN(bet) || bet < 5) {
      showNotice?.('Minimum bet is 5 Aura Points!', 'error');
      return;
    }

    if (points < bet) {
      showNotice?.(`Insufficient balance! You only have ${points} AP.`, 'error');
      return;
    }

    setSlotsRolling(true);
    setLastWinMessage(null);

    // Spin reels effect
    const symbols = ['🍒', '🍋', '🍇', '💎', '👑', '🍉', '🍌', '🍍', '🎰', '🔔', '⭐️', '🍀'];
    const interval = setInterval(() => {
      setSlotReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
    }, 80);

    try {
      const res = await fetch('/api/game/bet/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, betAmount: bet })
      });

      const data = await res.json();
      if (!res.ok) {
        clearInterval(interval);
        throw new Error(data.error || 'Failed to spin slot machine.');
      }

      // Keep spin active for 1500ms
      setTimeout(() => {
        clearInterval(interval);
        setSlotReels(data.resultSymbols);
        setSlotsRolling(false);
        setPoints?.(data.newPoints);
        setLastWinMessage(data.message);

        // Notify
        showNotice?.(data.message, data.win ? 'success' : 'error');

        // History entry
        setBetHistory(prev => [
          {
            id: 'b_' + Math.random().toString(36).substring(2, 11),
            game: 'Aura Slots 🎰',
            bet,
            result: data.resultSymbols.join(' '),
            payout: data.win ? Math.floor(bet * data.multiplier) : 0,
            won: data.win,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev
        ]);
      }, 1500);

    } catch (err: any) {
      clearInterval(interval);
      setSlotsRolling(false);
      showNotice?.(err.message || 'Error occurred during slots spin.', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-pink-500 animate-pulse" /> Aurlets AuraGames Zone
        </h2>
        <p className="text-zinc-400 text-sm">
          Challenge yourself with highly interactive multiplayer logic mini-games based on original server codes!
        </p>

        {/* Connection status banner */}
        {!isLoggedIn ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>You are currently playing as Guest <span className="font-bold text-white">({playerName})</span>. Connect your Discord account to save your points permanently!</span>
            </div>
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 hover:text-white font-bold transition-all text-[11px] shrink-0"
            >
              Connect Profile
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Authenticated via Discord as <span className="font-bold text-white">{playerName}</span>. Your scores will populate on the live server lobbies. Good luck!</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!activeGame ? (
          /* Game Selection Dash */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-10 text-left"
          >
            {/* Category 1: Strategy & Logic Arenas */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-2">
                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <LayoutGrid className="w-4.5 h-4.5" />
                </span>
                <h3 className="text-sm font-black text-zinc-300 tracking-wider uppercase font-mono">🧠 Strategy & Logic Games</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Maths Game Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full inline-block">
                      Speed Logic
                    </span>
                    <h3 className="text-xl font-bold text-white">Multithread Maths Arena</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Test your reaction speed against active moderators inside a timed math lobby. Solve equations to score aura points before anyone else does!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Compete in fast-paced arithmetic to gain points" position="top">
                        <button
                          onClick={() => {
                            setActiveGame('math');
                            startMathGame();
                          }}
                          className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Play className="w-4.5 h-4.5" /> Start Lobby
                        </button>
                      </Tooltip>
                    </div>
                    <button
                      onClick={() => handleCopyInvite('math')}
                      title="Copy Invite Link"
                      className="px-3 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-purple-500/40 hover:bg-zinc-900 text-zinc-400 hover:text-purple-400 transition-all active:scale-95 shrink-0"
                    >
                      <Link2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* King of Diamonds Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-pink-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full inline-block">
                      Strategy Card Game
                    </span>
                    <h3 className="text-xl font-bold text-white">King of Diamonds (KOTD)</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      The ultimate logical standoff. Submit numbers from 0 to 100. Target is 0.8 * average. Furthest player loses a life. Last standing wins the crown!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Play a thrilling multiplayer math guessing strategy game" position="top">
                        <button
                          onClick={() => {
                            setActiveGame('kotd');
                          }}
                          className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Play className="w-4.5 h-4.5" /> Play Game
                        </button>
                      </Tooltip>
                    </div>
                    <button
                      onClick={() => handleCopyInvite('kotd')}
                      title="Copy Invite Link"
                      className="px-3 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-pink-500/40 hover:bg-zinc-900 text-zinc-400 hover:text-pink-400 transition-all active:scale-95 shrink-0"
                    >
                      <Link2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Slide Puzzle Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full inline-block">
                      Visual Mastery
                    </span>
                    <h3 className="text-xl font-bold text-white">Slide Puzzle Arena</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Rearrange image tiles by swapping clicked pieces to reconstruct stunning pictures. Solve 3x3, 4x4, or 5x5 grids for up to 30 Aura Points!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Solve sliding image puzzles to earn points" position="top">
                        <button
                          onClick={() => {
                            setActiveGame('puzzle');
                          }}
                          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Play className="w-4.5 h-4.5" /> Play Puzzle
                        </button>
                      </Tooltip>
                    </div>
                    <button
                      onClick={() => handleCopyInvite('puzzle')}
                      title="Copy Invite Link"
                      className="px-3 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900 text-zinc-400 hover:text-emerald-400 transition-all active:scale-95 shrink-0"
                    >
                      <Link2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Category 2: High Stakes Betting Games */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Coins className="w-4.5 h-4.5" />
                </span>
                <h3 className="text-sm font-black text-zinc-300 tracking-wider uppercase font-mono">🪙 High-Stakes Betting Games</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Betting Casino Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-block">
                      High Stakes Luck
                    </span>
                    <h3 className="text-xl font-bold text-white">Aura Betting Casino</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Put your hard-earned Aura Points on the line! Win double-or-nothing rewards on the classic 50/50 Coinflip or spin the 3-reel Slot Machine for massive payouts of up to 25x!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Wager your points in slots or coinflip mini-games" position="top">
                        <button
                          onClick={() => {
                            setActiveGame('betting');
                          }}
                          className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/25"
                        >
                          <Coins className="w-4 h-4" /> Enter Casino
                        </button>
                      </Tooltip>
                    </div>
                    <button
                      onClick={() => handleCopyInvite('betting')}
                      title="Copy Invite Link"
                      className="px-3 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 text-zinc-400 hover:text-amber-400 transition-all active:scale-95 shrink-0"
                    >
                      <Link2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeGame === 'math' ? (
          /* MATHS GAME DISPLAY */
          <motion.div
            key="math-game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Game Dashboard */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-6 shadow-2xl relative">
                <div className="flex justify-between items-center text-xs font-mono text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span>Speed Match Lobby</span>
                    <button
                      onClick={() => setShowMathRules(!showMathRules)}
                      className="p-1 rounded hover:bg-zinc-800 text-purple-400 hover:text-white transition-colors"
                      title="View Rules"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-rose-400 font-bold">Round Timer: {mathTimeLeft}s</span>
                </div>

                {showMathRules && (
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-zinc-300 text-left space-y-1.5 leading-relaxed">
                    <h5 className="font-bold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Multithread Maths Arena Rules:
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                      <li>Server generates randomized mathematical equations.</li>
                      <li>Type the answer and hit Submit as quickly as possible.</li>
                      <li>The first player to submit the correct answer gets <span className="text-amber-400 font-bold">+1 Aura Point (AP)</span> added directly to their profile balance!</li>
                      <li>Timer ticks down every 15 seconds. Active lobby needs at least 2 active players to run.</li>
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Solve Equation</span>
                  <p className="text-4xl md:text-5xl font-black text-white font-mono tracking-tight">{mathQuestion}</p>
                </div>

                <div className="flex gap-3 max-w-sm mx-auto pt-2">
                  <input
                    type="text"
                    value={userMathAns}
                    onChange={(e) => setUserMathAns(e.target.value)}
                    placeholder="Enter answer"
                    className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && submitMathAnswer()}
                  />
                  <button
                    onClick={submitMathAnswer}
                    className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit
                  </button>
                </div>

                <div className="flex justify-center items-center gap-6 pt-2">
                  <button
                    onClick={() => handleCopyInvite('math')}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5" /> Copy Invite Link
                  </button>
                  <span className="text-zinc-800">|</span>
                  <button
                    onClick={stopMathGame}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Quit Match
                  </button>
                </div>
              </div>

              {/* Game Log */}
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 shadow-md space-y-4">
                <h4 className="text-sm font-bold text-white">Live Game Logs</h4>
                <div className="h-40 overflow-y-auto space-y-2 font-mono text-xs pr-2">
                  {mathLogs.length === 0 ? (
                    <span className="text-zinc-600 italic">Waiting for round action...</span>
                  ) : (
                    mathLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`p-2 rounded ${
                          log.type === 'success' 
                            ? 'bg-emerald-950/45 border-l-2 border-emerald-500 text-emerald-300' 
                            : log.type === 'danger'
                              ? 'bg-rose-950/45 border-l-2 border-rose-500 text-rose-300'
                              : log.type === 'warning'
                                ? 'bg-amber-950/45 border-l-2 border-amber-500 text-amber-300'
                                : 'bg-zinc-950 border-l-2 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        {log.msg}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Players Scores Sidebar */}
            <div className="lg:col-span-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Lobby Scoreboard
              </h3>

              <div className="space-y-3 font-mono">
                {mathPlayers.map((p, idx) => (
                  <div 
                    key={p.name} 
                    className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-900 flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-zinc-200">{p.name}</span>
                    <span className="text-xs font-black text-purple-400">{p.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : activeGame === 'kotd' ? (
          /* KING OF DIAMONDS (KOTD) DISPLAY */
          <motion.div
            key="kotd-game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {!kotdLobbyJoined ? (
              /* KOTD Joining screen */
              <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-xl space-y-6 max-w-md mx-auto text-center relative">
                <div className="flex justify-between items-center absolute top-4 right-4">
                  <button
                    onClick={() => setShowKotdRules(!showKotdRules)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all"
                  >
                    <HelpCircle className="w-4 h-4 text-pink-400" />
                    {showKotdRules ? 'Hide Rules' : 'Rules'}
                  </button>
                </div>

                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mx-auto border border-pink-500/20">
                  <Gamepad2 className="w-6 h-6 animate-bounce" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-white">Join King of Diamonds</h3>
                  <p className="text-xs text-zinc-400">Enter your name to register for the upcoming round strategy session</p>
                </div>

                {showKotdRules && (
                  <div className="p-4 rounded-xl bg-pink-950/20 border border-pink-500/20 text-xs text-zinc-300 text-left space-y-1.5 leading-relaxed">
                    <h5 className="font-bold text-pink-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> King of Diamonds Rules:
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                      <li>Every round, all active players submit a secret strategy number between <span className="font-bold text-white">0 and 100</span>.</li>
                      <li>The server calculates the average of all submissions and multiplies it by <span className="text-pink-400 font-bold">0.8</span> to establish the target.</li>
                      <li>The player closest to the target wins <span className="text-emerald-400 font-bold">+2 Aura Points (AP)</span>.</li>
                      <li>The player furthest from the target loses <span className="text-rose-400 font-bold">1 Heart</span>.</li>
                      <li>Players who run out of Hearts are eliminated. The last standing champion wins <span className="text-amber-400 font-bold">+10 Aura Points (AP)</span>!</li>
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  <input
                    type="text"
                    value={kotdUsername}
                    onChange={(e) => setKotdUsername(e.target.value)}
                    placeholder="Enter player name"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-pink-500 font-mono text-center"
                    onKeyDown={(e) => e.key === 'Enter' && joinKotdLobby()}
                  />
                  <button
                    onClick={joinKotdLobby}
                    className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all text-sm active:scale-95"
                  >
                    Enter Arena Lobby
                  </button>
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => handleCopyInvite('kotd')}
                      className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1.5"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Copy Invite Link
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* KOTD Arena gameplay screen */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Board and Strategy input */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center text-xs font-mono text-zinc-500">
                      <div className="flex items-center gap-2">
                        <span>KOTD Match • Round {kotdRound}</span>
                        <button
                          onClick={() => setShowKotdRules(!showKotdRules)}
                          className="p-1 rounded hover:bg-zinc-800 text-pink-400 hover:text-white transition-colors"
                          title="View Rules"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-rose-400 font-bold">Action Clock: {kotdTimeLeft}s</span>
                    </div>

                    {showKotdRules && (
                      <div className="p-4 rounded-xl bg-pink-950/20 border border-pink-500/20 text-xs text-zinc-300 text-left space-y-1.5 leading-relaxed">
                        <h5 className="font-bold text-pink-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> King of Diamonds Rules:
                        </h5>
                        <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                          <li>Every round, all active players submit a secret strategy number between <span className="font-bold text-white">0 and 100</span>.</li>
                          <li>The server calculates the average of all submissions and multiplies it by <span className="text-pink-400 font-bold">0.8</span> to establish the target.</li>
                          <li>The player closest to the target wins <span className="text-emerald-400 font-bold">+2 Aura Points (AP)</span>.</li>
                          <li>The player furthest from the target loses <span className="text-rose-400 font-bold">1 Heart</span>.</li>
                          <li>Players who run out of Hearts are eliminated. The last standing champion wins <span className="text-amber-400 font-bold">+10 Aura Points (AP)</span>!</li>
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Logical Strategy</span>
                      <p className="text-lg text-zinc-300 font-medium">Select a strategy number between 0 and 100</p>
                    </div>

                    <div className="flex gap-3 max-w-sm mx-auto pt-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={kotdUserAns}
                        onChange={(e) => {
                          setKotdUserAns(e.target.value);
                          if (kotdError) setKotdError('');
                        }}
                        placeholder="e.g. 42"
                        className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-pink-500 text-center"
                        onKeyDown={(e) => e.key === 'Enter' && submitKotdNumber()}
                      />
                      <button
                        onClick={submitKotdNumber}
                        className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                      >
                        Submit Value
                      </button>
                    </div>

                    {kotdError && (
                      <div className="text-rose-400 font-mono text-[10px] text-center pt-1 animate-pulse">
                        ⚠️ {kotdError}
                      </div>
                    )}

                    <div className="flex justify-center items-center gap-6 pt-2">
                      <button
                        onClick={() => handleCopyInvite('kotd')}
                        className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Copy Invite Link
                      </button>
                      <span className="text-zinc-800">|</span>
                      <button
                        onClick={stopKotdGame}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Surrender Match
                      </button>
                    </div>
                  </div>

                  {/* KOTD Game Log */}
                  <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 shadow-md space-y-4">
                    <h4 className="text-sm font-bold text-white">Live KOTD Logs</h4>
                    <div className="h-44 overflow-y-auto space-y-2 font-mono text-xs pr-2">
                      {kotdLogs.length === 0 ? (
                        <span className="text-zinc-600 italic">Submit your choice to begin the game loop.</span>
                      ) : (
                        kotdLogs.map((log) => (
                          <div 
                            key={log.id} 
                            className={`p-2 rounded ${
                              log.type === 'success' 
                                ? 'bg-emerald-950/45 border-l-2 border-emerald-500 text-emerald-300' 
                                : log.type === 'danger'
                                  ? 'bg-rose-950/45 border-l-2 border-rose-500 text-rose-300'
                                  : log.type === 'warning'
                                    ? 'bg-amber-950/45 border-l-2 border-amber-500 text-amber-300'
                                    : 'bg-zinc-950 border-l-2 border-zinc-700 text-zinc-400'
                            }`}
                          >
                            {log.msg}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Score and lives sidebar */}
                <div className="lg:col-span-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-400" /> Surviving Players
                  </h3>

                  <div className="space-y-3.5 font-mono text-xs">
                    {kotdPlayers.map((p) => (
                      <div 
                        key={p.name} 
                        className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-900 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-200">{p.name}</span>
                          <span className="text-pink-400 font-semibold">{p.score} Wins</span>
                        </div>
                        {/* Lives Counter Bar */}
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                          <span className="shrink-0 uppercase font-bold text-[9px]">Lives:</span>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Heart 
                                key={i} 
                                className={`w-3.5 h-3.5 ${i < (p.lives || 5) ? 'text-rose-500 fill-rose-500' : 'text-zinc-800'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : activeGame === 'puzzle' ? (
          /* SLIDE PUZZLE GAME DISPLAY */
          <motion.div
            key="puzzle-game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <SlidePuzzle
              playerName={playerName}
              isLoggedIn={isLoggedIn}
              points={points}
              setPoints={setPoints}
              showNotice={showNotice}
              onBack={() => setActiveGame(null)}
            />
          </motion.div>
        ) : (
          /* AURA BETTING CASINO DISPLAY */
          <motion.div
            key="betting-casino"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Header / Back button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800/60 shadow-lg text-left">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveGame(null)}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" /> Aura Palace Casino
                    </h3>
                    <p className="text-xs text-zinc-400">Play provably fair games of chance with your Aura Points</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyInvite('betting')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-300 hover:text-white text-xs font-bold transition-all"
                  >
                    <Link2 className="w-4 h-4" />
                    Invite Link
                  </button>
                  <button
                    onClick={() => setShowCasinoRules(!showCasinoRules)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    {showCasinoRules ? 'Hide Rules' : 'Rules & Odds'}
                  </button>
                </div>
              </div>

              {/* Player Balance widget */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <Coins className="w-5 h-5" />
                <div className="font-mono text-sm font-black">
                  {points.toLocaleString()} <span className="text-[10px] text-amber-400/70 font-sans font-bold">AP</span>
                </div>
              </div>
            </div>

            {/* Casino Rules Panel */}
            {showCasinoRules && (
              <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-zinc-300 text-left space-y-2 shadow-xl">
                <h4 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Betting Casino Rules & Payout Odds
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-200">🪙 Coinflip Rules:</span>
                    <p className="text-zinc-400">Choose Heads or Tails and enter any bet. Correct prediction pays double your bet (<span className="text-emerald-400 font-bold">2x Payout</span>). Incorrect prediction loses wager. Provably fair 50/50 ratio.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-200">🎰 Slot Machine Payout Matrix:</span>
                    <ul className="list-disc pl-4 text-zinc-400 space-y-0.5">
                      <li>Three Kings (👑 👑 👑) — <span className="text-amber-400 font-bold">25x Payout</span></li>
                      <li>Three Diamonds (💎 💎 💎) — <span className="text-amber-400 font-bold">15x Payout</span></li>
                      <li>Three Identical Fruits — <span className="text-amber-400 font-bold">10x Payout</span></li>
                      <li>Any 2 Matching Symbols — <span className="text-amber-300 font-bold">3x Payout</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Play Area */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Tabs selection: Coinflip or Slots */}
                <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      if (!isRolling && !slotsRolling) {
                        setActiveCasinoTab('coinflip');
                        setLastWinMessage(null);
                      }
                    }}
                    disabled={isRolling || slotsRolling}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      activeCasinoTab === 'coinflip'
                        ? 'bg-zinc-800 text-amber-400 border border-zinc-700/50 shadow'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                    } disabled:opacity-50`}
                  >
                    🪙 50/50 Coin Flip
                  </button>
                  <button
                    onClick={() => {
                      if (!isRolling && !slotsRolling) {
                        setActiveCasinoTab('slots');
                        setLastWinMessage(null);
                      }
                    }}
                    disabled={isRolling || slotsRolling}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      activeCasinoTab === 'slots'
                        ? 'bg-zinc-800 text-amber-400 border border-zinc-700/50 shadow'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                    } disabled:opacity-50`}
                  >
                    🎰 Aura Slots
                  </button>
                </div>

                {/* Tab content 1: Coin Flip */}
                {activeCasinoTab === 'coinflip' && (
                  <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col items-center space-y-8 text-center relative overflow-hidden">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold">Provably Fair Game</span>
                      <h4 className="text-xl font-bold text-white">Classic Coinflip</h4>
                      <p className="text-xs text-zinc-400 max-w-sm">Double your bet amount! Pick Heads or Tails, place your bet, and flip the golden coin.</p>
                    </div>

                    {/* Flipping Coin Asset */}
                    <div className="py-4 flex flex-col items-center justify-center">
                      <div className="perspective">
                        <motion.div
                          animate={isRolling ? { rotateY: [0, 360, 720, 1080, 1440, 1800] } : { rotateY: 0 }}
                          transition={isRolling ? { repeat: Infinity, duration: 1.0, ease: "linear" } : { duration: 0.5 }}
                          className="w-32 h-32 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 border-4 border-amber-300/60 shadow-2xl shadow-amber-500/20 flex items-center justify-center select-none text-5xl font-black text-amber-950 font-mono"
                        >
                          {coinResult ? (coinResult === 'heads' ? '🪙' : '👑') : (coinChoice === 'heads' ? '🪙' : '👑')}
                        </motion.div>
                      </div>
                      
                      {/* Subtitle helper showing what coin symbol is */}
                      <span className="text-[10px] text-zinc-500 font-mono mt-3 block">
                        {coinResult 
                          ? `Landed on: ${coinResult.toUpperCase()} (${coinResult === 'heads' ? '🪙 Heads' : '👑 Tails'})` 
                          : `Currently selected: ${coinChoice.toUpperCase()}`}
                      </span>
                    </div>

                    {/* Choices Picker */}
                    <div className="flex gap-4 w-full max-w-xs">
                      <button
                        onClick={() => !isRolling && setCoinChoice('heads')}
                        disabled={isRolling}
                        className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border ${
                          coinChoice === 'heads'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        } disabled:opacity-50`}
                      >
                        <span className="text-2xl">🪙</span>
                        <span>Heads</span>
                      </button>
                      <button
                        onClick={() => !isRolling && setCoinChoice('tails')}
                        disabled={isRolling}
                        className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border ${
                          coinChoice === 'tails'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        } disabled:opacity-50`}
                      >
                        <span className="text-2xl">👑</span>
                        <span>Tails</span>
                      </button>
                    </div>

                    {/* Betting Input & CTA */}
                    <div className="w-full max-w-sm space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 font-bold block text-left">Wager Amount (Min 5 AP)</label>
                        <div className="flex gap-2 text-left">
                          <input
                            type="number"
                            min="5"
                            disabled={isRolling}
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            placeholder="Wager AP"
                            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50 text-center"
                          />
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => !isRolling && setBetAmount('10')}
                              disabled={isRolling}
                              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-400 hover:text-white"
                            >
                              10
                            </button>
                            <button
                              onClick={() => !isRolling && setBetAmount('50')}
                              disabled={isRolling}
                              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-400 hover:text-white"
                            >
                              50
                            </button>
                            <button
                              onClick={() => !isRolling && setBetAmount('250')}
                              disabled={isRolling}
                              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-400 hover:text-white"
                            >
                              250
                            </button>
                            <button
                              onClick={() => !isRolling && setBetAmount(points.toString())}
                              disabled={isRolling}
                              className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 hover:bg-amber-500/20"
                            >
                              ALL IN
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleCoinFlip}
                        disabled={isRolling || !isLoggedIn}
                        className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98 shadow-lg shadow-amber-950/20"
                      >
                        {isRolling ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" /> Flipping Golden Coin...
                          </>
                        ) : (
                          <>
                            Flip Coin • Bet {Math.floor(Number(betAmount) || 0)} AP
                          </>
                        )}
                      </button>
                    </div>

                    {lastWinMessage && (
                      <div className={`p-4 rounded-xl font-bold text-sm w-full ${lastWinMessage.includes('Won') || lastWinMessage.includes('won') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'} animate-fade-in`}>
                        {lastWinMessage}
                      </div>
                    )}

                  </div>
                )}

                {/* Tab content 2: Slots */}
                {activeCasinoTab === 'slots' && (
                  <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col items-center space-y-8 text-center relative overflow-hidden">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold">Jackpot Multipliers</span>
                      <h4 className="text-xl font-bold text-white">Aura Slots Machine</h4>
                      <p className="text-xs text-zinc-400 max-w-sm">
                        Payouts up to <span className="text-amber-400 font-bold">25x</span>! 2 matching symbols gives a neat 3x, 3 symbols hits high payouts (up to 25x for Kings)!
                      </p>
                    </div>

                    {/* Slots Reels display */}
                    <div className="flex gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-inner w-full max-w-sm justify-center">
                      {slotReels.map((symbol, idx) => (
                        <div 
                          key={idx} 
                          className="w-20 h-24 rounded-xl bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center text-4xl shadow-md font-sans select-none relative overflow-hidden"
                        >
                          <motion.div
                            key={`${symbol}-${slotsRolling}`}
                            initial={slotsRolling ? { y: -30, opacity: 0.5 } : { y: 0, opacity: 1 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.08 }}
                          >
                            {symbol}
                          </motion.div>
                          {/* Ambient shadow gradient */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />
                        </div>
                      ))}
                    </div>

                    {/* Betting Input & CTA */}
                    <div className="w-full max-w-sm space-y-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 font-bold block text-left">Wager Amount (Min 5 AP)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="5"
                            disabled={slotsRolling}
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            placeholder="Wager AP"
                            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50 text-center"
                          />
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => !slotsRolling && setBetAmount('10')}
                              disabled={slotsRolling}
                              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-400 hover:text-white"
                            >
                              10
                            </button>
                            <button
                              onClick={() => !slotsRolling && setBetAmount('50')}
                              disabled={slotsRolling}
                              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-400 hover:text-white"
                            >
                              50
                            </button>
                            <button
                              onClick={() => !slotsRolling && setBetAmount('250')}
                              disabled={slotsRolling}
                              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-400 hover:text-white"
                            >
                              250
                            </button>
                            <button
                              onClick={() => !slotsRolling && setBetAmount(points.toString())}
                              disabled={slotsRolling}
                              className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 hover:bg-amber-500/20"
                            >
                              ALL IN
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSpinSlots}
                        disabled={slotsRolling || !isLoggedIn}
                        className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98 shadow-lg shadow-amber-950/20"
                      >
                        {slotsRolling ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" /> Pulling Slot Lever...
                          </>
                        ) : (
                          <>
                            Spin Slots • Bet {Math.floor(Number(betAmount) || 0)} AP
                          </>
                        )}
                      </button>
                    </div>

                    {lastWinMessage && (
                      <div className={`p-4 rounded-xl font-bold text-sm w-full ${lastWinMessage.includes('won') || lastWinMessage.includes('Multiplier') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'} animate-fade-in`}>
                        {lastWinMessage}
                      </div>
                    )}

                    {/* Paytable Guide */}
                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-[10px] text-zinc-500 text-left w-full space-y-1">
                      <div className="font-bold text-zinc-400 mb-1">Payout Guide:</div>
                      <div className="flex justify-between font-mono"><span>👑 👑 👑 (Three Kings)</span> <span className="font-bold text-amber-400">25x Payout</span></div>
                      <div className="flex justify-between font-mono"><span>💎 💎 💎 (Three Diamonds)</span> <span className="font-bold text-amber-400">15x Payout</span></div>
                      <div className="flex justify-between font-mono"><span>🍇 🍇 🍇 / 🍋 🍋 🍋 / 🍒 🍒 🍒 (Three Fruit)</span> <span className="font-bold text-amber-400">10x Payout</span></div>
                      <div className="flex justify-between font-mono"><span>Any 2 matching symbols</span> <span className="font-bold text-zinc-300">3x Payout</span></div>
                      <div className="flex justify-between font-mono"><span>No matches</span> <span className="text-zinc-600 font-mono">Deduct Wager</span></div>
                    </div>

                  </div>
                )}

              </div>

              {/* Sidebar Recent Bets History */}
              <div className="lg:col-span-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-amber-400" /> Recent Bets History
                  </h3>

                  <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1 font-mono text-[11px]">
                    {betHistory.length === 0 ? (
                      <span className="text-zinc-600 italic block text-center py-6">Your bets for this session will display here. Make a wager to play!</span>
                    ) : (
                      betHistory.map((historyItem) => (
                        <div 
                          key={historyItem.id} 
                          className={`p-3 rounded-xl border flex flex-col gap-1 ${
                            historyItem.won 
                              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' 
                              : 'bg-rose-950/10 border-rose-500/10 text-rose-400'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold">
                            <span>{historyItem.game}</span>
                            <span className="text-zinc-500 font-normal text-[10px]">{historyItem.time}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span>Wager: {historyItem.bet} AP</span>
                            <span className="font-bold">
                              {historyItem.won ? `Payout: +${historyItem.payout} AP` : 'Lost'}
                            </span>
                          </div>
                          <div className="text-[9px] text-zinc-500 text-left">
                            Outcome: {historyItem.result}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-zinc-500 leading-relaxed text-center">
                  ⚠️ Mini-games are provably fair. Play responsibly. All payouts are computed immediately on the secure server database.
                </div>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
