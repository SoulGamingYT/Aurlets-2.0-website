import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, Coins, ShieldAlert, Sparkles, Trophy } from 'lucide-react';

interface Card {
  value: number;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  label: string;
}

interface HigherLowerProps {
  playerName: string;
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  showNotice?: (msg: string, type: 'success' | 'error') => void;
  onBack: () => void;
}

const SUIT_EMOJIS = {
  hearts: '♥️',
  diamonds: '♦️',
  clubs: '♣️',
  spades: '♠️'
};

const SUIT_COLORS = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-zinc-300',
  spades: 'text-zinc-300'
};

export default function HigherLower({
  playerName,
  points,
  setPoints,
  showNotice,
  onBack
}: HigherLowerProps) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'success'>('idle');
  const [streak, setStreak] = useState<number>(0);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [history, setHistory] = useState<Card[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const generateCard = (): Card => {
    const value = Math.floor(Math.random() * 13) + 1; // 1 to 13 (1 is Ace, 11 Jack, 12 Queen, 13 King)
    const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = ['hearts', 'diamonds', 'clubs', 'spades'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    
    let label = value.toString();
    if (value === 1) label = 'A';
    else if (value === 11) label = 'J';
    else if (value === 12) label = 'Q';
    else if (value === 13) label = 'K';

    return { value, suit, label };
  };

  const getMultiplier = (currentStreak: number) => {
    if (currentStreak === 0) return 1.0;
    // Multipliers grow with streak
    return parseFloat((1.0 + currentStreak * 0.5).toFixed(1));
  };

  const handleStartGame = async () => {
    if (points < betAmount) {
      showNotice?.('You do not have enough Aura Points for this bet!', 'error');
      return;
    }
    if (betAmount <= 0) {
      showNotice?.('Bet amount must be greater than 0!', 'error');
      return;
    }

    try {
      // Deduct bet amount
      const res = await fetch('/api/points/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: playerName, amount: betAmount })
      });
      
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points);
        const card1 = generateCard();
        setCurrentCard(card1);
        setHistory([card1]);
        setStreak(0);
        setGameState('playing');
        showNotice?.('Game started! Guess if the next card is higher or lower.', 'success');
      } else {
        const data = await res.json();
        showNotice?.(data.error || 'Failed to start game.', 'error');
      }
    } catch (err) {
      showNotice?.('Network error starting game.', 'error');
    }
  };

  const handleGuess = async (direction: 'higher' | 'lower') => {
    if (isProcessing || !currentCard) return;
    setIsProcessing(true);

    const nextCard = generateCard();
    const isCorrect = direction === 'higher' 
      ? nextCard.value >= currentCard.value 
      : nextCard.value <= currentCard.value;

    setHistory(prev => [...prev, nextCard]);
    setCurrentCard(nextCard);

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      showNotice?.(`Correct! Current streak: ${nextStreak} (Multiplier: ${getMultiplier(nextStreak)}x)`, 'success');
      setIsProcessing(false);
    } else {
      setGameState('gameover');
      showNotice?.('Wrong guess! You lost your bet.', 'error');
      setIsProcessing(false);
    }
  };

  const handleCashOut = async () => {
    if (gameState !== 'playing' || streak === 0) return;
    setIsProcessing(true);

    const mult = getMultiplier(streak);
    const winAmount = Math.floor(betAmount * mult);

    try {
      const res = await fetch('/api/points/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: playerName, amount: winAmount })
      });

      if (res.ok) {
        const data = await res.json();
        setPoints(data.points);
        setGameState('success');
        showNotice?.(`Cashed out successfully! Won ${winAmount} AP!`, 'success');
      } else {
        showNotice?.('Failed to cash out winnings.', 'error');
      }
    } catch {
      showNotice?.('Network error cashing out.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetGame = () => {
    setGameState('idle');
    setStreak(0);
    setCurrentCard(null);
    setHistory([]);
  };

  return (
    <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-left">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400 animate-pulse" /> Higher or Lower
            </h2>
            <p className="text-xs text-zinc-500">Test your instincts and build massive win multipliers!</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <Coins className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold text-zinc-300">Wallet: {points} AP</span>
        </div>
      </div>

      {gameState === 'idle' && (
        <div className="max-w-md mx-auto text-center space-y-6 py-6">
          <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 space-y-3.5">
            <div className="flex justify-center">
              <span className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
                <Sparkles className="w-6 h-6" />
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Wager Your Points</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We draw a random card. Guess if the next drawn card is higher or lower. Each correct guess adds **0.5x** multiplier to your win rate. Cash out anytime to claim your AP!
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">Enter Bet Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors pl-10"
                />
                <Coins className="w-4.5 h-4.5 text-zinc-500 absolute left-3.5 top-3.5" />
              </div>
              <div className="flex gap-2">
                {[50, 100, 250, 500, 1000].map(val => (
                  <button
                    key={val}
                    onClick={() => setBetAmount(val)}
                    className="flex-1 py-1 px-2 text-[10px] font-mono font-bold rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-950/30 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> Deal Cards & Start
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && currentCard && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6">
          {/* Card Showcase */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-44 h-64 bg-zinc-900 border-2 border-purple-500/30 rounded-2xl shadow-2xl flex flex-col justify-between p-4 bg-gradient-to-br from-zinc-900 to-zinc-950">
              <div className="flex justify-between items-start">
                <span className={`text-xl font-black font-mono leading-none`}>{currentCard.label}</span>
                <span className={`text-xl ${SUIT_COLORS[currentCard.suit]}`}>{SUIT_EMOJIS[currentCard.suit]}</span>
              </div>
              
              <div className="text-center">
                <span className={`text-5xl ${SUIT_COLORS[currentCard.suit]}`}>{SUIT_EMOJIS[currentCard.suit]}</span>
              </div>

              <div className="flex justify-between items-end rotate-180">
                <span className={`text-xl font-black font-mono leading-none`}>{currentCard.label}</span>
                <span className={`text-xl ${SUIT_COLORS[currentCard.suit]}`}>{SUIT_EMOJIS[currentCard.suit]}</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Active Card</div>
              <h4 className="text-sm font-bold text-white capitalize">{currentCard.label} of {currentCard.suit}</h4>
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-6 text-left">
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Current Streak</div>
                  <div className="text-lg font-black text-white">{streak} correct</div>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <div className="text-[9px] text-purple-400 uppercase tracking-wider font-mono">Multiplier</div>
                  <div className="text-lg font-black text-purple-300">{getMultiplier(streak)}x</div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex justify-between items-center text-xs">
                <span className="text-zinc-500">Potential Winnings:</span>
                <span className="font-bold text-emerald-400 font-mono">{Math.floor(betAmount * getMultiplier(streak))} AP</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleGuess('higher')}
                  disabled={isProcessing}
                  className="py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  🔼 Higher / Equal
                </button>
                <button
                  onClick={() => handleGuess('lower')}
                  disabled={isProcessing}
                  className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  🔽 Lower / Equal
                </button>
              </div>

              {streak > 0 && (
                <button
                  onClick={handleCashOut}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 animate-bounce"
                >
                  💰 Cash Out ({Math.floor(betAmount * getMultiplier(streak))} AP)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {(gameState === 'gameover' || gameState === 'success') && (
        <div className="max-w-md mx-auto text-center space-y-6 py-6">
          <div className={`p-6 rounded-2xl border ${
            gameState === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          } space-y-4`}>
            <span className="text-3xl inline-block">
              {gameState === 'success' ? '🎉' : '💀'}
            </span>
            <h3 className="text-lg font-black text-white">
              {gameState === 'success' ? 'Successful Cashout!' : 'Game Over!'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {gameState === 'success' 
                ? `You successfully pocketed **${Math.floor(betAmount * getMultiplier(streak))} Aura Points** with a **${streak}** card win-streak!` 
                : `You guessed incorrectly on the cards. Better luck next time!`
              }
            </p>
          </div>

          <button
            onClick={resetGame}
            className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
