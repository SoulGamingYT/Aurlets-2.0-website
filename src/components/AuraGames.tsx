import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Play, Users, Send, CheckCircle, HelpCircle, Trophy, RefreshCw, AlertCircle, Heart, Coins, Sparkles, ArrowLeft, RotateCw, Landmark, Grid, LayoutGrid, Link2 } from 'lucide-react';
import { Tooltip } from './Tooltip';
import SlidePuzzle from './SlidePuzzle';
import HigherLower from './HigherLower';
import RockPaperScissors from './RockPaperScissors';
import AuraBankHeist from './AuraBankHeist';

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
  bankBalance?: number;
  setBankBalance?: React.Dispatch<React.SetStateAction<number>>;
  showNotice?: (msg: string, type: 'success' | 'error' | 'info') => void;
  isAdmin?: boolean;
  userDiscordId?: string;
}

export default function AuraGames({ 
  playerName: propPlayerName, 
  isLoggedIn, 
  onOpenAuthModal,
  points = 0,
  setPoints,
  bankBalance = 0,
  setBankBalance,
  showNotice,
  isAdmin = false,
  userDiscordId = ''
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

  const [activeGame, setActiveGame] = useState<'math' | 'kotd' | 'betting' | 'puzzle' | 'higherlower' | 'rps' | 'bank' | 'spin' | 'tictactoe' | 'hangman' | 'scramble' | null>(null);

  // --- TIC TAC TOE GAME STATE ---
  const [tttBoard, setTttBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tttWinner, setTttWinner] = useState<string | null>(null); // 'X', 'O', 'draw', null
  const [tttIsAILoading, setTttIsAILoading] = useState<boolean>(false);

  // --- HANGMAN GAME STATE ---
  const HANGMAN_WORDS = [
    { word: 'REACT', hint: 'A popular frontend web library' },
    { word: 'DISCORD', hint: 'The platform hosting our beautiful community' },
    { word: 'AURAFLOW', hint: 'A state of absolute design perfection' },
    { word: 'TYPESCRIPT', hint: 'Strict syntactical superset of JavaScript' },
    { word: 'TAILWIND', hint: 'A utility-first CSS framework for rapid UI styling' },
    { word: 'BLOCKCHAIN', hint: 'Decentralized distributed ledger tech' },
    { word: 'SOLIDITY', hint: 'Language used to write smart contracts' },
    { word: 'DEVELOPER', hint: 'A builder of virtual software universes' }
  ];
  const [hangmanWord, setHangmanWord] = useState<string>('REACT');
  const [hangmanHint, setHangmanHint] = useState<string>('A popular frontend web library');
  const [hangmanGuessed, setHangmanGuessed] = useState<string[]>([]);
  const [hangmanLives, setHangmanLives] = useState<number>(6);

  // --- WORD SCRAMBLE GAME STATE ---
  const SCRAMBLE_WORDS = [
    { word: 'VARIABLE', hint: 'A storage location paired with an associated symbolic name' },
    { word: 'COMPILER', hint: 'Translates source code into machine code' },
    { word: 'DATABASE', hint: 'An organized collection of structured information or data' },
    { word: 'FUNCTION', hint: 'A set of statements that performs a task or calculates a value' },
    { word: 'SERVER', hint: 'A computer program or device that provides a service to another' },
    { word: 'GITHUB', hint: 'Platform for version control and software collaboration' },
    { word: 'INTERNET', hint: 'A global computer network providing information and communication' }
  ];
  const [scrambleWord, setScrambleWord] = useState<string>('');
  const [scrambleScrambled, setScrambleScrambled] = useState<string>('');
  const [scrambleHint, setScrambleHint] = useState<string>('');
  const [scrambleInput, setScrambleInput] = useState<string>('');
  const [scrambleSolved, setScrambleSolved] = useState<boolean>(false);
  const [scrambleFeedback, setScrambleFeedback] = useState<string>('');

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
  const [activeCasinoTab, setActiveCasinoTab] = useState<'coinflip' | 'slots' | 'mines'>('coinflip');
  const [lastWinMessage, setLastWinMessage] = useState<string | null>(null);

  // --- MINES CASINO GAME STATE ---
  const [minesBet, setMinesBet] = useState<string>('10');
  const [minesCount, setMinesCount] = useState<number>(3);
  const [minesActive, setMinesActive] = useState<boolean>(false);
  const [minesRevealed, setMinesRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [minesGrid, setMinesGrid] = useState<('gem' | 'mine' | null)[]>(Array(25).fill(null));
  const [minesMultiplier, setMinesMultiplier] = useState<number>(1.0);
  const [minesNextMultiplier, setMinesNextMultiplier] = useState<number>(1.13);
  const [minesLoading, setMinesLoading] = useState<boolean>(false);
  const [minesResultMsg, setMinesResultMsg] = useState<string | null>(null);

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

  // --- DAILY LUCKY SPIN GAME STATE ---
  const [dailySpinState, setDailySpinState] = useState<{
    points: number;
    spinVouchers: number;
    extraSpins: number;
    spinsToday: number;
    dailyLimit: number;
    canSpin: boolean;
    segments: any[];
  } | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinRotation, setSpinRotation] = useState<number>(0);
  const [spinResult, setSpinResult] = useState<any | null>(null);
  const [isRedeemingVoucher, setIsRedeemingVoucher] = useState<boolean>(false);
  const [redeemVoucherAmount, setRedeemVoucherAmount] = useState<string>('1');

  const fetchDailySpinState = async () => {
    try {
      const res = await fetch(`/api/games/daily-spin/state?username=${encodeURIComponent(playerName)}`);
      if (res.ok) {
        const data = await res.json();
        setDailySpinState(data);
      }
    } catch (err) {
      console.error('Failed to fetch daily spin state:', err);
    }
  };

  const segments = dailySpinState?.segments || [
    { label: '10 AP', value: 10, type: 'ap', color: '#10b981', weight: 24 },
    { label: '50 AP', value: 50, type: 'ap', color: '#3b82f6', weight: 18 },
    { label: '75 AP', value: 75, type: 'ap', color: '#8b5cf6', weight: 15 },
    { label: '100 AP', value: 100, type: 'ap', color: '#ec4899', weight: 12 },
    { label: '250 AP', value: 250, type: 'ap', color: '#06b6d4', weight: 8 },
    { label: '500 AP', value: 500, type: 'ap', color: '#f59e0b', weight: 3 }, // low chances than other
    { label: 'No Reward', value: 0, type: 'none', color: '#4b5563', weight: 20 },
    { label: 'Spin Again (+1 Spin)', value: 1, type: 'spin', color: '#14b8a6', weight: 12 },
    { label: '+3 Spin', value: 3, type: 'spin', color: '#f43f5e', weight: 2 }, // low chances
    { label: '+1000 AP', value: 1000, type: 'ap', color: '#eab308', weight: 1 } // Low Chances
  ];

  const triggerDailySpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);

    try {
      const res = await fetch('/api/games/daily-spin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: playerName })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to spin the wheel.');
      }

      const data = await res.json();
      const winningIndex = data.segmentIndex;

      // Calculate new spin rotation:
      // We do a full 6 rotations (2160 deg) plus the alignment to the top (which is - winningIndex * 36)
      const sliceSize = 360 / segments.length;
      const targetRotation = spinRotation + 2160 - (spinRotation % 360) + (360 - (winningIndex * sliceSize) - (sliceSize / 2));
      setSpinRotation(targetRotation);

      setTimeout(() => {
        setIsSpinning(false);
        setSpinResult(data.segment);
        // Update user stats
        if (setPoints) setPoints(data.points);
        if (dailySpinState) {
          setDailySpinState(prev => prev ? {
            ...prev,
            points: data.points,
            spinVouchers: data.spinVouchers,
            extraSpins: data.extraSpins,
            spinsToday: data.spinsToday,
            canSpin: data.spinsToday < prev.dailyLimit || data.extraSpins > 0
          } : null);
        }
        showNotice?.(data.feedbackMessage || `You won ${data.segment.label}!`, 'success');
      }, 4000);

    } catch (err: any) {
      setIsSpinning(false);
      showNotice?.(err.message || 'Error spinning the wheel.', 'error');
    }
  };

  const handleRedeemVouchersInUI = async () => {
    const amount = parseInt(redeemVoucherAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      showNotice?.('Please enter a valid positive voucher amount.', 'error');
      return;
    }
    setIsRedeemingVoucher(true);
    try {
      const res = await fetch('/api/games/daily-spin/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: playerName, amount })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice?.(data.message, 'success');
        if (dailySpinState) {
          setDailySpinState(prev => prev ? {
            ...prev,
            spinVouchers: data.spinVouchers,
            extraSpins: data.extraSpins,
            canSpin: prev.spinsToday < prev.dailyLimit || data.extraSpins > 0
          } : null);
        }
        setRedeemVoucherAmount('1');
      } else {
        showNotice?.(data.error || 'Failed to redeem vouchers.', 'error');
      }
    } catch (err: any) {
      showNotice?.(err.message || 'Error redeeming vouchers.', 'error');
    } finally {
      setIsRedeemingVoucher(false);
    }
  };

  useEffect(() => {
    if (activeGame === 'spin' && isLoggedIn) {
      fetchDailySpinState();
    }
  }, [activeGame, playerName, isLoggedIn]);

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

  // --- NEW AURA GAMES ACTIONS ---
  // --- TIC TAC TOE FUNCTIONS ---
  const resetTtt = () => {
    setTttBoard(Array(9).fill(null));
    setTttWinner(null);
    setTttIsAILoading(false);
  };

  const handleTttClick = (index: number) => {
    if (tttBoard[index] || tttWinner || tttIsAILoading) return;

    const newBoard = [...tttBoard];
    newBoard[index] = 'X';
    setTttBoard(newBoard);

    const win = checkTttWinner(newBoard);
    if (win) {
      setTttWinner(win);
      handleTttGameOver(win);
      return;
    }

    setTttIsAILoading(true);
    setTimeout(() => {
      const aiBoard = [...newBoard];
      const emptyIndices = aiBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
      if (emptyIndices.length > 0) {
        const randomChoice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        aiBoard[randomChoice] = 'O';
        setTttBoard(aiBoard);

        const aiWin = checkTttWinner(aiBoard);
        if (aiWin) {
          setTttWinner(aiWin);
          handleTttGameOver(aiWin);
        }
      } else {
        setTttWinner('draw');
        handleTttGameOver('draw');
      }
      setTttIsAILoading(false);
    }, 500);
  };

  const checkTttWinner = (board: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell !== null)) {
      return 'draw';
    }
    return null;
  };

  const handleTttGameOver = (result: string) => {
    if (!isLoggedIn) return;
    if (result === 'X') {
      updatePointsOnServer(15, 'Tic Tac Toe Victory! ⭕❌');
    } else if (result === 'draw') {
      updatePointsOnServer(5, 'Tic Tac Toe Draw!');
    }
  };

  const updatePointsOnServer = async (amount: number, reason: string) => {
    try {
      const res = await fetch('/api/admin/user/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-username': 'Admin'
        },
        body: JSON.stringify({
          name: playerName,
          action: 'add',
          points: amount,
          type: 'points'
        })
      });
      if (res.ok) {
        if (setPoints) {
          setPoints(prev => prev + amount);
        }
        if (showNotice) {
          showNotice(`🎉 +${amount} AP gained from ${reason}!`, 'success');
        }
      }
    } catch (err) {
      console.error('Error awarding points:', err);
    }
  };

  // --- HANGMAN FUNCTIONS ---
  const startHangman = () => {
    const item = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
    setHangmanWord(item.word);
    setHangmanHint(item.hint);
    setHangmanGuessed([]);
    setHangmanLives(6);
  };

  const handleHangmanGuess = (letter: string) => {
    if (hangmanGuessed.includes(letter) || hangmanLives <= 0 || isHangmanWon()) return;

    const newGuessed = [...hangmanGuessed, letter];
    setHangmanGuessed(newGuessed);

    if (!hangmanWord.includes(letter)) {
      const newLives = hangmanLives - 1;
      setHangmanLives(newLives);
      if (newLives <= 0) {
        if (showNotice) showNotice(`💀 Game Over! The word was "${hangmanWord}".`, 'error');
      }
    } else {
      const wordLetters = hangmanWord.split('');
      const isWin = wordLetters.every(l => newGuessed.includes(l));
      if (isWin) {
        if (showNotice) showNotice(`🎉 You solved Hangman! Gained +20 AP!`, 'success');
        updatePointsOnServer(20, 'Hangman Victory! 🪓');
      }
    }
  };

  const isHangmanWon = () => {
    return hangmanWord.split('').every(l => hangmanGuessed.includes(l));
  };

  // --- WORD SCRAMBLE FUNCTIONS ---
  const startScramble = () => {
    const item = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
    setScrambleWord(item.word);
    setScrambleHint(item.hint);
    setScrambleInput('');
    setScrambleSolved(false);
    setScrambleFeedback('');

    let arr = item.word.split('');
    let attempts = 0;
    while (attempts < 10) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      if (arr.join('') !== item.word) break;
      attempts++;
    }
    setScrambleScrambled(arr.join(''));
  };

  const checkScrambleGuess = () => {
    if (scrambleSolved) return;

    if (scrambleInput.trim().toUpperCase() === scrambleWord) {
      setScrambleSolved(true);
      setScrambleFeedback('🎉 Correct! Magnificent solving skills.');
      if (showNotice) showNotice('🎉 Word Scramble Solved! Gained +15 AP!', 'success');
      updatePointsOnServer(15, 'Word Scramble Solving! 📝');
    } else {
      setScrambleFeedback('❌ Incorrect. Focus your aura and try again!');
    }
  };

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

  // --- MINES CASINO GAME HANDLERS ---
  const startMinesGame = async () => {
    if (!isLoggedIn) {
      showNotice?.('Please set your nickname/profile before starting a game!', 'error');
      return;
    }
    const bet = Math.floor(Number(minesBet));
    if (isNaN(bet) || bet < 5) {
      showNotice?.('Minimum bet is 5 Aura Points (AP).', 'error');
      return;
    }
    if (points < bet) {
      showNotice?.(`Insufficient points! You only have ${points} AP.`, 'error');
      return;
    }
    if (minesCount < 1 || minesCount > 24) {
      showNotice?.('Mines count must be between 1 and 24.', 'error');
      return;
    }

    setMinesLoading(true);
    setMinesResultMsg(null);

    try {
      const res = await fetch('/api/game/bet/mines/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, betAmount: bet, minesCount })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start Mines game.');
      }

      setMinesActive(true);
      setMinesRevealed(Array(25).fill(false));
      setMinesGrid(Array(25).fill(null));
      setMinesMultiplier(1.0);
      setMinesNextMultiplier(data.nextMultiplier || 1.13);
      setPoints?.(data.newPoints);
      showNotice?.(data.message, 'success');
    } catch (err: any) {
      showNotice?.(err.message || 'Error starting Mines game.', 'error');
    } finally {
      setMinesLoading(false);
    }
  };

  const revealMinesTile = async (idx: number) => {
    if (!minesActive || minesLoading || minesRevealed[idx]) return;

    setMinesLoading(true);
    try {
      const res = await fetch('/api/game/bet/mines/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, tileIndex: idx })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reveal tile.');
      }

      if (data.mineHit) {
        // Lost!
        setMinesActive(false);
        setMinesResultMsg('💣 Hit a mine! Game Over.');
        
        // Populate full grid to reveal everything
        const newGrid = data.grid.map((val: string) => val);
        setMinesGrid(newGrid);
        setMinesRevealed(Array(25).fill(true));
        showNotice?.(data.message, 'error');

        setBetHistory(prev => [
          {
            id: 'b_' + Math.random().toString(36).substring(2, 11),
            game: `Mines 💣 (${minesCount} Mines)`,
            bet: Math.floor(Number(minesBet)),
            result: 'Lost (Hit Mine)',
            payout: 0,
            won: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev
        ]);
      } else if (data.cashout) {
        // Automatic cashout (found all gems!)
        setMinesActive(false);
        setMinesResultMsg(`🎉 Max Gems Found! Won ${data.payout} AP!`);
        setMinesMultiplier(data.multiplier);
        setPoints?.(data.newPoints);

        const newGrid = data.grid.map((val: string) => val);
        setMinesGrid(newGrid);
        setMinesRevealed(Array(25).fill(true));
        showNotice?.(data.message, 'success');

        setBetHistory(prev => [
          {
            id: 'b_' + Math.random().toString(36).substring(2, 11),
            game: `Mines 💣 (${minesCount} Mines)`,
            bet: Math.floor(Number(minesBet)),
            result: `Cleared! (${data.multiplier}x)`,
            payout: data.payout,
            won: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev
        ]);
      } else {
        // Gem found!
        const newRevealed = [...minesRevealed];
        newRevealed[idx] = true;
        setMinesRevealed(newRevealed);

        const newGrid = [...minesGrid];
        newGrid[idx] = 'gem';
        setMinesGrid(newGrid);

        setMinesMultiplier(data.multiplier);
        if (data.nextMultiplier) {
          setMinesNextMultiplier(data.nextMultiplier);
        }
        showNotice?.(data.message, 'success');
      }
    } catch (err: any) {
      showNotice?.(err.message || 'Error revealing tile.', 'error');
    } finally {
      setMinesLoading(false);
    }
  };

  const cashoutMinesGame = async () => {
    if (!minesActive || minesLoading) return;

    setMinesLoading(true);
    try {
      const res = await fetch('/api/game/bet/mines/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cash out.');
      }

      setMinesActive(false);
      setMinesResultMsg(`💰 Cashed Out! Won ${data.payout} AP (${data.multiplier}x)`);
      setPoints?.(data.newPoints);

      const newGrid = data.grid.map((val: string) => val);
      setMinesGrid(newGrid);
      setMinesRevealed(Array(25).fill(true));
      showNotice?.(data.message, 'success');

      setBetHistory(prev => [
        {
          id: 'b_' + Math.random().toString(36).substring(2, 11),
          game: `Mines 💣 (${minesCount} Mines)`,
          bet: Math.floor(Number(minesBet)),
          result: `Cashed Out (${data.multiplier}x)`,
          payout: data.payout,
          won: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
        ...prev
      ]);
    } catch (err: any) {
      showNotice?.(err.message || 'Error cashing out.', 'error');
    } finally {
      setMinesLoading(false);
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                {/* Tic Tac Toe Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full inline-block">
                      Classic Board
                    </span>
                    <h3 className="text-xl font-bold text-white">Aura Tic-Tac-Toe</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Pit your logical foresight against an intelligent AI in a classic 3x3 duel. Defeat the AI to claim a swift 15 Aura Points bounty!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Play Tic Tac Toe against a smart AI" position="top">
                        <button
                          onClick={() => {
                            setActiveGame('tictactoe');
                            resetTtt();
                          }}
                          className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Play className="w-4.5 h-4.5" /> Play Duel
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Hangman Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-block">
                      Vocabulary Duel
                    </span>
                    <h3 className="text-xl font-bold text-white">Aura Tech Hangman</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Guess secret programming and community terminology letter-by-letter. Retain your lives and unlock an absolute 20 Aura Points treasure!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Guess letters to solve the hidden word" position="top">
                        <button
                          onClick={() => {
                            setActiveGame('hangman');
                            startHangman();
                          }}
                          className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Play className="w-4.5 h-4.5" /> Play Hangman
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Word Scramble Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-violet-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full inline-block">
                      Anagram Solver
                    </span>
                    <h3 className="text-xl font-bold text-white">Aura Word Scramble</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Unscramble randomized characters of vital computer science terms. Prove your word supremacy and harvest 15 Aura Points!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Unscramble letters to find the word" position="top">
                        <button
                          onClick={() => {
                            setActiveGame('scramble');
                            startScramble();
                          }}
                          className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Play className="w-4.5 h-4.5" /> Unscramble
                        </button>
                      </Tooltip>
                    </div>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Daily Lucky Spin Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-pink-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3 text-left">
                    <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full inline-block animate-pulse">
                      Daily Fortune
                    </span>
                    <h3 className="text-xl font-bold text-white">Daily Lucky Spin</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Spin the wheel once a day for free! Redeem your Spin Vouchers to get extra spins and win massive jackpots of up to 1,000 AP!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Spin the wheel once a day for amazing prizes" position="top">
                        <button
                          onClick={() => {
                            if (!isLoggedIn) {
                              onOpenAuthModal();
                              return;
                            }
                            setActiveGame('spin');
                          }}
                          className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-pink-950/25"
                        >
                          <RotateCw className="w-4 h-4" /> Spin Now
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

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

                {/* Higher or Lower Card */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3 text-left">
                    <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full inline-block">
                      Multiplier Streak
                    </span>
                    <h3 className="text-xl font-bold text-white">Higher or Lower</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Test your instincts! Guess if the next card is higher or lower. Accumulate win streak multipliers and cash out your Aura Points anytime!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Play Higher or Lower card guessing game" position="top">
                        <button
                          onClick={() => {
                            if (!isLoggedIn) {
                              onOpenAuthModal();
                              return;
                            }
                            setActiveGame('higherlower');
                          }}
                          className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-purple-950/25"
                        >
                          <Play className="w-4 h-4 fill-white" /> Play Game
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Rock Paper Scissors Card */}
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-6 h-full shadow-xl">
                  <div className="space-y-3 text-left">
                    <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-block">
                      Fast Action Double
                    </span>
                    <h3 className="text-xl font-bold text-white">Rock Paper Scissors</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Compete against Aura Bot in the classic arena! Choose rock, paper, or scissors to double your wager. Clean draws get full refunds!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <Tooltip content="Play Rock Paper Scissors vs the bot" position="top">
                        <button
                          onClick={() => {
                            if (!isLoggedIn) {
                              onOpenAuthModal();
                              return;
                            }
                            setActiveGame('rps');
                          }}
                          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-sm active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-950/25"
                        >
                          <Play className="w-4.5 h-4.5 fill-white" /> Fight Bot
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category 3: Financial Systems & Vault Heists */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Landmark className="w-4.5 h-4.5" />
                </span>
                <h3 className="text-sm font-black text-zinc-300 tracking-wider uppercase font-mono">🏦 Aura Banking & Vault Heists</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-emerald-950/20 border border-zinc-800/80 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/8 transition-all duration-700 pointer-events-none" />
                  <div className="space-y-4 max-w-2xl text-left">
                    <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full inline-block">
                      Secure Vault & High-Stakes Co-op
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">Aura Bank & Server Vault Heist</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Secure your hard-earned Aura Points in the secure Bank account (immune to robberies!). Form a heist crew with up to 5 members, register for a high-stakes safe-cracking run (costs 200 AP per player), and hack the server vault for up to 25% of the massive server vault bank roll!
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col sm:flex-row gap-3 md:w-80">
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          onOpenAuthModal();
                          return;
                        }
                        setActiveGame('bank');
                      }}
                      className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-all text-base active:scale-95 flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/40 relative overflow-hidden group/btn"
                    >
                      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      <Landmark className="w-5 h-5" /> Access Bank & Vault
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
        ) : activeGame === 'higherlower' ? (
          <motion.div
            key="higher-lower"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <HigherLower
              playerName={playerName}
              points={points || 0}
              setPoints={setPoints || (() => {})}
              showNotice={showNotice as any}
              onBack={() => setActiveGame(null)}
            />
          </motion.div>
        ) : activeGame === 'rps' ? (
          <motion.div
            key="rps"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <RockPaperScissors
              playerName={playerName}
              points={points || 0}
              setPoints={setPoints || (() => {})}
              showNotice={showNotice as any}
              onBack={() => setActiveGame(null)}
            />
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
        ) : activeGame === 'spin' ? (
          /* DAILY LUCKY SPIN WHEEL GAME */
          <motion.div
            key="daily-spin-wheel"
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20 animate-pulse">
                        DAILY FORTUNE
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white mt-1">Daily Lucky Spin</h2>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-zinc-950/80 px-4 py-2.5 rounded-xl border border-zinc-800">
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 block uppercase">Your Balance</span>
                  <span className="text-sm font-black text-amber-400">{(dailySpinState?.points ?? points).toLocaleString()} AP</span>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 block uppercase">Spin Vouchers</span>
                  <span className="text-sm font-black text-pink-400">{dailySpinState?.spinVouchers ?? 0} Vouchers</span>
                </div>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
              {/* Left Column: Spin Wheel Stage (7 cols on desktop) */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-900/25 border border-zinc-800/60 rounded-3xl p-8 relative overflow-hidden min-h-[500px]">
                {/* Background decorative grids */}
                <div className="absolute inset-0 bg-radial-at-t from-pink-500/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Wheel Container */}
                <div className="relative flex flex-col items-center">
                  
                  {/* Top Pointer Indicator */}
                  <div className="absolute -top-3 z-30 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] animate-bounce">
                    <svg className="w-8 h-8 text-pink-500 fill-pink-500" viewBox="0 0 24 24">
                      <path d="M12 21l-8-12h16z" />
                    </svg>
                  </div>

                  {/* Outer ring with decorative glowing LEDs */}
                  <div className="relative p-3 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-full border border-zinc-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
                    {/* The Wheel itself */}
                    <div 
                      className="w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden relative border-4 border-zinc-950 transition-transform duration-1000"
                      style={{
                        transform: `rotate(${spinRotation}deg)`,
                        transition: isSpinning ? 'transform 4000ms cubic-bezier(0.15, 0.85, 0.15, 1)' : 'transform 500ms ease-out'
                      }}
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
                        {segments.map((seg, i) => {
                          const sliceAngle = 360 / segments.length;
                          const startAngle = i * sliceAngle - 90;
                          const endAngle = (i + 1) * sliceAngle - 90;
                          const startRad = (startAngle * Math.PI) / 180;
                          const endRad = (endAngle * Math.PI) / 180;
                          
                          const x1 = 50 + 50 * Math.cos(startRad);
                          const y1 = 50 + 50 * Math.sin(startRad);
                          const x2 = 50 + 50 * Math.cos(endRad);
                          const y2 = 50 + 50 * Math.sin(endRad);
                          
                          const midAngle = startAngle + sliceAngle / 2;
                          const midRad = (midAngle * Math.PI) / 180;
                          const tx = 50 + 34 * Math.cos(midRad);
                          const ty = 50 + 34 * Math.sin(midRad);
                          
                          return (
                            <g key={i}>
                              <path
                                d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                                fill={seg.color}
                                stroke="#18181b"
                                strokeWidth="0.8"
                              />
                              <text
                                x={tx}
                                y={ty}
                                fill="#ffffff"
                                fontSize="2.8"
                                fontWeight="bold"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                                className="font-sans filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                              >
                                {seg.label.replace(' AP', '')}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Central Glowing Hub with Spin Button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerDailySpin();
                        }}
                        disabled={isSpinning || !(dailySpinState?.canSpin)}
                        className={`pointer-events-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-950 border-4 border-zinc-800 flex flex-col items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:border-pink-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] select-none cursor-pointer ${
                          isSpinning ? 'opacity-90 scale-95' : 'active:scale-95'
                        }`}
                      >
                        <span className="text-[10px] font-black text-zinc-400 tracking-wider uppercase font-mono">
                          {isSpinning ? 'SPINNING' : 'SPIN'}
                        </span>
                        <RotateCw className={`w-4 h-4 text-pink-400 mt-1 ${isSpinning ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Spin Feedback Message */}
                <div className="mt-8 text-center max-w-md min-h-[44px]">
                  {spinResult ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl"
                    >
                      <span className="text-sm font-semibold text-pink-300">
                        🎉 Winning Segment: <strong className="text-white text-base font-black uppercase tracking-wider">{spinResult.label}</strong>
                      </span>
                    </motion.div>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      {isSpinning ? 'May the fortune be with you... 🍀' : 'Click the central SPIN button or any of the controls below to try your luck!'}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Information & Voucher Redemption (5 cols on desktop) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Spin Controls & Status Panel */}
                <div className="bg-zinc-900/30 border border-zinc-800/60 p-6 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" /> Spin Dashboard
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 text-left">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase block">Daily Spins Used</span>
                      <span className="text-lg font-black text-white">{dailySpinState?.spinsToday ?? 0} / {dailySpinState?.dailyLimit ?? 1}</span>
                      <span className="text-[9px] text-zinc-400 mt-1 block">Resets daily at UTC midnight.</span>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 text-left">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase block">Available Extra Spins</span>
                      <span className="text-lg font-black text-pink-400">{dailySpinState?.extraSpins ?? 0} Spins</span>
                      <span className="text-[9px] text-zinc-400 mt-1 block">Earned via redeeming vouchers.</span>
                    </div>
                  </div>

                  {/* Main Trigger Buttons */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={triggerDailySpin}
                      disabled={isSpinning || !(dailySpinState?.canSpin)}
                      className={`w-full py-4 rounded-xl font-extrabold transition-all text-sm flex items-center justify-center gap-2.5 shadow-lg border ${
                        dailySpinState?.canSpin && !isSpinning
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white border-pink-500/20 hover:shadow-pink-500/10 active:scale-[0.98]'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                      {isSpinning ? 'Spinning Wheel...' : (dailySpinState?.spinsToday ?? 0) < (dailySpinState?.dailyLimit ?? 1) ? 'Spin Daily Wheel (FREE)' : 'Spin Using Extra Spin'}
                    </button>
                    
                    {!(dailySpinState?.canSpin) && !isSpinning && (
                      <p className="text-[11px] text-center text-rose-400 font-medium">
                        ⚠️ You have used your free daily spin! Redeem a spin voucher below or use `+redeemvoucher` to spin again.
                      </p>
                    )}
                  </div>
                </div>

                {/* Voucher Redemption Panel */}
                <div className="bg-zinc-900/30 border border-zinc-800/60 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      🎟️ Redeem Spin Vouchers
                    </h3>
                    <span className="text-xs font-mono font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded">
                      {dailySpinState?.spinVouchers ?? 0} Vouchers
                    </span>
                  </div>
                  
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Convert your existing Spin Vouchers into usable Extra Spins. Each Spin Voucher yields exactly **+1 Spin** on the wheel!
                  </p>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        max={dailySpinState?.spinVouchers ?? 1}
                        value={redeemVoucherAmount}
                        onChange={(e) => setRedeemVoucherAmount(e.target.value)}
                        placeholder="Voucher amount..."
                        className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-zinc-600 outline-none transition-all"
                      />
                    </div>
                    
                    <button
                      onClick={handleRedeemVouchersInUI}
                      disabled={isRedeemingVoucher || (dailySpinState?.spinVouchers ?? 0) <= 0}
                      className={`px-5 py-3 rounded-xl font-bold transition-all text-sm shrink-0 active:scale-95 ${
                        (dailySpinState?.spinVouchers ?? 0) > 0
                          ? 'bg-zinc-100 hover:bg-white text-zinc-950'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
                      }`}
                    >
                      {isRedeemingVoucher ? 'Redeeming...' : 'Redeem'}
                    </button>
                  </div>
                  
                  <div className="flex gap-2 justify-start">
                    <button
                      type="button"
                      onClick={() => setRedeemVoucherAmount('1')}
                      className="text-[10px] font-mono font-bold text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded transition-all"
                    >
                      Redeem 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setRedeemVoucherAmount(String(dailySpinState?.spinVouchers ?? 1))}
                      className="text-[10px] font-mono font-bold text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded transition-all"
                    >
                      Redeem All
                    </button>
                  </div>
                  
                  <span className="text-[10px] text-zinc-500 block italic">
                    💡 Tip: You can also use the Discord bot command `+redeemvoucher &lt;amount&gt;` (or `+rv &lt;amount&gt;`) anytime!
                  </span>
                </div>

                {/* Prizes Breakdown Table */}
                <div className="bg-zinc-900/30 border border-zinc-800/60 p-6 rounded-3xl space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    🏆 Wheel Prizes & Probability Odds
                  </h3>
                  
                  <div className="divide-y divide-zinc-800/40 text-xs">
                    <div className="flex justify-between py-2 text-zinc-400 font-mono text-[10px] uppercase font-bold">
                      <span>Prize Reward</span>
                      <span>Chances Level</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">10 AP</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Very High (20.8%)</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">No Reward</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">High (17.3%)</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">50 AP</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">High (15.6%)</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">75 AP</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Medium (13.0%)</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">100 AP</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Medium (10.4%)</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">Spin Again (+1 Spin)</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Medium (10.4%)</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">250 AP</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800/60 text-pink-400">Uncommon (6.9%)</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">500 AP</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/40 text-amber-400">Low (2.6%)</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">+3 Spin Jackpot</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/40 text-rose-400">Very Low (1.7%)</span>
                    </div>

                    <div className="flex justify-between py-2.5 items-center">
                      <span className="font-semibold text-zinc-300">+1000 AP Mega Jackpot</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-yellow-950/40 text-yellow-400 font-extrabold animate-pulse">Ultra Low (0.8%)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        ) : activeGame === 'bank' ? (
          /* AURA BANK & VAULT HEIST DISPLAY */
          <motion.div
            key="bank-heist"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <AuraBankHeist
              playerName={propPlayerName}
              isLoggedIn={isLoggedIn}
              points={points}
              setPoints={setPoints}
              showNotice={showNotice}
              onBack={() => setActiveGame(null)}
              isAdmin={isAdmin}
            />
          </motion.div>
        ) : activeGame === 'tictactoe' ? (
          <motion.div
            key="tictactoe-game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-6 shadow-2xl relative max-w-lg mx-auto"
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3 text-left">
                <button
                  onClick={() => setActiveGame(null)}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-white">Aura Tic-Tac-Toe</h3>
                  <p className="text-xs text-zinc-400">Play against our intelligent robot AI</p>
                </div>
              </div>
              <button
                onClick={resetTtt}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500 hover:bg-cyan-500/10 text-zinc-400 hover:text-cyan-400 transition-all"
                title="Restart Game"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Game Status */}
              <div className="py-2 px-4 rounded-xl bg-zinc-900 border border-zinc-800 inline-block font-mono text-sm">
                {tttWinner === 'X' ? (
                  <span className="text-emerald-400 font-bold">🎉 VICTORY! +15 AP Gained!</span>
                ) : tttWinner === 'O' ? (
                  <span className="text-rose-400 font-bold">💀 DEFEAT! AI Outsmarted You.</span>
                ) : tttWinner === 'draw' ? (
                  <span className="text-yellow-400 font-bold">🤝 DRAW! +5 AP Awarded!</span>
                ) : tttIsAILoading ? (
                  <span className="text-cyan-400 animate-pulse flex items-center gap-2 justify-center">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> AI is thinking...
                  </span>
                ) : (
                  <span className="text-zinc-300">Your Turn (Play as <span className="text-cyan-400 font-bold">X</span>)</span>
                )}
              </div>

              {/* Grid 3x3 */}
              <div className="grid grid-cols-3 gap-3 w-72 h-72 mx-auto mt-4">
                {tttBoard.map((cell, idx) => (
                  <button
                    key={idx}
                    disabled={!!cell || !!tttWinner || tttIsAILoading}
                    onClick={() => handleTttClick(idx)}
                    className={`rounded-2xl border flex items-center justify-center text-4xl font-black font-mono transition-all duration-200 shadow-lg ${
                      cell === 'X'
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 scale-95 shadow-cyan-500/10'
                        : cell === 'O'
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 scale-95 shadow-rose-500/10'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 hover:-translate-y-0.5 active:scale-95'
                    }`}
                  >
                    {cell}
                  </button>
                ))}
              </div>

              <div className="text-xs text-zinc-500 max-w-xs mx-auto pt-2">
                * Note: You must be logged in with Discord to harvest Aura Points rewards for victory/draws.
              </div>
            </div>
          </motion.div>
        ) : activeGame === 'hangman' ? (
          <motion.div
            key="hangman-game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-6 shadow-2xl relative max-w-xl mx-auto"
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3 text-left">
                <button
                  onClick={() => setActiveGame(null)}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-white">Aura Tech Hangman</h3>
                  <p className="text-xs text-zinc-400">Guess tech and programming terminology</p>
                </div>
              </div>
              <button
                onClick={startHangman}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 transition-all"
                title="New Word"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Clue/Hint */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-300 text-sm">
                <span className="font-bold text-amber-400 font-mono text-xs uppercase tracking-wider block mb-1">💡 Clue / Category Hint</span>
                {hangmanHint}
              </div>

              {/* Word Display */}
              <div className="flex justify-center gap-3 flex-wrap py-4">
                {hangmanWord.split('').map((letter, idx) => {
                  const revealed = hangmanGuessed.includes(letter);
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 rounded-xl border flex items-center justify-center text-2xl font-black font-mono transition-all duration-300 ${
                        revealed
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                          : 'bg-zinc-900 border-zinc-800 text-transparent'
                      }`}
                    >
                      {revealed ? letter : '_'}
                    </div>
                  );
                })}
              </div>

              {/* Hearts / Lives */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-mono text-zinc-400 mr-2">Remaining attempts:</span>
                {Array(6).fill(null).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`w-5 h-5 transition-all duration-300 ${
                      idx < hangmanLives
                        ? 'text-rose-500 fill-rose-500 scale-100'
                        : 'text-zinc-800 fill-none scale-90'
                    }`}
                  />
                ))}
              </div>

              {/* Win / Loss Overlay / Status */}
              {isHangmanWon() ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold font-mono text-sm animate-bounce">
                  🏆 VICTORY! Word Solved successfully. +20 AP credited!
                </div>
              ) : hangmanLives <= 0 ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold font-mono text-sm">
                  💀 DEFEATED! The secret word was <span className="underline font-black text-white">{hangmanWord}</span>.
                </div>
              ) : null}

              {/* Alphabet Keyboard */}
              <div className="grid grid-cols-7 gap-2 max-w-md mx-auto">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
                  const guessed = hangmanGuessed.includes(letter);
                  const isCorrect = hangmanWord.includes(letter);
                  return (
                    <button
                      key={letter}
                      disabled={guessed || hangmanLives <= 0 || isHangmanWon()}
                      onClick={() => handleHangmanGuess(letter)}
                      className={`py-2 rounded-lg font-bold font-mono text-sm border transition-all ${
                        guessed
                          ? isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500/50 cursor-not-allowed'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-500/50 cursor-not-allowed'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 active:scale-95'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-zinc-500 max-w-xs mx-auto pt-2">
                * Note: You must be logged in with Discord to harvest Aura Points rewards.
              </div>
            </div>
          </motion.div>
        ) : activeGame === 'scramble' ? (
          <motion.div
            key="scramble-game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-6 shadow-2xl relative max-w-md mx-auto"
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3 text-left">
                <button
                  onClick={() => setActiveGame(null)}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-white">Aura Word Scramble</h3>
                  <p className="text-xs text-zinc-400">Anagram solver for core software terms</p>
                </div>
              </div>
              <button
                onClick={startScramble}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-violet-500 hover:bg-violet-500/10 text-zinc-400 hover:text-violet-400 transition-all"
                title="New Word"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Randomized Scrambled Word */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
                <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest block mb-2">🌪️ Scrambled Characters</span>
                <span className="text-3xl font-black text-white font-mono tracking-widest select-all">{scrambleScrambled}</span>
              </div>

              {/* Clue Hint */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-300 text-sm">
                <span className="font-bold text-violet-400 font-mono text-xs uppercase block mb-1">💡 CLUE HINT</span>
                {scrambleHint}
              </div>

              {/* Feedback */}
              {scrambleFeedback && (
                <div className={`p-3 rounded-xl border text-sm font-bold font-mono ${
                  scrambleSolved
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  {scrambleFeedback}
                </div>
              )}

              {/* Solving Input Form */}
              <div className="space-y-3">
                <input
                  type="text"
                  disabled={scrambleSolved}
                  value={scrambleInput}
                  onChange={(e) => setScrambleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') checkScrambleGuess();
                  }}
                  placeholder="Enter unscrambled word..."
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white font-mono font-bold text-center placeholder:text-zinc-600 outline-none transition-all uppercase"
                />

                <div className="flex gap-2">
                  <button
                    disabled={scrambleSolved}
                    onClick={checkScrambleGuess}
                    className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold transition-all text-sm active:scale-95 shadow-lg shadow-violet-500/10"
                  >
                    Submit Unscrambled
                  </button>
                  <button
                    onClick={startScramble}
                    className="px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95"
                    title="Skip Word"
                  >
                    Skip
                  </button>
                </div>
              </div>

              <div className="text-xs text-zinc-500 max-w-xs mx-auto pt-2">
                * Note: Solve correctly for +15 AP. Requires Discord authentication.
              </div>
            </div>
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
                  <button
                    onClick={() => {
                      if (!isRolling && !slotsRolling) {
                        setActiveCasinoTab('mines');
                        setLastWinMessage(null);
                      }
                    }}
                    disabled={isRolling || slotsRolling}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      activeCasinoTab === 'mines'
                        ? 'bg-zinc-800 text-amber-400 border border-zinc-700/50 shadow'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                    } disabled:opacity-50`}
                  >
                    💣 Mines Sweeper
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

                {/* Tab content 3: Mines */}
                {activeCasinoTab === 'mines' && (
                  <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col md:flex-row gap-8 items-stretch relative overflow-hidden">
                    {/* Left: Interactive Grid */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-pink-500 font-bold">5x5 Minefield</span>
                        <h4 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                          💣 Mines Sweeper
                        </h4>
                      </div>

                      {/* 5x5 Grid */}
                      <div className="grid grid-cols-5 gap-3 w-full max-w-[340px] aspect-square p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-inner">
                        {Array(25).fill(null).map((_, idx) => {
                          const isRevealed = minesRevealed[idx];
                          const cellType = minesGrid[idx];
                          return (
                            <button
                              key={idx}
                              onClick={() => revealMinesTile(idx)}
                              disabled={!minesActive || isRevealed || minesLoading}
                              className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-bold select-none transition-all duration-150 relative overflow-hidden ${
                                isRevealed
                                  ? cellType === 'mine'
                                    ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-500'
                                    : cellType === 'gem'
                                      ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                      : 'bg-zinc-800/80 border border-zinc-700 text-zinc-500'
                                  : 'bg-zinc-800 hover:bg-zinc-700 active:scale-95 shadow-md border border-zinc-700/50 cursor-pointer'
                              } disabled:cursor-not-allowed`}
                            >
                              {isRevealed ? (
                                cellType === 'mine' ? (
                                  '💣'
                                ) : cellType === 'gem' ? (
                                  '💎'
                                ) : (
                                  ''
                                )
                              ) : minesActive ? (
                                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800/10 to-zinc-700/30 hover:to-zinc-600/30" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {minesResultMsg && (
                        <div className={`py-2 px-4 rounded-xl text-xs font-bold ${minesResultMsg.includes('Hit') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {minesResultMsg}
                        </div>
                      )}
                    </div>

                    {/* Right: Settings and actions panel */}
                    <div className="w-full md:w-[240px] flex flex-col justify-between p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/80 space-y-6">
                      <div className="space-y-4">
                        {/* Wager Input */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 font-bold block">Wager Amount</label>
                          <input
                            type="number"
                            min="5"
                            disabled={minesActive || minesLoading}
                            value={minesBet}
                            onChange={(e) => setMinesBet(e.target.value)}
                            placeholder="Wager AP"
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-pink-500 disabled:opacity-50 text-center text-sm"
                          />
                        </div>

                        {/* Mines Count */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 font-bold">Mines Count</label>
                            <span className="text-xs font-mono font-bold text-pink-500">{minesCount} 💣</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="24"
                            disabled={minesActive || minesLoading}
                            value={minesCount}
                            onChange={(e) => setMinesCount(Number(e.target.value))}
                            className="w-full accent-pink-500 disabled:opacity-50"
                          />
                        </div>

                        {/* Multiplier / Next Multiplier */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/60 text-center">
                            <div className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Multiplier</div>
                            <div className="text-sm font-black font-mono text-emerald-400">{minesMultiplier.toFixed(2)}x</div>
                          </div>
                          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/60 text-center">
                            <div className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Next Tile</div>
                            <div className="text-sm font-black font-mono text-zinc-400">
                              {minesActive ? `${minesNextMultiplier.toFixed(2)}x` : '--'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA Buttons */}
                      <div className="space-y-2.5">
                        {!minesActive ? (
                          <button
                            onClick={startMinesGame}
                            disabled={minesLoading || !isLoggedIn}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg active:scale-98 animate-pulse"
                          >
                            {minesLoading ? (
                              <RotateCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              `Bet ${Math.floor(Number(minesBet) || 0)} AP`
                            )}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-center text-[10px] font-mono text-emerald-400 font-bold mb-1 animate-pulse">
                              Pending Cashout: {Math.floor(Number(minesBet) * minesMultiplier)} AP
                            </div>
                            <button
                              onClick={cashoutMinesGame}
                              disabled={minesLoading || minesMultiplier <= 1.0}
                              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg active:scale-98"
                            >
                              Cash Out
                            </button>
                          </div>
                        )}
                      </div>
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
