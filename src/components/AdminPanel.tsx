import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Gift, 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  Database, 
  Download, 
  Upload, 
  Image, 
  X,
  Wrench,
  Calendar,
  Coins
} from 'lucide-react';

interface AdminPanelProps {
  adminDiscordId: string;
  adminUsername: string;
  discordConfigured: boolean;
  onPointsUpdated?: (newPoints: number) => void;
}

interface Farmer {
  name: string;
  points: number;
  spinVouchers?: number;
  avatarUrl: string;
}

interface RedeemCode {
  code: string;
  rewardAmount: number;
  maxUses: number;
  uses: number;
  redeemedBy: string[];
  createdAt: number;
  rewardType?: 'points' | 'voucher';
}

export interface AuditReport {
  timestamp: number;
  totalUsers: number;
  totalPoints: number;
  unusuallyHighEarners: Array<{ username: string; points: number }>;
  userPointsSnapshot: Record<string, number>;
  changes: Array<{ username: string; oldPoints: number; newPoints: number; diff: number }>;
}

export default function AdminPanel({
  adminDiscordId,
  adminUsername,
  discordConfigured,
  onPointsUpdated
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'codes' | 'audit' | 'backup' | 'puzzles' | 'maintenance' | 'shop' | 'heist'>('users');
  
  // States for Shop Config
  const [customRolePrice, setCustomRolePrice] = useState<number>(49999);
  const [presetRoles, setPresetRoles] = useState<Array<{ id: string; name: string; emoji: string; price: number }>>([]);
  const [dailyLimit, setDailyLimit] = useState<number>(1);
  const [isSavingShopConfig, setIsSavingShopConfig] = useState<boolean>(false);
  const [isLoadingShopConfig, setIsLoadingShopConfig] = useState<boolean>(false);
  
  // States for Puzzle Images approval
  const [pendingPuzzles, setPendingPuzzles] = useState<Array<{ id: string; url: string; uploadedBy: string; approved: boolean; createdAt: number }>>([]);
  const [allPuzzles, setAllPuzzles] = useState<Array<{ id: string; url: string; uploadedBy: string; approved: boolean; createdAt: number }>>([]);
  const [isLoadingPuzzles, setIsLoadingPuzzles] = useState(false);
  const [puzzleViewTab, setPuzzleViewTab] = useState<'pending' | 'approved'>('pending');
  
  const [directUrl, setDirectUrl] = useState('');
  const [directFileBase64, setDirectFileBase64] = useState('');
  const [directFileName, setDirectFileName] = useState('');
  const [directSubType, setDirectSubType] = useState<'url' | 'file'>('url');
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  
  // States for Backup/Restore system
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupStats, setBackupStats] = useState<{ usersCount: number; customRolesCount: number; redeemCodesCount: number; exportedAt: number } | null>(null);
  
  // Backups History States
  const [backupsHistory, setBackupsHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackupId, setIsRestoringBackupId] = useState<string | null>(null);
  
  // States for User Management
  const [users, setUsers] = useState<Farmer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userPointsAction, setUserPointsAction] = useState<Record<string, { value: string; mode: 'add' | 'subtract' | 'set'; type: 'points' | 'vouchers' }>>({});

  // States for Code Management
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeReward, setNewCodeReward] = useState('100');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('50');
  const [newCodeRewardType, setNewCodeRewardType] = useState<'points' | 'voucher'>('points');

  // States for Points Audit
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [lastAuditTimestamp, setLastAuditTimestamp] = useState<number | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isTriggeringAudit, setIsTriggeringAudit] = useState(false);

  // States for Maintenance Mode settings
  const [maintenanceEnabled, setMaintenanceEnabled] = useState<boolean>(false);
  const [maintenanceFullWebsite, setMaintenanceFullWebsite] = useState<boolean>(false);
  const [maintenanceCategories, setMaintenanceCategories] = useState<string[]>([]);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState<boolean>(false);

  // Heist/Vault Admin States
  const [adminVaultBalance, setAdminVaultBalance] = useState<number>(0);
  const [vaultTxAmount, setVaultTxAmount] = useState<string>('');
  const [vaultTxAction, setVaultTxAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [scheduleVaultName, setScheduleVaultName] = useState<string>('');
  const [scheduleTargetAmount, setScheduleTargetAmount] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [adminUpcomingHeists, setAdminUpcomingHeists] = useState<any[]>([]);
  const [isSubmittingVaultTx, setIsSubmittingVaultTx] = useState<boolean>(false);
  const [isSchedulingHeist, setIsSchedulingHeist] = useState<boolean>(false);

  // General feedback notice
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => {
      setNotice(prev => prev?.message === message ? null : prev);
    }, 5000);
  };

  // --- FETCHING FUNCTIONS ---
  const fetchVaultAndHeists = async () => {
    try {
      const res = await fetch(`/api/team/info?name=${encodeURIComponent(adminUsername)}`);
      if (res.ok) {
        const data = await res.json();
        setAdminVaultBalance(data.serverVault || 0);
        setAdminUpcomingHeists(data.upcomingHeists || []);
      }
    } catch (err) {
      console.error('Failed to load admin vault details:', err);
    }
  };

  const handleVaultTransaction = async () => {
    const value = parseInt(vaultTxAmount, 10);
    if (isNaN(value) || value <= 0) {
      showNotice('Please enter a valid positive transaction amount.', 'error');
      return;
    }
    setIsSubmittingVaultTx(true);
    try {
      const res = await fetch('/api/admin/vault/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({ amount: value, action: vaultTxAction })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice(data.message, 'success');
        setVaultTxAmount('');
        fetchVaultAndHeists();
      } else {
        showNotice(data.error || 'Failed to process vault transaction.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message, 'error');
    } finally {
      setIsSubmittingVaultTx(false);
    }
  };

  const handleScheduleHeist = async () => {
    if (!scheduleVaultName.trim() || !scheduleTargetAmount || !scheduleTime) {
      showNotice('Please fill in all heist scheduling fields.', 'error');
      return;
    }
    const target = parseInt(scheduleTargetAmount, 10);
    if (isNaN(target) || target <= 0) {
      showNotice('Please enter a valid target amount.', 'error');
      return;
    }
    setIsSchedulingHeist(true);
    try {
      const res = await fetch('/api/admin/heist/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({
          vaultName: scheduleVaultName.trim(),
          targetAmount: target,
          scheduledAt: scheduleTime
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice(data.message, 'success');
        setScheduleVaultName('');
        setScheduleTargetAmount('');
        setScheduleTime('');
        fetchVaultAndHeists();
      } else {
        showNotice(data.error || 'Failed to schedule heist.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message, 'error');
    } finally {
      setIsSchedulingHeist(false);
    }
  };

  const handleUnscheduleHeist = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel and unschedule this heist?')) return;
    try {
      const res = await fetch('/api/admin/heist/unschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice(data.message, 'success');
        fetchVaultAndHeists();
      } else {
        showNotice(data.error || 'Failed to cancel heist.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message, 'error');
    }
  };
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.text();
        console.error('Failed to load users:', err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchCodes = async () => {
    setIsLoadingCodes(true);
    try {
      const res = await fetch('/api/admin/codes', {
        headers: {
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
      } else {
        const err = await res.text();
        console.error('Failed to load codes:', err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCodes(false);
    }
  };

  const fetchPuzzles = async () => {
    setIsLoadingPuzzles(true);
    try {
      const headers = {
        'x-admin-discord-id': adminDiscordId,
        'x-admin-username': adminUsername
      };
      
      const [pendingRes, allRes] = await Promise.all([
        fetch(`/api/puzzle/pending?adminDiscordId=${adminDiscordId}&adminUsername=${adminUsername}`, { headers }),
        fetch(`/api/puzzle/all?adminDiscordId=${adminDiscordId}&adminUsername=${adminUsername}`, { headers })
      ]);

      if (pendingRes.ok) {
        setPendingPuzzles(await pendingRes.json());
      }
      if (allRes.ok) {
        const allData = await allRes.json();
        setAllPuzzles(allData);
      }
    } catch (err) {
      console.error('Error fetching admin puzzles list:', err);
    } finally {
      setIsLoadingPuzzles(false);
    }
  };

  const approvePuzzle = async (id: string) => {
    try {
      const res = await fetch('/api/puzzle/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({ id, adminDiscordId, adminUsername })
      });
      if (res.ok) {
        showNotice('Custom puzzle image approved successfully!');
        setPendingPuzzles(prev => prev.filter(p => p.id !== id));
        fetchPuzzles();
      } else {
        const errData = await res.json();
        showNotice(errData.error || 'Failed to approve image', 'error');
      }
    } catch (err) {
      console.error('[APPROVE ERROR]', err);
      showNotice('Network error approving puzzle image', 'error');
    }
  };

  const rejectPuzzle = async (id: string) => {
    try {
      const res = await fetch('/api/puzzle/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({ id, adminDiscordId, adminUsername })
      });
      if (res.ok) {
        showNotice('Custom puzzle image rejected and deleted.');
        setPendingPuzzles(prev => prev.filter(p => p.id !== id));
        fetchPuzzles();
      } else {
        const errData = await res.json();
        showNotice(errData.error || 'Failed to reject image', 'error');
      }
    } catch (err) {
      console.error('[REJECT ERROR]', err);
      showNotice('Network error rejecting puzzle image', 'error');
    }
  };

  const deletePuzzle = async (id: string) => {
    try {
      const res = await fetch('/api/puzzle/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({ id, adminDiscordId, adminUsername })
      });
      if (res.ok) {
        showNotice('Puzzle image/level permanently deleted.');
        setPendingPuzzles(prev => prev.filter(p => p.id !== id));
        setAllPuzzles(prev => prev.filter(p => p.id !== id));
        fetchPuzzles();
      } else {
        const errData = await res.json();
        showNotice(errData.error || 'Failed to delete level', 'error');
      }
    } catch (err) {
      console.error('[DELETE ERROR]', err);
      showNotice('Network error deleting puzzle level', 'error');
    }
  };

  const handleDirectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      showNotice('⚠️ Image size must be smaller than 2.5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setDirectFileBase64(base64);
      setDirectFileName(file.name);
    };
    reader.onerror = (err) => {
      console.error(err);
      showNotice('Error reading image file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const addDirectPuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = '';
    
    if (directSubType === 'url') {
      if (!directUrl.trim()) return;
      finalUrl = directUrl.trim();
    } else {
      if (!directFileBase64) {
        showNotice('⚠️ Please select a file to upload first.', 'error');
        return;
      }
      finalUrl = directFileBase64;
    }

    setIsDirectUploading(true);
    try {
      const res = await fetch('/api/puzzle/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({ url: finalUrl, name: `${adminUsername} (Admin)` })
      });

      if (res.ok) {
        showNotice('✅ Direct approved puzzle level created successfully!', 'success');
        setDirectUrl('');
        setDirectFileBase64('');
        setDirectFileName('');
        const fileInput = document.getElementById('admin-puzzle-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchPuzzles();
      } else {
        const data = await res.json();
        showNotice(data.error || 'Failed to create level.', 'error');
      }
    } catch (err) {
      console.error('Error creating level:', err);
      showNotice('Network error creating puzzle level.', 'error');
    } finally {
      setIsDirectUploading(false);
    }
  };

  const fetchAuditReports = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch('/api/admin/audit-reports', {
        headers: {
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditReports(data.auditReports || []);
        setLastAuditTimestamp(data.lastAuditTimestamp || null);
      } else {
        const err = await res.text();
        console.error('Failed to load audit reports:', err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const triggerManualAudit = async () => {
    setIsTriggeringAudit(true);
    try {
      const res = await fetch('/api/admin/audit-reports/run', {
        method: 'POST',
        headers: {
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditReports(data.auditReports || []);
        setLastAuditTimestamp(data.lastAuditTimestamp || null);
        showNotice('Audit check run successfully and logs generated!', 'success');
      } else {
        const err = await res.text();
        showNotice(`Failed to run audit check: ${err}`, 'error');
      }
    } catch (err: any) {
      showNotice(`Audit check error: ${err.message || err}`, 'error');
    } finally {
      setIsTriggeringAudit(false);
    }
  };

  const fetchBackupsHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/admin/backups/history', {
        headers: {
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBackupsHistory(data.history || []);
      }
    } catch (err: any) {
      console.error('Error fetching backups history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchMaintenanceSettings = async () => {
    try {
      const res = await fetch('/api/maintenance/status');
      if (res.ok) {
        const data = await res.json();
        setMaintenanceEnabled(data.enabled);
        setMaintenanceFullWebsite(data.fullWebsite);
        setMaintenanceCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching maintenance settings:', err);
    }
  };

  const handleSaveMaintenance = async () => {
    setIsSavingMaintenance(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({
          enabled: maintenanceEnabled,
          fullWebsite: maintenanceFullWebsite,
          categories: maintenanceCategories
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotice('Maintenance settings successfully updated and applied!', 'success');
      } else {
        showNotice(data.error || 'Failed to update maintenance settings.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error saving maintenance settings.', 'error');
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const fetchShopConfig = async () => {
    setIsLoadingShopConfig(true);
    try {
      const res = await fetch('/api/shop/config');
      if (res.ok) {
        const data = await res.json();
        setCustomRolePrice(data.customRolePrice);
        setPresetRoles(data.presetRoles || []);
        setDailyLimit(data.dailyLimit || 1);
      }
    } catch (err) {
      console.error('Failed to fetch shop config:', err);
    } finally {
      setIsLoadingShopConfig(false);
    }
  };

  const handleSaveShopConfig = async () => {
    setIsSavingShopConfig(true);
    try {
      const res = await fetch('/api/admin/shop/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({
          customRolePrice,
          presetRoles,
          dailyLimit
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotice('Shop configurations updated successfully!', 'success');
      } else {
        showNotice(data.error || 'Failed to update shop configuration.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error updating shop configuration.', 'error');
    } finally {
      setIsSavingShopConfig(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCodes();
    fetchAuditReports();
    fetchBackupsHistory();
    fetchMaintenanceSettings();
    fetchShopConfig();
    fetchVaultAndHeists();
  }, [adminDiscordId, adminUsername]);

  useEffect(() => {
    if (activeSubTab === 'backup') {
      fetchBackupsHistory();
    } else if (activeSubTab === 'heist') {
      fetchVaultAndHeists();
    }
  }, [activeSubTab]);

  // --- ACTIONS ---
  const handleUpdatePoints = async (userName: string) => {
    const config = userPointsAction[userName] || { value: '', mode: 'add', type: 'points' };
    const numValue = parseInt(config.value);
    
    if (isNaN(numValue) || numValue < 0) {
      showNotice('Please enter a valid positive number.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/user/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({
          name: userName,
          points: numValue,
          action: config.mode,
          type: config.type || 'points'
        })
      });

      const data = await res.json();
      if (res.ok) {
        showNotice(`Successfully updated ${config.type === 'vouchers' ? 'vouchers' : 'points'} for ${userName}!`, 'success');
        
        // Update local list
        setUsers(prev => prev.map(u => u.name === userName ? { ...u, points: data.newPoints, spinVouchers: data.newVouchers } : u));
        
        // Clear input
        setUserPointsAction(prev => ({
          ...prev,
          [userName]: { ...prev[userName], value: '' }
        }));

        // If admin updated their own points, trigger callback
        if (userName === adminUsername && onPointsUpdated) {
          onPointsUpdated(data.newPoints);
        }
      } else {
        showNotice(data.error || 'Failed to update user values.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error updating values.', 'error');
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) {
      showNotice('Please enter a code name.', 'error');
      return;
    }
    const reward = parseInt(newCodeReward);
    const maxUses = parseInt(newCodeMaxUses);

    if (isNaN(reward) || reward <= 0) {
      showNotice('Reward points must be greater than 0.', 'error');
      return;
    }
    if (isNaN(maxUses) || maxUses <= 0) {
      showNotice('Max uses must be greater than 0.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({
          code: newCodeName.toUpperCase().trim(),
          rewardAmount: reward,
          maxUses: maxUses,
          rewardType: newCodeRewardType
        })
      });

      const data = await res.json();
      if (res.ok) {
        showNotice(`Code "${data.code}" successfully generated!`, 'success');
        setNewCodeName('');
        fetchCodes();
      } else {
        showNotice(data.error || 'Failed to generate code.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error generating code.', 'error');
    }
  };

  const handleDeleteCode = async (codeStr: string) => {
    if (!window.confirm(`Are you sure you want to delete redeem code "${codeStr}"?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/codes/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({ code: codeStr })
      });

      if (res.ok) {
        showNotice(`Code "${codeStr}" deleted.`, 'success');
        setCodes(prev => prev.filter(c => c.code !== codeStr));
      } else {
        const data = await res.json();
        showNotice(data.error || 'Failed to delete code.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error deleting code.', 'error');
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/backup/export', {
        headers: {
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        }
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      a.download = `aurlets_progress_${dateStr}.aurlets`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotice('Website progress successfully exported as .aurlets file!', 'success');
      fetchBackupsHistory();
    } catch (err: any) {
      showNotice(err.message || 'Failed to export backup.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (file: File) => {
    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const res = await fetch('/api/admin/backup/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-discord-id': adminDiscordId,
              'x-admin-username': adminUsername
            },
            body: JSON.stringify({ fileContent: content })
          });
          const data = await res.json();
          if (res.ok) {
            showNotice('Website progress restored successfully!', 'success');
            setBackupStats({
              usersCount: data.stats.usersCount,
              customRolesCount: data.stats.customRolesCount,
              redeemCodesCount: data.stats.redeemCodesCount,
              exportedAt: data.stats.exportedAt
            });
            // Force sync
            fetchUsers();
            fetchCodes();
            fetchAuditReports();
            fetchBackupsHistory();
          } else {
            showNotice(data.error || 'Failed to import backup.', 'error');
          }
        } catch (err: any) {
          showNotice(err.message || 'Error parsing uploaded file.', 'error');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      showNotice(err.message || 'Failed to read backup file.', 'error');
      setIsImporting(false);
    }
  };

  const handleCreateBackupPoint = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        }
      });
      const data = await res.json();
      if (res.ok) {
        showNotice('Successfully created a new backup point on the server!', 'success');
        fetchBackupsHistory();
      } else {
        showNotice(data.error || 'Failed to create backup point.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error creating backup point.', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackupPoint = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to restore this backup? This will overwrite your current progress (we will create a recovery save point automatically before applying).')) {
      return;
    }
    setIsRestoringBackupId(id);
    try {
      const res = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        showNotice('Successfully restored backup point!', 'success');
        setBackupStats({
          usersCount: data.stats.usersCount,
          customRolesCount: data.stats.customRolesCount,
          redeemCodesCount: data.stats.redeemCodesCount,
          exportedAt: data.stats.exportedAt
        });
        // Refresh states
        fetchUsers();
        fetchCodes();
        fetchAuditReports();
        fetchBackupsHistory();
      } else {
        showNotice(data.error || 'Failed to restore backup.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error restoring backup point.', 'error');
    } finally {
      setIsRestoringBackupId(null);
    }
  };

  const handleDeleteBackupPoint = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this backup point from the server?')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/backups/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        showNotice('Deleted backup point from history.', 'success');
        fetchBackupsHistory();
      } else {
        showNotice(data.error || 'Failed to delete backup point.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error deleting backup point.', 'error');
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-pink-500" /> Admin Command Center
        </h2>
        <p className="text-zinc-400 text-sm">
          Welcome back, <span className="text-pink-400 font-bold">{adminUsername}</span>. Generate custom points vouchers, audit player registries, and calibrate farmer scores.
        </p>
      </div>

      {/* Admin Notice Banner */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border text-xs font-bold text-center flex items-center justify-center gap-2 ${
              notice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {notice.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {notice.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub Tabs Switcher */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/20 p-4 border border-zinc-900 rounded-2xl">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'users'
                ? 'bg-pink-600 text-white shadow shadow-pink-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Users className="w-4 h-4" /> Manage Users & Points ({users.length})
          </button>
          <button
            onClick={() => setActiveSubTab('codes')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'codes'
                ? 'bg-pink-600 text-white shadow shadow-pink-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Gift className="w-4 h-4" /> Redeem Codes Generator ({codes.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('audit');
              fetchAuditReports();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'audit'
                ? 'bg-pink-600 text-white shadow shadow-pink-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Points Audit Logs ({auditReports.length})
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'backup'
                ? 'bg-pink-600 text-white shadow shadow-pink-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Database className="w-4 h-4" /> Save & Load Progress
          </button>
          <button
            onClick={() => {
              setActiveSubTab('puzzles');
              fetchPuzzles();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'puzzles'
                ? 'bg-pink-600 text-white shadow shadow-pink-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Image className="w-4 h-4 text-pink-400" /> Pending Puzzle Images ({pendingPuzzles.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('maintenance');
              fetchMaintenanceSettings();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'maintenance'
                ? 'bg-amber-600 text-white shadow shadow-amber-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-500" /> Maintenance Mode 🛠️
          </button>
          <button
            onClick={() => {
              setActiveSubTab('shop');
              fetchShopConfig();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'shop'
                ? 'bg-pink-600 text-white shadow shadow-pink-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Award className="w-4 h-4 text-pink-400" /> Reward Shop Config 🛒
          </button>
          <button
            onClick={() => {
              setActiveSubTab('heist');
              fetchVaultAndHeists();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'heist'
                ? 'bg-pink-600 text-white shadow shadow-pink-500/10'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-pink-400 animate-pulse" /> Vault Heist Console 💎
          </button>
        </div>

        {/* Sync Controls */}
        <button
          onClick={() => {
            fetchUsers();
            fetchCodes();
            fetchAuditReports();
            fetchPuzzles();
            showNotice('State refreshed with database.', 'success');
          }}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Force Sync
        </button>
      </div>

      {activeSubTab === 'users' && (
        /* USER AND POINTS MANAGER VIEW */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search players by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/40 border border-zinc-900 rounded-xl focus:border-pink-500 focus:outline-none text-xs text-white placeholder-zinc-500"
              />
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/20 rounded-2xl overflow-hidden">
            {isLoadingUsers ? (
              <div className="p-12 text-center text-xs text-zinc-500 font-mono animate-pulse">
                Refreshing user profiles state from memory...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500">
                No players match your search query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Current Points</th>
                      <th className="py-3 px-4 text-center">Adjust Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {filteredUsers.map((user) => {
                      const userAct = userPointsAction[user.name] || { value: '', mode: 'add', type: 'points' };
                      return (
                        <tr key={user.name} className="hover:bg-zinc-900/10 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-lg object-cover border border-zinc-800"
                              />
                              <div>
                                <span className="block text-xs font-bold text-white">{user.name}</span>
                                {user.name === adminUsername && (
                                  <span className="inline-block text-[9px] font-mono text-pink-400 bg-pink-500/10 px-1 py-0.2 rounded mt-0.5">Admin (You)</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-bold">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-400">{user.points.toLocaleString()}</span>
                                <span className="text-[10px] text-pink-500 font-semibold">AP</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500">{user.spinVouchers || 0}</span>
                                <span className="text-[10px] text-pink-400 font-semibold">Vouchers</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
                              {/* Type selection */}
                              <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-850 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setUserPointsAction(p => ({ ...p, [user.name]: { ...userAct, type: 'points' } }))}
                                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded-md transition-all ${userAct.type !== 'vouchers' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                  Points
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setUserPointsAction(p => ({ ...p, [user.name]: { ...userAct, type: 'vouchers' } }))}
                                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded-md transition-all ${userAct.type === 'vouchers' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                  Vouchers
                                </button>
                              </div>

                              {/* Mode selection buttons */}
                              <div className="flex bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800 shrink-0">
                                <button
                                  onClick={() => setUserPointsAction(p => ({ ...p, [user.name]: { ...userAct, mode: 'add' } }))}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${userAct.mode === 'add' ? 'bg-pink-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => setUserPointsAction(p => ({ ...p, [user.name]: { ...userAct, mode: 'subtract' } }))}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${userAct.mode === 'subtract' ? 'bg-pink-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                  Sub
                                </button>
                                <button
                                  onClick={() => setUserPointsAction(p => ({ ...p, [user.name]: { ...userAct, mode: 'set' } }))}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${userAct.mode === 'set' ? 'bg-pink-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                  Set
                                </button>
                              </div>

                              <input
                                type="number"
                                min="0"
                                placeholder={userAct.mode === 'set' ? 'Value' : 'Amt'}
                                value={userAct.value}
                                onChange={(e) => setUserPointsAction(p => ({
                                  ...p,
                                  [user.name]: { ...userAct, value: e.target.value }
                                }))}
                                className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-800 text-xs font-mono text-center rounded-lg text-white focus:outline-none focus:border-pink-500"
                              />

                              <button
                                onClick={() => handleUpdatePoints(user.name)}
                                className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-[10px] uppercase rounded-lg transition-all"
                              >
                                Apply
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {activeSubTab === 'codes' && (
        /* PROMO CODES MANAGER VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Create Code Panel */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-pink-500" /> Generate Promo Code
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Generate a points-carrying code users can redeem.</p>
            </div>

            <form onSubmit={handleGenerateCode} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-mono uppercase tracking-wider text-[10px]">Code Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXTRAAURA100"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-pink-500 focus:outline-none text-xs text-white font-mono uppercase placeholder-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-mono uppercase tracking-wider text-[10px]">Reward Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCodeRewardType('points');
                      setNewCodeReward('100');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      newCodeRewardType === 'points'
                        ? 'bg-pink-600/10 border-pink-500 text-pink-400 font-black'
                        : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-white'
                    }`}
                  >
                    💰 Aura Points
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCodeRewardType('voucher');
                      setNewCodeReward('5');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      newCodeRewardType === 'voucher'
                        ? 'bg-pink-600/10 border-pink-500 text-pink-400 font-black'
                        : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-white'
                    }`}
                  >
                    🎟️ Spin Vouchers
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono uppercase tracking-wider text-[10px]">
                    {newCodeRewardType === 'voucher' ? 'Vouchers Reward' : 'Aura Points Reward'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={newCodeRewardType === 'voucher' ? '5' : '100'}
                    value={newCodeReward}
                    onChange={(e) => setNewCodeReward(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-pink-500 focus:outline-none text-xs text-white font-mono text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono uppercase tracking-wider text-[10px]">Max Use Limit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="50"
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-pink-500 focus:outline-none text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow shadow-pink-500/10 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Generate Vouchers
              </button>
            </form>
          </div>

          {/* Active Codes List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm uppercase font-mono tracking-wider text-zinc-500 font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-pink-500" /> Active Promo Codes ({codes.length})
            </h3>

            {isLoadingCodes ? (
              <div className="p-8 border border-zinc-900 bg-zinc-950/20 rounded-2xl text-center text-xs text-zinc-500 font-mono animate-pulse">
                Fetching active codes list...
              </div>
            ) : codes.length === 0 ? (
              <div className="p-8 border border-zinc-900 bg-zinc-950/20 rounded-2xl text-center text-xs text-zinc-500">
                No active promo codes currently exist. Create one using the generator wizard.
              </div>
            ) : (
              <div className="space-y-3.5">
                {codes.map((codeItem) => (
                  <div 
                    key={codeItem.code}
                    className="p-5 border border-zinc-900 bg-zinc-950/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-800 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-pink-500/15 border border-pink-500/35 text-xs text-pink-400 font-mono font-bold rounded-lg select-all">
                          {codeItem.code}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                          +{codeItem.rewardAmount} {codeItem.rewardType === 'voucher' ? 'Spin Vouchers 🎟️' : 'AP 💰'}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-500 font-mono space-y-0.5">
                        <div className="flex gap-2">
                          <span className="text-zinc-600">Uses:</span>
                          <span className={`${codeItem.uses >= codeItem.maxUses ? 'text-rose-400 font-bold' : 'text-zinc-400'}`}>
                            {codeItem.uses} / {codeItem.maxUses} used
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-zinc-600">Redeemers:</span>
                          <span className="text-zinc-400 truncate max-w-xs" title={codeItem.redeemedBy.join(', ') || 'None'}>
                            {codeItem.redeemedBy.length > 0 ? codeItem.redeemedBy.join(', ') : 'No one yet'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCode(codeItem.code)}
                      className="p-2 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/30 text-rose-400 rounded-xl transition-all self-end md:self-center shrink-0"
                      title="Revoke and delete code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'audit' && (
        /* POINTS AUDIT LOGS VIEW */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/10 p-4 border border-zinc-900 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-500 animate-pulse" /> Points Growth Audit
              </h3>
              <p className="text-zinc-500 text-[11px] mt-0.5 max-w-xl">
                Every 12 hours, points are analyzed to detect glitches, unauthorized modifications, or suspicious loopholes. Suspected exploiters (earning &gt;=1,000 AP) are flagged automatically.
              </p>
            </div>
            
            <button
              onClick={triggerManualAudit}
              disabled={isTriggeringAudit}
              className="px-4 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95 shrink-0 self-stretch sm:self-auto justify-center"
            >
              {isTriggeringAudit ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Force Audit Scan
                </>
              )}
            </button>
          </div>

          {isLoadingAudit ? (
            <div className="p-12 text-center text-xs font-mono text-zinc-500 animate-pulse">
              Compiling points history records...
            </div>
          ) : auditReports.length === 0 ? (
            <div className="p-12 border border-zinc-900 rounded-2xl bg-zinc-950/20 text-center text-xs text-zinc-500 font-mono">
              No audit records generated yet. Click "Force Audit Scan" to compile the first report!
            </div>
          ) : (
            <div className="space-y-6">
              {[...auditReports].reverse().map((report, idx) => {
                const dateStr = new Date(report.timestamp).toLocaleString();
                return (
                  <div key={idx} className="p-5 border border-zinc-900 bg-zinc-950/40 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between border-b border-zinc-900/60 pb-3 gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                        <div>
                          <div className="text-xs font-bold text-white">Audit Report #{auditReports.length - idx}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{dateStr}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] font-mono">
                        <div>
                          <span className="text-zinc-500">Registered Users:</span>{' '}
                          <span className="text-white font-bold">{report.totalUsers}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Aura Points Pool:</span>{' '}
                          <span className="text-pink-400 font-bold">{report.totalPoints} AP</span>
                        </div>
                      </div>
                    </div>

                    {/* Suspicious earners warning */}
                    {report.unusuallyHighEarners && report.unusuallyHighEarners.length > 0 ? (
                      <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-rose-400 font-bold">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Flagged Suspicious Earnings (&gt;=1000 AP in 12h)</span>
                        </div>
                        <ul className="list-disc list-inside text-rose-300 pl-1 space-y-0.5">
                          {report.unusuallyHighEarners.map((earner, earnerIdx) => (
                            <li key={earnerIdx}>
                              Player <span className="font-bold underline">{earner.username}</span> earned{' '}
                              <span className="font-mono font-bold">+{earner.points} AP</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-mono">
                        <CheckCircle className="w-4 h-4" />
                        <span>No suspicious points growth or anomalies detected. System is secure.</span>
                      </div>
                    )}

                    {/* Normal growth changes */}
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                        Points Activity Summary
                      </h4>
                      {report.changes.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic font-mono">No active point transactions or earnings occurred during this window.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {report.changes.map((change, changeIdx) => (
                            <div
                              key={changeIdx}
                              className="px-3 py-2.5 bg-zinc-900/40 border border-zinc-900/50 rounded-xl flex items-center justify-between text-xs font-mono"
                            >
                              <span className="text-zinc-300 font-bold truncate max-w-[120px]">{change.username}</span>
                              <div className="text-right">
                                <span className="text-pink-400 font-bold">+{change.diff} AP</span>
                                <div className="text-[9px] text-zinc-500">
                                  {change.oldPoints} ➔ {change.newPoints} AP
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'backup' && (
        /* BACKUP & RESTORE VIEW */
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Export Panel */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-500">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Save Website Progress
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1">
                    Export all user points, time spent on website, leaderboard data, generated redeem codes, and custom roles purchased into a special secured backup file (<span className="text-pink-400 font-mono">.aurlets</span>).
                  </p>
                </div>
                <div className="p-3.5 bg-zinc-900/35 border border-zinc-900 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Data Included:</h4>
                  <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                    <li>All player registries ({users.length} users)</li>
                    <li>Active Promo Codes ({codes.length} codes)</li>
                    <li>Global and AFK leaderboards</li>
                    <li>Point growths & system Audit logs</li>
                    <li>Puzzle image progress & Giveaways list</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={handleExportBackup}
                disabled={isExporting}
                className="w-full mt-4 py-3.5 bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-600/15 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                {isExporting ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export Progress File</span>
                  </>
                )}
              </button>
            </div>

            {/* Import Panel */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-500">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Load Website Progress
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1">
                    Upload a previously saved <span className="text-pink-400 font-mono">.aurlets</span> file to restore all website data, including user progress, settings, and points.
                  </p>
                </div>

                {/* Drag and drop area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setSelectedFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                    dragActive
                      ? 'border-pink-500 bg-pink-500/5'
                      : selectedFile
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/20'
                  }`}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".aurlets"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  {selectedFile ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-zinc-600" />
                      <div>
                        <p className="text-xs font-bold text-zinc-300">Drag & drop your .aurlets backup</p>
                        <p className="text-[10px] text-zinc-500 mt-1">or click to browse from files</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Success feedback state */}
                {backupStats && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 animate-pulse">
                    <h4 className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Import Successful
                    </h4>
                    <div className="text-[11px] text-zinc-400 font-mono grid grid-cols-2 gap-y-1">
                      <span>Restored Users:</span>
                      <span className="text-white font-bold text-right">{backupStats.usersCount}</span>
                      <span>Promo Codes:</span>
                      <span className="text-white font-bold text-right">{backupStats.redeemCodesCount}</span>
                      <span>Custom Roles:</span>
                      <span className="text-white font-bold text-right">{backupStats.customRolesCount}</span>
                      <span>Backup Date:</span>
                      <span className="text-white font-bold text-right text-[10px]">
                        {new Date(backupStats.exportedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setBackupStats(null);
                    }}
                    className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold rounded-xl transition-all"
                  >
                    Clear File
                  </button>
                )}
                <button
                  onClick={() => selectedFile && handleImportBackup(selectedFile)}
                  disabled={!selectedFile || isImporting}
                  className="flex-2 py-3 bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-600/15 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {isImporting ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Restore Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Historical rolling backup panel */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-6 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-pink-500" />
                  Rolling Backups History (Last 10)
                </h3>
                <p className="text-zinc-400 text-xs mt-1">
                  Rolling backup restore points automatically generated on crucial actions or created manually. Restore any point instantly.
                </p>
              </div>

              <button
                onClick={handleCreateBackupPoint}
                disabled={isCreatingBackup}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isCreatingBackup ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                ) : (
                  <Plus className="w-4 h-4 text-pink-400" />
                )}
                <span>Create Local Backup Point</span>
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500">
                <RefreshCw className="w-8 h-8 animate-spin text-zinc-600" />
                <span className="text-xs font-mono">Loading backups list...</span>
              </div>
            ) : backupsHistory.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-zinc-900 rounded-xl bg-zinc-900/10 text-zinc-500">
                <Database className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                <p className="text-xs font-mono">No backup points saved yet.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Trigger exports, imports, or click "Create Local Backup Point" above to start saving progress states.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {backupsHistory.map((backup) => {
                  const date = new Date(backup.timestamp);
                  const isRestoring = isRestoringBackupId === backup.id;

                  return (
                    <div
                      key={backup.id}
                      className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {backup.trigger}
                          </span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400">
                            ID: {backup.id}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {date.toLocaleString()}
                        </div>

                        {/* Stats grid */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 font-mono pt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-zinc-500" /> Users: <strong className="text-zinc-200">{backup.stats?.usersCount ?? 0}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Gift className="w-3.5 h-3.5 text-zinc-500" /> Codes: <strong className="text-zinc-200">{backup.stats?.redeemCodesCount ?? 0}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-zinc-500" /> Roles: <strong className="text-zinc-200">{backup.stats?.customRolesCount ?? 0}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Image className="w-3.5 h-3.5 text-zinc-500" /> Puzzle Imgs: <strong className="text-zinc-200">{backup.stats?.puzzleImagesCount ?? 0}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-zinc-500" /> Giveaways: <strong className="text-zinc-200">{backup.stats?.giveawaysCount ?? 0}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t border-zinc-900/50 md:border-0 pt-3 md:pt-0">
                        <button
                          onClick={() => handleRestoreBackupPoint(backup.id)}
                          disabled={!!isRestoringBackupId}
                          className="px-3.5 py-2 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          {isRestoring ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>Restore</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteBackupPoint(backup.id)}
                          disabled={!!isRestoringBackupId}
                          className="p-2 bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl transition-all"
                          title="Delete Backup Point"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'puzzles' && (
        /* PUZZLES MANAGER VIEW */
        <div className="space-y-6 text-left">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-3 gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-pink-500" /> Custom Slide Puzzle Manager
              </h3>
              <p className="text-zinc-400 text-xs">
                Create new puzzle levels directly via file upload or URL, approve custom submissions from players, and delete active levels whenever you want.
              </p>
            </div>
            
            {/* View Tab Switcher */}
            <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 self-start sm:self-center">
              <button
                onClick={() => setPuzzleViewTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  puzzleViewTab === 'pending'
                    ? 'bg-pink-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Awaiting Verification ({pendingPuzzles.length})
              </button>
              <button
                onClick={() => setPuzzleViewTab('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  puzzleViewTab === 'approved'
                    ? 'bg-pink-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Playable Levels ({allPuzzles.filter(p => p.approved).length})
              </button>
            </div>
          </div>

          {/* CREATE DIRECT LEVEL / IMAGE FORM (ADMIN ONLY) */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-xl space-y-4">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-pink-400" /> Create Direct Playable Level
            </h4>
            <p className="text-xs text-zinc-400">
              Create and release a new level immediately. Since you are an administrator, levels created here bypass verification and are immediately playable by everyone.
            </p>

            <form onSubmit={addDirectPuzzle} className="space-y-3">
              <div className="flex gap-2 border-b border-zinc-800 pb-2">
                <button
                  type="button"
                  onClick={() => setDirectSubType('url')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    directSubType === 'url' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  By URL
                </button>
                <button
                  type="button"
                  onClick={() => setDirectSubType('file')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    directSubType === 'file' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  File Upload
                </button>
              </div>

              {directSubType === 'url' ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    placeholder="https://example.com/beautiful-level.png"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-pink-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isDirectUploading}
                    className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {isDirectUploading ? 'Creating...' : 'Create Level'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="admin-puzzle-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleDirectFileChange}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-500 cursor-pointer"
                    />
                    <button
                      type="submit"
                      disabled={isDirectUploading || !directFileBase64}
                      className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                      {isDirectUploading ? 'Uploading...' : 'Upload & Create'}
                    </button>
                  </div>
                  {directFileName && (
                    <p className="text-[10px] font-mono text-zinc-500">
                      Selected file: <span className="text-zinc-300 font-bold">{directFileName}</span>
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* LIST VIEWS */}
          {isLoadingPuzzles ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="w-8 h-8 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
              <p className="text-xs text-zinc-500 font-mono">Syncing levels...</p>
            </div>
          ) : puzzleViewTab === 'pending' ? (
            /* PENDING PUZZLES */
            pendingPuzzles.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20">
                <Image className="w-10 h-10 text-zinc-700 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-bold text-zinc-400">All Clean!</p>
                <p className="text-xs text-zinc-500 mt-1">No custom puzzle images are currently waiting for admin approval.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {pendingPuzzles.map((p) => (
                  <div 
                    key={p.id} 
                    className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-4 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-lg text-left"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 group">
                        <img 
                          src={p.url} 
                          alt="Submitted PFP" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=300&q=80';
                          }}
                        />
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Sender:</span>
                          <span className="font-bold text-white truncate max-w-[150px]">{p.uploadedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Date:</span>
                          <span className="font-mono text-zinc-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => approvePuzzle(p.id)}
                        className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 active:scale-95 shadow-md shadow-emerald-950/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => rejectPuzzle(p.id)}
                        className="py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs border border-rose-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* APPROVED/PLAYABLE LEVELS */
            allPuzzles.filter(p => p.approved).length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20">
                <Image className="w-10 h-10 text-zinc-700 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-bold text-zinc-400">Gallery Empty</p>
                <p className="text-xs text-zinc-500 mt-1">There are no approved or active slide puzzle levels currently. Use the tool above to add some!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allPuzzles.filter(p => p.approved).map((p) => (
                  <div 
                    key={p.id} 
                    className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-4 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-lg text-left"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 group">
                        <img 
                          src={p.url} 
                          alt="Playable Level" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=300&q=80';
                          }}
                        />
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Creator:</span>
                          <span className="font-bold text-white truncate max-w-[150px]">{p.uploadedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Created:</span>
                          <span className="font-mono text-zinc-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deletePuzzle(p.id)}
                      className="w-full py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs border border-rose-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Level
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {activeSubTab === 'maintenance' && (
        <div className="space-y-6 text-left animate-fade-in">
          <div className="border-b border-zinc-900 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" /> Maintenance Mode Config
            </h3>
            <p className="text-zinc-400 text-xs font-medium">
              Toggle full website or specific section-level maintenance modes. Whitelisted admins bypass maintenance checks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-xl space-y-6">
            {/* Master Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-500 font-bold">Master Switch</span>
                <h4 className="text-sm font-bold text-white">Enable Maintenance Mode</h4>
                <p className="text-zinc-500 text-xs">Instantly apply maintenance screen blocks to normal users.</p>
              </div>
              <button
                onClick={() => setMaintenanceEnabled(!maintenanceEnabled)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  maintenanceEnabled
                    ? 'bg-amber-600 text-white shadow shadow-amber-500/20'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                }`}
              >
                {maintenanceEnabled ? '🔴 Active (Maintenance On)' : '⚪ Inactive (Website Live)'}
              </button>
            </div>

            {/* Scope selection */}
            {maintenanceEnabled && (
              <div className="space-y-5">
                {/* Full Website vs Specific Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => {
                      setMaintenanceFullWebsite(true);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      maintenanceFullWebsite
                        ? 'bg-red-500/5 border-red-500/30 text-white'
                        : 'bg-zinc-900/20 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${maintenanceFullWebsite ? 'border-red-500' : 'border-zinc-700'}`}>
                        {maintenanceFullWebsite && <div className="w-2 h-2 rounded-full bg-red-500" />}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Full Website Block</div>
                        <div className="text-[10px] text-zinc-500">Every single page is blocked for non-admins</div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setMaintenanceFullWebsite(false);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      !maintenanceFullWebsite
                        ? 'bg-amber-500/5 border-amber-500/30 text-white'
                        : 'bg-zinc-900/20 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!maintenanceFullWebsite ? 'border-amber-500' : 'border-zinc-700'}`}>
                        {!maintenanceFullWebsite && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Specific Categories Block</div>
                        <div className="text-[10px] text-zinc-500">Only block certain subsections (e.g. Games, Giveaways)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categories Multiselect */}
                {!maintenanceFullWebsite && (
                  <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-800/60 space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Select categories to lock down:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'games', label: '🎮 AuraGames' },
                        { id: 'giveaways', label: '🎉 Giveaways' },
                        { id: 'staff', label: '🛡️ Staff Team' },
                        { id: 'afk', label: '🔥 AFK Farming' },
                        { id: 'shop', label: '🛒 Reward Shop' },
                        { id: 'announcements', label: '📢 Announcements' },
                        { id: 'highlights', label: '✨ Highlights' },
                        { id: 'minecraft', label: '⛏️ AuraCraft' },
                        { id: 'info', label: 'ℹ️ Information' },
                        { id: 'home', label: '🏠 Dashboard Home' }
                      ].map((cat) => {
                        const isChecked = maintenanceCategories.includes(cat.id);
                        return (
                          <div
                            key={cat.id}
                            onClick={() => {
                              if (isChecked) {
                                setMaintenanceCategories(maintenanceCategories.filter((c) => c !== cat.id));
                              } else {
                                setMaintenanceCategories([...maintenanceCategories, cat.id]);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all flex items-center gap-2 ${
                              isChecked
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold'
                                : 'bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="accent-amber-500 pointer-events-none"
                            />
                            <span>{cat.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Action */}
            <div className="flex justify-end pt-3">
              <button
                onClick={handleSaveMaintenance}
                disabled={isSavingMaintenance}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg active:scale-95"
              >
                {isSavingMaintenance ? 'Saving Changes...' : 'Save & Deploy Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'shop' && (
        <div className="space-y-6 text-left animate-fade-in">
          <div className="border-b border-zinc-900 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-pink-500" /> Reward Shop Config 🛒
            </h3>
            <p className="text-zinc-400 text-xs font-medium">
              Update Custom Role prices and individual Preset Role prices in real-time. Changes apply instantly to all users.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Custom Role Price */}
              <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-850/60 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">Custom Discord Role Price (AP)</span>
                <p className="text-[10px] text-zinc-400">Price for users to create a server-wide custom styled Discord role.</p>
                <input
                  type="number"
                  value={customRolePrice}
                  onChange={(e) => setCustomRolePrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Daily Limit */}
              <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-850/60 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">Daily Spin Game Limit</span>
                <p className="text-[10px] text-zinc-400">Max limit of Spin Games per user daily.</p>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Preset Roles Price Configuration */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">Preset Roles Prices</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {presetRoles.map((role, idx) => (
                  <div key={role.id} className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-850/60 flex flex-col justify-between space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{role.emoji}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{role.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">ID: {role.id}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 font-bold block">Price (AP):</label>
                      <input
                        type="number"
                        value={role.price}
                        onChange={(e) => {
                          const updated = [...presetRoles];
                          updated[idx] = { ...role, price: Math.max(0, parseInt(e.target.value) || 0) };
                          setPresetRoles(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Shop Action */}
            <div className="flex justify-end pt-3">
              <button
                onClick={handleSaveShopConfig}
                disabled={isSavingShopConfig}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg active:scale-95"
              >
                {isSavingShopConfig ? 'Saving Prices...' : 'Save & Deploy Prices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'heist' && (
        <div className="space-y-6 text-left animate-fade-in">
          <div className="border-b border-zinc-900 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pink-500" /> Vault Heist Console 💎
            </h3>
            <p className="text-zinc-400 text-xs font-medium">
              Calibrate global heist vaults, inject central reserve AP jackpots, or schedule/cancel upcoming server-wide coop heist raids.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: VAULT BANKROLL MANAGEMENT */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    🛡️ Central Vault Balance
                  </h4>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    Active Reservoir
                  </span>
                </div>

                <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-850 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Current Vault Bankroll</div>
                    <div className="text-2xl font-black font-mono text-amber-300">
                      {adminVaultBalance.toLocaleString()} <span className="text-xs text-amber-400">AP</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Coins className="w-6 h-6" />
                  </div>
                </div>

                {/* Vault Transaction (Deposit/Withdraw) */}
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-zinc-400">Perform Vault Treasury Adjustments</div>
                  
                  <div className="flex gap-2 p-1 bg-zinc-900/60 rounded-xl border border-zinc-850">
                    <button
                      onClick={() => setVaultTxAction('deposit')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        vaultTxAction === 'deposit' 
                          ? 'bg-emerald-600 text-white shadow' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Deposit Fund
                    </button>
                    <button
                      onClick={() => setVaultTxAction('withdraw')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        vaultTxAction === 'withdraw' 
                          ? 'bg-rose-600 text-white shadow' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Withdraw Fund
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase block">Adjustment Amount (AP)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={vaultTxAmount}
                        onChange={(e) => setVaultTxAmount(e.target.value)}
                        placeholder="e.g. 50000"
                        className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                      />
                      <button
                        onClick={handleVaultTransaction}
                        disabled={isSubmittingVaultTx || !vaultTxAmount}
                        className={`px-5 py-2.5 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2 ${
                          vaultTxAction === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                        }`}
                      >
                        {isSubmittingVaultTx ? 'Syncing...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: HEIST SCHEDULER & UPCOMING HEISTS */}
            <div className="lg:col-span-7 space-y-6">
              {/* HEIST RAIDS SCHEDULER FORM */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-xl space-y-5">
                <div className="border-b border-zinc-900 pb-3">
                  <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-400">
                    🎯 Schedule Server Vault Heist Raid
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase block">Heist Vault Name</label>
                    <input
                      type="text"
                      value={scheduleVaultName}
                      onChange={(e) => setScheduleVaultName(e.target.value)}
                      placeholder="e.g. Cyber Security Safehouse"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase block">Target Jackpot Pool (AP)</label>
                    <input
                      type="number"
                      value={scheduleTargetAmount}
                      onChange={(e) => setScheduleTargetAmount(e.target.value)}
                      placeholder="e.g. 250000"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase block">Scheduled Date & Time (Local / UTC)</label>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleScheduleHeist}
                    disabled={isSchedulingHeist || !scheduleVaultName.trim() || !scheduleTargetAmount || !scheduleTime}
                    className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Schedule Upcoming Heist
                  </button>
                </div>
              </div>

              {/* LIST OF UPCOMING SCHEDULER HEISTS */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-xl space-y-4">
                <div className="border-b border-zinc-900 pb-2">
                  <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-400">
                    🗓️ Scheduled Upcoming Raids ({adminUpcomingHeists.length})
                  </h4>
                </div>

                {adminUpcomingHeists.length === 0 ? (
                  <div className="text-xs text-zinc-500 font-mono text-center py-6">
                    No upcoming vault heists scheduled. Use the form above to post one!
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {adminUpcomingHeists.map((h, index) => {
                      const formattedDate = new Date(h.scheduledAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      });
                      return (
                        <div 
                          key={h.id || index}
                          className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-850 flex items-center justify-between gap-4 font-mono text-xs text-left"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-white text-sm">{h.vaultName}</div>
                            <div className="text-[10px] text-zinc-400">
                              Target Jackpot: <span className="text-amber-400 font-bold">{h.targetAmount.toLocaleString()} AP</span> | Schedule: <span className="text-pink-400">{formattedDate}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnscheduleHeist(h.id)}
                            className="p-2 rounded-lg bg-zinc-950 hover:bg-red-950/40 border border-zinc-850 hover:border-red-900 text-zinc-500 hover:text-red-400 transition-all"
                            title="Unschedule & Cancel Heist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
