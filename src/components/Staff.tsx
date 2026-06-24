import { motion } from 'motion/react';
import { STAFF_MEMBERS, StaffMember } from '../data';
import { Shield, Sparkles, Star, Crown, Heart, Award, ArrowUpRight } from 'lucide-react';

export default function Staff() {
  
  const getBadgeIcon = (role: StaffMember['role']) => {
    switch (role) {
      case 'FOUNDER':
        return <Crown className="w-4 h-4 text-purple-400" />;
      case 'CO FOUNDER':
        return <Crown className="w-4 h-4 text-pink-400" />;
      case 'OWNER':
        return <Crown className="w-4 h-4 text-red-400" />;
      case 'LEAD ADMIN':
        return <Star className="w-4 h-4 text-emerald-400" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'MANAGER':
        return <Award className="w-4 h-4 text-yellow-400" />;
      default:
        return <Shield className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getRoleTextColor = (role: StaffMember['role']) => {
    switch (role) {
      case 'FOUNDER': return 'text-purple-400';
      case 'CO FOUNDER': return 'text-pink-400';
      case 'OWNER': return 'text-red-400';
      case 'LEAD ADMIN': return 'text-emerald-400';
      case 'ADMIN': return 'text-blue-400';
      case 'MANAGER': return 'text-yellow-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Header Info */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-500" /> Aurlets Staff Team
        </h2>
        <p className="text-zinc-400 text-sm">
          The amazing, dedicated team that builds, manages, and protects the Aurlets community brick by brick.
        </p>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {STAFF_MEMBERS.map((member, idx) => {
          const initials = member.name.split(' ').map((n) => n[0]).join('').substring(0, 2);
          
          return (
            <motion.div
              key={member.name + idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/50 transition-all flex flex-col space-y-4 shadow-xl text-center group relative overflow-hidden h-full justify-between"
            >
              {/* Background Ambient Glow */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />

              <div className="space-y-4">
                {/* Custom Avatar with gradient */}
                <div className="relative mx-auto w-16 h-16 rounded-full flex items-center justify-center p-0.5 border-2 border-zinc-800 group-hover:border-purple-500/40 transition-colors">
                  <div className={`w-full h-full rounded-full bg-gradient-to-tr ${member.color} flex items-center justify-center text-white font-black text-lg tracking-wider font-mono shadow-md`}>
                    {initials}
                  </div>
                  {/* Glowing Indicator for Live Staff Tagline */}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono font-medium">{member.username}</p>
                </div>
              </div>

              {/* Role Badge and button info */}
              <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-center gap-1.5 mt-auto">
                {getBadgeIcon(member.role)}
                <span className={`text-xs font-bold tracking-widest font-mono uppercase ${getRoleTextColor(member.role)}`}>
                  {member.role}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Want to apply? promo */}
      <div className="p-8 rounded-2xl bg-radial from-zinc-950 via-zinc-950 to-indigo-950/20 border border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h4 className="text-lg font-bold text-white">Interested in joining our staff family?</h4>
          <p className="text-sm text-zinc-400">
            We are always on the lookout for positive, helpful, and active community members who want to help keep our server fun, safe, and engaging.
          </p>
        </div>
        <a
          href="https://discord.gg/aurlets"
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 shadow"
        >
          Open Staff Applications <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
