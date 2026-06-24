import { motion } from 'motion/react';
import { Target, Star, Swords, MessageSquare, Flame } from 'lucide-react';

export default function Info() {
  const mottoItems = [
    {
      word: 'Young',
      meaning: 'Full of vibrant energy, unbounded creativity, and refreshing new ideas.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      word: 'Black',
      meaning: 'Sleek, bold, mysterious, and absolutely powerful in our collective style.',
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      word: 'Rich',
      meaning: 'Rich in deep vibes, genuine connections, community support, and memorable experiences.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20'
    }
  ];

  const offers = [
    {
      title: 'Gaming Squads',
      desc: 'Team up, schedule friendly scrims, stream matches, and climb the ranks together in your favorite competitive titles.',
      icon: Swords,
      color: 'text-indigo-400'
    },
    {
      title: 'Chill VC',
      desc: 'Settle down in our cozy, late-night voice chats. Sing songs, play music, share jokes, or discuss late-night deep thoughts.',
      icon: MessageSquare,
      color: 'text-purple-400'
    },
    {
      title: 'Aura Farming',
      desc: 'Take part in highly entertaining community-wide events and mini-games. Complete challenges to boost your rank and aura.',
      icon: Flame,
      color: 'text-rose-400'
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="text-xs font-mono text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
            Our Philosophy
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white">
            About Aurlets – <span className="text-purple-400">The Aura Farmers</span>
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
            Aurlets isn’t just another Discord server — it’s a lifestyle, a family, and a movement. We call ourselves the **Aura Farmers**, because every single member who joins contributes to our collective vibes, positive energy, and shared growth. 
          </p>
        </div>
      </div>

      {/* Motto Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
          <h3 className="text-2xl font-bold text-white">Our Motto</h3>
        </div>
        
        <p className="text-zinc-400 text-sm max-w-xl">
          The three cornerstones that define our identity, vibe, and vision.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mottoItems.map((motto, idx) => (
            <motion.div
              key={motto.word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-2xl border ${motto.bg} flex flex-col space-y-3 shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-black font-mono tracking-wide ${motto.color}`}>
                  {motto.word}
                </span>
                <span className="text-xs font-mono text-zinc-600">0{idx + 1}</span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {motto.meaning}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* What We Offer Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
          <h3 className="text-2xl font-bold text-white">What We Offer</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offers.map((offer, idx) => {
            const IconComponent = offer.icon;
            return (
              <motion.div
                key={offer.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col space-y-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 ${offer.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white">{offer.title}</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {offer.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent p-8 md:p-12 text-center space-y-6">
        <h3 className="text-2xl md:text-3xl font-extrabold text-white">Ready to grow your aura?</h3>
        <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
          Be a key contributor to Pakistan's chillest digital family. Meet people who understand you, play without toxicity, and farm those positive vibes!
        </p>
        <a
          href="https://discord.gg/aurlets"
          target="_blank"
          rel="noreferrer"
          className="inline-flex px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all active:scale-95 shadow-md hover:shadow-indigo-500/20"
        >
          Join Aurlets Discord
        </a>
      </div>
    </div>
  );
}
