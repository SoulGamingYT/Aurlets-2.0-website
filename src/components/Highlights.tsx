import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HIGHLIGHTS, CREATIONS } from '../data';
import { Sparkles, Trophy, Users, Gamepad2, Mic, Heart, Eye, ArrowRight } from 'lucide-react';

export default function Highlights() {
  const [filterType, setFilterType] = useState<string>('All');
  const [likes, setLikes] = useState<Record<number, number>>({});

  const toggleLike = (idx: number) => {
    setLikes((prev) => ({
      ...prev,
      [idx]: (prev[idx] || 0) + (likes[idx] ? -1 : 1)
    }));
  };

  const types = ['All', 'Edit', 'Meme', 'Art'];

  const filteredCreations = filterType === 'All'
    ? CREATIONS
    : CREATIONS.filter((c) => c.type === filterType);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Gamepad2': return <Gamepad2 className="w-5 h-5" />;
      case 'Mic': return <Mic className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-yellow-400" /> Server Highlights & Creations
        </h2>
        <p className="text-zinc-400 text-sm">
          A showcase of historical milestones and incredible media created by our talented Aura Farmers.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {HIGHLIGHTS.map((hl, idx) => (
          <motion.div
            key={hl.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="p-6 rounded-2xl bg-zinc-900/35 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/40 transition-all flex items-start gap-4 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0">
              {getIcon(hl.icon)}
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-zinc-100">{hl.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{hl.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Community Creations Header & Filter */}
      <div className="pt-6 border-t border-zinc-800/60 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🎨 Community Creations Gallery
            </h3>
            <p className="text-zinc-400 text-xs">
              Meme cards, custom edits, and server fanart designed exclusively by Aurlets members.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-md text-xs font-semibold font-mono transition-all ${
                  filterType === t
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCreations.map((c, idx) => (
              <motion.div
                key={c.title + idx}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group rounded-2xl overflow-hidden bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-xl flex flex-col h-full"
              >
                {/* Visual Placeholder for high quality image generation details */}
                <div className={`aspect-video w-full bg-gradient-to-tr ${c.placeholderColor} relative flex items-center justify-center p-6 text-center`}>
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] group-hover:opacity-0 transition-opacity" />
                  <span className="relative z-10 font-black text-2xl text-white/90 drop-shadow-md group-hover:scale-105 transition-transform">
                    {c.type} Art
                  </span>
                  
                  {/* Subtle Aura Particles */}
                  <div className="absolute w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold tracking-widest uppercase font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                      {c.type}
                    </span>
                    <h4 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors pt-1">
                      {c.title}
                    </h4>
                    <p className="text-xs text-zinc-400">Created by <span className="text-purple-300 font-semibold">{c.author}</span></p>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs">
                    <button 
                      onClick={() => toggleLike(idx)}
                      className={`flex items-center gap-1.5 transition-colors ${likes[idx] ? 'text-rose-500 font-semibold' : 'text-zinc-500 hover:text-rose-400'}`}
                    >
                      <Heart className={`w-4 h-4 ${likes[idx] ? 'fill-rose-500' : ''}`} />
                      <span>{likes[idx] ? 13 + (likes[idx] || 0) : 12} Likes</span>
                    </button>
                    
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> 184 Views
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Promo Submit Box */}
        <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-zinc-300">
            Have some cool art, edits, or memes about Aurlets? Share them on Discord in <span className="text-purple-400 font-semibold">#media-gallery</span>!
          </p>
          <a
            href="https://discord.gg/aurlets"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all text-xs text-center flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            Submit Content <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
