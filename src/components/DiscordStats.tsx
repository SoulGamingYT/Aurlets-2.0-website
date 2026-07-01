import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  MessageSquare, 
  Mic, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  RefreshCw, 
  Clock, 
  Flame,
  Volume2,
  Lock,
  Compass
} from 'lucide-react';
import { Tooltip } from './Tooltip';

interface DiscordStatsProps {
  isLoggedIn: boolean;
  nickname: string;
  discordUser: any;
  onOpenAuthModal: () => void;
  showNotice: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface DiscordChannel {
  id: string;
  name: string;
}

interface MemberHistoryItem {
  timestamp: number;
  count: number;
}

export default function DiscordStats({
  isLoggedIn,
  nickname,
  discordUser,
  onOpenAuthModal,
  showNotice
}: DiscordStatsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'vc' | 'chat'>('analytics');
  const [stats, setStats] = useState<any>(null);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Chat inputs
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatCooldown, setChatCooldown] = useState(0);

  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch Discord Stats and Channels
  const fetchStatsAndChannels = async () => {
    try {
      const statsRes = await fetch('/api/discord/stats');
      const statsContentType = statsRes.headers.get('content-type');
      if (statsRes.ok && statsContentType && statsContentType.includes('application/json')) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const discordIdParam = discordUser?.id ? `?discordId=${encodeURIComponent(discordUser.id)}` : '';
      const channelsRes = await fetch(`/api/discord/channels${discordIdParam}`);
      const channelsContentType = channelsRes.headers.get('content-type');
      if (channelsRes.ok && channelsContentType && channelsContentType.includes('application/json')) {
        const channelsData = await channelsRes.json();
        const textChannels = channelsData.channels || [];
        setChannels(textChannels);
        if (textChannels.length > 0 && !selectedChannelId) {
          setSelectedChannelId(textChannels[0].id);
        }
      }
    } catch (err) {
      console.debug('Failed to load Discord Stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndChannels();
    const interval = setInterval(fetchStatsAndChannels, 15000);
    return () => clearInterval(interval);
  }, [discordUser?.id]);

  // Cooldown timer effect
  useEffect(() => {
    if (chatCooldown > 0) {
      const timer = setTimeout(() => setChatCooldown(chatCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [chatCooldown]);

  // Handle direct message sending
  const handleSendMessage = async () => {
    if (!isLoggedIn) {
      showNotice('Please connect your Discord profile to send direct messages.', 'error');
      return;
    }
    if (!selectedChannelId) {
      showNotice('Please select a target channel.', 'error');
      return;
    }
    if (!chatMessage.trim()) {
      showNotice('Please enter some message content.', 'error');
      return;
    }

    // Client-side spam ping check
    const hasPing = /@everyone|@here|<@&?\d+>|<@!\d+>/i.test(chatMessage);
    if (hasPing) {
      showNotice('Spam Prevention: Pings are not allowed inside direct web messages.', 'error');
      return;
    }

    setIsSendingMsg(true);
    try {
      const res = await fetch('/api/discord/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: nickname,
          channelId: selectedChannelId,
          content: chatMessage.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('Message broadcast successfully!', 'success');
        setChatMessage('');
        setChatCooldown(10); // Start 10s cooldown
      } else {
        showNotice(data.error || 'Failed to send message.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error occurred while sending message.', 'error');
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Map real server member count history records to correct timestamps
  const getProcessedHistory = (): MemberHistoryItem[] => {
    const rawHistory: any[] = stats?.discordStats?.memberCountHistory || [];
    
    return rawHistory.map(item => {
      let ts = 0;
      if (item.timestamp) {
        ts = item.timestamp;
      } else if (item.date) {
        ts = new Date(item.date).getTime();
      }
      return {
        timestamp: ts,
        count: item.count
      };
    });
  };

  const getFilteredHistory = () => {
    const history = getProcessedHistory();
    if (!startDate && !endDate) return history;

    const startMs = startDate ? new Date(startDate).getTime() : 0;
    // Set end range to end of that selected day (23:59:59)
    const endMs = endDate ? new Date(endDate).getTime() + 86400000 - 1 : Infinity;

    return history.filter(item => item.timestamp >= startMs && item.timestamp <= endMs);
  };

  const filteredHistoryData = getFilteredHistory();

  const formattedChartData = filteredHistoryData.map(item => {
    const d = new Date(item.timestamp);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      'Live Members': item.count
    };
  });

  // Calculate dynamic stats metrics
  const totalMessagesTracked: number = stats?.discordStats?.messageCountByChannel
    ? Number(Object.values(stats.discordStats.messageCountByChannel).reduce((acc: any, v: any) => acc + v, 0))
    : 0;

  const totalVCJoinsTracked: number = stats?.discordStats?.vcJoinCountByChannel
    ? Number(Object.values(stats.discordStats.vcJoinCountByChannel).reduce((acc: any, v: any) => acc + v, 0))
    : 0;

  const liveVCsData = stats?.liveVCs || {};
  const activeVCsCount = Object.keys(liveVCsData).filter(key => liveVCsData[key].length > 0).length;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950/40 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Discord Integrations
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Aura Server Live Statistics 📊
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
            Monitor real-time community engagement, browse live active voice channels, or send messages straight from the web browser dashboard into Discord text channels.
          </p>
        </div>

        <button
          onClick={() => {
            setIsLoading(true);
            fetchStatsAndChannels();
          }}
          className="relative z-10 p-3 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-all hover:border-zinc-700 flex items-center justify-center self-start md:self-auto shadow-sm"
          title="Force Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Internal Tabs navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/10 p-4 border border-zinc-900 rounded-2xl">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'analytics'
                ? 'bg-purple-600 text-white shadow shadow-purple-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Compass className="w-4 h-4" /> Discord Analytics & Growth
          </button>
          <button
            onClick={() => setActiveSubTab('vc')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'vc'
                ? 'bg-purple-600 text-white shadow shadow-purple-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Volume2 className="w-4 h-4" /> Live Voice View ({activeVCsCount} Active)
          </button>
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'chat'
                ? 'bg-purple-600 text-white shadow shadow-purple-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Send className="w-4 h-4" /> Direct Web-to-Discord Messenger
          </button>
        </div>
      </div>

      {isLoading && !stats ? (
        <div className="p-16 text-center text-zinc-500 font-mono text-xs">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-purple-500" />
          Synchronizing analytics databases...
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB 1: ANALYTICS */}
          {activeSubTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1: LIVE MEMBERS */}
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between shadow">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500 block">Live Guild Members</span>
                    <div className="text-2xl font-black font-mono text-white flex items-center gap-2">
                      {(stats?.liveMemberCount ?? 0).toLocaleString()}
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="Gateway Active" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* CARD 2: MSG COUNTS */}
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between shadow">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500 block">Messages Tracked</span>
                    <div className="text-2xl font-black font-mono text-white">
                      {totalMessagesTracked.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>

                {/* CARD 3: ACTIVE CHANNEL */}
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between shadow">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500 block">Most Active Channel</span>
                    <div className="text-base font-black font-mono text-white truncate max-w-[160px]">
                      {stats?.mostActiveChannel ? `#${stats.mostActiveChannel}` : 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Flame className="w-5 h-5" />
                  </div>
                </div>

                {/* CARD 4: ACTIVE VC */}
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between shadow">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500 block">Hottest Voice Channel</span>
                    <div className="text-base font-black font-mono text-white truncate max-w-[160px]">
                      {stats?.mostActiveVC ? `🔊 ${stats.mostActiveVC}` : 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Mic className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Chart & Growth Filtering Section */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-900 pb-4">
                  <div>
                    <h3 className="text-sm font-mono font-black uppercase text-white flex items-center gap-1.5">
                      📈 Growth Rate History Analytics
                    </h3>
                    <p className="text-[10px] text-zinc-500">Filter member count historical logs using local date ranges.</p>
                  </div>

                  {/* Date Filters Form */}
                  <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 py-1.5">
                      <span className="text-zinc-500 text-[10px] uppercase font-bold">From:</span>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent border-none text-white focus:outline-none focus:ring-0 text-xs w-[110px]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 py-1.5">
                      <span className="text-zinc-500 text-[10px] uppercase font-bold">To:</span>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent border-none text-white focus:outline-none focus:ring-0 text-xs w-[110px]"
                      />
                    </div>
                    {(startDate || endDate) && (
                      <button
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 hover:text-white"
                        title="Clear Range Filter"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Graph Container */}
                <div className="h-72 w-full font-mono text-xs">
                  {formattedChartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                      <Calendar className="w-8 h-8 mb-2 text-zinc-700" />
                      No historical datapoints match the selected date boundaries.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="memberColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                          labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Live Members" 
                          stroke="#c084fc" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#memberColor)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Grid: Message breakdown and VC join statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Message Counts by Channel */}
                <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow space-y-4 text-left">
                  <h4 className="text-xs font-mono font-black uppercase text-zinc-400 tracking-wider">
                    💬 Text Channel Engagement Logs
                  </h4>

                  {!stats?.discordStats?.messageCountByChannel || Object.keys(stats.discordStats.messageCountByChannel).length === 0 ? (
                    <div className="text-zinc-500 text-xs font-mono text-center py-10">No messages logged since startup.</div>
                  ) : (
                    <div className="space-y-3 font-mono text-xs">
                      {Object.entries(stats.discordStats.messageCountByChannel).map(([channel, count]: any) => {
                        const pct = totalMessagesTracked > 0 ? (count / totalMessagesTracked) * 100 : 0;
                        return (
                          <div key={channel} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-bold">#{channel}</span>
                              <span className="text-zinc-500 font-bold">{count} msgs</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* VC Joins by Channel */}
                <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow space-y-4 text-left">
                  <h4 className="text-xs font-mono font-black uppercase text-zinc-400 tracking-wider">
                    🎙️ Voice Channel Join Frequency
                  </h4>

                  {!stats?.discordStats?.vcJoinCountByChannel || Object.keys(stats.discordStats.vcJoinCountByChannel).length === 0 ? (
                    <div className="text-zinc-500 text-xs font-mono text-center py-10">No voice logs tracked yet.</div>
                  ) : (
                    <div className="space-y-3 font-mono text-xs">
                      {Object.entries(stats.discordStats.vcJoinCountByChannel).map(([vcName, count]: any) => {
                        const pct = totalVCJoinsTracked > 0 ? (count / totalVCJoinsTracked) * 100 : 0;
                        return (
                          <div key={vcName} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-bold">🔊 {vcName}</span>
                              <span className="text-zinc-500 font-bold">{count} joins</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-pink-500 to-amber-500 rounded-full" 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: LIVE VOICE CHANNELS */}
          {activeSubTab === 'vc' && (
            <motion.div
              key="vc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow text-left space-y-6">
                <div>
                  <h3 className="text-sm font-mono font-black uppercase text-white flex items-center gap-1.5">
                    🎙️ Live Voice Channel Occupancy Panel
                  </h3>
                  <p className="text-[10px] text-zinc-500">Live feed of active users and staff connected to Discord voice lobbies.</p>
                </div>

                {Object.keys(liveVCsData).length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 font-mono text-xs space-y-3">
                    <Mic className="w-8 h-8 mx-auto text-zinc-700 animate-pulse" />
                    <p>No voice channels are currently cached. Jump on Discord to activate!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(liveVCsData).map(([vcName, users]: any) => {
                      const isActive = users.length > 0;
                      return (
                        <div 
                          key={vcName}
                          className={`p-5 rounded-2xl border transition-all ${
                            isActive 
                              ? 'bg-purple-950/10 border-purple-900/40 shadow-sm shadow-purple-500/5' 
                              : 'bg-zinc-900/20 border-zinc-900 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3 mb-4">
                            <span className="font-mono text-xs font-black text-white flex items-center gap-1.5 truncate">
                              <Volume2 className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
                              {vcName}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-zinc-900 text-zinc-600'
                            }`}>
                              {users.length} in VC
                            </span>
                          </div>

                          {users.length === 0 ? (
                            <div className="text-[10px] text-zinc-600 font-mono italic">Channel is currently empty.</div>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {users.map((u: string, idx: number) => (
                                <div 
                                  key={idx} 
                                  className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/40 border border-zinc-850 font-mono text-xs text-zinc-300"
                                >
                                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                  <span className="truncate font-bold">{u}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: WEB CHAT */}
          {activeSubTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto"
            >
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-xl text-left space-y-6">
                <div className="border-b border-zinc-900 pb-4">
                  <h3 className="text-sm font-mono font-black uppercase text-white flex items-center gap-1.5">
                    💬 Direct Text Channel Messenger
                  </h3>
                  <p className="text-[10px] text-zinc-500">Selected authenticated users can send real-time text logs into selected Discord channels.</p>
                </div>

                {!isLoggedIn ? (
                  <div className="p-6 rounded-xl bg-purple-950/10 border border-purple-900/20 text-center space-y-4">
                    <Lock className="w-8 h-8 mx-auto text-purple-400" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-xs font-mono">Profile Connection Required</h4>
                      <p className="text-zinc-400 text-[10px] font-mono leading-relaxed">
                        You must connect your Discord profile to prevent anonymous spam and identify yourself in the broadcast lobby.
                      </p>
                    </div>
                    <button
                      onClick={onOpenAuthModal}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Connect Profile Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 font-mono text-xs">
                    {/* Username identity */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Web User Identity</label>
                      <div className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-850 text-white font-bold text-xs flex items-center justify-between">
                        <span>{nickname}</span>
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black font-sans">
                          Verified Profile
                        </span>
                      </div>
                    </div>

                    {/* Channel Dropdown Selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Select Target Channel</label>
                      <select
                        value={selectedChannelId}
                        onChange={(e) => setSelectedChannelId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-purple-500"
                      >
                        {channels.length === 0 ? (
                          <option value="">No text channels available</option>
                        ) : (
                          channels.map(ch => (
                            <option key={ch.id} value={ch.id}>#{ch.name}</option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Message content */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Message Content</label>
                      <textarea
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type something to broadcast to Discord..."
                        className="w-full h-24 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white resize-none focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Alerts and Constraints */}
                    <div className="p-3.5 rounded-xl bg-red-950/10 border border-red-900/20 text-red-400 text-[10px] space-y-1 leading-relaxed">
                      <p className="font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Anti-Spam Guidelines:</p>
                      <ul className="list-disc pl-4 space-y-0.5 font-sans">
                        <li>All messages are prefixed as <strong className="font-bold font-mono text-white">{nickname} &gt;&gt; [Content]</strong>.</li>
                        <li>Spam or system-level pings (<span className="font-bold font-mono text-white">@everyone</span>, <span className="font-bold font-mono text-white">@here</span>, or raw mentions) will block execution instantly.</li>
                        <li>A strict <strong>10-second cooldown</strong> applies to all consecutive broadcasts.</li>
                      </ul>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={isSendingMsg || chatCooldown > 0 || !chatMessage.trim()}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {isSendingMsg ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Broadcasting...
                        </>
                      ) : chatCooldown > 0 ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Cooldown active ({chatCooldown}s)
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Transmit Message
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
