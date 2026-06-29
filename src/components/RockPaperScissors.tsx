import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Coins, Award, HelpCircle } from 'lucide-react';

interface RockPaperScissorsProps {
  playerName: string;
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  showNotice?: (msg: string, type: 'success' | 'error') => void;
  onBack: () => void;
}

type Choice = 'rock' | 'paper' | 'scissors';
type GameResult = 'win' | 'lose' | 'tie' | null;

const CHOICE_DETAILS = {
  rock: { emoji: '✊', name: 'Rock', color: 'from-amber-500 to-orange-600', border: 'border-amber-500/30' },
  paper: { emoji: '✋', name: 'Paper', color: 'from-blue-500 to-indigo-600', border: 'border-blue-500/30' },
  scissors: { emoji: '✌️', name: 'Scissors', color: 'from-pink-500 to-rose-600', border: 'border-pink-500/30' }
};

export default function RockPaperScissors({
  playerName,
  points,
  setPoints,
  showNotice,
  onBack
}: RockPaperScissorsProps) {
  const [betAmount, setBetAmount] = useState<number>(50);
  const [gameState, setGameState] = useState<'idle' | 'fighting' | 'resolved'>('idle');
  const [userChoice, setUserChoice] = useState<Choice | null>(null);
  const [botChoice, setBotChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<GameResult>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handlePlay = async (choice: Choice) => {
    if (points < betAmount) {
      showNotice?.('You do not have enough Aura Points for this bet!', 'error');
      return;
    }
    if (betAmount <= 0) {
      showNotice?.('Bet amount must be greater than 0!', 'error');
      return;
    }

    setIsProcessing(true);
    setUserChoice(choice);
    setGameState('fighting');

    try {
      // Deduct bet amount
      const deductRes = await fetch('/api/points/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: playerName, amount: betAmount })
      });

      if (!deductRes.ok) {
        const errData = await deductRes.json();
        showNotice?.(errData.error || 'Failed to process bet.', 'error');
        setGameState('idle');
        setIsProcessing(false);
        return;
      }

      const deductData = await deductRes.json();
      setPoints(deductData.points);

      // Animation delay for dramatic effect
      setTimeout(async () => {
        const choices: Choice[] = ['rock', 'paper', 'scissors'];
        const randomBotChoice = choices[Math.floor(Math.random() * choices.length)];
        setBotChoice(randomBotChoice);

        let finalResult: GameResult = 'tie';
        if (choice === randomBotChoice) {
          finalResult = 'tie';
        } else if (
          (choice === 'rock' && randomBotChoice === 'scissors') ||
          (choice === 'paper' && randomBotChoice === 'rock') ||
          (choice === 'scissors' && randomBotChoice === 'paper')
        ) {
          finalResult = 'win';
        } else {
          finalResult = 'lose';
        }

        setResult(finalResult);
        setGameState('resolved');

        if (finalResult === 'win') {
          const winAmount = betAmount * 2;
          const addRes = await fetch('/api/points/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: playerName, amount: winAmount })
          });
          if (addRes.ok) {
            const addData = await addRes.json();
            setPoints(addData.points);
          }
          showNotice?.(`You Won! Earned ${winAmount} AP!`, 'success');
        } else if (finalResult === 'tie') {
          // Refund
          const refundRes = await fetch('/api/points/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: playerName, amount: betAmount })
          });
          if (refundRes.ok) {
            const refundData = await refundRes.json();
            setPoints(refundData.points);
          }
          showNotice?.('It is a Draw! Bet refunded.', 'success');
        } else {
          showNotice?.('Aura Bot won. Try again!', 'error');
        }

        setIsProcessing(false);
      }, 1500);

    } catch (err) {
      showNotice?.('Network error occurred.', 'error');
      setGameState('idle');
      setIsProcessing(false);
    }
  };

  const handlePlayAgain = () => {
    setGameState('idle');
    setUserChoice(null);
    setBotChoice(null);
    setResult(null);
  };

  return (
    <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

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
              ✊ RPS vs Aura Bot
            </h2>
            <p className="text-xs text-zinc-500">Fast action double-or-nothing game!</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-zinc-300">Wallet: {points} AP</span>
        </div>
      </div>

      {gameState === 'idle' && (
        <div className="max-w-md mx-auto text-center space-y-6 py-6">
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">Enter Bet Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-blue-500 transition-colors pl-10"
                />
                <Coins className="w-4.5 h-4.5 text-zinc-500 absolute left-3.5 top-3.5" />
              </div>
              <div className="flex gap-2">
                {[10, 50, 100, 250, 500].map(val => (
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

            <div className="border border-zinc-900 rounded-2xl p-4 bg-zinc-950 text-center space-y-1">
              <h4 className="text-xs font-bold text-zinc-400">Select Your Fighter</h4>
              <p className="text-[10px] text-zinc-500">Wins pay out **2.0x** double. Ties are refunded!</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['rock', 'paper', 'scissors'] as Choice[]).map(choice => {
                const det = CHOICE_DETAILS[choice];
                return (
                  <button
                    key={choice}
                    onClick={() => handlePlay(choice)}
                    className="flex flex-col items-center justify-center p-6 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl hover:bg-zinc-850/80 transition-all active:scale-95 group space-y-2"
                  >
                    <span className="text-4xl group-hover:scale-110 transition-transform">{det.emoji}</span>
                    <span className="text-xs font-bold text-zinc-300">{det.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {gameState === 'fighting' && userChoice && (
        <div className="max-w-md mx-auto text-center space-y-8 py-8">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl animate-bounce">
                {CHOICE_DETAILS[userChoice].emoji}
              </div>
              <span className="text-xs text-zinc-400">You</span>
            </div>

            <div className="text-xl font-mono text-zinc-600 font-black animate-pulse">VS</div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>
                ❓
              </div>
              <span className="text-xs text-zinc-400">Aura Bot</span>
            </div>
          </div>

          <p className="text-sm text-purple-400 font-medium tracking-wide animate-pulse">Aura Bot is deciding...</p>
        </div>
      )}

      {gameState === 'resolved' && userChoice && botChoice && (
        <div className="max-w-md mx-auto text-center space-y-8 py-6">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl shadow-xl">
                {CHOICE_DETAILS[userChoice].emoji}
              </div>
              <span className="text-xs font-bold text-zinc-400 capitalize">You ({CHOICE_DETAILS[userChoice].name})</span>
            </div>

            <div className="text-sm font-mono text-zinc-600 font-bold">vs</div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl shadow-xl">
                {CHOICE_DETAILS[botChoice].emoji}
              </div>
              <span className="text-xs font-bold text-zinc-400 capitalize">Bot ({CHOICE_DETAILS[botChoice].name})</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${
            result === 'win' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : result === 'tie'
                ? 'bg-zinc-850 border-zinc-800 text-zinc-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
          } space-y-1`}>
            <h3 className="text-lg font-black uppercase tracking-wider">
              {result === 'win' ? 'Victory! 🎉' : result === 'tie' ? 'Tie Draw' : 'Defeat'}
            </h3>
            <p className="text-xs text-zinc-400">
              {result === 'win' 
                ? `Incredible! You defeated Aura Bot and won ${betAmount * 2} AP!` 
                : result === 'tie'
                  ? 'It is a clean tie! Your wager is safe and refunded.'
                  : 'Aura Bot outplayed you! Try again to reclaim your AP!'
              }
            </p>
          </div>

          <button
            onClick={handlePlayAgain}
            className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
