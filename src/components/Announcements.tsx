import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ANNOUNCEMENTS, Announcement } from '../data';
import { 
  Megaphone, Calendar, ChevronRight, Gift, Landmark, 
  BookOpen, Terminal, Coins, Gamepad2, Users, ShoppingBag, 
  ShieldCheck, Flame, Info, HelpCircle, Key, ArrowRight, Play
} from 'lucide-react';

export default function Announcements() {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [showDocHub, setShowDocHub] = useState<boolean>(false);
  const [docSubTab, setDocSubTab] = useState<'bot' | 'games' | 'shop' | 'giveaways'>('bot');
  
  // Unique tags for filter tabs
  const tags = ['All', ...Array.from(new Set(ANNOUNCEMENTS.map((a) => a.tag).filter(Boolean))) as string[]];

  const filteredAnnouncements = selectedTag === 'All'
    ? ANNOUNCEMENTS
    : ANNOUNCEMENTS.filter((a) => a.tag === selectedTag);

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* HEADER HERO BANNER WITH COMMAND WIKI TOGGLE */}
      <div className="p-8 rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-950 to-purple-950/20 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="space-y-4 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-xs uppercase tracking-widest font-black">
            <Megaphone className="w-3.5 h-3.5 animate-bounce" /> Mega System Update
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Banking, Cooperative Heists & Command Hub is Live!
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            The Aurlets ecosystem has undergone its biggest upgrade yet. We added a Secure Banking system, High-Stakes Robberies, Cooperative Server Vault Heists with a Safe Cracking mini-game, and direct SPA paths for all categories. Click the Command Wiki button to see detailed explanations!
          </p>
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row gap-3 relative z-10">
          <button
            onClick={() => {
              setShowDocHub(prev => !prev);
              if (!showDocHub) {
                // Scroll to top of the documentation area smoothly
                setTimeout(() => {
                  document.getElementById('doc-hub-anchor')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="px-6 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-purple-950/50 active:scale-95 group"
          >
            <BookOpen className="w-5 h-5" /> 
            {showDocHub ? 'Close System Wiki' : 'Open Command & Info Wiki'}
            <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${showDocHub ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      <div id="doc-hub-anchor" />

      {/* DETAILED INFORMATION / COMMAND & INFO WIKI WIDGET */}
      <AnimatePresence mode="wait">
        {showDocHub && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 rounded-3xl bg-zinc-950 border border-purple-500/20 shadow-2xl space-y-6"
          >
            {/* Wiki Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-4">
              <button
                onClick={() => setDocSubTab('bot')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
                  docSubTab === 'bot'
                    ? 'bg-purple-600 text-white shadow shadow-purple-500/20'
                    : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
                }`}
              >
                <Terminal className="w-4 h-4 text-purple-400" /> 🏦 Discord Bot & Bank Commands
              </button>
              <button
                onClick={() => setDocSubTab('games')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
                  docSubTab === 'games'
                    ? 'bg-purple-600 text-white shadow shadow-purple-500/20'
                    : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-purple-400" /> 🎮 AuraGames & Farming
              </button>
              <button
                onClick={() => setDocSubTab('shop')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
                  docSubTab === 'shop'
                    ? 'bg-purple-600 text-white shadow shadow-purple-500/20'
                    : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-purple-400" /> 🛒 Reward Shop & AP Guide
              </button>
              <button
                onClick={() => setDocSubTab('giveaways')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
                  docSubTab === 'giveaways'
                    ? 'bg-purple-600 text-white shadow shadow-purple-500/20'
                    : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
                }`}
              >
                <Gift className="w-4 h-4 text-purple-400" /> 🎉 Giveaways & Milestones
              </button>
            </div>

            {/* Wiki Content Panel */}
            <div className="bg-zinc-900/10 border border-zinc-900 p-6 rounded-2xl text-zinc-300 space-y-6">
              {docSubTab === 'bot' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                      🏦 Aura Banking & Coop Heists Discord Commands
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      Manage your money safely or squad up to pull off high-stakes robberies on the server vault bankroll!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded">
                          +deposit &lt;amount&gt;
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">Secure Wallet AP</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Moves the specified amount of Aura Points (AP) from your wallet into your personal Bank Vault. Banked funds are **100% immune** to robberies, heist losses, or Discord chat stealing.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded">
                          +withdraw &lt;amount&gt;
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">Transfer to Wallet</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Retrieves points from your secure bank and places them into your wallet. Points must be in your wallet if you want to play games, buy shop items, or join heist registration!
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">
                          +rob @user / +steal @user
                        </span>
                        <span className="text-[10px] text-red-400 font-mono font-bold">High Risk!</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Attempts to rob a user of **20% to 30%** of their wallet balance! If successful, you steal the cash. If you get caught by the server guards, you pay a heavy **10% fine** or face chat cooldowns.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                          +heist vault
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">Requires Crew</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Deploys your active team on a high-stakes heist run against the server bankroll. Players must play a safe-cracking puzzle terminal under 45 seconds to escape with up to **25%** of the giant vault!
                      </p>
                    </div>
                  </div>

                  {/* COOP SQUAD MANAGEMENT GUIDE */}
                  <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 space-y-4 text-left">
                    <h4 className="text-xs font-mono font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" /> Cooperative Heist Crew Formations (Expiry: 1 Hour)
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      To challenge the vault, you cannot go alone. Form a syndicate with up to 5 players. **Heist crews are valid for exactly 1 hour** after creation. Assemble your crew, register, and hack the system before time runs out!
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-900">
                        <div className="text-white font-bold">+team create &lt;name&gt;</div>
                        <div className="text-zinc-500 text-[10px]">Launch a crew and become captain</div>
                      </div>
                      <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-900">
                        <div className="text-white font-bold">+team invite @user</div>
                        <div className="text-zinc-500 text-[10px]">Invite server members to your syndicate</div>
                      </div>
                      <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-900">
                        <div className="text-white font-bold">+team remove @user</div>
                        <div className="text-zinc-500 text-[10px]">Remove a member from the crew</div>
                      </div>
                      <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-900">
                        <div className="text-white font-bold">+team delete</div>
                        <div className="text-zinc-500 text-[10px]">Disband your syndicate immediately</div>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 text-[11px] text-purple-300">
                      💡 **Quick Play Tips:** To see what squads are running heists, execute <code className="bg-purple-500/15 px-1.5 py-0.5 rounded font-black text-white">+heist list</code>. Every squad member registers for 200 AP, and loot is divided equally among all crew members if successful.
                    </div>
                  </div>

                  {/* ADMIN VAULT INSTRUCTIONS */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-red-950/20 space-y-3">
                    <span className="text-[10px] font-mono font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded inline-block uppercase">
                      Admin Command Console
                    </span>
                    <h4 className="text-xs font-bold text-zinc-200">Vault Bankroll Refill & Adjustments</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Admins can dynamically adjust the size of the heist payout pool to encourage gaming action!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 text-xs font-mono text-zinc-300">
                      <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex-1">
                        <span className="text-emerald-400 font-bold">+vault deposit &lt;amount&gt;</span>
                        <div className="text-zinc-500 text-[9px]">Add funding directly into server vault pool</div>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex-1">
                        <span className="text-red-400 font-bold">+vault withdraw &lt;amount&gt;</span>
                        <div className="text-zinc-500 text-[9px]">Withdraw funding from server vault pool</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {docSubTab === 'games' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                      🎮 AuraGames & Farming Manual
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      Play and master our custom interactive games on the website or farm passive AP while sleeping!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-400">
                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-purple-400 font-mono">01.</span> Math Showdown
                      </h4>
                      <p>Answer dynamic addition, subtraction, multiplication, and algebraic equations before the timer runs out! Fast streaks earn point multipliers.</p>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-purple-400 font-mono">02.</span> King of the Hill (KOTD)
                      </h4>
                      <p>Bet your hard earned AP on a slot of the hill. If you hold the crown on rollover or defend successfully against random challengers, you win the entire pool!</p>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-purple-400 font-mono">03.</span> Interactive Slide Puzzles
                      </h4>
                      <p>Solve classic tiles slide puzzles using stunning custom uploaded images. Points are awarded based on completion moves and grid sizes.</p>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-purple-400 font-mono">04.</span> Web AFK Farming
                      </h4>
                      <p>Open the AFK Farming tab, keep the browser window focused, and farm passive Aura Points (AP) automatically every 5 minutes. Best offline method!</p>
                    </div>
                  </div>
                </div>
              )}

              {docSubTab === 'shop' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                      🛒 Reward Shop, Daily Limits & AP Utilities
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      Learn how to redeem custom Discord roles, daily spin vouchers, and optimize your AP ecosystem.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
                    <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                      <ShoppingBag className="w-4 h-4" /> Discord Roles Redemption
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Collect points and redeem them in the **Reward Shop** tab. 
                    </p>
                    <ul className="space-y-2.5 text-xs text-zinc-300 list-disc list-inside">
                      <li>**Custom Role creation:** Create a brand new custom Discord role with your choice of color, name, and position on the server member list!</li>
                      <li>**Preset Tier roles:** Buy colorful, stylized preset roles (e.g., *Slayer, Royal Elite, Champion*) instantly.</li>
                      <li>**Real-time Price Sync:** Admin manages the prices and role definitions on the Admin Panel in real-time. Prices adapt dynamically!</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-yellow-500 font-bold">
                      <Coins className="w-4 h-4" /> How to Earn Aura Points (AP):
                    </div>
                    <p className="text-zinc-400">
                      Aura Points are the lifeblood of the Aurlets Pakistan community.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center font-mono text-[11px]">
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900">
                        <div className="text-white font-bold">Text Chatting</div>
                        <div className="text-zinc-500 mt-1">Chatting on Discord triggers dynamic 5-15 AP bonuses.</div>
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900">
                        <div className="text-white font-bold">Voice Activity</div>
                        <div className="text-zinc-500 mt-1">Sit in active server voice channels for passive AP.</div>
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900">
                        <div className="text-white font-bold">Spin Vouchers</div>
                        <div className="text-zinc-500 mt-1">Redeem codes or complete events to earn Spin wheels!</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {docSubTab === 'giveaways' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                      🎉 Giveaways, Events & PFP Matches
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      Participate in high-reward community battles to claim Discord Nitro, game keys, and massive AP stacks.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                      <h4 className="font-bold text-white text-sm">🔥 Discord PFP Battles</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        We periodically host epic Pakistan-wide server battles (e.g., *Aurlets vs Pookiestan*). Participants and voters get rewarded with points, Nitro, Custom banners, and decorations.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                      <h4 className="font-bold text-white text-sm">🎁 Live Giveaways</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Check the **Giveaways tab** on the web! Join running items like AP bundles, Nitro passes, or premium roles with 1 click. Winners are drawn securely on-screen via verifiable algorithms.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
      <div className="space-y-4 text-left">
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
