import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Play, Users, Send, CheckCircle, HelpCircle, Trophy, RefreshCw, AlertCircle, Heart } from 'lucide-react';

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
}

export default function AuraGames({ playerName: propPlayerName, isLoggedIn, onOpenAuthModal }: AuraGamesProps) {
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

  const [activeGame, setActiveGame] = useState<'math' | 'kotd' | null>(null);

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
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Maths Game Selector */}
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full inline-block">
                  Speed Logic
                </span>
                <h3 className="text-2xl font-bold text-white">Multithread Maths Arena</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Test your reaction speed against active moderators inside a timed math lobby. Solve equations to score aura points before anyone else does!
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveGame('math');
                  startMathGame();
                }}
                className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4.5 h-4.5" /> Start Maths Lobby
              </button>
            </div>

            {/* King of Diamonds Selector */}
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-pink-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full inline-block">
                  Strategy Card Game
                </span>
                <h3 className="text-2xl font-bold text-white">King of Diamonds (KOTD)</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  The ultimate logical standoff. Submit numbers from 0 to 100. Target is 0.8 * average. Furthest player loses a life. Last standing wins the crown!
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveGame('kotd');
                }}
                className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4.5 h-4.5" /> Play King of Diamonds
              </button>
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
              <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-6 shadow-2xl">
                <div className="flex justify-between items-center text-xs font-mono text-zinc-500">
                  <span>Speed Match Lobby</span>
                  <span className="text-rose-400 font-bold">Round Timer: {mathTimeLeft}s</span>
                </div>

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

                <button
                  onClick={stopMathGame}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Quit Match
                </button>
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
        ) : (
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
              <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-xl space-y-6 max-w-md mx-auto text-center">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mx-auto border border-pink-500/20">
                  <Gamepad2 className="w-6 h-6 animate-bounce" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-white">Join King of Diamonds</h3>
                  <p className="text-xs text-zinc-400">Enter your name to register for the upcoming round strategy session</p>
                </div>

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
                </div>
              </div>
            ) : (
              /* KOTD Arena gameplay screen */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Board and Strategy input */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center text-xs font-mono text-zinc-500">
                      <span>KOTD Match • Round {kotdRound}</span>
                      <span className="text-rose-400 font-bold">Action Clock: {kotdTimeLeft}s</span>
                    </div>

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

                    <button
                      onClick={stopKotdGame}
                      className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors block mx-auto"
                    >
                      Surrender Match
                    </button>
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
        )}
      </AnimatePresence>
    </div>
  );
}
