import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  Info as InfoIcon, 
  Megaphone, 
  Sparkles, 
  Shield, 
  Gamepad2, 
  Flame, 
  Gift, 
  Menu, 
  X, 
  ExternalLink,
  LogOut,
  User as UserIcon,
  Coins,
  ShoppingBag
} from 'lucide-react';

// Custom sub-components
import Home from './components/Home';
import Info from './components/Info';
import Announcements from './components/Announcements';
import Highlights from './components/Highlights';
import Staff from './components/Staff';
import AuraGames from './components/AuraGames';
import AFKFarming from './components/AFKFarming';
import EidGift from './components/EidGift';
import Shop from './components/Shop';
import { DiscordIcon } from './components/Icons';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [discordConfigured, setDiscordConfigured] = useState<boolean>(false);

  // Global Auth states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('aurlets_logged_in') === 'true';
  });
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('aurlets_name') || '';
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('aurlets_avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80';
  });
  const [points, setPoints] = useState<number>(() => {
    const p = localStorage.getItem('aurlets_points');
    return p ? parseInt(p) : 0;
  });
  const [discordUser, setDiscordUser] = useState<any>(() => {
    const u = localStorage.getItem('aurlets_discord_user');
    return u ? JSON.parse(u) : null;
  });

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem('aurlets_logged_in', isLoggedIn ? 'true' : 'false');
    localStorage.setItem('aurlets_name', nickname);
    localStorage.setItem('aurlets_avatar', avatarUrl);
    localStorage.setItem('aurlets_points', points.toString());
    if (discordUser) {
      localStorage.setItem('aurlets_discord_user', JSON.stringify(discordUser));
    } else {
      localStorage.removeItem('aurlets_discord_user');
    }
  }, [isLoggedIn, nickname, avatarUrl, points, discordUser]);

  // Sync Discord configuration status from the backend
  useEffect(() => {
    fetch('/api/auth/discord/config')
      .then((res) => res.json())
      .then((data) => {
        setDiscordConfigured(data.configured);
      })
      .catch((err) => console.error('Error fetching Discord config:', err));
  }, []);

  // Listen for successful Discord Auth postMessage from the popup callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'DISCORD_AUTH_SUCCESS') {
        const { user } = event.data;
        setDiscordUser(user);
        setNickname(user.globalName || user.username);
        setAvatarUrl(user.avatarUrl);
        setIsLoggedIn(true);
        setShowAuthModal(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDiscordLogin = async () => {
    try {
      const origin = window.location.origin;
      const response = await fetch(`/api/auth/discord/url?origin=${encodeURIComponent(origin)}`);
      if (!response.ok) {
        throw new Error('Failed to get Discord authorization URL');
      }
      const { url } = await response.json();

      // Open a popup for Discord authorize
      const width = 500;
      const height = 750;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        'discord_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        alert('Popup was blocked! Please enable popups for this site to login via Discord.');
      }
    } catch (err) {
      console.error('Discord login initiation error:', err);
      alert('Could not start Discord login. Please check configuration.');
    }
  };

  const handleCustomLogin = (name: string, avatar: string) => {
    setDiscordUser(null);
    setNickname(name);
    setAvatarUrl(avatar);
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleSimulateDiscord = (simUser: { id: string; username: string; globalName: string; avatarUrl: string }) => {
    setDiscordUser(simUser);
    setNickname(simUser.globalName);
    setAvatarUrl(simUser.avatarUrl);
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setNickname('');
    setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80');
    setDiscordUser(null);
    setPoints(0);
    localStorage.removeItem('aurlets_name');
    localStorage.removeItem('aurlets_avatar');
    localStorage.removeItem('aurlets_points');
    localStorage.removeItem('aurlets_discord_user');
    localStorage.setItem('aurlets_logged_in', 'false');
  };

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'info', label: 'Info', icon: InfoIcon },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'highlights', label: 'Highlights', icon: Sparkles },
    { id: 'staff', label: 'Staff', icon: Shield },
    { id: 'games', label: 'AuraGames', icon: Gamepad2 },
    { id: 'afk', label: 'AFK Farming', icon: Flame },
    { id: 'shop', label: 'Reward Shop 🛒', icon: ShoppingBag },
    { id: 'gift', label: 'Eid Gift 🌙', icon: Gift }
  ];

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={(tab) => setActiveTab(tab)} />;
      case 'info':
        return <Info />;
      case 'announcements':
        return <Announcements />;
      case 'highlights':
        return <Highlights />;
      case 'staff':
        return <Staff />;
      case 'games':
        return (
          <AuraGames 
            playerName={nickname} 
            isLoggedIn={isLoggedIn} 
            onOpenAuthModal={() => setShowAuthModal(true)} 
          />
        );
      case 'afk':
        return (
          <AFKFarming
            nickname={nickname}
            setNickname={setNickname}
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            points={points}
            setPoints={setPoints}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        );
      case 'shop':
        return (
          <Shop
            isLoggedIn={isLoggedIn}
            nickname={nickname}
            avatarUrl={avatarUrl}
            points={points}
            setPoints={setPoints}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        );
      case 'gift':
        return <EidGift />;
      default:
        return <Home onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col antialiased">
      {/* Dynamic Background Noise / Particles Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none blur-3xl" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            {/* Logo Badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-purple-500/15">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">Aurlets</h1>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">The Aura Farmers</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-zinc-900 text-white border border-zinc-800'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Connect Action Trigger / User profile dropdown */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-4 pl-3 border-l border-zinc-900">
                {/* Aura Points Display */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-purple-400">
                  <Coins className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>{points} AP</span>
                </div>

                {/* Profile Badge */}
                <div className="flex items-center gap-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl p-1.5 pr-3 relative group">
                  <img
                    src={avatarUrl}
                    alt={nickname}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-lg object-cover border border-zinc-800"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white leading-tight truncate max-w-[110px]">
                      {nickname}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-500 font-bold tracking-wider leading-none">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping" />
                      ONLINE
                    </span>
                  </div>

                  {/* Dropdown Menu on Hover */}
                  <div className="absolute right-0 top-full mt-2 w-44 bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                    <div className="p-2 text-[10px] text-zinc-500 uppercase font-mono tracking-wider border-b border-zinc-900">
                      Account Actions
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Logout Profile
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow shadow-purple-500/10"
              >
                <DiscordIcon className="w-3.5 h-3.5 fill-white" />
                Connect Profile
              </button>
            )}
            
            <a
              href="https://discord.gg/aurlets"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
            >
              Join Server
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-zinc-900 bg-black/95 sticky top-16 z-30 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1.5">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                      isActive
                        ? 'bg-zinc-900 text-white border border-zinc-800'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-4 border-t border-zinc-900">
                {isLoggedIn ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <img src={avatarUrl} className="w-9 h-9 rounded-lg object-cover" />
                      <div>
                        <div className="text-sm font-bold text-white">{nickname}</div>
                        <div className="text-xs text-purple-400 font-mono font-bold">{points} Aura Points</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-3 rounded-xl bg-red-950/40 border border-red-900/30 text-red-400 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout Profile
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowAuthModal(true);
                    }}
                    className="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <DiscordIcon className="w-4 h-4 fill-white" />
                    Connect Profile
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {renderActiveContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Bar */}
      <footer className="w-full border-t border-zinc-900 py-6 bg-black/40 text-center text-xs text-zinc-500 relative z-10 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Aurlets – The Aura Farmers • All Rights Reserved</span>
          <div className="flex items-center gap-4">
            <a href="https://discord.gg/aurlets" target="_blank" rel="noreferrer" className="hover:text-zinc-300 flex items-center gap-1">
              Discord <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://www.instagram.com/aurletss" target="_blank" rel="noreferrer" className="hover:text-zinc-300 flex items-center gap-1">
              Instagram <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Global Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onDiscordLogin={handleDiscordLogin}
            onCustomLogin={handleCustomLogin}
            onSimulateDiscord={handleSimulateDiscord}
            discordConfigured={discordConfigured}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
