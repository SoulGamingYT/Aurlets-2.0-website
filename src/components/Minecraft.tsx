import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Server, 
  Users, 
  Copy, 
  Check, 
  RefreshCw, 
  Wifi,
  Radio,
  Sliders,
  Sparkles,
  Info,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Tv
} from 'lucide-react';

interface Player {
  name: string;
  uuid?: string;
}

interface McStatus {
  online: boolean;
  type: string;
  host: string;
  port: number;
  version: string;
  motd: {
    raw: string;
    clean: string;
    html: string;
  };
  players: {
    online: number;
    max: number;
    list: Player[];
  };
  icon: string | null;
  ping: number;
}

export default function Minecraft() {
  const host = '168.119.88.183';
  const javaPort = 7064;
  const bedrockPort = 7065;

  const [activePort, setActivePort] = useState<number>(7064); // default to the online Java port
  const [status, setStatus] = useState<McStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string>('');

  const fetchStatus = async (portToFetch = activePort, isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/minecraft/status?host=${host}&port=${portToFetch}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus({
          online: false,
          type: 'unknown',
          host,
          port: portToFetch,
          version: '1.21.11',
          motd: { raw: '', clean: 'Failed to retrieve status', html: '<span>Failed to retrieve status</span>' },
          players: { online: 0, max: 0, list: [] },
          icon: null,
          ping: 0
        });
      }
    } catch (err) {
      console.error('Error fetching Minecraft server status:', err);
      setStatus({
        online: false,
        type: 'unknown',
        host,
        port: portToFetch,
        version: '1.21.11',
        motd: { raw: '', clean: 'Connection timed out', html: '<span>Connection timed out</span>' },
        players: { online: 0, max: 0, list: [] },
        icon: null,
        ping: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStatus(activePort);
    const interval = setInterval(() => fetchStatus(activePort), 30000);
    return () => clearInterval(interval);
  }, [activePort]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedText(label);
        setCopied(true);
      } else {
        // Fallback for older browsers or iframes without clipboard access
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopiedText(label);
            setCopied(true);
          } else {
            console.warn('Fallback copy command was unsuccessful');
          }
        } catch (err) {
          console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    } finally {
      setTimeout(() => {
        setCopied(false);
        setCopiedText('');
      }, 2000);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Minecraft Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-radial from-slate-950 via-zinc-950 to-black p-8 md:p-12 border border-emerald-900/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/30 text-xs text-emerald-400 font-mono">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE SERVER STATUS
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-sans">
              Aura<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Craft</span>
            </h1>
            
            <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
              Experience the pure live connection of the official Aurlets private Minecraft server. Copy the connection IP and port below to join the game!
            </p>

            {/* Port Selector Tabs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-3">
              <button
                onClick={() => setActivePort(javaPort)}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 flex items-center gap-2 border ${
                  activePort === javaPort 
                    ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300' 
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Java Edition (Port {javaPort})</span>
              </button>

              <button
                onClick={() => setActivePort(bedrockPort)}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 flex items-center gap-2 border ${
                  activePort === bedrockPort 
                    ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300' 
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Bedrock Edition (Port {bedrockPort})</span>
              </button>
            </div>
          </div>

          {/* Large Live Server Status Card */}
          <div className="bg-zinc-900/50 border border-zinc-800/60 p-6 rounded-2xl flex flex-col items-center justify-center w-64 h-48 text-center backdrop-blur-sm shadow-xl relative overflow-hidden">
            {loading ? (
              <div className="space-y-2">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs text-zinc-500 font-mono">Pinging server...</p>
              </div>
            ) : (
              <>
                <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-all duration-500 ${
                  status?.online ? 'bg-emerald-500/20' : 'bg-rose-500/15'
                }`} />

                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Server Status</span>
                
                <div className="flex items-center gap-2.5 my-3 justify-center">
                  <span className={`w-3.5 h-3.5 rounded-full ${status?.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="text-2xl font-black text-white tracking-wide font-sans">
                    {status?.online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-mono">
                  {status?.online ? `${status?.players?.online ?? 0} / ${status?.players?.max ?? 0} Players` : '0 / 0 Players'}
                </p>

                <button 
                  onClick={() => fetchStatus(activePort, true)}
                  disabled={refreshing}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors duration-150 active:scale-95 border border-zinc-700/50"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Status Grid & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl flex items-center space-x-4 shadow-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-mono block">Active Players</span>
            <span className="text-lg font-bold text-white font-mono">
              {!loading && status?.online ? `${status?.players?.online ?? 0} / ${status?.players?.max ?? 0}` : '0 / 0'}
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl flex items-center space-x-4 shadow-md">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-mono block">Game Version</span>
            <span className="text-base font-bold text-white font-mono truncate max-w-[150px] block">
              {!loading && status?.online ? status.version : '1.21.11'}
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl flex items-center space-x-4 shadow-md">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-mono block">Latency / Ping</span>
            <span className="text-lg font-bold text-white font-mono">
              {!loading && status?.online && status.ping ? `${status.ping} ms` : 'N/A'}
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl flex items-center space-x-4 shadow-md">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-mono block">Platform Protocol</span>
            <span className="text-lg font-bold text-white font-mono uppercase">
              {!loading && status?.online ? status.type : 'JAVA/BEDROCK'}
            </span>
          </div>
        </div>
      </div>

      {/* MOTD Display */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-2xl shadow-md">
        <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest block mb-2">Message of the Day (MOTD)</span>
        <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 font-mono text-sm leading-relaxed text-zinc-300 shadow-inner overflow-x-auto min-h-[50px] flex items-center">
          <span className="text-emerald-400 select-none mr-2 font-bold">»</span>
          {loading ? (
            <span className="text-zinc-600">Retrieving MOTD...</span>
          ) : status?.online ? (
            <div 
              className="whitespace-pre-wrap select-all font-mono"
              dangerouslySetInnerHTML={{ __html: status?.motd?.html || status?.motd?.clean || '' }}
            />
          ) : (
            <span className="text-rose-500/90 font-medium">Server Offline (Connection Refused)</span>
          )}
        </div>
      </div>

      {/* Two-Column Detail Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Connection details / How to join */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-400" />
              How to Connect & Play
            </h2>

            <div className="space-y-4">
              {/* Java connect row */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-mono uppercase">Java</span>
                    <span className="text-zinc-200 text-xs font-semibold">Minecraft Java Edition</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${host}:${javaPort}`, 'Java IP')}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors font-mono"
                  >
                    {copied && copiedText === 'Java IP' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-zinc-400">
                  <span className="text-zinc-500">Address:</span> {host}<br />
                  <span className="text-zinc-500">Port:</span> {javaPort}
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Open Minecraft Java, go to <strong className="text-zinc-400">Multiplayer</strong>, click <strong className="text-zinc-400">Add Server</strong>, and paste the connection details.
                </p>
              </div>

              {/* Bedrock connect row */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded text-[10px] font-mono uppercase">Bedrock</span>
                    <span className="text-zinc-200 text-xs font-semibold">Bedrock Edition (Mobile/Console/Win10)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${host}:${bedrockPort}`, 'Bedrock IP')}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors font-mono"
                  >
                    {copied && copiedText === 'Bedrock IP' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-zinc-400">
                  <span className="text-zinc-500">Address:</span> {host}<br />
                  <span className="text-zinc-500">Port:</span> {bedrockPort}
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Open Minecraft Bedrock, navigate to the <strong className="text-zinc-400">Servers</strong> tab, scroll down to <strong className="text-zinc-400">Add Server</strong>, and enter the IP and Bedrock port.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Player list */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 shadow-xl flex flex-col h-full min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Online Players
              </h2>
              {!loading && status?.online && (
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                  Live
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[320px] custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-zinc-500 text-xs font-mono">
                  Checking online players...
                </div>
              ) : status?.online && status?.players?.list && status.players.list.length > 0 ? (
                status.players.list.map((player) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-900"
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={`https://minotar.net/helm/${player.name}/32.png`} 
                        alt={player.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://minotar.net/helm/Steve/32.png';
                        }}
                        className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800"
                      />
                      <span className="text-zinc-200 font-medium text-sm font-mono">{player.name}</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 text-zinc-500 space-y-3">
                  <Users className="w-8 h-8 stroke-1 text-zinc-600" />
                  <p className="text-xs font-mono">
                    {status?.online ? 'No players currently online.' : 'Server offline.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
