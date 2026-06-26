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
  ShoppingBag,
  UserCheck,
  Server as ServerIcon,
  Bell,
  BellOff,
  Send,
  Trophy
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
import TransferModal from './components/TransferModal';
import AdminPanel from './components/AdminPanel';
import Minecraft from './components/Minecraft';
import Leaderboards from './components/Leaderboards';
import { DiscordIcon } from './components/Icons';
import AuthModal from './components/AuthModal';
import { Tooltip } from './components/Tooltip';
import { Chatbot } from './components/Chatbot';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [discordConfigured, setDiscordConfigured] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

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

  const [globalNotice, setGlobalNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showGlobalNotice = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setGlobalNotice({ message, type });
    setTimeout(() => {
      setGlobalNotice(prev => prev?.message === message ? null : prev);
    }, 5000);
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showGlobalNotice('This browser does not support desktop notifications.', 'error');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification('Aurlets Notifications Enabled! 🔔', {
          body: 'You will now receive real-time updates on your Aura Points, rewards, and transfers!',
        });
        showGlobalNotice('Desktop notifications enabled successfully!', 'success');
      } else if (permission === 'denied') {
        showGlobalNotice('Notifications blocked. Please reset site permissions in your browser address bar.', 'error');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if (notificationPermission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (err) {
        console.error('Failed to trigger browser notification:', err);
      }
    }
  };

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

  // Sync cosmetic states with localStorage changes across tabs/windows
  const [userColor, setUserColor] = useState<string | null>(null);
  const [hasFrame, setHasFrame] = useState<boolean>(false);
  const [userFrameColor, setUserFrameColor] = useState<string>('#a855f7');

  useEffect(() => {
    const syncStyles = () => {
      setUserColor(localStorage.getItem('aurlets_unlocked_color'));
      setHasFrame(localStorage.getItem('aurlets_unlocked_frame') === 'true');
      setUserFrameColor(localStorage.getItem('aurlets_frame_color') || '#a855f7');
    };
    syncStyles();
    window.addEventListener('storage', syncStyles);
    return () => window.removeEventListener('storage', syncStyles);
  }, []);

  // Sync Discord configuration status from the backend
  useEffect(() => {
    fetch('/api/auth/discord/config')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load Discord config');
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return res.json();
        }
        throw new Error('Response is not JSON');
      })
      .then((data) => {
        setDiscordConfigured(data.configured);
      })
      .catch((err) => console.error('Error fetching Discord config:', err));
  }, []);

  // Track referral / invite code from URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('invite');
    if (ref) {
      localStorage.setItem('aurlets_invited_by', ref);
      // Clean up URL so it doesn't clutter the address bar
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Periodically and on active tab changes sync user points from server
  useEffect(() => {
    if (isLoggedIn && nickname) {
      const discordIdParam = discordUser?.id ? `&discordId=${encodeURIComponent(discordUser.id)}` : '';
      const discordUserParam = discordUser?.username ? `&discordUsername=${encodeURIComponent(discordUser.username)}` : '';
      
      const invitedByVal = localStorage.getItem('aurlets_invited_by') || '';
      const invitedByParam = invitedByVal ? `&invitedBy=${encodeURIComponent(invitedByVal)}` : '';

      fetch(`/api/user/sync?name=${encodeURIComponent(nickname)}&localPoints=${points}${discordIdParam}${discordUserParam}${invitedByParam}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Sync failed');
        })
        .then(data => {
          if (typeof data.points === 'number') {
            setPoints(data.points);
            if (invitedByVal) {
              localStorage.removeItem('aurlets_invited_by');
              showGlobalNotice(`Successfully applied referral from ${invitedByVal}! You both earned bonus AP! 🎉`, 'success');
            }
          }
        })
        .catch(err => console.warn('Error syncing points:', err));
    }
  }, [nickname, isLoggedIn, activeTab, discordUser]);

  // Background active browse heartbeat ping to track total "time on website"
  useEffect(() => {
    if (isLoggedIn && nickname) {
      const sendHeartbeat = () => {
        fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nickname })
        }).catch(err => console.warn('Heartbeat failed:', err));
      };

      sendHeartbeat(); // Fire immediately
      const interval = setInterval(sendHeartbeat, 10000); // and every 10 seconds thereafter
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, nickname]);

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
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Response was not JSON');
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
        console.warn('Popup was blocked! Please enable popups for this site to login via Discord.');
      }
    } catch (err) {
      console.error('Discord login initiation error:', err);
    }
  };

  const handleCustomLogin = (name: string, avatar: string) => {
    setDiscordUser(null);
    setNickname(name);
    setAvatarUrl(avatar);
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

  const isAdmin = discordUser?.id === '840560998011502593' || (!discordConfigured && nickname.toLowerCase() === 'admin');

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon, tooltip: 'Go to home page & view dashboard' },
    { id: 'info', label: 'Info', icon: InfoIcon, tooltip: 'Learn about Aurlets and how it works' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, tooltip: 'Check out latest news & updates' },
    { id: 'highlights', label: 'Highlights', icon: Sparkles, tooltip: 'View epic community moments & clips' },
    { id: 'staff', label: 'Staff', icon: Shield, tooltip: 'Meet the official Aurlets server team' },
    { id: 'games', label: 'AuraGames', icon: Gamepad2, tooltip: 'Play interactive games to win points' },
    { id: 'afk', label: 'AFK Farming', icon: Flame, tooltip: 'Farm Aura Points automatically by being AFK' },
    { id: 'leaderboards', label: 'Leaderboards 🏆', icon: Trophy, tooltip: 'Check out who is dominating the rankings' },
    { id: 'minecraft', label: 'AuraCraft ⛏️', icon: ServerIcon, tooltip: 'Check live status of our Minecraft server' },
    { id: 'shop', label: 'Reward Shop 🛒', icon: ShoppingBag, tooltip: 'Redeem points for Custom Discord Roles & ranks' },
    { id: 'gift', label: 'Eid Gift 🌙', icon: Gift, tooltip: 'Claim your special Eid gift reward' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel ⚙️', icon: UserCheck, tooltip: 'Manage user points, custom roles, and redeem codes' }] : [])
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
            points={points}
            setPoints={setPoints}
            showNotice={(msg, type) => showGlobalNotice(msg, type)}
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
      case 'leaderboards':
        return (
          <Leaderboards
            isLoggedIn={isLoggedIn}
            nickname={nickname}
            onOpenAuthModal={() => setShowAuthModal(true)}
            showNotice={(msg, type) => showGlobalNotice(msg, type)}
          />
        );
      case 'minecraft':
        return <Minecraft />;
      case 'shop':
        return (
          <Shop
            isLoggedIn={isLoggedIn}
            nickname={nickname}
            avatarUrl={avatarUrl}
            points={points}
            setPoints={setPoints}
            onOpenAuthModal={() => setShowAuthModal(true)}
            discordUserId={discordUser?.id || ''}
          />
        );
      case 'gift':
        return <EidGift />;
      case 'admin':
        return isAdmin ? (
          <AdminPanel
            adminDiscordId={discordUser?.id || ''}
            adminUsername={nickname}
            discordConfigured={discordConfigured}
            onPointsUpdated={(newPts) => setPoints(newPts)}
          />
        ) : (
          <Home onNavigate={(tab) => setActiveTab(tab)} />
        );
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Logo & Key Actions */}
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('home')}>
              {/* Logo Badge */}
              <Tooltip content="Go to Aurlets home page" position="bottom">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-md shadow-purple-500/15 border border-zinc-800">
                  <img 
                    src="https://i.postimg.cc/DZF2WXYD/aurlets.webp" 
                    alt="Aurlets" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </Tooltip>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight leading-none">Aurlets</h1>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">The Aura Farmers</span>
              </div>
            </div>

            {/* Connect Action Trigger / User profile dropdown (Desktop only) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {/* Notification Bell */}
              <Tooltip content={`Browser Notifications: ${notificationPermission === 'granted' ? 'Enabled 🔔' : 'Click to request permission 🔕'}`} position="bottom">
                <button
                  onClick={requestNotificationPermission}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-center relative active:scale-95 ${
                    notificationPermission === 'granted'
                      ? 'bg-emerald-950/20 border-emerald-900/35 text-emerald-400 hover:bg-emerald-950/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {notificationPermission === 'granted' ? (
                    <>
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    </>
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                </button>
              </Tooltip>

              {isLoggedIn ? (
                <div className="flex items-center gap-4 pl-3 border-l border-zinc-900">
                  {/* Aura Points Display */}
                  <Tooltip content="Your current balance. Earn points by playing games or going AFK." position="bottom">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-purple-400 cursor-help">
                      <Coins className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                      <span>{points} AP</span>
                    </div>
                  </Tooltip>

                  {/* Profile Badge */}
                  <Tooltip content={`Logged in as ${nickname}. Hover to see account actions.`} position="bottom">
                    <div className="flex items-center gap-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl p-1.5 pr-3 relative group">
                      <div className="relative">
                        <img
                          src={avatarUrl}
                          alt={nickname}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-lg object-cover relative z-10"
                          style={hasFrame ? {
                            border: `1.5px solid ${userFrameColor}`,
                            boxShadow: `0 0 8px ${userFrameColor}80`
                          } : {
                            border: '1px solid var(--color-zinc-800)'
                          }}
                        />
                        {hasFrame && (
                          <div className="absolute inset-0 rounded-lg animate-pulse pointer-events-none opacity-40" style={{ border: `1.5px solid ${userFrameColor}` }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span 
                          className="block text-xs font-bold leading-tight truncate max-w-[110px]"
                          style={userColor ? { color: userColor } : { color: 'var(--color-white)' }}
                        >
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
                          onClick={() => setShowTransferModal(true)}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-colors flex items-center gap-2 mt-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Points
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 mt-1 border-t border-zinc-900/40 pt-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Logout Profile
                        </button>
                      </div>
                    </div>
                  </Tooltip>
                </div>
              ) : (
                <Tooltip content="Log in using your Discord account to save progress & redeem codes" position="bottom">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow shadow-purple-500/10"
                  >
                    <DiscordIcon className="w-3.5 h-3.5 fill-white" />
                    Connect Profile
                  </button>
                </Tooltip>
              )}
              
              <Tooltip content="Visit our official Discord server to get help & meet members" position="bottom">
                <a
                  href="https://discord.gg/aurlets"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
                >
                  Join Server
                </a>
              </Tooltip>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex lg:hidden">
              <Tooltip content={mobileMenuOpen ? "Close menu" : "Open menu"} position="bottom">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Bottom Row: Navigation Items (Desktop only, centered and beautifully grouped) */}
          <div className="hidden lg:flex items-center justify-center border-t border-zinc-900/60 py-2 overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-1 flex-wrap justify-center max-w-full">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Tooltip key={item.id} content={item.tooltip} position="bottom">
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
                      {item.label}
                    </button>
                  </Tooltip>
                );
              })}
            </nav>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowTransferModal(true);
                          setMobileMenuOpen(false);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/35 text-purple-400 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Points
                      </button>
                      <button
                        onClick={() => {
                          requestNotificationPermission();
                          setMobileMenuOpen(false);
                        }}
                        className="py-2.5 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        {notificationPermission === 'granted' ? <Bell className="w-3.5 h-3.5 text-emerald-400" /> : <BellOff className="w-3.5 h-3.5 text-zinc-500" />}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-red-950/40 border border-red-900/30 text-red-400 text-xs font-bold flex items-center justify-center gap-2"
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
            discordConfigured={discordConfigured}
          />
        )}
      </AnimatePresence>

      {/* Global Points Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <TransferModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            senderName={nickname}
            senderPoints={points}
            onTransferSuccess={(newPoints, msg) => {
              setPoints(newPoints);
              sendBrowserNotification('Points Sent! 💸', msg);
            }}
            showNotice={(msg, type) => showGlobalNotice(msg, type === 'success' ? 'success' : 'error')}
          />
        )}
      </AnimatePresence>

      {/* Global Floating Toast Notice */}
      <AnimatePresence>
        {globalNotice && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              globalNotice.type === 'error'
                ? 'bg-red-950/80 border-red-900/50 text-red-300'
                : globalNotice.type === 'info'
                ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
                : 'bg-purple-950/80 border-purple-900/50 text-purple-300'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${
              globalNotice.type === 'error'
                ? 'bg-red-900/30'
                : globalNotice.type === 'info'
                ? 'bg-zinc-800/80'
                : 'bg-purple-900/30'
            }`}>
              {globalNotice.type === 'error' ? (
                <Shield className="w-4 h-4 text-red-400" />
              ) : globalNotice.type === 'info' ? (
                <Bell className="w-4 h-4 text-zinc-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <span className="text-xs font-semibold leading-snug">{globalNotice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Assistant Chatbot */}
      <Chatbot />
    </div>
  );
}
