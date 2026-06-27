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
  X
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
  avatarUrl: string;
}

interface RedeemCode {
  code: string;
  rewardAmount: number;
  maxUses: number;
  uses: number;
  redeemedBy: string[];
  createdAt: number;
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
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'codes' | 'audit' | 'backup' | 'puzzles'>('users');
  
  // States for Puzzle Images approval
  const [pendingPuzzles, setPendingPuzzles] = useState<Array<{ id: string; url: string; uploadedBy: string; approved: boolean; createdAt: number }>>([]);
  const [isLoadingPuzzles, setIsLoadingPuzzles] = useState(false);
  
  // States for Backup/Restore system
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupStats, setBackupStats] = useState<{ usersCount: number; customRolesCount: number; redeemCodesCount: number; exportedAt: number } | null>(null);
  
  // States for User Management
  const [users, setUsers] = useState<Farmer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userPointsAction, setUserPointsAction] = useState<Record<string, { value: string; mode: 'add' | 'subtract' | 'set' }>>({});

  // States for Code Management
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeReward, setNewCodeReward] = useState('100');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('50');

  // States for Points Audit
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [lastAuditTimestamp, setLastAuditTimestamp] = useState<number | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isTriggeringAudit, setIsTriggeringAudit] = useState(false);

  // General feedback notice
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => {
      setNotice(prev => prev?.message === message ? null : prev);
    }, 5000);
  };

  // --- FETCHING FUNCTIONS ---
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

  const fetchPendingPuzzles = async () => {
    setIsLoadingPuzzles(true);
    try {
      const res = await fetch(`/api/puzzle/pending?adminDiscordId=${adminDiscordId}&adminUsername=${adminUsername}`, {
        headers: {
          'x-admin-discord-id': adminDiscordId,
          'x-admin-username': adminUsername
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingPuzzles(data);
      } else {
        const err = await res.text();
        console.error('Failed to load pending puzzles:', err);
      }
    } catch (err) {
      console.error(err);
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
      } else {
        const errData = await res.json();
        showNotice(errData.error || 'Failed to reject image', 'error');
      }
    } catch (err) {
      console.error('[REJECT ERROR]', err);
      showNotice('Network error rejecting puzzle image', 'error');
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

  useEffect(() => {
    fetchUsers();
    fetchCodes();
    fetchAuditReports();
  }, [adminDiscordId, adminUsername]);

  // --- ACTIONS ---
  const handleUpdatePoints = async (userName: string) => {
    const config = userPointsAction[userName] || { value: '', mode: 'add' };
    const numValue = parseInt(config.value);
    
    if (isNaN(numValue) || numValue < 0) {
      showNotice('Please enter a valid positive number for points.', 'error');
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
          action: config.mode
        })
      });

      const data = await res.json();
      if (res.ok) {
        showNotice(`Successfully updated points for ${userName} to ${data.newPoints} AP!`, 'success');
        
        // Update local list
        setUsers(prev => prev.map(u => u.name === userName ? { ...u, points: data.newPoints } : u));
        
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
        showNotice(data.error || 'Failed to update user points.', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Error updating points.', 'error');
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
          maxUses: maxUses
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
        </div>

        {/* Sync Controls */}
        <button
          onClick={() => {
            fetchUsers();
            fetchCodes();
            fetchAuditReports();
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
                      const userAct = userPointsAction[user.name] || { value: '', mode: 'add' };
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
                            <div className="flex items-center gap-1.5">
                              <span className="text-zinc-400">{user.points}</span>
                              <span className="text-[10px] text-pink-500 font-semibold">AP</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono uppercase tracking-wider text-[10px]">Aura Points Reward</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="100"
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
                        <span className="text-[10px] text-zinc-400 font-mono">
                          +{codeItem.rewardAmount} AP
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
        </div>
      )}
    </div>
  );
}
