import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, HelpCircle, ArrowLeft, RefreshCw, Grid, Upload, Check, AlertCircle, Image as ImageIcon, Sparkles, Trophy, Link2 } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface SlidePuzzleProps {
  playerName: string;
  isLoggedIn: boolean;
  points: number;
  setPoints?: React.Dispatch<React.SetStateAction<number>>;
  showNotice?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onBack: () => void;
}

interface PuzzleImage {
  id: string;
  url: string;
  uploadedBy: string;
  approved: boolean;
  createdAt: number;
}

export default function SlidePuzzle({
  playerName,
  isLoggedIn,
  points,
  setPoints,
  showNotice,
  onBack
}: SlidePuzzleProps) {
  const [gridSize, setGridSize] = useState<3 | 4 | 5>(3);
  const [images, setImages] = useState<PuzzleImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<PuzzleImage | null>(null);
  
  // Gameplay states
  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moves, setMoves] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [withHints, setWithHints] = useState(true);
  const [playedCount, setPlayedCount] = useState<number>(0);

  // Fetch played count
  useEffect(() => {
    if (playerName) {
      fetch(`/api/user/sync?name=${encodeURIComponent(playerName)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.farmer) {
            const count = data.farmer.gamesPlayed?.['slide_puzzle'] || 0;
            setPlayedCount(count);
          }
        })
        .catch(err => console.error(err));
    }
  }, [playerName, isSolved]);

  // Upload/Deposit states
  const [subType, setSubType] = useState<'url' | 'file'>('url');
  const [depositUrl, setDepositUrl] = useState('');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch approved puzzle images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch('/api/puzzle/images');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setImages(data);
            setSelectedImage(data[0]);
          } else {
            setImages([]);
            setSelectedImage(null);
          }
        } else {
          setImages([]);
          setSelectedImage(null);
        }
      } catch (err) {
        console.error('Error fetching puzzle images:', err);
        setImages([]);
        setSelectedImage(null);
      }
    };
    fetchImages();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 2.5MB
    if (file.size > 2.5 * 1024 * 1024) {
      if (showNotice) {
        showNotice('⚠️ Image size must be smaller than 2.5MB.', 'error');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFileBase64(base64);
      setFileName(file.name);
    };
    reader.onerror = (err) => {
      console.error(err);
      if (showNotice) {
        showNotice('Error reading image file.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Initialize and shuffle puzzle
  const handleStartGame = () => {
    if (!selectedImage) return;

    const totalTiles = gridSize * gridSize;
    const initialTiles = Array.from({ length: totalTiles }, (_, i) => i);

    // Fisher-Yates Shuffle that guarantees the board is NOT in solved state initially
    let shuffled = [...initialTiles];
    let attempts = 0;
    
    do {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      attempts++;
    } while (
      shuffled.every((tile, index) => tile === index) && 
      attempts < 100
    );

    setTiles(shuffled);
    setSelectedTileIndex(null);
    setIsSolved(false);
    setMoves(0);
    setIsPlaying(true);
  };

  // Click handler for tiles
  const handleTileClick = async (clickedIndex: number) => {
    if (isSolved || !isPlaying) return;

    if (selectedTileIndex === null) {
      setSelectedTileIndex(clickedIndex);
    } else if (selectedTileIndex === clickedIndex) {
      setSelectedTileIndex(null); // Deselect
    } else {
      // Perform Swap!
      const nextTiles = [...tiles];
      const temp = nextTiles[selectedTileIndex];
      nextTiles[selectedTileIndex] = nextTiles[clickedIndex];
      nextTiles[clickedIndex] = temp;

      setTiles(nextTiles);
      setSelectedTileIndex(null);
      setMoves(prev => prev + 1);

      // Check if solved
      const solved = nextTiles.every((tile, index) => tile === index);
      if (solved) {
        setIsSolved(true);
        setIsPlaying(false);

        // Determine expected rewards
        let baseRewards = 10;
        if (gridSize === 4) baseRewards = 20;
        if (gridSize === 5) baseRewards = 30;
        const rewards = withHints ? baseRewards : baseRewards * 2;
        setRewardPoints(rewards);

        // Award points on the server database
        try {
          const res = await fetch('/api/puzzle/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playerName, gridSize, withHints })
          });
          if (res.ok) {
            const data = await res.json();
            const actualReward = typeof data.rewardPoints === 'number' ? data.rewardPoints : rewards;
            setRewardPoints(actualReward);

            if (setPoints) {
              setPoints(data.newPoints || (points + actualReward));
            }
            if (showNotice) {
              if (actualReward === 0) {
                showNotice(data.message || `Level reward limit reached! You have already earned rewards for this difficulty 5 times.`, 'info');
              } else {
                showNotice(`🎉 Puzzle Solved! Gained +${actualReward} Aura Points!`, 'success');
              }
            }
          } else {
            // Client-side fallback if server fails
            if (setPoints) setPoints(prev => prev + rewards);
            if (showNotice) showNotice(`🎉 Puzzle Solved! Gained +${rewards} Aura Points!`, 'success');
          }
        } catch (err) {
          console.error('Error claiming puzzle points:', err);
          if (setPoints) setPoints(prev => prev + rewards);
        }
      }
    }
  };

  // Submit/Deposit an image for admin approval
  const handleDepositImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalUrl = '';
    if (subType === 'url') {
      if (!depositUrl.trim()) return;
      finalUrl = depositUrl.trim();
    } else {
      if (!fileBase64) {
        if (showNotice) showNotice('⚠️ Please select an image file to upload first.', 'error');
        return;
      }
      finalUrl = fileBase64;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/puzzle/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, name: playerName })
      });

      if (res.ok) {
        if (showNotice) {
          showNotice('✅ Image deposited successfully! Pending Administrator approval.', 'success');
        }
        setDepositUrl('');
        setFileBase64('');
        setFileName('');
        const fileInput = document.getElementById('puzzle-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const data = await res.json();
        if (showNotice) {
          showNotice(data.error || 'Failed to submit image.', 'error');
        }
      }
    } catch (err) {
      console.error('Error depositing image:', err);
      if (showNotice) {
        showNotice('Network error submitting puzzle image.', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="slide-puzzle-container" className="space-y-6 text-left relative">
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all text-xs font-mono font-bold mb-2 group active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Arcade
          </button>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            🧩 Slide Puzzle Arena
          </h2>
          <p className="text-xs text-zinc-400">
            Swap puzzle tiles to reconstruct beautiful images. High-tier grids reward more Aura Points!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const link = `${window.location.origin}${window.location.pathname}?game=puzzle`;
              navigator.clipboard.writeText(link)
                .then(() => {
                  showNotice?.('Slide Puzzle invite link copied to clipboard! 🔗', 'success');
                })
                .catch(() => {
                  showNotice?.('Failed to copy invite link.', 'error');
                });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 hover:text-white text-xs font-bold transition-all"
          >
            <Link2 className="w-4 h-4" />
            Invite Link
          </button>
          <button
            onClick={() => setShowRules(!showRules)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all"
          >
            <HelpCircle className="w-4 h-4 text-purple-400" />
            {showRules ? 'Hide Rules' : 'Game Rules'}
          </button>
        </div>
      </div>

      {/* Rules Slide-out panel */}
      {showRules && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200 leading-relaxed space-y-2 shadow-xl"
        >
          <h3 className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> How to Play & Reward Guide
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li>Choose a beautiful approved image from the gallery.</li>
            <li>Select your challenge grid difficulty:
              <ul className="list-circle pl-5 mt-1 space-y-0.5 text-zinc-400">
                <li><strong className="text-purple-300">3x3 Grid</strong> — Shuffled into 9 tiles. Rewards <strong className="text-amber-400">+10 Aura Points (AP)</strong> on solve.</li>
                <li><strong className="text-purple-300">4x4 Grid</strong> — Shuffled into 16 tiles. Rewards <strong className="text-amber-400">+20 Aura Points (AP)</strong> on solve.</li>
                <li><strong className="text-purple-300">5x5 Grid</strong> — Shuffled into 25 tiles. Rewards <strong className="text-amber-400">+30 Aura Points (AP)</strong> on solve.</li>
              </ul>
            </li>
            <li><strong>Interactive Swap Mechanic:</strong> Click on one piece, then click on any other piece to swap their positions.</li>
            <li>Rearrange the tiles until the full image is reconstructed in perfect order.</li>
            <li><strong>Want to play with your own image or PFP?</strong> Submit a URL in the deposit box below or use the Discord command <code className="px-1.5 py-0.5 rounded bg-zinc-900 font-mono text-pink-400">+puzzle deposit &lt;attachment&gt;</code>. Once approved by an Admin, it becomes available for everyone!</li>
          </ul>
        </motion.div>
      )}

      {/* Main Game Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Play Space (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Game Controls Panel */}
          {!isPlaying && !isSolved && (
            images.length === 0 ? (
              <div className="p-10 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-4 shadow-xl">
                <ImageIcon className="w-12 h-12 text-purple-500/40 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-white">No Slide Puzzle Levels</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                    All default system levels have been removed. Be the first to deposit a custom image using the file uploader or direct image URL below! Once verified by an administrator, the puzzle arena will be fully playable!
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl w-full">
                <div className="space-y-3 text-center md:text-left w-full md:w-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="font-bold text-lg text-white">Configure your Session</h3>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 w-fit mx-auto sm:mx-0">
                      Played {playedCount} times
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Select difficulty and hit Play to shuffle tiles!</p>
                  
                  {/* Difficulty Select */}
                  <div className="flex gap-2 justify-center md:justify-start">
                    {([3, 4, 5] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setGridSize(size)}
                        className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                          gridSize === size
                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-950/20'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {size}x{size} Grid
                      </button>
                    ))}
                  </div>

                  {/* Mode Select (With Hints / Without Hints) */}
                  <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start items-center">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block sm:inline">Type:</span>
                    <button
                      onClick={() => setWithHints(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        withHints
                          ? 'bg-purple-950/40 border-purple-500/30 text-purple-300 shadow-md'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      With Hints
                    </button>
                    <button
                      onClick={() => setWithHints(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        !withHints
                          ? 'bg-amber-950/40 border-amber-500/30 text-amber-300 shadow-md'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      No Hints (+2x Prize 💎)
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleStartGame}
                  disabled={!selectedImage}
                  className="px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-950/40 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" /> Shuffle & Start Game
                </button>
              </div>
            )
          )}

          {/* Active Gameplay Panel */}
          {isPlaying && (
            <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4">
              <div className="flex gap-4 font-mono text-xs">
                <div>
                  <span className="text-zinc-500">GRID SIZE:</span>{' '}
                  <span className="font-bold text-purple-400">{gridSize}x{gridSize}</span>
                </div>
                <div>
                  <span className="text-zinc-500">MOVES:</span>{' '}
                  <span className="font-bold text-white">{moves}</span>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restart / Reshuffle
              </button>
            </div>
          )}

          {/* Solved Victory Banner */}
          {isSolved && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl text-center md:text-left"
            >
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-emerald-400 flex items-center justify-center md:justify-start gap-2">
                  <Trophy className="w-5 h-5 text-amber-400 animate-bounce" /> Puzzle Completed!
                </h3>
                <p className="text-xs text-zinc-300">
                  You successfully solved the <span className="font-bold text-white">{gridSize}x{gridSize}</span> slide puzzle in <span className="font-bold text-white">{moves} moves</span>!
                </p>
              </div>

              <div className="flex gap-3">
                <span className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" /> {rewardPoints > 0 ? `+${rewardPoints} AP Claimed!` : 'No Reward (Limit Reached)'}
                </span>
                <button
                  onClick={() => setIsSolved(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold border border-zinc-800"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          )}

          {/* THE GRID CANVAS */}
          {(isPlaying || isSolved) && (
            <div className="flex justify-center items-center bg-zinc-950/40 border border-zinc-800/80 p-4 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
              <div
                className="grid gap-1 shadow-2xl rounded-lg overflow-hidden max-w-full w-full aspect-square md:w-[480px] md:h-[480px]"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
                }}
              >
                {tiles.map((tilePos, index) => {
                  const correctRow = Math.floor(tilePos / gridSize);
                  const correctCol = tilePos % gridSize;
                  const xPercent = gridSize > 1 ? (correctCol / (gridSize - 1)) * 100 : 0;
                  const yPercent = gridSize > 1 ? (correctRow / (gridSize - 1)) * 100 : 0;

                  const isSelected = selectedTileIndex === index;

                  return (
                    <motion.div
                      key={`${tilePos}-${index}`}
                      onClick={() => handleTileClick(index)}
                      className={`relative cursor-pointer aspect-square select-none overflow-hidden rounded border transition-all ${
                        isSelected 
                          ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-black scale-[0.98] z-10' 
                          : 'hover:opacity-90 hover:scale-[1.01]'
                      } ${isSolved ? 'border-emerald-500/30' : 'border-zinc-800'}`}
                      whileTap={{ scale: 0.96 }}
                    >
                      {/* CSS background slicing */}
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${selectedImage?.url})`,
                          backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                          backgroundPosition: `${xPercent}% ${yPercent}%`,
                          backgroundRepeat: 'no-repeat'
                        }}
                      />

                      {/* Optional tile index overlay hints to help the player */}
                      {!isSolved && withHints && (
                        <div className="absolute bottom-1 right-1 bg-black/60 text-[9px] font-mono text-zinc-500 px-1 py-0.5 rounded">
                          {tilePos + 1}
                        </div>
                      )}

                      {/* Success Check overlay */}
                      {isSolved && (
                        <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-5 h-5 text-emerald-400 drop-shadow" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Image Submission Form */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Upload className="w-4.5 h-4.5 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Deposit Custom Puzzle Image</h3>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSubType('url')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    subType === 'url' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  By URL
                </button>
                <button
                  type="button"
                  onClick={() => setSubType('file')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    subType === 'file' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  File Upload
                </button>
              </div>
            </div>

            {subType === 'url' ? (
              <p className="text-xs text-zinc-400 leading-relaxed">
                Have an awesome wallpaper or avatar URL? Enter a valid direct image URL to submit it for administrator verification. Once approved, it will join the global playable deck!
              </p>
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed">
                Upload a local image file directly from your device (Max 2.5MB). The image is safely stored in our database for custom game sessions once verified by an Admin.
              </p>
            )}

            <form onSubmit={handleDepositImage} className="space-y-3">
              {subType === 'url' ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={depositUrl}
                    onChange={(e) => setDepositUrl(e.target.value)}
                    placeholder="https://example.com/my-cool-image.png"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    {isUploading ? 'Submitting...' : 'Submit URL'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="puzzle-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                    />
                    <button
                      type="submit"
                      disabled={isUploading || !fileBase64}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                  {fileName && (
                    <p className="text-[10px] font-mono text-zinc-500">
                      Selected file: <span className="text-zinc-300 font-bold">{fileName}</span>
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Gallery Sidebar (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Currently Selected Card */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" /> Image Preview
            </h3>
            
            {selectedImage ? (
              <div className="space-y-3">
                <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <img
                    src={selectedImage.url}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/75 px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-400 border border-zinc-800">
                    Uploaded by: <span className="font-bold text-white">{selectedImage.uploadedBy}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                No image selected
              </div>
            )}
          </div>

          {/* Printable Gallery list */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-xl space-y-4 flex flex-col h-[400px]">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-purple-400" /> Playable Gallery ({images.length})
            </h3>
            
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1">
              {images.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2">
                  <ImageIcon className="w-8 h-8 text-zinc-700 animate-pulse" />
                  <p className="text-[11px] font-bold">No images</p>
                  <p className="text-[9px] text-zinc-600 leading-normal">Submit a photo or URL below to request approval!</p>
                </div>
              ) : (
                images.map((img) => {
                  const isCurrent = selectedImage?.id === img.id;
                  return (
                    <div
                      key={img.id}
                      onClick={() => {
                        if (!isPlaying) {
                          setSelectedImage(img);
                        } else {
                          if (showNotice) showNotice('⚠️ Please stop or finish your current game before switching images!', 'info');
                        }
                      }}
                      className={`relative cursor-pointer aspect-square rounded-xl overflow-hidden border transition-all ${
                        isCurrent 
                          ? 'border-purple-500 ring-2 ring-purple-500/20' 
                          : 'border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt="Gallery Option"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1 text-[8px] font-mono text-zinc-400 truncate text-center">
                        by {img.uploadedBy}
                      </div>
                      {isCurrent && (
                        <div className="absolute top-1.5 right-1.5 bg-purple-600 rounded-full p-1 shadow-lg">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
