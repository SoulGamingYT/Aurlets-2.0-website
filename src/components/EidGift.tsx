import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EID_LETTERS, EID_PASSWORDS } from '../data';
import { Mail, Unlock, Lock, Play, Pause, RefreshCw, Star, Heart, ArrowLeft, Volume2, Sparkles } from 'lucide-react';

export default function EidGift() {
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [password, setPassword] = useState<string>('');
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [scratchProgress, setScratchProgress] = useState<number>(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Envelope recipients list based on the original structure
  const recipients = [
    { id: 'queenz', label: '💌 Queenz' },
    { id: 'peanut', label: '💌 Peanutliver' },
    { id: 'masab', label: '💌 Masab' },
    { id: 'ibbi', label: '💌 Ibbi' },
    { id: 'palindrome', label: '💌 Palindrome' },
    { id: 'brooks', label: '💌 Brooks' },
    { id: 'bipolar', label: '💌 Bipolar Disorder' },
    { id: 'maki', label: '💌 Maki' },
    { id: 'shino', label: '💌 Shino & Mustafa' },
    { id: 'malu', label: '💌 Malu & Lilly' },
    { id: 'hajji', label: '💌 Hajji' },
    { id: 'allama', label: '💌 Allama' },
    { id: 'cipher', label: '💌 Cipher' },
    { id: 'fari', label: '💌 Fari' },
    { id: 'kole', label: '💌 Kole' },
    { id: 'mahi', label: '💌 Mahi' },
    { id: 'merited', label: '💌 Merited' },
    { id: 'brzrkr', label: '💌 Brzrkr' },
    { id: 'everyone', label: '💌 For Everyone From Aurlets Management! 💜' }
  ];

  const handleSelectPerson = (id: string) => {
    setSelectedPerson(id);
    setPassword('');
    setUnlocked(false);
    setErrorMsg('');
    setScratchProgress(0);
    
    // Automatically unlock if there is no password
    if (EID_PASSWORDS[id] === '') {
      setUnlocked(true);
    }
  };

  const checkPassword = () => {
    if (!selectedPerson) return;
    const requiredPass = EID_PASSWORDS[selectedPerson];
    
    if (password.toLowerCase() === requiredPass.toLowerCase()) {
      setUnlocked(true);
      setErrorMsg('');
      // Play a happy soft sound if needed, or trigger background music
      toggleMusic(true);
    } else {
      setErrorMsg('Wrong code 👀 - Keep trying or ask Ded Inside!');
    }
  };

  const toggleMusic = (forceValue?: boolean) => {
    if (audioRef.current) {
      const nextState = forceValue !== undefined ? forceValue : !isPlayingMusic;
      if (nextState) {
        audioRef.current.play().then(() => {
          setIsPlayingMusic(true);
        }).catch((err) => {
          console.warn('Audio play blocked:', err.message);
        });
      } else {
        audioRef.current.pause();
        setIsPlayingMusic(false);
      }
    }
  };

  // Canvas Scratch Card Implementation (as requested by original eid.html scratch effect)
  useEffect(() => {
    if (unlocked && canvasRef.current && selectedPerson) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Adjust for high resolution
      canvas.width = 400;
      canvas.height = 200;

      // Fill background (scratchable color)
      ctx.fillStyle = '#1e1b4b'; // dark blue/indigo scratch
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add a sparkly pattern / text on top of scratch card
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨ SCRATCH ME TO REVEAL ✨', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText('Drag cursor / touch to wipe off the envelope', canvas.width / 2, canvas.height / 2 + 15);

      const scratch = (e: any) => {
        const rect = canvas.getBoundingClientRect();
        // Support mouse and touch safely
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);
        
        if (!clientX || !clientY) return;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();

        // Calculate progress roughly
        setScratchProgress((prev) => Math.min(prev + 0.5, 100));
      };

      let isScratching = false;

      const handleStart = (e: any) => {
        isScratching = true;
        scratch(e);
      };

      const handleMove = (e: any) => {
        if (!isScratching) return;
        scratch(e);
      };

      const handleEnd = () => {
        isScratching = false;
      };

      canvas.addEventListener('mousedown', handleStart);
      canvas.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);

      canvas.addEventListener('touchstart', handleStart);
      canvas.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);

      return () => {
        canvas.removeEventListener('mousedown', handleStart);
        canvas.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        canvas.removeEventListener('touchstart', handleStart);
        canvas.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [unlocked, selectedPerson]);

  return (
    <div className="space-y-8 pb-12">
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        loop 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" // Royalty free beautiful classical background tracks
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
            🌙 Aurlets Eid Letters <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
          </h2>
          <p className="text-zinc-400 text-sm">
            Made with ❤️ by <span className="text-purple-400 font-semibold">@ded_inside13</span> • Aurlets Exclusive Letters ✨
          </p>
        </div>

        {/* Music Player Bar */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-center">
          <Volume2 className="w-4 h-4 text-pink-400 animate-pulse" />
          <span className="text-xs text-zinc-400 font-mono">Ambient Vibe:</span>
          <button
            onClick={() => toggleMusic()}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center justify-center"
          >
            {isPlayingMusic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedPerson ? (
          /* Recipient Selector Grid */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="text-center py-6 bg-zinc-900/10 border border-zinc-800/50 rounded-2xl">
              <p className="text-zinc-300 italic text-base">"Choose your envelope to read the personal letter written inside..."</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {recipients.map((rec) => (
                <motion.div
                  key={rec.id}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPerson(rec.id)}
                  className={`p-6 rounded-2xl cursor-pointer text-center font-semibold transition-all shadow-lg border ${
                    rec.id === 'everyone'
                      ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-purple-500/30 hover:border-purple-500/60 text-white'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-pink-500/30 text-zinc-200 hover:text-white'
                  }`}
                >
                  <Mail className="w-8 h-8 mx-auto mb-3 text-pink-400 opacity-80" />
                  <span className="text-sm font-sans tracking-wide">{rec.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Single Recipient View (Password check & scratch reveal & letter rendering) */
          <motion.div
            key="letter"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            {/* Back Button */}
            <button
              onClick={() => setSelectedPerson(null)}
              className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-2 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Envelopes
            </button>

            {/* Recipient Header Info */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 text-center space-y-2">
              <span className="text-xs font-mono text-pink-400 uppercase tracking-widest font-bold">Selected Envelope</span>
              <h3 className="text-2xl font-extrabold text-white">
                {recipients.find((r) => r.id === selectedPerson)?.label}
              </h3>
            </div>

            {/* Password Verification View */}
            {!unlocked && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-6 shadow-xl max-w-md mx-auto"
              >
                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 mx-auto">
                  <Lock className="w-5 h-5 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white">Enter Envelope Passcode</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    To open this private Eid Letter, please enter your dedicated Eid code given by Ded Inside.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter code (e.g., moti, elahi, nibbi)"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-center text-white focus:outline-none focus:border-pink-500 font-mono placeholder:text-zinc-600"
                    onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
                  />
                  {errorMsg && (
                    <p className="text-xs text-rose-400 font-semibold animate-shake">{errorMsg}</p>
                  )}
                  <button
                    onClick={checkPassword}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold transition-all text-sm shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" /> Open Envelope
                  </button>
                </div>
              </motion.div>
            )}

            {/* Unlocked & Scratch revealing state */}
            {unlocked && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Scratchable Canvas Card (Show only if not fully scratched) */}
                {scratchProgress < 85 && selectedPerson !== 'everyone' && (
                  <div className="flex flex-col items-center justify-center p-6 bg-zinc-950/40 border border-zinc-800 rounded-2xl shadow-xl max-w-md mx-auto space-y-4">
                    <div className="relative rounded-xl overflow-hidden cursor-crosshair border border-pink-500/30 shadow-lg">
                      <canvas ref={canvasRef} className="block max-w-full" />
                      {/* Hidden content that scratching reveals underneath */}
                      <div className="absolute inset-0 z-[-1] flex flex-col items-center justify-center bg-zinc-900 text-center p-4">
                        <Heart className="w-12 h-12 text-pink-500 animate-pulse mb-2" />
                        <span className="text-sm font-bold text-white font-mono">Wiping Envelope...</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                      <span>Wiped: {Math.round(scratchProgress)}%</span>
                      <button 
                        onClick={() => setScratchProgress(100)} 
                        className="text-pink-400 hover:underline font-bold"
                      >
                        Skip Scratching
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Rendered Letter */}
                {(scratchProgress >= 85 || selectedPerson === 'everyone') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 md:p-12 rounded-3xl bg-radial from-slate-900 via-zinc-950 to-black border border-zinc-800/80 shadow-2xl relative"
                  >
                    {/* Retro Stamp Style Deco */}
                    <div className="absolute top-6 right-6 w-16 h-16 border-2 border-dashed border-pink-500/20 rounded-lg flex items-center justify-center text-pink-500/20 rotate-12 select-none pointer-events-none font-bold text-xs uppercase text-center leading-none">
                      Eid<br/>Mubarak
                    </div>

                    <div className="space-y-8 max-w-2xl mx-auto">
                      <div className="space-y-4">
                        {/* Letter Icon & Theme */}
                        <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 mb-2">
                          <Heart className="w-5 h-5 fill-pink-400/20" />
                        </div>
                      </div>

                      {/* Handwritten Letter Text */}
                      <div className="text-zinc-100 font-serif leading-loose text-base md:text-lg whitespace-pre-wrap tracking-wide text-justify italic font-medium p-2 selection:bg-pink-500/30">
                        {EID_LETTERS[selectedPerson]}
                      </div>

                      {/* Footer signatures */}
                      <div className="border-t border-zinc-800/60 pt-6 flex flex-wrap justify-between items-center text-xs text-zinc-500">
                        <span>Aurlets Exclusive • Powered by Love 💜</span>
                        <button
                          onClick={() => {
                            setScratchProgress(0);
                            if (selectedPerson !== 'everyone') setUnlocked(false);
                          }}
                          className="text-pink-400 hover:underline font-bold flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Seal Envelope Again
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
