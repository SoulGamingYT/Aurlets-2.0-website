import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Calendar, 
  Sparkles, 
  Coins, 
  Palette, 
  Upload, 
  Check, 
  Clock, 
  Terminal, 
  User, 
  ShieldAlert, 
  Eye, 
  Award, 
  Layers,
  Sparkle,
  Image as ImageIcon,
  Gift,
  Trash2
} from 'lucide-react';
import { DiscordIcon } from './Icons';
import { Tooltip } from './Tooltip';

interface CustomRole {
  id: string;
  creator: string;
  roleName: string;
  color: string;
  icon: string;
  createdAt: number;
}

interface ShopProps {
  isLoggedIn: boolean;
  nickname: string;
  avatarUrl: string;
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  onOpenAuthModal: () => void;
  discordUserId?: string;
}

const PRESET_ROLES = [
  { id: '1417575135279452221', name: 'Blossom 🌸', emoji: '🌸', price: 2500 },
  { id: '1417674566515560529', name: 'Overclocked ⚡', emoji: '⚡', price: 5000 },
  { id: '1417679884733649007', name: 'Shieldbearer 🛡️', emoji: '🛡️', price: 7500 },
  { id: '1423454938784075949', name: 'The Honored One', emoji: '💫', price: 10000 },
  { id: '1417681913069572267', name: 'Ribbon Rebel 🎀', emoji: '🎀', price: 12500 },
  { id: '1417688194098659389', name: 'Warrior ⚔️', emoji: '⚔️', price: 15000 },
  { id: '1417689418034319394', name: 'Guardian 🪽', emoji: '🪽', price: 17500 },
  { id: '1420103265298813009', name: 'Viber 🎧', emoji: '🎧', price: 20000 },
  { id: '1420108774445682719', name: 'Elite 💸', emoji: '💸', price: 22500 },
  { id: '1417692877227561064', name: 'Royal ⚜️', emoji: '⚜️', price: 25000 }
];

const LUXURY_COLORS = [
  { name: 'Aura Purple', hex: '#a855f7' },
  { name: 'Neon Mint', hex: '#10b981' },
  { name: 'Ice Blue', hex: '#06b6d4' },
  { name: 'Hot Pink', hex: '#f43f5e' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Crimson Fury', hex: '#ef4444' }
];

const PRESET_EMOJIS = ['👑', '⚔️', '🌸', '⚡', '🔥', '💎', '🎮', '💀', '🌙', '🍀', '✨', '☣️'];

export default function Shop({
  isLoggedIn,
  nickname,
  avatarUrl,
  points,
  setPoints,
  onOpenAuthModal,
  discordUserId
}: ShopProps) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'buy' | 'roles'>('buy');
  const [shopNotification, setShopNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotice = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setShopNotification({ message, type });
    setTimeout(() => {
      setShopNotification(prev => prev?.message === message ? null : prev);
    }, 6000);
  };
  
  // Daily Claim Cooldown State
  const [claimCooldown, setClaimCooldown] = useState<number | null>(null); // Time in ms remaining
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  // Custom Role Configurator State
  const [roleName, setRoleName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#a855f7');
  const [iconType, setIconType] = useState<'emoji' | 'upload'>('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState('👑');
  const [uploadedIconBase64, setUploadedIconBase64] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Purchase State
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'purchasing' | 'success' | 'error'>('idle');
  const [botLogs, setBotLogs] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [serverRoles, setServerRoles] = useState<CustomRole[]>([]);
  const [purchasedPresetIds, setPurchasedPresetIds] = useState<string[]>([]);
  const [isPurchasingPreset, setIsPurchasingPreset] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  // Dynamic Shop configurations
  const [customRolePriceState, setCustomRolePriceState] = useState<number>(49999);
  const [presetRolesList, setPresetRolesList] = useState<Array<{ id: string; name: string; emoji: string; price: number }>>(PRESET_ROLES);

  // Other cosmetic states purchased locally (for immediate client engagement)
  const [unlockedColor, setUnlockedColor] = useState<string | null>(() => localStorage.getItem('aurlets_unlocked_color'));
  const [unlockedFrame, setUnlockedFrame] = useState<boolean>(() => localStorage.getItem('aurlets_unlocked_frame') === 'true');
  const [frameColor, setFrameColor] = useState<string>(() => localStorage.getItem('aurlets_frame_color') || '#a855f7');

  // Editing Custom Role states
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleColor, setEditRoleColor] = useState('#ffffff');
  const [editRoleIcon, setEditRoleIcon] = useState('⭐');
  const [isEditingRole, setIsEditingRole] = useState(false);

  const updateNameColor = (hex: string) => {
    setUnlockedColor(hex);
    localStorage.setItem('aurlets_unlocked_color', hex);
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }
  };

  const updateFrameColor = (hex: string) => {
    setFrameColor(hex);
    localStorage.setItem('aurlets_frame_color', hex);
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleEditRole = async (roleId: string) => {
    if (!isLoggedIn) return;
    if (points < 500) {
      showNotice('Insufficient points! You need 500 AP to change style.', 'error');
      return;
    }
    setIsEditingRole(true);
    try {
      const res = await fetch('/api/shop/edit-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nickname,
          roleId,
          newColor: editRoleColor,
          newIcon: editRoleIcon,
          currentPoints: points
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update custom role.');
      }

      setPoints(data.newPoints);
      if (data.customRoles) {
        setServerRoles(data.customRoles);
      } else {
        setServerRoles(prev => prev.map(r => r.id === roleId ? { ...r, color: editRoleColor, icon: editRoleIcon } : r));
      }
      
      setEditingRoleId(null);
      showNotice('Custom role updated successfully for 500 AP!', 'success');
    } catch (err: any) {
      showNotice(err.message || 'Failed to update custom role.', 'error');
    } finally {
      setIsEditingRole(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logTerminalEndRef = useRef<HTMLDivElement>(null);

  // Promo code redemption state
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleRedeemCode = async () => {
    if (!isLoggedIn) {
      showNotice('Please log in or guest play first to redeem promo codes.', 'error');
      return;
    }
    if (!promoCode.trim()) return;

    setIsRedeeming(true);
    setRedeemMessage(null);

    try {
      const res = await fetch('/api/shop/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nickname,
          code: promoCode.toUpperCase().trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPoints(data.newPoints);
        setRedeemMessage({ text: data.message || 'Successfully redeemed code!', type: 'success' });
        setPromoCode('');
        showNotice(data.message || 'Successfully redeemed code!', 'success');
      } else {
        setRedeemMessage({ text: data.error || 'Failed to redeem code.', type: 'error' });
      }
    } catch (err: any) {
      setRedeemMessage({ text: err.message || 'Error occurred during redemption.', type: 'error' });
    } finally {
      setIsRedeeming(false);
    }
  };

  // --- TIME COOLDOWN HOOKS ---
  useEffect(() => {
    // Check local storage daily claim timestamp
    const checkCooldown = () => {
      const lastClaimTime = localStorage.getItem(`aurlets_last_claim_${nickname}`);
      if (lastClaimTime) {
        const lastClaim = parseInt(lastClaimTime);
        const now = Date.now();
        const COOLDOWN_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        if (now - lastClaim < COOLDOWN_DURATION) {
          setClaimCooldown(COOLDOWN_DURATION - (now - lastClaim));
        } else {
          setClaimCooldown(null);
        }
      } else {
        setClaimCooldown(null);
      }
    };

    checkCooldown();
    const timer = setInterval(checkCooldown, 1000);
    return () => clearInterval(timer);
  }, [nickname]);

  // Fetch created roles gallery
  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/shop/roles');
      if (res.ok) {
        const data = await res.json();
        setServerRoles(data);
      }
    } catch (err) {
      console.error('Error fetching custom roles:', err);
    }
  };

  const fetchPurchasedPresetRoles = async () => {
    if (!isLoggedIn || !nickname) return;
    try {
      const res = await fetch(`/api/shop/preset-purchases?username=${encodeURIComponent(nickname)}`);
      if (res.ok) {
        const data = await res.json();
        const ids = data.map((p: any) => p.roleId);
        setPurchasedPresetIds(ids);
      }
    } catch (err) {
      console.error('Error fetching preset purchases:', err);
    }
  };

  const fetchShopLiveConfig = async () => {
    try {
      const res = await fetch('/api/shop/config');
      if (res.ok) {
        const data = await res.json();
        if (data.customRolePrice !== undefined) {
          setCustomRolePriceState(data.customRolePrice);
        }
        if (data.presetRoles && Array.isArray(data.presetRoles)) {
          setPresetRolesList(data.presetRoles);
        }
      }
    } catch (err) {
      console.error('Error fetching live shop configuration:', err);
    }
  };

  useEffect(() => {
    fetchPurchasedPresetRoles();
  }, [isLoggedIn, nickname]);

  useEffect(() => {
    fetchRoles();
    fetchShopLiveConfig();
    const interval = setInterval(fetchRoles, 5000);
    return () => clearInterval(interval);
  }, []);

  // Log simulation player effect
  useEffect(() => {
    if (purchaseStatus === 'purchasing' && logIndex < botLogs.length) {
      const timer = setTimeout(() => {
        setLogIndex(prev => prev + 1);
        if (logTerminalEndRef.current) {
          logTerminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 700);
      return () => clearTimeout(timer);
    } else if (purchaseStatus === 'purchasing' && logIndex >= botLogs.length && botLogs.length > 0) {
      setPurchaseStatus('success');
      fetchRoles();
    }
  }, [purchaseStatus, logIndex, botLogs]);

  // --- DAILY CLAIM TRIGGER ---
  const handleDailyClaim = async () => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    
    setIsClaiming(true);
    setClaimSuccessMessage(null);

    try {
      const res = await fetch('/api/daily/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nickname, points })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server returned status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim reward');
      }

      setPoints(data.newPoints);
      localStorage.setItem(`aurlets_last_claim_${nickname}`, Date.now().toString());
      setClaimSuccessMessage(`Claimed successfully! You earned +${data.rewardAmount} Aura Points 🌟`);
    } catch (err: any) {
      console.error(err);
      showNotice(err.message || 'Error claiming daily reward.', 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  // --- DRAG AND DROP FILE HANDLERS ---
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotice('Please upload an image file (PNG, JPG, SVG).', 'error');
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      showNotice('File is too large! Please select an image under 1MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedIconBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- PURCHASE OTHER CATALOG ITEMS ---
  const purchaseNameColor = (hex: string) => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    const cost = 1000;
    if (points < cost) {
      showNotice('Insufficient Aura Points!', 'error');
      return;
    }

    setPoints(p => p - cost);
    setUnlockedColor(hex);
    localStorage.setItem('aurlets_unlocked_color', hex);
    showNotice(`Username style successfully unlocked and applied to your profile!`, 'success');
  };

  const purchaseAvatarFrame = () => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    const cost = 1500;
    if (points < cost) {
      showNotice('Insufficient Aura Points!', 'error');
      return;
    }

    setPoints(p => p - cost);
    setUnlockedFrame(true);
    localStorage.setItem('aurlets_unlocked_frame', 'true');
    showNotice('Radiant Profile Frame unlocked and applied! Admire your glowing border.', 'success');
  };

  // --- PURCHASE PRESET DISCORD ROLE ---
  const handlePresetPurchase = async (roleId: string) => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }

    const role = presetRolesList.find(r => r.id === roleId);
    if (!role) return;

    if (points < role.price) {
      showNotice('Insufficient points to purchase this role.', 'error');
      return;
    }

    setIsPurchasingPreset(roleId);
    try {
      const res = await fetch('/api/shop/purchase-preset-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nickname,
          roleId: roleId,
          currentPoints: points,
          discordUserId: discordUserId
        })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server returned status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to purchase preset role');
      }

      setPoints(data.newPoints);
      setPurchasedPresetIds(prev => [...prev, roleId]);
      showNotice(`Successfully purchased and assigned "${role.name}" role! Check your Discord profile!`, 'success');
    } catch (err: any) {
      console.error(err);
      showNotice(err.message || 'Error occurred while purchasing role.', 'error');
    } finally {
      setIsPurchasingPreset(null);
    }
  };

  // --- DELETE CUSTOM DISCORD ROLE ---
  const handleDeleteRole = async (roleId: string) => {
    if (!isLoggedIn || !nickname) return;
    
    if (!window.confirm("Are you sure you want to delete this custom role? This will also attempt to delete it from the Discord server (if connected) and cannot be undone.")) {
      return;
    }

    setDeletingRoleId(roleId);
    try {
      const res = await fetch('/api/shop/delete-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nickname,
          roleId: roleId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete custom role');
      }

      setServerRoles(data.customRoles || []);
      showNotice('Custom role deleted successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showNotice(err.message || 'Error occurred while deleting custom role.', 'error');
    } finally {
      setDeletingRoleId(null);
    }
  };

  // --- PURCHASE CUSTOM DISCORD ROLE ---
  const handleRolePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    if (!roleName.trim()) {
      showNotice('Please input a role name first.', 'error');
      return;
    }
    const cost = customRolePriceState;
    if (points < cost) {
      showNotice('Insufficient points to buy a custom role.', 'error');
      return;
    }

    setPurchaseStatus('purchasing');
    setLogIndex(0);
    setErrorMessage('');

    const iconVal = iconType === 'emoji' ? selectedEmoji : uploadedIconBase64;

    try {
      const res = await fetch('/api/shop/purchase-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nickname,
          roleName: roleName.trim(),
          color: selectedColor,
          icon: iconVal,
          currentPoints: points,
          discordUserId: discordUserId
        })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server returned status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Server rejected purchase');
      }

      setBotLogs(data.botLogs || []);
      setPoints(data.newPoints);
      if (data.role) {
        setServerRoles(prev => [data.role, ...prev]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred while creating custom role.');
      setPurchaseStatus('error');
    }
  };

  // Cooldown helper to format time
  const formatCooldown = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeIcon = iconType === 'emoji' ? selectedEmoji : uploadedIconBase64;

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-purple-400" /> Aurlets Reward Shop
        </h2>
        <p className="text-zinc-400 text-sm">
          Exchange your hard-earned Aura Points (AP) for premium digital features, custom profiles, and custom Discord server roles!
        </p>
      </div>

      {/* Global Notifications Toast/Banner */}
      <AnimatePresence>
        {shopNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border text-xs font-bold text-center ${
              shopNotification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : shopNotification.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
            }`}
          >
            {shopNotification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs Switcher & Points Monitor */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/20 p-4 border border-zinc-900 rounded-2xl">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'buy'
                ? 'bg-purple-600 text-white shadow shadow-purple-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            Catalog & Role Creator
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'roles'
                ? 'bg-purple-600 text-white shadow shadow-purple-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            Server Custom Roles ({serverRoles.length})
          </button>
        </div>

        {/* Current Balance */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <Coins className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-xs font-mono text-zinc-400">Your Aura Balance:</span>
            <span className="text-sm font-mono font-black text-purple-400">{points} AP</span>
          </div>
        </div>
      </div>

      {activeTab === 'buy' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDE: Daily Reward + Catalog Items */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* DAILY REWARD CARD */}
            <motion.div
              layout
              className="p-6 rounded-2xl bg-gradient-to-tr from-purple-950/20 via-zinc-950 to-indigo-950/10 border border-purple-900/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-left">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" /> Hourly Bonus
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                    Claim Daily Rewards
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                    Click once every 24 hours to receive a free, randomized injection of <span className="text-purple-300 font-bold">up to 10 Aura Points (AP)</span> straight to your account!
                  </p>
                </div>

                {/* Clock indicator / Action */}
                <div className="shrink-0 flex flex-col items-center">
                  {claimCooldown !== null ? (
                    <div className="space-y-1 text-center">
                      <div className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-sm font-bold text-rose-400 flex items-center gap-1.5 justify-center">
                        <Clock className="w-4 h-4 animate-spin" /> {formatCooldown(claimCooldown)}
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono tracking-wide uppercase font-semibold">Cooldown Running</span>
                    </div>
                  ) : (
                    <Tooltip content="Instantly gain a free daily allowance of up to 10 Aura Points!" position="top">
                      <button
                        onClick={handleDailyClaim}
                        disabled={isClaiming}
                        className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all active:scale-95 shadow shadow-purple-500/20 uppercase tracking-wider flex items-center gap-2 animate-bounce"
                      >
                        <Sparkles className="w-4 h-4" /> Claim Daily Bonus
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Message Banner */}
              <AnimatePresence>
                {claimSuccessMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-center font-bold"
                  >
                    {claimSuccessMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* REDEEM PROMO CODE CARD */}
            <motion.div
              layout
              className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-900/80 space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3">
                <span className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                  <Gift className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Redeem Promo Code</h3>
                  <p className="text-[11px] text-zinc-500">Claim your free Aura Points (AP) voucher codes generated by admins!</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER PROMO CODE (e.g. AURLETS100)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={isRedeeming}
                  className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-850 rounded-xl focus:border-pink-500 focus:outline-none text-xs font-mono text-white placeholder-zinc-600 uppercase"
                />
                <button
                  onClick={handleRedeemCode}
                  disabled={isRedeeming || !promoCode.trim()}
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-xl transition-all uppercase font-mono shrink-0"
                >
                  {isRedeeming ? 'Redeeming...' : 'Redeem'}
                </button>
              </div>

              <AnimatePresence>
                {redeemMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3 rounded-xl text-xs font-bold text-center ${
                      redeemMessage.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    }`}
                  >
                    {redeemMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* DISCORD PRESET ROLES SHOP CATEGORY */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <h3 className="text-sm uppercase font-mono tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400 animate-pulse" /> 🎭 Premium Server Roles Shop
                </h3>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                  Auto-Assigned On Discord
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presetRolesList.map((role) => {
                  const isOwned = purchasedPresetIds.includes(role.id);
                  const isPointsEnough = points >= role.price;
                  const isPending = isPurchasingPreset === role.id;

                  return (
                    <div 
                      key={role.id} 
                      id={`preset-role-card-${role.id}`}
                      className={`p-5 rounded-xl border bg-zinc-900/10 space-y-4 flex flex-col justify-between transition-all duration-300 ${
                        isOwned 
                          ? 'border-emerald-500/30 bg-emerald-950/5 font-bold' 
                          : 'border-zinc-850 hover:border-zinc-700/80 hover:bg-zinc-900/20'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl shrink-0 select-none">{role.emoji}</span>
                            <span className="text-sm font-bold text-white tracking-tight truncate">{role.name}</span>
                          </div>
                          <span className="text-xs font-mono font-black text-purple-400 bg-purple-500/5 px-2.5 py-1 rounded-lg border border-purple-500/10 shrink-0">
                            {role.price} AP
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-400 leading-normal">
                            Instantly rewards you with the <span className="text-white font-semibold">@{role.name}</span> role on our official Discord server.
                          </p>
                          <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 break-all select-all">
                            <span className="text-zinc-600 font-semibold select-none">ROLE ID:</span> {role.id}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {isOwned ? (
                          <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold font-mono text-center flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" /> Purchased &amp; Active
                          </div>
                        ) : !isLoggedIn ? (
                          <button
                            type="button"
                            id={`btn-preset-connect-${role.id}`}
                            onClick={onOpenAuthModal}
                            className="w-full py-2.5 rounded-lg text-xs font-bold transition-all bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white uppercase flex items-center justify-center gap-1.5"
                          >
                            <DiscordIcon className="w-3.5 h-3.5 fill-current" /> Connect Discord
                          </button>
                        ) : (
                          <button
                            type="button"
                            id={`btn-preset-buy-${role.id}`}
                            disabled={!isPointsEnough || isPending}
                            onClick={() => handlePresetPurchase(role.id)}
                            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all uppercase flex items-center justify-center gap-1.5 ${
                              isPending
                                ? 'bg-purple-600/50 text-white cursor-wait'
                                : !isPointsEnough
                                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-97'
                            }`}
                          >
                            {isPending ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Coins className="w-3.5 h-3.5" />
                                Buy for {role.price} AP
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COSMETIC PROFILE CATALOG */}
            <div className="space-y-4">
              <h3 className="text-sm uppercase font-mono tracking-wider text-zinc-500 font-bold">🛒 General Profiles Shop Catalog</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Product 1: Custom Name color */}
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/10 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
                        <Palette className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-400">1000 AP</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">Custom Name Color Style</h4>
                    <p className="text-xs text-zinc-400 leading-normal">
                      Unlock the ability to change your username color to any custom color across the entire platform.
                    </p>
                  </div>
                  
                  {unlockedColor ? (
                    <div className="space-y-3 pt-2 border-t border-zinc-850">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">Pick Your Favorite Color:</div>
                      
                      {/* Presets Grid */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: 'Cyan', hex: '#06b6d4' },
                          { name: 'Pink', hex: '#ec4899' },
                          { name: 'Purple', hex: '#a855f7' },
                          { name: 'Emerald', hex: '#10b981' },
                          { name: 'Orange', hex: '#f97316' },
                          { name: 'Gold', hex: '#eab308' },
                          { name: 'Red', hex: '#ef4444' },
                          { name: 'White', hex: '#ffffff' }
                        ].map((p) => (
                          <button
                            key={p.hex}
                            type="button"
                            onClick={() => updateNameColor(p.hex)}
                            className={`w-6 h-6 rounded-full border transition-all ${
                              unlockedColor === p.hex 
                                ? 'border-white scale-110 shadow-lg' 
                                : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                            }`}
                            style={{ backgroundColor: p.hex }}
                            title={p.name}
                          />
                        ))}

                        {/* Custom Color Picker Input */}
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-zinc-700/60 bg-zinc-900 hover:border-zinc-500 cursor-pointer flex items-center justify-center">
                          <input
                            type="color"
                            value={unlockedColor}
                            onChange={(e) => updateNameColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            title="Choose Custom Color"
                          />
                          <span className="text-[10px] pointer-events-none">🎨</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-zinc-950/60 p-2 rounded-lg border border-zinc-900">
                        <span className="text-[9px] font-mono text-zinc-500">Equipped Color:</span>
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ color: unlockedColor, backgroundColor: `${unlockedColor}12` }}>
                          {unlockedColor.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => purchaseNameColor('#06b6d4')}
                      className="w-full py-2.5 rounded-lg text-xs font-bold transition-all bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white"
                    >
                      Deduct 1000 AP & Equip
                    </button>
                  )}
                </div>

                {/* Product 2: Avatar Glow border */}
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/10 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                        <Award className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-400">1500 AP</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">Radiant Avatar Frame</h4>
                    <p className="text-xs text-zinc-400 leading-normal">
                      Unlocks an animated glowing custom border wrapping your avatar photo in rosters, logs, and pages.
                    </p>
                  </div>
                  
                  {unlockedFrame ? (
                    <div className="space-y-3 pt-2 border-t border-zinc-850">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">Pick Your Frame Color:</div>
                      
                      {/* Presets Grid */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: 'Cosmic Purple', hex: '#a855f7' },
                          { name: 'Ruby Glow', hex: '#ef4444' },
                          { name: 'Ocean Cyan', hex: '#06b6d4' },
                          { name: 'Emerald Glow', hex: '#10b981' },
                          { name: 'Sunset Orange', hex: '#f97316' },
                          { name: 'Golden Sunrise', hex: '#eab308' },
                          { name: 'Royal White', hex: '#ffffff' }
                        ].map((p) => (
                          <button
                            key={p.hex}
                            type="button"
                            onClick={() => updateFrameColor(p.hex)}
                            className={`w-6 h-6 rounded-full border transition-all ${
                              frameColor === p.hex 
                                ? 'border-white scale-110 shadow-lg' 
                                : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                            }`}
                            style={{ backgroundColor: p.hex }}
                            title={p.name}
                          />
                        ))}

                        {/* Custom Color Picker Input */}
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-zinc-700/60 bg-zinc-900 hover:border-zinc-500 cursor-pointer flex items-center justify-center">
                          <input
                            type="color"
                            value={frameColor}
                            onChange={(e) => updateFrameColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            title="Choose Custom Color"
                          />
                          <span className="text-[10px] pointer-events-none">🎨</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-zinc-950/60 p-2 rounded-lg border border-zinc-900">
                        <span className="text-[9px] font-mono text-zinc-500">Frame Color:</span>
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ color: frameColor, backgroundColor: `${frameColor}12` }}>
                          {frameColor.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={purchaseAvatarFrame}
                      className="w-full py-2.5 rounded-lg text-xs font-bold transition-all bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white"
                    >
                      Deduct 1500 AP & Equip
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* COMPREHENSIVE CUSTOM DISCORD ROLE INSTRUCTIONS */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3.5 text-xs text-zinc-400 leading-relaxed">
              <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Premium Custom Role Mechanics
              </span>
              <p>
                The premium Custom Discord Role costs <span className="text-purple-400 font-black">{customRolePriceState} AP</span>. Upon purchase:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-1.5">
                <li>The website securely calls our connected Discord Bot.</li>
                <li>The bot creates the role on our guild with your preferred name & color.</li>
                <li>The bot uploads your custom role icon or sets your preferred emoji emblem.</li>
                <li>The bot re-orders role positions so yours sits <span className="text-white font-bold">directly ABOVE the Server Booster role</span>, allowing your custom name to render at the top of member side-panels!</li>
                <li>The role is automatically awarded to your logged-in Discord account!</li>
              </ul>
            </div>

          </div>

          {/* RIGHT SIDE: Custom Role Configurator & Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" /> Custom Role Creator Wizard
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Design your role details in real-time below.</p>
              </div>

              {purchaseStatus === 'purchasing' ? (
                /* Simulated Console Loader */
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
                    <Terminal className="w-4 h-4 animate-pulse" /> Connecting bot gateway...
                  </div>
                  <div className="h-56 bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 overflow-hidden font-mono text-[10px] text-zinc-400 leading-normal space-y-2">
                    {botLogs.slice(0, logIndex).map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-purple-400 shrink-0 select-none">&gt;</span>
                        <span className={log.includes('[SUCCESS]') ? 'text-emerald-400' : log.includes('[EXEC]') ? 'text-cyan-300' : 'text-zinc-400'}>{log}</span>
                      </div>
                    ))}
                    <div ref={logTerminalEndRef} />
                  </div>
                  <p className="text-[10px] text-zinc-500 text-center animate-pulse">
                    Please stand by, the Discord bot is restructuring guild hierarchy...
                  </p>
                </div>
              ) : purchaseStatus === 'success' ? (
                /* Success screen */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 text-center py-6"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Custom Role Created!</h4>
                    <p className="text-xs text-zinc-400 leading-normal max-w-xs mx-auto">
                      Your premium role <span className="font-bold text-white">"{roleName}"</span> has been deployed on the Discord server above Booster roles and added to your profile!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPurchaseStatus('idle');
                      setRoleName('');
                    }}
                    className="px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-mono text-[11px] font-bold transition-all"
                  >
                    Build Another Role
                  </button>
                </motion.div>
              ) : (
                /* Main wizard configurator form */
                <form onSubmit={handleRolePurchase} className="space-y-5">
                  
                  {/* Role Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400">Role Display Name</label>
                    <input
                      type="text"
                      maxLength={32}
                      required
                      placeholder="e.g. God of Aura"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-purple-500 focus:outline-none text-xs text-white"
                    />
                  </div>

                  {/* Role Color */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-400 flex justify-between">
                      <span>Role Display Color</span>
                      <span className="font-mono text-[10px] text-purple-400 font-bold">{selectedColor}</span>
                    </label>
                    
                    {/* Presets */}
                    <div className="flex flex-wrap gap-2">
                      {LUXURY_COLORS.map((col) => (
                        <button
                          type="button"
                          key={col.hex}
                          onClick={() => setSelectedColor(col.hex)}
                          className={`w-7 h-7 rounded-lg relative transition-all active:scale-90 border-2 ${
                            selectedColor === col.hex ? 'border-white scale-105 shadow-md' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        />
                      ))}
                      
                      {/* Native Custom Color Picker */}
                      <div className="relative w-7 h-7 rounded-lg border border-zinc-800 overflow-hidden shrink-0">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="absolute inset-0 w-12 h-12 -translate-x-2.5 -translate-y-2.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role Icon selector */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-1">
                      <label className="text-xs font-mono text-zinc-400">Role Icon Emblem</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setIconType('emoji')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            iconType === 'emoji' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Emoji presets
                        </button>
                        <button
                          type="button"
                          onClick={() => setIconType('upload')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            iconType === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Upload Image
                        </button>
                      </div>
                    </div>

                    {iconType === 'emoji' ? (
                      <div className="grid grid-cols-6 gap-2">
                        {PRESET_EMOJIS.map((emo) => (
                          <button
                            type="button"
                            key={emo}
                            onClick={() => setSelectedEmoji(emo)}
                            className={`py-1.5 rounded-lg text-sm transition-all border ${
                              selectedEmoji === emo && iconType === 'emoji'
                                ? 'bg-purple-500/10 border-purple-500/40 scale-105 font-bold text-white'
                                : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-800 hover:bg-zinc-900 text-zinc-400'
                            }`}
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                          isDragging 
                            ? 'border-purple-500 bg-purple-500/5' 
                            : uploadedIconBase64 
                              ? 'border-emerald-500/40 bg-zinc-900/20' 
                              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/10'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        {uploadedIconBase64 ? (
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={uploadedIconBase64}
                              alt="Uploaded icon"
                              className="w-10 h-10 object-contain rounded border border-zinc-800"
                            />
                            <span className="text-[10px] text-emerald-400 font-bold">Image loaded successfully!</span>
                            <span className="text-[9px] text-zinc-500">Click to change image</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-zinc-500">
                            <Upload className="w-5 h-5 text-zinc-600 animate-pulse" />
                            <p className="text-[10px]">
                              Drag & drop role icon image here, or <span className="text-purple-400 hover:underline">browse files</span>
                            </p>
                            <span className="text-[9px] text-zinc-600">(PNG, JPG, SVG - max 1MB)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Real-time Discord Profile Preview */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Live Discord Badge Preview
                    </span>

                    {/* Discord Card Mockup */}
                    <div className="rounded-xl border border-zinc-900 bg-[#1e1f22] p-4 font-sans text-xs select-none">
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <img
                            src={avatarUrl}
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1e1f22] rounded-full" />
                        </div>

                        {/* Text and Badges */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[#f2f3f5] text-[13px] hover:underline cursor-pointer truncate max-w-[140px]">
                              {nickname || 'DiscordUser'}
                            </span>
                            <span className="bg-[#5865f2] text-white font-mono text-[8px] font-bold uppercase px-1 py-0.2 rounded-sm select-none">
                              USER
                            </span>
                          </div>

                          {/* Role Badges Array */}
                          <div className="flex flex-wrap gap-1.5">
                            {/* Created Custom Role Badge */}
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2b2d31] border border-zinc-850 hover:bg-[#35373c] cursor-pointer text-[10px] font-semibold transition-colors shrink-0">
                              {/* Icon rendering */}
                              {iconType === 'emoji' ? (
                                <span className="text-[11px]">{selectedEmoji}</span>
                              ) : uploadedIconBase64 ? (
                                <img
                                  src={uploadedIconBase64}
                                  alt=""
                                  className="w-3.5 h-3.5 object-contain"
                                />
                              ) : (
                                <Sparkle className="w-3 h-3" style={{ color: selectedColor }} />
                              )}
                              <span style={{ color: selectedColor }}>{roleName.trim() || 'Custom Role Name'}</span>
                            </span>

                            {/* Booster default role below */}
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2b2d31] border border-zinc-850 text-[#ff73fa] text-[10px] font-semibold shrink-0">
                              <span>💖</span> Server Booster
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit purchase */}
                  <div className="pt-2">
                    {!isLoggedIn ? (
                      <Tooltip content="Sign in with Discord first to buy a custom role" position="top">
                        <button
                          type="button"
                          onClick={onOpenAuthModal}
                          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                          <DiscordIcon className="w-4 h-4 fill-white" /> Connect Profile to Create
                        </button>
                      </Tooltip>
                    ) : (
                      <Tooltip content={`Spend ${customRolePriceState} AP to create a server-wide role with custom name and style`} position="top">
                        <button
                          type="submit"
                          disabled={points < customRolePriceState || !roleName.trim() || (serverRoles.filter(r => r.creator === nickname).length >= 2)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-98 shadow-lg shadow-purple-600/10 flex items-center justify-center gap-1.5"
                        >
                          <Coins className="w-4 h-4" /> Deduct {customRolePriceState} AP &amp; Create Role
                        </button>
                      </Tooltip>
                    )}
                  </div>

                  {/* Warning banner */}
                  {serverRoles.filter(r => r.creator === nickname).length >= 2 && isLoggedIn && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 leading-normal flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                      <span>You have reached the limit of 2 custom roles. You cannot purchase or create any more custom roles.</span>
                    </div>
                  )}

                  {points < 350 && isLoggedIn && serverRoles.filter(r => r.creator === nickname).length < 2 && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-300 leading-normal flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>You do not have enough Aura Points (AP). Claim your Daily Reward or leave this website open in the AFK room to farm more!</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-[10px] text-red-400">
                      {errorMessage}
                    </div>
                  )}

                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SERVER CUSTOM ROLES GALLERY TAB */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <div>
              <h3 className="text-sm uppercase font-mono tracking-wider text-zinc-500 font-bold">🎖 Community Created Roles Gallery</h3>
              <p className="text-xs text-zinc-500 mt-1">Check out premium custom server roles made by community members.</p>
            </div>
          </div>

          {serverRoles.length === 0 ? (
            <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs font-mono space-y-2">
              <Award className="w-8 h-8 text-zinc-600 mx-auto animate-pulse" />
              <p>No member has created a custom role yet. Be the first to buy one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serverRoles.map((role) => {
                const isEditing = editingRoleId === role.id;
                
                return (
                  <div
                    key={role.id}
                    className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/20 hover:border-zinc-800 transition-all flex flex-col gap-3"
                  >
                    {isEditing ? (
                      // INLINE EDIT FORM FOR 500 AP
                      <div className="space-y-3 w-full">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                            ✏️ Edit Style (-500 AP)
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingRoleId(null)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono"
                          >
                            Cancel
                          </button>
                        </div>
                        
                        {/* New Color Selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-400 uppercase">Role Color:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editRoleColor}
                              onChange={(e) => setEditRoleColor(e.target.value)}
                              className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900 cursor-pointer p-0.5"
                            />
                            <span className="text-xs font-mono text-zinc-300 uppercase">{editRoleColor}</span>
                          </div>
                        </div>

                        {/* New Icon Selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-400 uppercase">Role Icon (Emoji/Char):</label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              maxLength={2}
                              value={editRoleIcon}
                              onChange={(e) => setEditRoleIcon(e.target.value)}
                              className="w-12 py-1 px-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-center font-bold text-white focus:outline-none focus:border-purple-500"
                            />
                            <div className="flex flex-wrap gap-1">
                              {['⭐', '👑', '💎', '🔥', '⚡', '🌸', '🍒', '🔮', '⚔️'].map((emo) => (
                                <button
                                  key={emo}
                                  type="button"
                                  onClick={() => setEditRoleIcon(emo)}
                                  className={`w-5 h-5 rounded text-xs flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border ${
                                    editRoleIcon === emo ? 'border-purple-500' : 'border-zinc-800'
                                  }`}
                                >
                                  {emo}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isEditingRole || points < 500}
                          onClick={() => handleEditRole(role.id)}
                          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 shadow-lg shadow-amber-500/5 mt-1"
                        >
                          {isEditingRole ? (
                            <>
                              <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5" /> Save Style (-500 AP)
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      // NORMAL ROLE CARD VIEW
                      <>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Role Icon */}
                            <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-base shrink-0 select-none">
                              {role.icon ? (
                                role.icon.startsWith('data:image') ? (
                                  <img src={role.icon} alt="" className="w-6 h-6 object-contain" />
                                ) : (
                                  <span>{role.icon}</span>
                                )
                              ) : (
                                <Sparkle className="w-4 h-4" style={{ color: role.color }} />
                              )}
                            </div>

                            {/* Text block */}
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold truncate" style={{ color: role.color }}>
                                {role.roleName}
                              </h4>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                By <span className="text-zinc-400 font-bold">{role.creator}</span>
                              </p>
                            </div>
                          </div>

                          <div className="px-2 py-1 rounded bg-[#ff73fa]/5 border border-[#ff73fa]/20 text-[9px] font-bold text-[#ff73fa] font-mono whitespace-nowrap">
                            Above Booster
                          </div>
                        </div>

                        {/* Owner buttons row */}
                        {isLoggedIn && nickname === role.creator && (
                          <div className="flex gap-2 border-t border-zinc-900/60 pt-2.5 mt-0.5 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRoleId(role.id);
                                setEditRoleColor(role.color || '#ffffff');
                                setEditRoleIcon(role.icon || '⭐');
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/25 transition-all flex items-center gap-1"
                              title="Change color and icon for 500 AP"
                            >
                              ✏️ Edit Style (500 AP)
                            </button>

                            <button
                              type="button"
                              disabled={deletingRoleId === role.id}
                              onClick={() => handleDeleteRole(role.id)}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/30 hover:border-red-900/50 hover:bg-red-950/40 transition-all flex items-center gap-1 disabled:opacity-50"
                              title="Delete this role from server"
                            >
                              {deletingRoleId === role.id ? (
                                <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Role
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
