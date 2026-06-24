import { motion } from 'motion/react';
import { DiscordIcon } from './Icons'; // custom discord icon helper
import { Flame, Shield, Users, MessageSquare, Gamepad2, Sparkles, TrendingUp, Music } from 'lucide-react';

interface HomeProps {
  onJoinDiscord?: () => void;
  onNavigate: (tab: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const socialLinks = [
    { name: 'Instagram', url: 'https://www.instagram.com/aurletss', color: 'hover:text-pink-500' },
    { name: 'TikTok', url: 'https://www.tiktok.com/@aurletsofficial', color: 'hover:text-red-400' },
    { name: 'Discord', url: 'https://discord.gg/aurlets', color: 'hover:text-indigo-400' }
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-radial from-slate-900 via-zinc-950 to-black p-8 md:p-16 text-center border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 space-y-6 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-purple-400 font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Grow Your Aura With Us
          </div>
          
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white leading-none">
            Aurlets – <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500">The Aura Farmers</span>
          </h1>
          
          <p className="font-mono text-zinc-400 text-base md:text-lg max-w-xl mx-auto italic">
            “Young, Black and Rich”
          </p>
          
          <p className="text-zinc-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            A chill Pakistani Discord community for gamers, music lovers, anime enjoyers, and late-night vibers. Step into a vibrant hub where Pakistan's youth gather to vibe, play, and farm aura. 🔥
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a
              href="https://discord.gg/aurlets"
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 flex items-center gap-3 group"
            >
              <DiscordIcon className="w-5 h-5 fill-white transition-transform group-hover:scale-110" />
              Join Our Discord
            </a>
            <button
              onClick={() => onNavigate('info')}
              className="px-8 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 font-semibold transition-all active:scale-95"
            >
              Learn More
            </button>
          </div>
        </motion.div>
      </div>

      {/* Grid of Perks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-purple-500/30 transition-all flex flex-col space-y-4 shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Gaming</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Team up, create squads, and dominate in your favorite titles with other Aurlets members. Random gaming nights are pure chaos.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-pink-500/30 transition-all flex flex-col space-y-4 shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
            <Music className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Chill Vibes</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Hop in late-night voice channels, enjoy live music streaming, watch movies, or just yap with extremely friendly and vibey friends.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-rose-500/30 transition-all flex flex-col space-y-4 shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Aura Farming</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Participate in interactive games, level up your rank, complete challenges, and watch your aura score climb on the server.
          </p>
        </motion.div>
      </div>

      {/* About & Quick Links Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-zinc-900/20 border border-zinc-800/50 p-6 md:p-8 rounded-2xl space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" /> About Our Community
          </h2>
          <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
            Aurlets is Pakistan’s most vibrant Discord hub. We’re not just another server — we’re a movement of Aura Farmers. Every voice, every meme, and every gaming match contributes to the shared energy that drives us. 
          </p>
          <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
            From late-night banter to celebrating personal wins (and academic acceptances!), our aura burns bright. Whether you are from Lahore, Karachi, Islamabad, or outside Pakistan, you will fit right in.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <span className="text-zinc-400 text-sm font-semibold uppercase font-mono">Connect on:</span>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 transition-all text-sm ${link.color}`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Rules Section */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="text-rose-400 w-5 h-5" /> Community Rules
            </h3>
            <ul className="space-y-3 text-sm text-zinc-300 font-sans">
              <li className="flex gap-2.5 items-start">
                <span className="text-purple-400 font-bold font-mono">01.</span>
                <span>Respect everyone — keep conversations chill, friendly, and inclusive.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="text-purple-400 font-bold font-mono">02.</span>
                <span>No toxicity, hate speech, bullying, or targeted harassment.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="text-purple-400 font-bold font-mono">03.</span>
                <span>No spam, mass pings, or self-promotion without team permission.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="text-purple-400 font-bold font-mono">04.</span>
                <span>Keep the positive vibes alive and help grow the server! 🌌</span>
              </li>
            </ul>
          </div>

          {/* Quick Gift Link */}
          <div 
            onClick={() => onNavigate('gift')}
            className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 hover:border-pink-500/40 cursor-pointer transition-all hover:scale-[1.02] shadow-md flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider font-mono">Exclusive Gift</span>
              <h4 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">🌙 Open Aurlets Eid Letters</h4>
              <p className="text-xs text-zinc-400">Made with ❤️ by @ded_inside13 • Click to view</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500/30 transition-colors">
              ✨
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
