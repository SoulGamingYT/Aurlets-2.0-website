import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ANNOUNCEMENTS, Announcement } from '../data';
import { Megaphone, Calendar, Tag, ChevronRight, Gamepad2, Gift } from 'lucide-react';

export default function Announcements() {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  
  // Unique tags for filter tabs
  const tags = ['All', ...Array.from(new Set(ANNOUNCEMENTS.map((a) => a.tag).filter(Boolean))) as string[]];

  const filteredAnnouncements = selectedTag === 'All'
    ? ANNOUNCEMENTS
    : ANNOUNCEMENTS.filter((a) => a.tag === selectedTag);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-purple-400" /> Server Announcements
          </h2>
          <p className="text-zinc-400 text-sm">
            Keep up with official battles, game updates, and server milestones.
          </p>
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-lg border text-xs font-semibold font-mono transition-all ${
                selectedTag === tag
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/15'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAnnouncements.map((ann, idx) => (
            <motion.div
              key={ann.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="group p-6 rounded-2xl bg-zinc-900/35 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-purple-400 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 uppercase tracking-wider font-mono">
                    {ann.tag || 'Update'}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {ann.date}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors">
                  {ann.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {ann.description}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <a
                  href="https://discord.gg/aurlets"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-all font-semibold flex items-center gap-2"
                >
                  Join Discord for Details <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upcoming Promo Box */}
      <div className="p-8 rounded-2xl border border-zinc-800 bg-radial from-zinc-950 via-zinc-950 to-purple-950/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-widest font-semibold">
            <Gift className="w-4 h-4 animate-bounce" /> Coming Soon
          </div>
          <h4 className="text-xl font-bold text-white">Casino Shop Update 1.0</h4>
          <p className="text-sm text-zinc-400 max-w-md">
            Buy exclusive prestige server ranks, custom cosmetics, and profile cards directly using your Casino Balance inside the server!
          </p>
        </div>
        <a
          href="https://discord.gg/aurlets"
          target="_blank"
          rel="noreferrer"
          className="relative z-10 sm:self-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all text-sm active:scale-95 whitespace-nowrap"
        >
          Check out #casino
        </a>
      </div>
    </div>
  );
}
