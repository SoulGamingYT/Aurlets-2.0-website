import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, Coins, ArrowLeft, ShieldCheck, UserPlus, UserMinus, Trash2, 
  Flame, Key, Lock, Unlock, Play, RefreshCw, AlertTriangle, CheckCircle2,
  Users, Sparkles, Terminal, Activity, HelpCircle, Calendar
} from 'lucide-react';

interface AuraBankHeistProps {
  playerName: string;
  isLoggedIn: boolean;
  points: number;
  setPoints?: React.Dispatch<React.SetStateAction<number>>;
  showNotice?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onBack: () => void;
  isAdmin?: boolean;
}

interface Team {
  name: string;
  leader: string;
  members: string[];
  createdAt: number;
}

export default function AuraBankHeist({
  playerName,
  isLoggedIn,
  points,
  setPoints,
  showNotice,
  onBack,
  isAdmin = false
}: AuraBankHeistProps) {
  // Bank State
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isBankActionLoading, setIsBankActionLoading] = useState<boolean>(false);

  // Vault/Team State
  const [serverVault, setServerVault] = useState<number>(0);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [upcomingHeists, setUpcomingHeists] = useState<any[]>([]);
  const [userHeistsThisMonth, setUserHeistsThisMonth] = useState<number>(0);
  const [teamNameInput, setTeamNameInput] = useState<string>('');
  const [inviteUsername, setInviteUsername] = useState<string>('');
  const [isTeamLoading, setIsTeamLoading] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Heist Game State
  const [isHeisting, setIsHeisting] = useState<boolean>(false);
  const [heistCode, setHeistCode] = useState<number[]>([1, 1, 1]);
  const [userGuess, setUserGuess] = useState<string[]>(['1', '1', '1']);
  const [guessHistory, setGuessHistory] = useState<Array<{ guess: string[]; feedback: string[] }>>([]);
  const [heistTimer, setHeistTimer] = useState<number>(45);
  const [heistStatus, setHeistStatus] = useState<'playing' | 'win' | 'lost'>('playing');
  const [heistMessage, setHeistMessage] = useState<string>('');
  const [isSubmittingHeist, setIsSubmittingHeist] = useState<boolean>(false);

  // Sync bank balance and vault info on load
  useEffect(() => {
    if (!isLoggedIn) return;

    // Fetch User Profile to get bank balance
    fetch(`/api/user/sync?name=${encodeURIComponent(playerName)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.points !== undefined) {
          if (setPoints) setPoints(data.points);
          setBankBalance(data.bankBalance || 0);
        }
      })
      .catch(err => console.error("Error fetching user stats:", err));

    // Fetch Vault & Team Info
    fetch(`/api/team/info?name=${encodeURIComponent(playerName)}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setServerVault(data.serverVault || 0);
          setUserTeam(data.userTeam);
          setAllTeams(data.allTeams || []);
          setUpcomingHeists(data.upcomingHeists || []);
          setUserHeistsThisMonth(data.userHeistsThisMonth || 0);
        }
      })
      .catch(err => console.error("Error fetching team/vault info:", err));
  }, [playerName, isLoggedIn, refreshTrigger]);

  // Periodic Refresh for Lobby
  useEffect(() => {
    if (isHeisting) return;
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, [isHeisting]);

  // Safe Cracker Timer Effect
  useEffect(() => {
    if (!isHeisting || heistStatus !== 'playing') return;
    
    if (heistTimer <= 0) {
      handleHeistOutcome(false);
      return;
    }

    const timer = setTimeout(() => {
      setHeistTimer(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isHeisting, heistTimer, heistStatus]);

  // BANKING ACTIONS
  const handleBankAction = async (action: 'deposit' | 'withdraw', amountStr: string) => {
    if (!isLoggedIn) return;
    setIsBankActionLoading(true);

    try {
      const res = await fetch(`/api/bank/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, amount: amountStr })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} points.`);
      }

      if (data.success) {
        if (setPoints) setPoints(data.points);
        setBankBalance(data.bankBalance || 0);
        if (showNotice) showNotice(data.message, 'success');
        
        if (action === 'deposit') setDepositAmount('');
        if (action === 'withdraw') setWithdrawAmount('');
      }
    } catch (err: any) {
      if (showNotice) showNotice(err.message, 'error');
    } finally {
      setIsBankActionLoading(false);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // TEAM ACTIONS
  const handleCreateTeam = async () => {
    if (!teamNameInput.trim()) return;
    setIsTeamLoading(true);

    try {
      const res = await fetch('/api/team/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamNameInput.trim(), leaderName: playerName })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create team.');

      if (data.success) {
        setUserTeam(data.team);
        setTeamNameInput('');
        if (showNotice) showNotice(data.message, 'success');
      }
    } catch (err: any) {
      if (showNotice) showNotice(err.message, 'error');
    } finally {
      setIsTeamLoading(false);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteUsername.trim() || !userTeam) return;
    setIsTeamLoading(true);

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: userTeam.name, 
          leaderName: playerName, 
          usernameToInvite: inviteUsername.trim() 
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to invite user.');

      if (data.success) {
        setUserTeam(data.team);
        setInviteUsername('');
        if (showNotice) showNotice(data.message, 'success');
      }
    } catch (err: any) {
      if (showNotice) showNotice(err.message, 'error');
    } finally {
      setIsTeamLoading(false);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleRemoveMember = async (memberToRemove: string) => {
    if (!userTeam) return;
    setIsTeamLoading(true);

    try {
      const res = await fetch('/api/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: userTeam.name, 
          leaderName: playerName, 
          usernameToRemove: memberToRemove 
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to remove member.');

      if (data.success) {
        setUserTeam(data.team);
        if (showNotice) showNotice(data.message, 'success');
      }
    } catch (err: any) {
      if (showNotice) showNotice(err.message, 'error');
    } finally {
      setIsTeamLoading(false);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDeleteTeam = async () => {
    if (!userTeam) return;
    if (!window.confirm("Are you sure you want to disband this heist team? This cannot be undone.")) return;
    setIsTeamLoading(true);

    try {
      const res = await fetch('/api/team/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: userTeam.name, leaderName: playerName })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to disband team.');

      if (data.success) {
        setUserTeam(null);
        if (showNotice) showNotice(data.message, 'success');
      }
    } catch (err: any) {
      if (showNotice) showNotice(err.message, 'error');
    } finally {
      setIsTeamLoading(false);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // HEIST SAFE CRACKING GAME INITIATION
  const startSafeCrackerHeist = () => {
    if (!userTeam) return;
    if (points < 200) {
      if (showNotice) showNotice("You need at least 200 AP in your wallet to register for the heist!", "error");
      return;
    }

    // Generate random 3-digit combination safe code (values 1 to 9)
    const code = [
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1
    ];

    setHeistCode(code);
    setUserGuess(['1', '1', '1']);
    setGuessHistory([]);
    setHeistTimer(45);
    setHeistStatus('playing');
    setHeistMessage('');
    setIsHeisting(true);
  };

  // SUBMIT GUESS IN TERMINAL GAME
  const submitCrackingGuess = () => {
    if (heistStatus !== 'playing') return;

    const currentGuess = userGuess.map(g => parseInt(g, 10));
    const feedback: string[] = [];

    let isAllCorrect = true;
    for (let i = 0; i < 3; i++) {
      if (currentGuess[i] === heistCode[i]) {
        feedback.push('✓');
      } else if (currentGuess[i] < heistCode[i]) {
        feedback.push('▲'); // Too low
        isAllCorrect = false;
      } else {
        feedback.push('▼'); // Too high
        isAllCorrect = false;
      }
    }

    const newHistory = [...guessHistory, { guess: [...userGuess], feedback }];
    setGuessHistory(newHistory);

    if (isAllCorrect) {
      setHeistStatus('win');
      handleHeistOutcome(true, 100 - (newHistory.length - 1) * 8); // Performance score scales with speed
    } else if (newHistory.length >= 8) {
      setHeistStatus('lost');
      handleHeistOutcome(false);
    }
  };

  const handleHeistOutcome = async (success: boolean, performanceScore: number = 50) => {
    if (!userTeam) return;
    setIsSubmittingHeist(true);

    try {
      const res = await fetch('/api/heist/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: userTeam.name,
          playerName,
          success,
          performanceScore
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to submit heist outcome.');

      setHeistMessage(data.message);
      if (setPoints && data.sharePerPerson !== undefined && success) {
        // Optimistically update wallet points locally
        setPoints(prev => prev - 200 + (data.sharePerPerson || 0));
      } else if (setPoints) {
        setPoints(prev => Math.max(0, prev - 200));
      }
    } catch (err: any) {
      if (showNotice) showNotice(err.message, 'error');
    } finally {
      setIsSubmittingHeist(false);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-400 animate-pulse" /> Aura Capital Vault
            </h3>
            <p className="text-xs text-zinc-400">Secure wallet holdings and run cooperative server heists</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Coins className="w-4 h-4" />
            <div className="font-mono text-xs font-black">
              Wallet: {points.toLocaleString()} AP
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ShieldCheck className="w-4 h-4" />
            <div className="font-mono text-xs font-black">
              Bank: {bankBalance.toLocaleString()} AP
            </div>
          </div>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
            title="Refresh Server Lobby Stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isHeisting ? (
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* BANK DEPOSIT & WITHDRAW CONTROLS */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <h4 className="text-sm font-black text-zinc-300 tracking-wider uppercase font-mono flex items-center gap-2">
                    🏦 Secured Bank Account
                  </h4>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    Immune to Robberies
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Deposit Form */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-zinc-400">Deposit points into Bank</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="Amount (e.g. 100)"
                          className="w-full pl-3 pr-16 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 focus:outline-none font-mono text-sm text-white"
                        />
                        <button
                          onClick={() => setDepositAmount(points.toString())}
                          className="absolute right-2.5 top-2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-black text-zinc-400 hover:text-white"
                        >
                          MAX
                        </button>
                      </div>
                      <button
                        onClick={() => handleBankAction('deposit', depositAmount)}
                        disabled={isBankActionLoading || !depositAmount}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
                      >
                        Deposit
                      </button>
                    </div>
                  </div>

                  {/* Withdraw Form */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-zinc-400">Withdraw points to Wallet</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="Amount (e.g. 50)"
                          className="w-full pl-3 pr-16 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:outline-none font-mono text-sm text-white"
                        />
                        <button
                          onClick={() => setWithdrawAmount(bankBalance.toString())}
                          className="absolute right-2.5 top-2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-black text-zinc-400 hover:text-white"
                        >
                          MAX
                        </button>
                      </div>
                      <button
                        onClick={() => handleBankAction('withdraw', withdrawAmount)}
                        disabled={isBankActionLoading || !withdrawAmount}
                        className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-sm transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap border border-zinc-700/50"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40">
                  ⚠️ **Disclaimer:** Wallet points can be stolen by others using the "+rob" Discord commands or during server events. Store points in your Bank vault to protect them! Bank deposits are fully insulated from other players' actions.
                </div>
              </div>
            </div>

            {/* HEIST LOBBY & SERVER VAULT PANEL */}
            <div className="lg:col-span-7 space-y-6">
              {/* SERVER VAULT HEADER DISPLAY */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800/80 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-1">
                  <div className="text-xs font-mono font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Global Server Pool
                  </div>
                  <h4 className="text-sm font-black text-zinc-300">Aura Palace Server Vault</h4>
                </div>
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-5 py-3 rounded-2xl">
                  <Lock className="w-6 h-6 text-amber-400" />
                  <div className="text-left">
                    <div className="text-[10px] font-mono font-bold text-amber-400/70">VAULT BANKROLL</div>
                    <div className="font-mono text-xl font-black text-amber-300">
                      {serverVault.toLocaleString()} <span className="text-xs text-amber-400">AP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HEIST TEAM SECTION */}
              <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <h4 className="text-sm font-black text-zinc-300 tracking-wider uppercase font-mono flex items-center gap-2">
                    ⚔️ Heist Crew Lobby
                  </h4>
                  {userTeam && (
                    <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                      Team Active: 1 Hour Limit
                    </span>
                  )}
                </div>

                {/* Monthly Quota Progress tracker */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60 font-mono text-xs">
                  <div className="space-y-1 flex-1 text-left">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> Monthly Heist Limit (Quota)
                    </div>
                    <div className="text-zinc-300">
                      You have executed <span className="text-orange-400 font-black">{userHeistsThisMonth}</span> of <span className="text-white font-black">5</span> allowed server heists this month.
                    </div>
                  </div>
                  <div className="w-full sm:w-32 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800 shrink-0">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(Math.min(5, userHeistsThisMonth) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {!userTeam ? (
                  /* NO TEAM ACTIVE: CREATE ONE */
                  <div className="space-y-4">
                    <div className="text-xs text-zinc-400 leading-relaxed text-left">
                      You are currently not in a heist crew. Form a crew to challenge the server vault security safe!
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={teamNameInput}
                        onChange={(e) => setTeamNameInput(e.target.value)}
                        placeholder="Team Name (e.g. Syndicate)"
                        maxLength={20}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 focus:outline-none font-mono text-sm text-white"
                      />
                      <button
                        onClick={handleCreateTeam}
                        disabled={isTeamLoading || !teamNameInput.trim()}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <UserPlus className="w-4 h-4" /> Create Crew
                      </button>
                    </div>
                  </div>
                ) : (
                  /* IN ACTIVE TEAM */
                  <div className="space-y-6">
                    {/* Team Header */}
                    <div className="flex items-center justify-between bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/40">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-emerald-400">CREW COMMAND DEPOT</div>
                        <div className="text-lg font-bold text-white tracking-tight">{userTeam.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono font-bold text-zinc-500">CREW LEADER</div>
                        <div className="text-xs font-bold text-zinc-300">{userTeam.leader}</div>
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="space-y-2">
                      <div className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest">Crew Members ({userTeam.members.length}/5)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {userTeam.members.map((member) => (
                          <div 
                            key={member}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-950/30 border border-zinc-800/60 font-mono text-xs"
                          >
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-zinc-400" /> {member}
                              {member.toLowerCase() === userTeam.leader.toLowerCase() && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded uppercase font-bold">Leader</span>
                              )}
                            </span>
                            {userTeam.leader.toLowerCase() === playerName.toLowerCase() && member.toLowerCase() !== playerName.toLowerCase() && (
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="text-zinc-500 hover:text-red-400 transition-all p-1"
                                title="Kick Crew Member"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Leader Controls */}
                    {userTeam.leader.toLowerCase() === playerName.toLowerCase() ? (
                      <div className="space-y-4 pt-2 border-t border-zinc-800/60">
                        {/* Invite Form */}
                        {userTeam.members.length < 5 && (
                          <div className="space-y-2">
                            <label className="text-xs font-mono font-bold text-zinc-400">Add Crew Members (Must exist in registry)</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={inviteUsername}
                                onChange={(e) => setInviteUsername(e.target.value)}
                                placeholder="Username (e.g. Jack)"
                                className="flex-1 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800 focus:border-emerald-500 focus:outline-none font-mono text-xs text-white"
                              />
                              <button
                                onClick={handleInviteMember}
                                disabled={isTeamLoading || !inviteUsername.trim()}
                                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all disabled:opacity-50"
                              >
                                Add Crew Member
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={startSafeCrackerHeist}
                            disabled={userHeistsThisMonth >= 5}
                            className={`flex-1 py-3 px-5 rounded-xl text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                              userHeistsThisMonth >= 5 
                                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed shadow-none' 
                                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-950/30'
                            }`}
                          >
                            <Play className="w-4 h-4 fill-white" /> 
                            {userHeistsThisMonth >= 5 ? 'Monthly Heist Limit Reached' : 'Launch Safe Heist (Costs 200 AP)'}
                          </button>
                          <button
                            onClick={handleDeleteTeam}
                            className="px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500/30 hover:bg-zinc-900 text-zinc-400 hover:text-red-400 transition-all"
                            title="Disband Team Crew"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* MEMBER VIEW STATUS */
                      <div className="pt-4 border-t border-zinc-800/60 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-mono">
                          <span className="animate-ping rounded-full h-1.5 w-1.5 bg-red-400"></span>
                          Waiting for Captain <span className="text-white font-bold">{userTeam.leader}</span> to deploy heist run...
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACTIVE HEISTS / TEAMS LIST */}
              <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 shadow-xl space-y-4">
                <div className="border-b border-zinc-800/80 pb-2 flex items-center justify-between">
                  <h4 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-500" /> Active Crews on Server
                  </h4>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                    {allTeams.length} Active
                  </span>
                </div>

                {allTeams.length === 0 ? (
                  <div className="text-xs text-zinc-500 font-mono text-center py-4">
                    No heist crews are active right now. Form one to see it here!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allTeams.map((t) => {
                      const ageMins = Math.floor((Date.now() - t.createdAt) / 60000);
                      return (
                        <div 
                          key={t.name}
                          className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left font-mono text-xs"
                        >
                          <div>
                            <div className="font-bold text-white text-sm">{t.name}</div>
                            <div className="text-zinc-500 text-[10px] mt-0.5">Leader: {t.leader} | Members: {t.members.join(', ')}</div>
                          </div>
                          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto">
                            Expires in {Math.max(0, 60 - ageMins)}m
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* UPCOMING SCHEDULED HEISTS & ADMIN COMMAND PANEL */}
              <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 shadow-xl space-y-4 text-left">
                <div className="border-b border-zinc-800/80 pb-2 flex items-center justify-between">
                  <h4 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400 animate-pulse" /> Scheduled Upcoming Heists
                  </h4>
                  <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2.5 py-0.5 rounded-full font-bold">
                    {upcomingHeists.length} Scheduled
                  </span>
                </div>

                {upcomingHeists.length === 0 ? (
                  <div className="text-xs text-zinc-500 font-mono text-center py-4">
                    No upcoming heists are currently scheduled.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingHeists.map((h, index) => {
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
                          className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left font-mono text-xs"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-500" /> {h.vaultName}
                            </div>
                            <div className="text-zinc-400 flex items-center gap-1">
                              Target Pool: <span className="text-amber-400 font-bold">{h.targetAmount.toLocaleString()} AP</span>
                            </div>
                          </div>
                          <div className="sm:text-right space-y-0.5">
                            <div className="text-purple-400 font-semibold">{formattedDate}</div>
                            <div className="text-[10px] text-zinc-500">Registration opens 1h prior</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ADMIN SERVER VAULT CONTROLS DISCORD INSTRUCTIONS */}
                <div className="mt-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5 text-left text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase">
                      Admin Guide
                    </span>
                    <span className="text-zinc-300 font-bold">Server Vault Control Commands</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Administrators can fund or withdraw reserves from the active heist vault pool using these Discord server commands:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-zinc-300">
                    <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                      <span className="text-emerald-400 font-bold">+vault deposit &lt;amount&gt;</span>
                      <div className="text-zinc-500 text-[9px] mt-0.5">Funds the server vault jackpot</div>
                    </div>
                    <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                      <span className="text-red-400 font-bold">+vault withdraw &lt;amount&gt;</span>
                      <div className="text-zinc-500 text-[9px] mt-0.5">Withdraws reserves back from vault</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* SAFE CRACKER TERMINAL MINI-GAME SCREEN */
          <motion.div
            key="heist-game-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-3xl mx-auto"
          >
            <div className="p-8 rounded-3xl bg-zinc-950 border-2 border-emerald-500/20 shadow-2xl space-y-8 relative overflow-hidden font-mono text-emerald-400 text-left">
              {/* Matrix Background / Scanner lines */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/10 animate-[bounce_3s_infinite] pointer-events-none" />

              {/* Game Header */}
              <div className="flex justify-between items-center border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wider uppercase">SAFE-CRACK TERMINAL</h3>
                    <p className="text-[10px] text-zinc-500">SYSTEM: ENCRYPTED SAFE COMBINATION LOCKOUT</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-lg font-black tracking-widest ${heistTimer <= 10 ? 'bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                  00:{heistTimer.toString().padStart(2, '0')}
                </div>
              </div>

              {heistStatus === 'playing' ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* LEFT COLUMN: CONTROLS & SELECTION */}
                  <div className="md:col-span-7 space-y-6">
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      💻 **Hacking Mission:** The vault combination is 3 digits, each from **1 to 9**. Rotate the dials, scan, and adjust using higher/lower feedback signals!
                    </div>

                    {/* Combinator Input Dials */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Dial Combination</div>
                      <div className="flex justify-center gap-4">
                        {[0, 1, 2].map((idx) => (
                          <div key={idx} className="flex flex-col items-center space-y-2">
                            <button
                              onClick={() => {
                                const copy = [...userGuess];
                                const currentVal = parseInt(copy[idx], 10);
                                copy[idx] = currentVal >= 9 ? '1' : (currentVal + 1).toString();
                                setUserGuess(copy);
                              }}
                              className="w-12 h-10 rounded-t-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-all font-bold"
                            >
                              ▲
                            </button>
                            <div className="w-16 h-16 bg-zinc-900 border-2 border-emerald-500/30 rounded-xl flex items-center justify-center text-3xl font-black text-white shadow-lg">
                              {userGuess[idx]}
                            </div>
                            <button
                              onClick={() => {
                                const copy = [...userGuess];
                                const currentVal = parseInt(copy[idx], 10);
                                copy[idx] = currentVal <= 1 ? '9' : (currentVal - 1).toString();
                                setUserGuess(copy);
                              }}
                              className="w-12 h-10 rounded-b-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-all font-bold"
                            >
                              ▼
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={submitCrackingGuess}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/30 border border-emerald-400/20"
                    >
                      <Key className="w-5 h-5" /> Submit Dial Code ({8 - guessHistory.length} Guesses Left)
                    </button>
                  </div>

                  {/* RIGHT COLUMN: REALTIME FEEDBACK MATRIX */}
                  <div className="md:col-span-5 flex flex-col h-[340px] border border-emerald-500/20 bg-zinc-950/60 rounded-2xl p-4 overflow-hidden">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-emerald-500/10 pb-2 mb-3">
                      Hacking Feedback Streams
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto font-mono text-xs pr-2">
                      {guessHistory.length === 0 ? (
                        <div className="text-zinc-500 text-center py-16">
                          Enter dial code above to start combination crack
                        </div>
                      ) : (
                        guessHistory.map((h, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between border-b border-zinc-900 pb-1.5"
                          >
                            <span className="text-zinc-500">GUESS #{index + 1}:</span>
                            <span className="font-bold text-white tracking-wider bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-mono text-sm">
                              {h.guess.join(' - ')}
                            </span>
                            <div className="flex gap-1.5">
                              {h.feedback.map((f, fIdx) => (
                                <span 
                                  key={fIdx}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                    f === '✓' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 
                                    f === '▲' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* KEY LEGEND */}
                    <div className="border-t border-emerald-500/10 pt-3 mt-3 grid grid-cols-3 gap-1 text-[9px] text-zinc-400 font-bold uppercase">
                      <div className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center justify-center">✓</span> Correct</div>
                      <div className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded flex items-center justify-center">▲</span> Too Low</div>
                      <div className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded flex items-center justify-center">▼</span> Too High</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* HEIST RESULTS MODAL SCREEN */
                <div className="space-y-6 text-center py-8 max-w-xl mx-auto">
                  <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-zinc-800">
                    {heistStatus === 'win' ? (
                      <Unlock className="w-12 h-12 text-emerald-400 animate-bounce" />
                    ) : (
                      <Lock className="w-12 h-12 text-red-500 animate-[shake_0.5s_infinite]" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-white tracking-wide uppercase">
                      {heistStatus === 'win' ? '🎯 VAULT UNLOCKED!' : '🚨 ACCESS DENIED!'}
                    </h4>
                    <p className="text-sm text-zinc-400">
                      {heistStatus === 'win' 
                        ? 'Safe combination solved! System offline, distributing loot...' 
                        : 'Server firewall triggered or time ran out. Commencing escape!'}
                    </p>
                  </div>

                  {isSubmittingHeist ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-6 font-mono text-zinc-500">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      Communicating with server secure transaction gateway...
                    </div>
                  ) : (
                    <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 text-left font-mono text-xs space-y-3 leading-relaxed">
                      {heistMessage ? (
                        <div className="text-zinc-300">
                          {heistMessage}
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-center py-4">
                          Syncing safe outcomes with local server pool logs...
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsHeisting(false);
                      setHeistStatus('playing');
                      setRefreshTrigger(prev => prev + 1);
                    }}
                    disabled={isSubmittingHeist}
                    className="py-3 px-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-white font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    Return to Safe Houses
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
