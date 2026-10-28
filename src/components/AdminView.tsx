import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Tournament, User, DepositRequest, WithdrawalRequest, AppSettings, Admin, LeaderboardEntry, BroadcastRecord } from "../types";
import { 
  LayoutDashboard, Gamepad2, Users, ArrowDownLeft, ArrowUpRight, Settings, Plus, 
  Trash2, Edit, Trophy, Key, ShieldAlert, Coins, RefreshCw, CheckCircle2, XCircle, 
  Loader2, Mail, Save, QrCode, Phone, Clipboard, AlertCircle, Medal, Crown,
  ArrowUp, ArrowDown, RotateCcw, Sparkles, Search, SlidersHorizontal, Bell, ShieldCheck,
  Send, Lock, Unlock, ListOrdered, Calendar, Eye, Copy, Filter, Megaphone, MessageSquare,
  KeyRound, History
} from "lucide-react";
import { WithdrawalQrModal } from "./WithdrawalQrModal";
import { TournamentFormModal } from "./admin/TournamentFormModal";
import { RoomDetailsModal } from "./admin/RoomDetailsModal";
import { RegistrationsModal } from "./admin/RegistrationsModal";
import { MatchesModal } from "./admin/MatchesModal";
import { TournamentScoresModal } from "./admin/TournamentScoresModal";
import { BroadcastNotificationModal } from "./admin/BroadcastNotificationModal";
import { SafeDeleteTournamentModal } from "./admin/SafeDeleteTournamentModal";
import { AdminSupportSection } from "./admin/AdminSupportSection";

interface AdminViewProps {
  currentAdmin: Admin;
  onLogout: () => void;
}

export default function AdminView({ currentAdmin, onLogout }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tournaments" | "notifications" | "support" | "leaderboard" | "deposits" | "withdrawals" | "users" | "settings">("dashboard");

  // Core Data Lists
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalTournaments: 0, totalPrizeDistributed: 0, totalRevenue: 0 });
  const [pendingSupportCount, setPendingSupportCount] = useState<number>(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [adminSelectedWithdrawalForQr, setAdminSelectedWithdrawalForQr] = useState<WithdrawalRequest | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ upi_id: "", qr_code_url: "", admin_mobile: "" });

  // Modals for Tournament Management System
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [roomModalTournament, setRoomModalTournament] = useState<Tournament | null>(null);
  const [registrationsModalTournament, setRegistrationsModalTournament] = useState<Tournament | null>(null);
  const [matchesModalTournament, setMatchesModalTournament] = useState<Tournament | null>(null);
  const [scoresModalTournament, setScoresModalTournament] = useState<Tournament | null>(null);
  const [safeDeleteTournament, setSafeDeleteTournament] = useState<Tournament | null>(null);
  
  // Broadcasts & Notifications States
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTargetTournId, setBroadcastTargetTournId] = useState<string | undefined>(undefined);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastRecord[]>([]);
  const [broadcastSearch, setBroadcastSearch] = useState("");
  const [broadcastFilter, setBroadcastFilter] = useState<string>("all");
  
  const [tournamentFilter, setTournamentFilter] = useState<string>("all");

  // Leaderboard Override State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const [overridingUserId, setOverridingUserId] = useState<string | null>(null);
  const [overrideUsername, setOverrideUsername] = useState("");
  const [overrideWinnings, setOverrideWinnings] = useState("");
  const [overrideWins, setOverrideWins] = useState("");
  const [overrideRank, setOverrideRank] = useState("");
  const [overrideRawWinnings, setOverrideRawWinnings] = useState(0);
  const [overrideRawWins, setOverrideRawWins] = useState(0);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create/Edit Tournament States
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [gameName, setGameName] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [commissionPct, setCommissionPct] = useState("20");

  // Manage Room Credentials / Declare Winner States
  const [showManageModal, setShowManageModal] = useState<string | null>(null); // tournament ID
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedWinnerId, setSelectedWinnerId] = useState("");

  // User Balance Adjustment state
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("Admin Wallet Adjustment");

  // Gamer Management (Delete & Search)
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [gamerSearch, setGamerSearch] = useState("");

  // Admin Settings credentials update state
  const [adminUsername, setAdminUsername] = useState(currentAdmin.username);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminMobile, setAdminMobile] = useState("7667265813");
  const [adminEmail, setAdminEmail] = useState(currentAdmin.email || "admin@artificialsamrajya.com");
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loadingSecurityLogs, setLoadingSecurityLogs] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      const statsRes = await api.getAdminStats();
      if (statsRes.success) setStats(statsRes.stats);

      const settingsRes = await api.getAppSettings();
      if (settingsRes.success) {
        setSettings(settingsRes.settings);
        setAdminMobile(settingsRes.settings.admin_mobile || "7667265813");
        if (settingsRes.settings.admin_username) {
          setAdminUsername(settingsRes.settings.admin_username);
        }
        if (settingsRes.settings.admin_email) {
          setAdminEmail(settingsRes.settings.admin_email);
        }
      }

      if (activeTab === "settings") {
        try {
          setLoadingSecurityLogs(true);
          const logsRes = await api.getSecurityAuditLogs();
          if (logsRes.success) {
            setSecurityLogs(logsRes.auditLogs || []);
          }
        } catch (err) {
          console.error("Failed to load security audit logs", err);
        } finally {
          setLoadingSecurityLogs(false);
        }
      }

      if (activeTab === "tournaments" || activeTab === "dashboard" || activeTab === "notifications") {
        const tRes = await api.getTournaments();
        if (tRes.success) setTournaments(tRes.tournaments);
      }

      if (activeTab === "users" || activeTab === "dashboard" || activeTab === "notifications") {
        const uRes = await api.getAdminUsers();
        if (uRes.success) setUsers(uRes.users);
      }

      if (activeTab === "leaderboard" || activeTab === "dashboard" || activeTab === "users") {
        const lRes = await api.getLeaderboard();
        if (lRes.success) setLeaderboard(lRes.leaderboard);
      }

      if (activeTab === "deposits") {
        const dRes = await api.getAdminDeposits();
        if (dRes.success) setDeposits(dRes.deposits);
      }

      if (activeTab === "withdrawals") {
        const wRes = await api.getAdminWithdrawals();
        if (wRes.success) setWithdrawals(wRes.withdrawals);
      }

      if (activeTab === "notifications" || activeTab === "dashboard") {
        const nRes = await api.getNotificationHistory();
        if (nRes.success) {
          setBroadcastHistory(nRes.broadcasts || []);
        }
      }

      // Fetch pending support tickets count
      try {
        const supRes = await api.getSupportTickets();
        if (supRes.success && Array.isArray(supRes.tickets)) {
          const pending = supRes.tickets.filter((t: any) => t.status === "Open" || t.status === "In Progress" || t.priority === "Urgent").length;
          setPendingSupportCount(pending);
        }
      } catch (err) {
        console.error("Failed to fetch pending tickets count", err);
      }

    } catch (e: any) {
      setErrorMsg(e.message || "Failed to parse system indices.");
    } finally {
      setLoading(false);
    }
  };

  // Duplicate Tournament
  const handleDuplicateTournament = async (id: string) => {
    try {
      const res = await api.duplicateTournament(id);
      if (res.success) {
        setSuccessMsg("Tournament duplicated successfully as a new draft!");
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to duplicate tournament.");
    }
  };

  // Save Tournament from TournamentFormModal
  const handleSaveTournamentModal = async (data: Partial<Tournament>) => {
    try {
      if (editingTournament) {
        const res = await api.updateTournament(editingTournament.id, data);
        if (res.success) {
          setSuccessMsg("Tournament updated successfully!");
          setFormModalOpen(false);
          setEditingTournament(null);
          fetchAdminData();
        }
      } else {
        const res = await api.createTournament(data);
        if (res.success) {
          setSuccessMsg("Tournament created successfully!");
          setFormModalOpen(false);
          setEditingTournament(null);
          fetchAdminData();
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to save tournament.");
    }
  };

  // Save Room Credentials from RoomDetailsModal
  const handleSaveRoomModal = async (roomIdVal: string, roomPasswordVal: string, roomTimeVal: string, publishVal: boolean) => {
    if (!roomModalTournament) return;
    try {
      const res = await api.updateRoomInfo(roomModalTournament.id, {
        room_id: roomIdVal,
        room_password: roomPasswordVal,
        room_time: roomTimeVal,
        room_published: publishVal
      });
      if (res.success) {
        setSuccessMsg(publishVal ? "Room details published and notifications sent to players!" : "Room credentials saved successfully!");
        setRoomModalTournament(null);
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to update room details.");
    }
  };

  // Clear Room Credentials from RoomDetailsModal
  const handleClearRoomModal = async () => {
    if (!roomModalTournament) return;
    try {
      const res = await api.updateRoomInfo(roomModalTournament.id, {
        room_id: "",
        room_password: "",
        room_published: false
      });
      if (res.success) {
        setSuccessMsg("Room credentials cleared.");
        setRoomModalTournament(null);
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to clear room credentials.");
    }
  };

  // Create or Update Tournament
  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      title,
      game_name: gameName,
      entry_fee: Number(entryFee) || 0,
      prize_pool: Number(prizePool) || 0,
      match_time: matchTime,
      commission_percentage: Number(commissionPct) || 20
    };

    try {
      if (editingId) {
        const res = await api.updateTournament(editingId, payload);
        if (res.success) {
          setSuccessMsg("Tournament updated successfully!");
          setEditingId(null);
        }
      } else {
        const res = await api.createTournament(payload);
        if (res.success) {
          setSuccessMsg("Tournament created successfully!");
        }
      }

      // Reset
      setTitle("");
      setGameName("");
      setEntryFee("");
      setPrizePool("");
      setMatchTime("");
      setCommissionPct("20");
      setShowTournamentForm(false);
      fetchAdminData();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to commit tournament payload.");
    }
  };

  // Populate Edit Fields
  const startEdit = (t: Tournament) => {
    setEditingId(t.id);
    setTitle(t.title);
    setGameName(t.game_name);
    setEntryFee(t.entry_fee.toString());
    setPrizePool(t.prize_pool.toString());
    setMatchTime(t.match_time);
    setCommissionPct((t.commission_percentage || 20).toString());
    setShowTournamentForm(true);
  };

  // Delete Tournament
  const handleDeleteTournament = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this tournament permanently? This removes all registrations.")) return;
    try {
      const res = await api.deleteTournament(id);
      if (res.success) {
        setSuccessMsg("Tournament deleted successfully!");
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not delete tournament.");
    }
  };

  // Open Room Credentials and Winner Form
  const openManageModal = async (t: Tournament) => {
    setShowManageModal(t.id);
    setRoomId(t.room_id || "");
    setRoomPassword(t.room_password || "");
    setSelectedWinnerId(t.winner_id || "");
    
    try {
      const res = await api.getTournamentParticipants(t.id);
      if (res.success) {
        setParticipants(res.participants);
      }
    } catch (e) {
      console.error("Could not fetch participants", e);
    }
  };

  // Submit Room Credentials
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showManageModal) return;
    try {
      const res = await api.updateRoomInfo(showManageModal, { room_id: roomId, room_password: roomPassword });
      if (res.success) {
        setSuccessMsg("Room credentials updated successfully!");
        setShowManageModal(null);
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not update room configurations.");
    }
  };

  // Declare Winner
  const handleDeclareWinner = async () => {
    if (!showManageModal || !selectedWinnerId) return;
    if (!window.confirm("Declare this player as winner and distribute prize pool? This action is final.")) return;
    try {
      const res = await api.declareWinner(showManageModal, selectedWinnerId);
      if (res.success) {
        setSuccessMsg(res.message);
        setShowManageModal(null);
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not distribute prizes.");
    }
  };

  // Toggle block/unblock gamer
  const handleToggleBlock = async (id: string) => {
    try {
      const res = await api.toggleBlockUser(id);
      if (res.success) {
        setSuccessMsg("User status changed successfully!");
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not change status.");
    }
  };

  // Permanently delete gamer account (Admin power)
  const handleDeleteUser = async (id: string) => {
    try {
      setDeleteUserLoading(true);
      const res = await api.deleteUser(id);
      if (res.success) {
        setSuccessMsg(res.message || "Gamer permanently deleted!");
        setDeletingUser(null);
        fetchAdminData();
      } else {
        setErrorMsg(res.message || "Could not delete gamer.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not delete gamer.");
    } finally {
      setDeleteUserLoading(false);
    }
  };

  // Adjust gamer balance manually
  const handleAdjustBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUserId) return;
    try {
      const res = await api.adjustUserBalance(adjustingUserId, { amount: Number(adjustAmount), description: adjustDesc });
      if (res.success) {
        setSuccessMsg("Gamer balance adjusted successfully!");
        setAdjustingUserId(null);
        setAdjustAmount("");
        setAdjustDesc("Admin Wallet Adjustment");
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not adjust balance.");
    }
  };

  const handleOpenLeaderboardModal = (entry: LeaderboardEntry | any) => {
    setOverridingUserId(entry.id);
    setOverrideUsername(entry.username);
    setOverrideWinnings(
      entry.custom_total_winnings !== undefined 
        ? entry.custom_total_winnings.toString() 
        : (entry.total_winnings !== undefined ? entry.total_winnings.toString() : "")
    );
    setOverrideWins(
      entry.custom_tournaments_won !== undefined 
        ? entry.custom_tournaments_won.toString() 
        : (entry.tournaments_won !== undefined ? entry.tournaments_won.toString() : "")
    );
    setOverrideRank(entry.custom_rank !== undefined ? entry.custom_rank.toString() : "");
    setOverrideRawWinnings(entry.raw_winnings !== undefined ? entry.raw_winnings : (entry.total_winnings || 0));
    setOverrideRawWins(entry.raw_wins !== undefined ? entry.raw_wins : (entry.tournaments_won || 0));
  };

  const handleOverrideLeaderboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overridingUserId) return;
    try {
      setIsSubmittingOverride(true);
      const res = await api.overrideLeaderboard(overridingUserId, { 
        custom_total_winnings: overrideWinnings.trim() === "" ? "" : Number(overrideWinnings), 
        custom_tournaments_won: overrideWins.trim() === "" ? "" : Number(overrideWins),
        custom_rank: overrideRank.trim() === "" ? "" : Number(overrideRank)
      });
      if (res.success) {
        setSuccessMsg("Leaderboard rankings and winnings overridden successfully!");
        setOverridingUserId(null);
        setOverrideWinnings("");
        setOverrideWins("");
        setOverrideRank("");
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not override leaderboard.");
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleResetSingleOverride = async (userId: string) => {
    try {
      const res = await api.overrideLeaderboard(userId, { reset: true });
      if (res.success) {
        setSuccessMsg("Reset gamer stats to natural tournament records!");
        if (overridingUserId === userId) {
          setOverridingUserId(null);
        }
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not reset leaderboard stats.");
    }
  };

  const handleResetAllLeaderboard = async () => {
    if (!window.confirm("Are you sure you want to reset ALL manual rankings and custom winnings? All rankings will revert to natural tournament victory history.")) {
      return;
    }
    try {
      const res = await api.resetAllLeaderboardOverrides();
      if (res.success) {
        setSuccessMsg("All leaderboard overrides reset to natural history!");
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not reset all overrides.");
    }
  };

  const handleMoveRank = async (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= leaderboard.length) return;

    const newOrder = [...leaderboard];
    const temp = newOrder[currentIndex];
    newOrder[currentIndex] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    try {
      const orderIds = newOrder.map(item => item.id);
      const res = await api.reorderLeaderboard(orderIds);
      if (res.success) {
        setSuccessMsg("Leaderboard ranking order updated!");
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to update ranking order.");
    }
  };

  // Approve / Reject Deposits
  const handleResolveDeposit = async (id: string, action: "Approve" | "Reject") => {
    try {
      const res = await api.resolveDeposit(id, action);
      if (res.success) {
        setSuccessMsg(`Deposit ${action === "Approve" ? "Approved" : "Rejected"} successfully!`);
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not process deposit request.");
    }
  };

  // Approve / Reject Withdrawals
  const handleResolveWithdrawal = async (id: string, action: "Approve" | "Reject") => {
    try {
      const res = await api.resolveWithdrawal(id, action);
      if (res.success) {
        setSuccessMsg(`Withdrawal ${action === "Approve" ? "Completed" : "Rejected"} successfully!`);
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not process withdrawal request.");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.updateSettings({
        upi_id: settings.upi_id,
        qr_code_url: settings.qr_code_url,
        admin_mobile: adminMobile,
        admin_username: adminUsername,
        admin_email: adminEmail,
        admin_password: adminPassword || undefined
      });
      if (res.success) {
        setSuccessMsg("Admin credentials and settings saved successfully!");
        setAdminPassword(""); // clear
        fetchAdminData();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Could not commit system properties.");
    }
  };

  // Fast generation of mock visual QR link
  const generateQRCodeURL = () => {
    const sanitizedUPI = encodeURIComponent(settings.upi_id.trim());
    const generatedURL = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${sanitizedUPI}&pn=ARTIFICIAL%20SAMARAJYA%20eSPORTS&cu=INR`;
    setSettings({
      ...settings,
      qr_code_url: generatedURL
    });
    setSuccessMsg("Automatic QR Code link compiled! Save setting to commit.");
  };

  const filteredLeaderboard = leaderboard.filter((entry) => {
    if (!leaderboardSearch.trim()) return true;
    const q = leaderboardSearch.toLowerCase();
    return (
      entry.username?.toLowerCase().includes(q) ||
      entry.email?.toLowerCase().includes(q) ||
      entry.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20">

      {/* Header Admin Quick Details */}
      <div className="bg-[#1A1D24] p-5 rounded-3xl border border-white/5 shadow-xl flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[9px] font-mono tracking-widest text-[#FF6B00] uppercase font-bold block">
            ADMIN CONSOLE
          </span>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">
            ARTIFICIAL SAMRAJYA
          </h2>
          <p className="text-[10px] text-gray-500 font-medium">Official Administrative & Esports Tournament Management Console</p>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-lg text-[10px] transition-all uppercase"
        >
          DISCONNECT
        </button>
      </div>

      {/* Horizontal Tab bar navigation for administrators (responsive scrollable) */}
      <div className="flex bg-[#1A1D24] border border-white/5 rounded-2xl p-1 overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "dashboard" ? "bg-[#FF6B00] text-black shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "tournaments" ? "bg-[#FF6B00] text-black shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          Tournaments
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 relative ${
            activeTab === "notifications" ? "bg-[#FF6B00] text-black shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Broadcasts
          {broadcastHistory.length > 0 && (
            <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded-full font-black ${
              activeTab === "notifications" ? "bg-black/30 text-black" : "bg-[#FF6B00]/20 text-[#FF6B00]"
            }`}>
              {broadcastHistory.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 relative ${
            activeTab === "support" ? "bg-[#FF6B00] text-black shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Support & Messages
          {pendingSupportCount > 0 && (
            <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded-full font-black ${
              activeTab === "support" ? "bg-black text-[#FF6B00]" : "bg-red-500 text-white animate-pulse"
            }`}>
              {pendingSupportCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 relative ${
            activeTab === "leaderboard" ? "bg-[#FF6B00] text-black shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab("deposits")}
          className={`px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 relative ${
            activeTab === "deposits" ? "bg-[#FF6B00] text-black shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          Deposits
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 relative ${
            activeTab === "withdrawals" ? "bg-[#FF6B00] text-black shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Withdrawals
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "users" ? "bg-[#FF6B00] text-black shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Gamers
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "settings" ? "bg-[#FF6B00] text-black shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
          <span className="text-xs font-mono">Syncing server database registry...</span>
        </div>
      ) : (
        <>
          {/* ===================================================================
              TAB: DASHBOARD (ADMIN QUICK STATS)
              =================================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Grid statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A1D24] border border-white/5 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Total Users</span>
                  <div className="text-xl font-black text-white">{stats.totalUsers}</div>
                  <p className="text-[9px] text-gray-600">Registered Gamers</p>
                </div>
                <div className="bg-[#1A1D24] border border-white/5 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Total Matches</span>
                  <div className="text-xl font-black text-white">{stats.totalTournaments}</div>
                  <p className="text-[9px] text-gray-650 font-mono">Completed + Upcoming</p>
                </div>
                <div className="bg-[#1A1D24] border border-white/5 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Prize Disbursed</span>
                  <div className="text-xl font-black text-[#00E676]">₹{stats.totalPrizeDistributed}</div>
                  <p className="text-[9px] text-gray-600">Victory Pool Paid</p>
                </div>
                <div className="bg-[#1A1D24] border border-white/5 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">App Revenue</span>
                  <div className="text-xl font-black text-[#FF6B00]">₹{stats.totalRevenue}</div>
                  <p className="text-[9px] text-gray-650 font-mono">Deducted Commissions</p>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-tighter">Create Tournament</h4>
                    <p className="text-[10px] text-gray-500">Inject a brand new battle schedule with full parameters.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTournament(null);
                      setFormModalOpen(true);
                    }}
                    className="px-4 py-3 bg-[#FF6B00] hover:bg-[#E65100] text-black font-black uppercase rounded-2xl text-xs flex items-center gap-1 shrink-0 tracking-tighter shadow-lg shadow-[#FF6B00]/10"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    CREATE
                  </button>
                </div>

                <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-tighter">Leaderboard & Winnings</h4>
                    <p className="text-[10px] text-gray-500">Override rankings, podium, & prize stats.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("leaderboard")}
                    className="px-4 py-3 bg-[#0F1115] hover:bg-white/5 border border-white/10 text-white font-bold uppercase rounded-2xl text-xs flex items-center gap-1.5 shrink-0 tracking-tighter"
                  >
                    <Trophy className="w-4 h-4 text-[#FF6B00]" />
                    MANAGE
                  </button>
                </div>

                <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-tighter flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-[#FF6B00]" />
                      Broadcast System
                    </h4>
                    <p className="text-[10px] text-gray-500">Send alerts to gamers, tournament participants, or user IDs.</p>
                  </div>
                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    className="px-4 py-3 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/30 text-[#FF6B00] font-black uppercase rounded-2xl text-xs flex items-center gap-1.5 shrink-0 tracking-tighter"
                  >
                    <Send className="w-3.5 h-3.5" />
                    SEND ALERT
                  </button>
                </div>

                <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-tighter flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#FF6B00]" />
                        Gamer Support & Helpdesk
                      </h4>
                      {pendingSupportCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-red-500 text-white font-mono text-[9px] font-black rounded-full animate-pulse">
                          {pendingSupportCount} PENDING
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">Review tickets, answer Room ID / pass queries & chat with players.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("support")}
                    className="px-4 py-3 bg-[#FF6B00] hover:bg-[#E65100] text-black font-black uppercase rounded-2xl text-xs flex items-center gap-1.5 shrink-0 tracking-tighter shadow-lg shadow-[#FF6B00]/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-black" />
                    OPEN INBOX
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB: TOURNAMENTS (COMPREHENSIVE TOURNAMENT MANAGEMENT SYSTEM)
              =================================================================== */}
          {activeTab === "tournaments" && (
            <div className="space-y-4">
              {/* Header Action Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setEditingTournament(null);
                    setFormModalOpen(true);
                  }}
                  className="py-3.5 px-4 bg-[#FF6B00] hover:bg-[#E65100] text-black font-black tracking-tight uppercase rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/10 active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  CREATE NEW TOURNAMENT
                </button>
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className="py-3.5 px-4 bg-[#1A1D24] hover:bg-[#252830] text-white border border-white/10 hover:border-[#FF6B00]/40 font-bold tracking-tight uppercase rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Bell className="w-4 h-4 text-[#FF6B00]" />
                  BROADCAST NOTIFICATION
                </button>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: "all", label: "All Tournaments", count: tournaments.length },
                  { id: "Upcoming", label: "Upcoming", count: tournaments.filter((t) => t.status === "Upcoming").length },
                  { id: "Live", label: "Live Now", count: tournaments.filter((t) => t.status === "Live").length },
                  { id: "Completed", label: "Completed", count: tournaments.filter((t) => t.status === "Completed").length },
                  { id: "Draft", label: "Drafts", count: tournaments.filter((t) => t.status === "Draft").length },
                  { id: "Cancelled", label: "Cancelled", count: tournaments.filter((t) => t.status === "Cancelled").length },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setTournamentFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                      tournamentFilter === chip.id
                        ? "bg-[#FF6B00] text-black shadow-md"
                        : "bg-[#1A1D24] text-gray-400 hover:text-white border border-white/5"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono ${
                      tournamentFilter === chip.id ? "bg-black/20 text-black font-black" : "bg-white/5 text-gray-500"
                    }`}>
                      {chip.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tournaments List */}
              <div className="space-y-4">
                {tournaments
                  .filter((t) => tournamentFilter === "all" || t.status === tournamentFilter)
                  .map((t) => {
                    const maxP = t.max_players || 100;
                    const filled = t.slots_filled || 0;
                    const pct = Math.min(100, Math.round((filled / maxP) * 100));
                    const isRoomLive = Boolean(t.room_published && t.room_id);

                    return (
                      <div 
                        key={t.id} 
                        className={`bg-[#1A1D24] border rounded-3xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col gap-4 ${
                          t.status === "Live" 
                            ? "border-red-500/30 ring-1 ring-red-500/20" 
                            : t.status === "Draft"
                              ? "border-yellow-500/20 opacity-90"
                              : "border-white/5"
                        }`}
                      >
                        {/* Top Badge & Metadata */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                t.status === "Live"
                                  ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30"
                                  : t.status === "Completed"
                                    ? "bg-black/40 text-gray-400 border border-white/5"
                                    : t.status === "Draft"
                                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                      : t.status === "Cancelled"
                                        ? "bg-red-900/20 text-red-400 border border-red-900/30"
                                        : "bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20"
                              }`}>
                                {t.status === "Live" ? "● MATCH LIVE" : t.status}
                              </span>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 uppercase border border-white/5">
                                {t.tournament_type || "Solo"}
                              </span>
                              {t.map_mode && (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                                  {t.map_mode}
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-black text-white tracking-tight">{t.title}</h4>
                            <p className="text-xs text-gray-400 font-medium">{t.game_name}</p>
                          </div>

                          {/* Action header shortcuts (Edit, Duplicate, Broadcast, Safe Delete) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingTournament(t);
                                setFormModalOpen(true);
                              }}
                              className="p-2 bg-[#0F1115] hover:bg-[#252830] border border-white/5 hover:border-[#FF6B00]/40 text-gray-300 hover:text-[#FF6B00] rounded-xl transition-all"
                              title="Edit Tournament Settings"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateTournament(t.id)}
                              className="p-2 bg-[#0F1115] hover:bg-[#252830] border border-white/5 hover:border-blue-500/40 text-gray-300 hover:text-blue-400 rounded-xl transition-all"
                              title="Duplicate Tournament"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setBroadcastTargetTournId(t.id);
                                setShowBroadcastModal(true);
                              }}
                              className="p-2 bg-[#0F1115] hover:bg-[#252830] border border-white/5 hover:border-yellow-500/40 text-gray-300 hover:text-yellow-400 rounded-xl transition-all"
                              title="Send Broadcast Notification to Registered Players"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSafeDeleteTournament(t)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all"
                              title="Safe Delete / Cancel Tournament"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Slots & Prize Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-[#0F1115] p-3 rounded-2xl border border-white/5 text-center">
                          <div>
                            <span className="text-[9px] text-gray-500 uppercase font-mono block">Entry Fee</span>
                            <span className="text-xs font-black text-white block mt-0.5">
                              {t.entry_fee === 0 ? "FREE" : `₹${t.entry_fee}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 uppercase font-mono block">Prize Pool</span>
                            <span className="text-xs font-black text-[#00E676] block mt-0.5">₹{t.prize_pool}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 uppercase font-mono block">Roster Slots</span>
                            <span className="text-xs font-black text-[#FF6B00] block mt-0.5">
                              {filled} / {maxP}
                            </span>
                          </div>
                        </div>

                        {/* Slot Capacity Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Registration Fill</span>
                            <span className="font-mono">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                pct >= 100 ? "bg-red-500" : "bg-[#FF6B00]"
                              }`} 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>

                        {/* Room Status Indicator */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isRoomLive
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : t.room_id
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-black/20 border-white/5 text-gray-500"
                        }`}>
                          <div className="flex items-center gap-2">
                            {isRoomLive ? (
                              <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                            <span className="text-[11px] font-bold">
                              {isRoomLive
                                ? `Room Details Published (ID: ${t.room_id})`
                                : t.room_id
                                  ? `Credentials Saved (Unpublished to Gamers)`
                                  : "Room ID & Password Pending"}
                            </span>
                          </div>
                          <button
                            onClick={() => setRoomModalTournament(t)}
                            className="text-[10px] font-black uppercase underline hover:opacity-80 transition-all"
                          >
                            {isRoomLive ? "View / Edit" : "Set Room"}
                          </button>
                        </div>

                        {/* Comprehensive Admin Action Buttons Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <button
                            onClick={() => setRoomModalTournament(t)}
                            className="py-2.5 px-3 bg-[#0F1115] hover:bg-[#252830] border border-white/10 hover:border-[#FF6B00]/40 text-gray-200 hover:text-[#FF6B00] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5 text-[#FF6B00]" />
                            Room & Pass
                          </button>

                          <button
                            onClick={() => setRegistrationsModalTournament(t)}
                            className="py-2.5 px-3 bg-[#0F1115] hover:bg-[#252830] border border-white/10 hover:border-[#FF6B00]/40 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            Roster ({filled})
                          </button>

                          <button
                            onClick={() => setMatchesModalTournament(t)}
                            className="py-2.5 px-3 bg-[#0F1115] hover:bg-[#252830] border border-white/10 hover:border-[#FF6B00]/40 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                            Matches
                          </button>

                          <button
                            onClick={() => setScoresModalTournament(t)}
                            className="py-2.5 px-3 bg-[#0F1115] hover:bg-[#252830] border border-[#00E676]/20 hover:border-[#00E676]/50 text-[#00E676] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Trophy className="w-3.5 h-3.5 text-[#00E676]" />
                            Scores / Podium
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {tournaments.filter((t) => tournamentFilter === "all" || t.status === tournamentFilter).length === 0 && (
                  <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-10 text-center text-gray-500 space-y-3">
                    <Gamepad2 className="w-10 h-10 mx-auto text-gray-600" />
                    <p className="text-xs font-bold text-gray-400">No tournaments match the selected filter.</p>
                    <button
                      onClick={() => {
                        setEditingTournament(null);
                        setFormModalOpen(true);
                      }}
                      className="px-4 py-2 bg-[#FF6B00] text-black font-black rounded-xl text-xs uppercase"
                    >
                      Create Tournament
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB: LEADERBOARD & WINNINGS OVERRIDE CONTROLLER
              =================================================================== */}
          {activeTab === "leaderboard" && (
            <div className="space-y-5 animate-fade-in">
              {/* Leaderboard Management Header Banner */}
              <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-xl text-[#FF6B00]">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono tracking-widest text-[#FF6B00] uppercase font-bold">
                        Rankings Controller
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      Leaderboard & Winnings Override
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Manually customize player rank positions, total victory winnings (₹), and match win counts.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleResetAllLeaderboard}
                    title="Reset all overrides back to organic tournament victory records"
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3 text-[#FF6B00]" />
                    Reset All
                  </button>
                </div>

                {/* Search Bar & Active Stats */}
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      value={leaderboardSearch}
                      onChange={(e) => setLeaderboardSearch(e.target.value)}
                      placeholder="Search gamer by username or email..."
                      className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-600 outline-none transition-all"
                    />
                    {leaderboardSearch && (
                      <button
                        onClick={() => setLeaderboardSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="px-3 py-2 bg-[#0F1115] border border-white/5 rounded-xl text-[10px] font-mono font-bold text-gray-400 shrink-0">
                    <span className="text-[#FF6B00]">{leaderboard.filter(e => e.has_override).length}</span> Overrides Active
                  </div>
                </div>
              </div>

              {/* Live Front-End Podium Preview */}
              <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[#FFD700]" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-tighter">
                      Live Gamer Podium Preview
                    </h4>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase">
                    Reflects Home Screen Top 3
                  </span>
                </div>

                {leaderboard.length === 0 ? (
                  <p className="text-[10px] text-gray-500 text-center py-4">No registered players yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 items-end pt-3 pb-1">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                      {leaderboard[1] ? (
                        <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-2.5 text-center flex flex-col items-center justify-between h-[135px] w-full relative shadow-md">
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#D1D1D1]/20 text-[#D1D1D1] border border-[#D1D1D1]/40 rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black font-mono shadow">
                            2
                          </div>
                          <div className="space-y-0.5 w-full mt-2">
                            <p className="text-[10px] font-black text-gray-200 truncate uppercase tracking-tighter">
                              {leaderboard[1].username}
                            </p>
                            <p className="text-[8px] text-gray-500 font-bold uppercase">
                              {leaderboard[1].tournaments_won} Wins
                            </p>
                          </div>
                          <div className="w-full space-y-1">
                            <div className="bg-white/5 text-gray-300 font-mono text-[9px] py-0.5 px-2 rounded-lg font-bold border border-white/10">
                              ₹{leaderboard[1].total_winnings}
                            </div>
                            <button
                              onClick={() => handleOpenLeaderboardModal(leaderboard[1])}
                              className="w-full py-1 bg-white/5 hover:bg-[#FF6B00] hover:text-black text-gray-400 text-[8px] font-bold rounded-lg uppercase tracking-wider transition-all"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#0F1115]/50 border border-dashed border-white/5 rounded-2xl h-[120px] w-full flex items-center justify-center text-[9px] font-mono text-gray-600">
                          2ND EMPTY
                        </div>
                      )}
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center">
                      {leaderboard[0] ? (
                        <div className="bg-gradient-to-b from-[#1A1D24] to-[#2B2317] border border-[#FF6B00]/40 rounded-2xl p-2.5 text-center flex flex-col items-center justify-between h-[155px] w-full relative shadow-xl shadow-[#FF6B00]/10">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black border border-[#FFD700] rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-black font-mono shadow-md">
                            👑
                          </div>
                          <div className="space-y-0.5 w-full mt-2.5">
                            <p className="text-[11px] font-black text-white truncate uppercase tracking-tighter">
                              {leaderboard[0].username}
                            </p>
                            <p className="text-[8px] text-[#FF6B00] font-black uppercase tracking-wider">
                              {leaderboard[0].tournaments_won} Wins
                            </p>
                          </div>
                          <div className="w-full space-y-1">
                            <div className="bg-[#FF6B00]/15 text-[#FF6B00] font-mono text-[10px] py-0.5 px-2 rounded-lg font-black border border-[#FF6B00]/30">
                              ₹{leaderboard[0].total_winnings}
                            </div>
                            <button
                              onClick={() => handleOpenLeaderboardModal(leaderboard[0])}
                              className="w-full py-1 bg-[#FF6B00] hover:bg-[#E65100] text-black text-[8px] font-black rounded-lg uppercase tracking-wider transition-all shadow"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#0F1115]/50 border border-dashed border-white/5 rounded-2xl h-[140px] w-full flex items-center justify-center text-[9px] font-mono text-gray-600">
                          1ST EMPTY
                        </div>
                      )}
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                      {leaderboard[2] ? (
                        <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-2.5 text-center flex flex-col items-center justify-between h-[125px] w-full relative shadow-md">
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#CD7F32]/20 text-[#CD7F32] border border-[#CD7F32]/40 rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black font-mono shadow">
                            3
                          </div>
                          <div className="space-y-0.5 w-full mt-2">
                            <p className="text-[10px] font-black text-gray-300 truncate uppercase tracking-tighter">
                              {leaderboard[2].username}
                            </p>
                            <p className="text-[8px] text-gray-500 font-bold uppercase">
                              {leaderboard[2].tournaments_won} Wins
                            </p>
                          </div>
                          <div className="w-full space-y-1">
                            <div className="bg-white/5 text-gray-400 font-mono text-[9px] py-0.5 px-2 rounded-lg font-bold border border-white/10">
                              ₹{leaderboard[2].total_winnings}
                            </div>
                            <button
                              onClick={() => handleOpenLeaderboardModal(leaderboard[2])}
                              className="w-full py-1 bg-white/5 hover:bg-[#FF6B00] hover:text-black text-gray-400 text-[8px] font-bold rounded-lg uppercase tracking-wider transition-all"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#0F1115]/50 border border-dashed border-white/5 rounded-2xl h-[110px] w-full flex items-center justify-center text-[9px] font-mono text-gray-600">
                          3RD EMPTY
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Ranked Roster List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-tighter flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF6B00]" />
                    All Ranked Gamers ({filteredLeaderboard.length})
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Use ▲/▼ to swap ranks or Edit for custom stats
                  </span>
                </div>

                {filteredLeaderboard.length === 0 ? (
                  <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-8 text-center text-gray-500 shadow-xl">
                    <p className="text-xs font-bold text-gray-400">No players match the search criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredLeaderboard.map((player, index) => {
                      const rankNum = index + 1;
                      return (
                        <div
                          key={player.id}
                          className={`bg-[#1A1D24] border rounded-3xl p-4 transition-all shadow-xl ${
                            player.has_override 
                              ? "border-[#FF6B00]/30 hover:border-[#FF6B00]/60" 
                              : "border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Rank and Player Identity */}
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Rank Indicator */}
                              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black font-mono text-xs shrink-0 ${
                                rankNum === 1 
                                  ? "bg-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20" 
                                  : rankNum === 2 
                                  ? "bg-[#E0E0E0] text-black" 
                                  : rankNum === 3 
                                  ? "bg-[#CD7F32] text-white" 
                                  : "bg-[#0F1115] border border-white/10 text-gray-400"
                              }`}>
                                {rankNum === 1 ? "👑" : `#${rankNum}`}
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white uppercase tracking-tight truncate">
                                    {player.username}
                                  </span>
                                  {player.has_override && (
                                    <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 rounded-md shrink-0 uppercase">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                  <span>Wallet: ₹{player.wallet_balance}</span>
                                  {player.custom_rank && (
                                    <span className="text-[#FF6B00] font-bold">
                                      Pinned #{player.custom_rank}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Winnings & Tournament Wins */}
                            <div className="text-right shrink-0 space-y-0.5">
                              <div className="text-xs font-black font-mono text-[#00E676]">
                                ₹{player.total_winnings}
                              </div>
                              <div className="text-[10px] font-mono text-gray-400 font-bold">
                                {player.tournaments_won} Wins
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions Row */}
                          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-white/5">
                            {/* Reorder Buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                disabled={index === 0}
                                onClick={() => handleMoveRank(index, 'up')}
                                title="Move up 1 rank"
                                className="w-8 h-8 bg-[#0F1115] hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-[#0F1115] border border-white/10 rounded-xl flex items-center justify-center text-gray-300 transition-all"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={index === filteredLeaderboard.length - 1}
                                onClick={() => handleMoveRank(index, 'down')}
                                title="Move down 1 rank"
                                className="w-8 h-8 bg-[#0F1115] hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-[#0F1115] border border-white/10 rounded-xl flex items-center justify-center text-gray-300 transition-all"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              {player.has_override && (
                                <button
                                  onClick={() => handleResetSingleOverride(player.id)}
                                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all"
                                >
                                  Reset
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenLeaderboardModal(player)}
                                className="px-3.5 py-1.5 bg-[#FF6B00] hover:bg-[#E65100] text-black font-black rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all shadow-md shadow-[#FF6B00]/10"
                              >
                                <Edit className="w-3 h-3" />
                                Edit Override
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB: DEPOSIT REQUESTS (MANUAL UPI ADD MONEY)
              =================================================================== */}
          {activeTab === "deposits" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-tighter">
                Pending Manual Deposits Verification
              </h3>

              {deposits.length === 0 ? (
                <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-8 text-center text-gray-500 shadow-xl">
                  <ArrowDownLeft className="w-8 h-8 mx-auto text-gray-650 mb-2" />
                  <p className="text-xs font-bold text-gray-400">No deposit requests</p>
                  <p className="text-[10px] text-gray-600 mt-1">Manual UPI deposit submissions from users appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deposits.map((d) => (
                    <div 
                      key={d.id} 
                      className={`bg-[#1A1D24] border p-5 rounded-3xl space-y-4 shadow-xl ${
                        d.status === "Pending" ? "border-[#FF6B00]/20" : "border-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between border-b border-white/5 pb-3">
                        <div>
                          <span className="text-[9px] font-mono text-[#FF6B00] font-bold uppercase">DEPOSIT REQUEST</span>
                          <h4 className="text-sm font-bold text-white tracking-tight mt-0.5 uppercase">
                            {d.username}
                          </h4>
                        </div>
                        <div className="text-right font-bold text-sm text-[#00E676]">
                          ₹{d.amount}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-mono">Reference TxID</span>
                          <span className="font-mono text-white font-bold block bg-[#0F1115] border border-white/5 rounded-xl px-2.5 py-1.5 select-all truncate">
                            {d.transaction_id}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-mono">Status</span>
                          <span className={`font-mono text-xs font-bold block pt-1.5 ${
                            d.status === "Pending" ? "text-[#FF6B00]" : d.status === "Completed" ? "text-[#00E676]" : "text-red-400"
                          }`}>
                            {d.status}
                          </span>
                        </div>
                      </div>

                      {d.status === "Pending" && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            onClick={() => handleResolveDeposit(d.id, "Approve")}
                            className="py-2.5 bg-[#00E676] hover:bg-[#00C853] text-black font-black uppercase rounded-2xl text-xs tracking-tighter"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleResolveDeposit(d.id, "Reject")}
                            className="py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-2xl text-xs uppercase tracking-tighter"
                          >
                            REJECT
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB: WITHDRAWAL REQUESTS
              =================================================================== */}
          {activeTab === "withdrawals" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-tighter">
                Manual Payout Requests (Withdrawals)
              </h3>

              {withdrawals.length === 0 ? (
                <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-8 text-center text-gray-500 shadow-xl">
                  <ArrowUpRight className="w-8 h-8 mx-auto text-gray-650 mb-2" />
                  <p className="text-xs font-bold text-gray-400">No withdrawal requests</p>
                  <p className="text-[10px] text-gray-600 mt-1">Manual withdrawal requests from gamers appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div 
                      key={w.id} 
                      className={`bg-[#1A1D24] border p-5 rounded-3xl space-y-4 shadow-xl ${
                        w.status === "Pending" ? "border-[#FF6B00]/20" : "border-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between border-b border-white/5 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-[#FF6B00] font-bold uppercase">WITHDRAWAL REQUEST</span>
                            <span className="text-[9px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                              Player ID #{w.user_id}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white tracking-tight mt-0.5 uppercase">
                            {w.username}
                          </h4>
                        </div>
                        <div className="text-right font-bold text-sm text-red-400 font-mono">
                          -₹{w.amount}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-mono">Destination UPI ID</span>
                          <span className="font-mono text-white font-bold block bg-[#0F1115] border border-white/5 rounded-xl px-2.5 py-1.5 select-all truncate">
                            {w.upi_id || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-mono">Status</span>
                          <span className={`font-mono text-xs font-bold block pt-1.5 ${
                            w.status === "Pending" ? "text-[#FF6B00]" : w.status === "Completed" ? "text-[#00E676]" : "text-red-400"
                          }`}>
                            {w.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setAdminSelectedWithdrawalForQr(w)}
                          className="px-3 py-2 bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                          SCAN / VIEW AUTO-GENERATED QR
                        </button>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(w.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1 bg-[#0F1115] p-2 rounded-xl border border-white/5">
                        <Bell className="w-3 h-3 text-[#FF6B00] shrink-0" />
                        <span>Action triggers instant alert 🔔 to Player ID #{w.user_id}</span>
                      </div>

                      {w.status === "Pending" && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            onClick={() => handleResolveWithdrawal(w.id, "Approve")}
                            className="py-2.5 bg-[#00E676] hover:bg-[#00C853] text-black font-black uppercase rounded-2xl text-xs tracking-tighter shadow-md shadow-[#00E676]/20 transition-transform active:scale-95"
                          >
                            MARK PAID (COMPLETED)
                          </button>
                          <button
                            onClick={() => handleResolveWithdrawal(w.id, "Reject")}
                            className="py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-2xl text-xs uppercase tracking-tighter transition-transform active:scale-95"
                          >
                            REJECT & REFUND
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB: GAMER REGISTRY (USER.PHP EQUIVALENT)
              =================================================================== */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-tighter">
                    Registered Gamers Registry
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Total {users.length} registered gamer{users.length === 1 ? "" : "s"} in ARTIFICIAL SAMRAJYA
                  </p>
                </div>

                {/* Gamer search */}
                <div className="relative min-w-[200px] max-w-xs">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gamerSearch}
                    onChange={(e) => setGamerSearch(e.target.value)}
                    placeholder="Search by name, email, UID..."
                    className="w-full bg-[#0F1115] border border-white/10 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder-gray-500 focus:border-[#FF6B00] outline-none"
                  />
                  {gamerSearch && (
                    <button
                      onClick={() => setGamerSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {users.filter((u) => {
                if (!gamerSearch.trim()) return true;
                const q = gamerSearch.toLowerCase();
                return (
                  u.username?.toLowerCase().includes(q) ||
                  u.email?.toLowerCase().includes(q) ||
                  u.upi_id?.toLowerCase().includes(q) ||
                  u.id?.toLowerCase().includes(q)
                );
              }).length === 0 ? (
                <div className="text-center py-12 bg-[#1A1D24] border border-white/5 rounded-3xl p-6 space-y-2">
                  <Users className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400">No gamers found matching &ldquo;{gamerSearch}&rdquo;</p>
                  <button
                    onClick={() => setGamerSearch("")}
                    className="text-[11px] font-bold text-[#FF6B00] hover:underline uppercase"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {users
                    .filter((u) => {
                      if (!gamerSearch.trim()) return true;
                      const q = gamerSearch.toLowerCase();
                      return (
                        u.username?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q) ||
                        u.upi_id?.toLowerCase().includes(q) ||
                        u.id?.toLowerCase().includes(q)
                      );
                    })
                    .map((u) => (
                      <div key={u.id} className="bg-[#1A1D24] border border-white/5 p-5 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white tracking-tight uppercase">{u.username}</h4>
                              {u.is_blocked && (
                                <span className="text-[8px] font-mono bg-red-500/15 text-red-400 px-1.5 rounded font-bold uppercase">
                                  BLOCKED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium leading-none">{u.email}</p>
                            <p className="text-[9px] text-gray-600 font-mono">UID: {u.id}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block uppercase font-mono">Wallet</span>
                            <span className="text-sm font-black text-[#FF6B00]">₹{u.wallet_balance}</span>
                          </div>
                        </div>

                        <div className="bg-[#0F1115] p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
                          <span>UPI ID:</span>
                          <span className="text-white font-bold select-all">{u.upi_id || "None Saved"}</span>
                        </div>

                        {/* Action buttons with Delete Option */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <button
                            onClick={() => {
                              setAdjustingUserId(u.id);
                              setAdjustAmount("");
                            }}
                            className="py-2.5 bg-[#0F1115] border border-white/5 hover:border-[#FF6B00]/40 text-[#FF6B00] font-bold rounded-2xl text-[11px] flex items-center justify-center gap-1 transition-all uppercase tracking-tighter"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            WALLET
                          </button>
                          <button
                            onClick={() => {
                              const lbEntry = leaderboard.find(l => l.id === u.id) || {
                                id: u.id,
                                username: u.username,
                                email: u.email,
                                total_winnings: u.custom_total_winnings || 0,
                                tournaments_won: u.custom_tournaments_won || 0,
                                wallet_balance: u.wallet_balance,
                                custom_rank: u.custom_rank,
                                custom_total_winnings: u.custom_total_winnings,
                                custom_tournaments_won: u.custom_tournaments_won,
                                has_override: u.custom_total_winnings !== undefined || u.custom_tournaments_won !== undefined || u.custom_rank !== undefined
                              };
                              handleOpenLeaderboardModal(lbEntry);
                            }}
                            className="py-2.5 bg-[#0F1115] border border-white/5 hover:border-[#FF6B00]/40 text-[#FF6B00] font-bold rounded-2xl text-[11px] flex items-center justify-center gap-1 transition-all uppercase tracking-tighter"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            STATS
                          </button>
                          <button
                            onClick={() => handleToggleBlock(u.id)}
                            className={`py-2.5 font-bold rounded-2xl text-[11px] transition-all uppercase tracking-tighter ${
                              u.is_blocked
                                ? "bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] hover:bg-[#00E676]/20"
                                : "bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                            }`}
                          >
                            {u.is_blocked ? "UNBLOCK" : "BLOCK"}
                          </button>
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold rounded-2xl text-[11px] flex items-center justify-center gap-1 transition-all uppercase tracking-tighter"
                            title={`Delete gamer ${u.username}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            DELETE
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Modal adjustment */}
              {adjustingUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                  <div className="w-full max-w-sm bg-[#1A1D24] border border-white/5 rounded-3xl p-6 shadow-2xl relative">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                      <h3 className="text-xs font-bold text-[#FF6B00] uppercase tracking-tighter">
                        Adjust Gamer Wallet
                      </h3>
                      <button onClick={() => setAdjustingUserId(null)} className="p-1 text-gray-400 text-lg">✕</button>
                    </div>

                    <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
                          Amount (Use negative to deduct)
                        </label>
                        <input
                          type="number"
                          required
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="e.g. 500 or -200"
                          className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
                          Adjustment Description / Reason
                        </label>
                        <input
                          type="text"
                          required
                          value={adjustDesc}
                          onChange={(e) => setAdjustDesc(e.target.value)}
                          className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-xs text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#E65100] text-black font-black uppercase rounded-2xl text-xs tracking-tighter transition-all"
                      >
                        COMMIT ADJUSTMENT
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Delete Gamer Confirmation Modal */}
              {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                  <div className="w-full max-w-md bg-[#1A1D24] border border-red-500/30 rounded-3xl p-6 shadow-2xl relative space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-white uppercase tracking-wider">
                            Delete Gamer Account
                          </h3>
                          <span className="text-[9px] font-mono text-red-400 uppercase font-bold">
                            Permanent Action
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeletingUser(null)}
                        disabled={deleteUserLoading}
                        className="p-1 text-gray-400 hover:text-white text-lg disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="bg-[#0F1115] p-4 rounded-2xl border border-white/5 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Gamer:</span>
                        <span className="text-white font-bold uppercase">{deletingUser.username}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-gray-300 font-mono text-[11px]">{deletingUser.email}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Wallet Balance:</span>
                        <span className="text-[#FF6B00] font-mono font-bold">₹{deletingUser.wallet_balance}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">User UID:</span>
                        <span className="text-gray-500 font-mono text-[10px]">{deletingUser.id}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[11px] text-red-300 leading-relaxed">
                      ⚠️ <strong>Warning:</strong> Are you sure you want to delete gamer <strong>{deletingUser.username}</strong>? This will permanently remove their profile, wallet records, active tournament registrations, and support tickets from <strong>ARTIFICIAL SAMRAJYA</strong>.
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeletingUser(null)}
                        disabled={deleteUserLoading}
                        className="py-3 bg-[#0F1115] hover:bg-white/5 text-gray-300 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        CANCEL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(deletingUser.id)}
                        disabled={deleteUserLoading}
                        className="py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                      >
                        {deleteUserLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        <span>{deleteUserLoading ? "DELETING..." : "DELETE GAMER"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ===================================================================
              TAB: BROADCAST NOTIFICATIONS & GAMER ALERTS
              =================================================================== */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-fade-in">
              {/* Broadcast Hub Header Banner */}
              <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-xl text-[#FF6B00]">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono tracking-widest text-[#FF6B00] uppercase font-bold">
                        Gamer Communications Hub
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Broadcast Notifications & Alerts
                    </h3>
                    <p className="text-xs text-gray-400 font-medium max-w-xl">
                      Dispatch instant notifications to all active gamers, specific tournament participants, or individual players. Gamers see real-time 🔔 badges in their dashboard.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setBroadcastTargetTournId(undefined);
                      setShowBroadcastModal(true);
                    }}
                    className="px-4 py-3 bg-[#FF6B00] hover:bg-[#E65100] text-black font-black rounded-2xl text-xs uppercase tracking-tighter flex items-center gap-2 transition-all shadow-lg shadow-[#FF6B00]/10 shrink-0 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    SEND NEW BROADCAST
                  </button>
                </div>

                {/* Broadcast Analytics Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-3 text-center">
                    <span className="text-[9px] font-mono text-gray-500 uppercase block">Total Dispatches</span>
                    <span className="text-lg font-black text-white font-mono mt-0.5 block">{broadcastHistory.length}</span>
                  </div>
                  <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-3 text-center">
                    <span className="text-[9px] font-mono text-gray-500 uppercase block">All Gamers</span>
                    <span className="text-lg font-black text-[#00E676] font-mono mt-0.5 block">
                      {broadcastHistory.filter(b => b.target_type === "all").length}
                    </span>
                  </div>
                  <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-3 text-center">
                    <span className="text-[9px] font-mono text-gray-500 uppercase block">Tournament Alerts</span>
                    <span className="text-lg font-black text-[#FF6B00] font-mono mt-0.5 block">
                      {broadcastHistory.filter(b => b.target_type === "tournament").length}
                    </span>
                  </div>
                  <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-3 text-center">
                    <span className="text-[9px] font-mono text-gray-500 uppercase block">Direct Alerts</span>
                    <span className="text-lg font-black text-blue-400 font-mono mt-0.5 block">
                      {broadcastHistory.filter(b => b.target_type === "user").length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={broadcastSearch}
                    onChange={(e) => setBroadcastSearch(e.target.value)}
                    placeholder="Search broadcast title or message..."
                    className="w-full bg-[#1A1D24] border border-white/5 focus:border-[#FF6B00]/60 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                  />
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {[
                    { id: "all", label: "All Broadcasts", count: broadcastHistory.length },
                    { id: "all_gamers", label: "Global", count: broadcastHistory.filter(b => b.target_type === "all").length },
                    { id: "tournament", label: "Tournaments", count: broadcastHistory.filter(b => b.target_type === "tournament").length },
                    { id: "user", label: "Direct", count: broadcastHistory.filter(b => b.target_type === "user").length },
                  ].map(chip => (
                    <button
                      key={chip.id}
                      onClick={() => setBroadcastFilter(chip.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                        broadcastFilter === chip.id
                          ? "bg-[#FF6B00] text-black shadow-md"
                          : "bg-[#1A1D24] text-gray-400 hover:text-white border border-white/5"
                      }`}
                    >
                      <span>{chip.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono ${
                        broadcastFilter === chip.id ? "bg-black/20 text-black font-black" : "bg-white/5 text-gray-500"
                      }`}>
                        {chip.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Broadcasts History List */}
              <div className="space-y-3">
                {broadcastHistory
                  .filter(b => {
                    if (broadcastFilter === "all_gamers" && b.target_type !== "all") return false;
                    if (broadcastFilter === "tournament" && b.target_type !== "tournament") return false;
                    if (broadcastFilter === "user" && b.target_type !== "user") return false;
                    if (broadcastSearch.trim()) {
                      const q = broadcastSearch.toLowerCase();
                      const inTitle = b.title?.toLowerCase().includes(q);
                      const inMsg = b.message?.toLowerCase().includes(q);
                      const inTourn = b.tournament_name?.toLowerCase().includes(q);
                      const inUser = b.target_username?.toLowerCase().includes(q);
                      return inTitle || inMsg || inTourn || inUser;
                    }
                    return true;
                  })
                  .map((b) => (
                    <div 
                      key={b.id}
                      className="bg-[#1A1D24] border border-white/5 hover:border-white/10 rounded-3xl p-5 shadow-lg transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-mono px-2.5 py-0.5 rounded font-black uppercase tracking-wider ${
                              b.target_type === "all"
                                ? "bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20"
                                : b.target_type === "tournament"
                                  ? "bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}>
                              {b.target_type === "all" 
                                ? "📢 All Gamers Broadcast" 
                                : b.target_type === "tournament" 
                                  ? `🎯 Tournament: ${b.tournament_name || "Lobby"}`
                                  : `👤 Gamer: ${b.target_username || "Direct Player"}`
                              }
                            </span>

                            {b.type && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 uppercase border border-white/5">
                                {b.type.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-black text-white tracking-tight">{b.title}</h4>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-gray-500 block">
                            {b.created_at ? new Date(b.created_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "Just now"}
                          </span>
                          <span className="text-[9px] font-mono text-[#00E676] font-bold block mt-0.5">
                            Delivered to {b.delivered_count || 1} {b.delivered_count === 1 ? "Gamer" : "Gamers"}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-300 font-medium leading-relaxed bg-[#0F1115] p-3.5 rounded-2xl border border-white/5 whitespace-pre-wrap">
                        {b.message}
                      </p>

                      <div className="flex items-center justify-between gap-3 pt-1 text-[10px]">
                        <span className="text-gray-500 font-mono">
                          Sender: <strong className="text-gray-400">{b.sender || "Admin"}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (b.tournament_id) {
                                setBroadcastTargetTournId(b.tournament_id);
                              }
                              setShowBroadcastModal(true);
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                          >
                            <Send className="w-3 h-3 text-[#FF6B00]" />
                            Follow-up
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {broadcastHistory.length === 0 && (
                  <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-12 text-center text-gray-500 space-y-3">
                    <Megaphone className="w-10 h-10 mx-auto text-gray-600" />
                    <p className="text-xs font-bold text-gray-400">No broadcasts sent yet.</p>
                    <button
                      onClick={() => setShowBroadcastModal(true)}
                      className="px-4 py-2 bg-[#FF6B00] text-black font-black rounded-xl text-xs uppercase"
                    >
                      Send First Broadcast
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB: SUPPORT / GAMER MESSAGES & HELPDESK
              =================================================================== */}
          {activeTab === "support" && (
            <div className="animate-fade-in">
              <AdminSupportSection />
            </div>
          )}

          {/* ===================================================================
              TAB: SETTINGS (UPI ID, QR CODE, AND SECURITY CREDENTIALS)
              =================================================================== */}
          {activeTab === "settings" && (
            <form onSubmit={handleSaveSettings} className="space-y-5 animate-fade-in">
              {/* App-wide manual deposit settings */}
              <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                  <QrCode className="w-4.5 h-4.5 text-[#FF6B00]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-tighter">
                    UPI Deposit Credentials
                  </h3>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Your Receiver UPI ID (Admin UPI)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.upi_id}
                    onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                    placeholder="e.g. 7544026117@upi"
                    className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                  />
                  <span className="text-[9px] text-gray-500 mt-1 block">
                    ⚡ Users see this UPI ID on scanning to initiate deposits manually.
                  </span>
                </div>

                {/* Compile URL based on text */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      UPI QR Code Image Link
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.qr_code_url}
                      onChange={(e) => setSettings({ ...settings, qr_code_url: e.target.value })}
                      placeholder="Enter Image QR link"
                      className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateQRCodeURL}
                    className="px-4 bg-[#0F1115] hover:bg-black/30 text-[#FF6B00] hover:text-white border border-white/5 font-bold rounded-xl text-[10px] h-[44px] uppercase tracking-tighter"
                  >
                    Auto Generate QR
                  </button>
                </div>

                {settings.qr_code_url && (
                  <div className="bg-black/30 p-4 rounded-3xl border border-white/5 flex flex-col items-center gap-1.5 max-w-[150px] mx-auto">
                    <span className="text-[9px] text-gray-500 font-mono">PREVIEW QR</span>
                    <img src={settings.qr_code_url} alt="Admin QR Code" className="w-24 h-24 bg-white p-1 rounded" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              {/* Admin login security updates */}
              <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-[#FF6B00]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-tighter">
                      Admin Profile & Account Recovery
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-[#FF6B00]/10 text-[#FF6B00] px-2 py-0.5 rounded-full border border-[#FF6B00]/20 uppercase">
                    ARTIFICIAL SAMRAJYA SECURE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
                      Admin Username
                    </label>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
                      Admin Contact Number (Phone OTP)
                    </label>
                    <input
                      type="text"
                      required
                      value={adminMobile}
                      onChange={(e) => setAdminMobile(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
                      Admin Recovery Email (Email OTP)
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@artificialsamrajya.com"
                      className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                    />
                    <span className="text-[9px] text-gray-500 mt-1 block">
                      Used for verified OTP delivery during Admin Account Recovery.
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
                      Update Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave empty to keep existing password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                    />
                    <span className="text-[9px] text-gray-500 mt-1 block">
                      Min. 8 characters with security strength validation.
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Account Recovery Audit Logs */}
              <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <History className="w-4.5 h-4.5 text-[#00E676]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-tighter">
                      Security & Account Recovery Audit Logs
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-gray-400">
                      {securityLogs.length} events logged
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setLoadingSecurityLogs(true);
                          const res = await api.getSecurityAuditLogs();
                          if (res.success) setSecurityLogs(res.auditLogs || []);
                        } finally {
                          setLoadingSecurityLogs(false);
                        }
                      }}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
                      title="Refresh Audit Logs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingSecurityLogs ? "animate-spin text-[#FF6B00]" : ""}`} />
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Real-time security log tracking all authentication recovery requests, OTP verifications, password resets, and emergency administrative interventions.
                </p>

                {securityLogs.length === 0 ? (
                  <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-6 text-center text-xs text-gray-500 font-mono">
                    No security recovery events recorded yet.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {securityLogs.map((log: any) => {
                      const isSuccess = log.status === "SUCCESS";
                      const isWarning = log.status === "WARNING" || log.status === "LOCKED";
                      return (
                        <div
                          key={log.id}
                          className="bg-[#0F1115] border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-start justify-between gap-3 text-xs transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                isSuccess 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : isWarning
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}>
                                {log.event.replace(/_/g, " ")}
                              </span>
                              <span className="text-[9px] font-mono text-gray-400">
                                Role: <strong className="text-white uppercase">{log.role}</strong>
                              </span>
                              {log.identifier && (
                                <span className="text-[9px] font-mono text-gray-400 truncate max-w-[140px]">
                                  Target: <strong className="text-white">{log.identifier}</strong>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-300 font-sans">
                              {log.details}
                            </p>
                          </div>
                          <div className="text-right shrink-0 space-y-0.5">
                            <div className="text-[9px] font-mono text-gray-500">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div className="text-[9px] font-mono text-gray-600">
                              {new Date(log.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-[#0F1115] border border-white/5 rounded-xl p-3 flex items-center justify-between text-[10px] text-gray-400">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Emergency Master Recovery Override: <strong className="text-white font-mono">SAMRAJYA-SUPERADMIN-ROOT-2026</strong></span>
                  </div>
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[9px]">ENFORCED</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#E65100] text-black font-black uppercase rounded-2xl text-xs tracking-tighter shadow-lg shadow-[#FF6B00]/10 active:scale-95 transition-all"
              >
                SAVE ALL SETTINGS
              </button>
            </form>
          )}
        </>
      )}

      {/* Modal Leaderboard Override (Accessible Globally from Leaderboard & Gamers) */}
      {overridingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1A1D24] border border-white/5 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-xl text-[#FF6B00]">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-tighter">
                    Leaderboard Override
                  </h3>
                  <span className="text-[10px] text-[#FF6B00] font-mono font-bold block truncate">
                    Gamer: {overrideUsername || "Selected Player"}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setOverridingUserId(null)} 
                className="p-1 text-gray-400 hover:text-white text-lg rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Natural Organic Match History Card */}
            <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-3 mb-4 space-y-1">
              <div className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                Natural Match History
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Victories: <strong className="text-white">{overrideRawWins} Wins</strong></span>
                <span className="text-gray-400">Total Won: <strong className="text-[#00E676]">₹{overrideRawWinnings}</strong></span>
              </div>
            </div>

            {/* Fast Quick Presets */}
            <div className="space-y-1.5 mb-4">
              <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">
                Quick Rank Presets
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setOverrideRank("1");
                    setOverrideWinnings("10000");
                    setOverrideWins("10");
                  }}
                  className="p-2 bg-gradient-to-b from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 hover:border-[#FFD700] rounded-xl text-center transition-all group"
                >
                  <span className="text-[10px] block">👑 #1</span>
                  <span className="text-[8px] font-mono text-[#FFD700] font-bold block">₹10K / 10W</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverrideRank("2");
                    setOverrideWinnings("6000");
                    setOverrideWins("6");
                  }}
                  className="p-2 bg-gradient-to-b from-gray-300/10 to-transparent border border-white/20 hover:border-white/50 rounded-xl text-center transition-all"
                >
                  <span className="text-[10px] block">🥈 #2</span>
                  <span className="text-[8px] font-mono text-gray-300 font-bold block">₹6K / 6W</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverrideRank("3");
                    setOverrideWinnings("3500");
                    setOverrideWins("4");
                  }}
                  className="p-2 bg-gradient-to-b from-[#CD7F32]/10 to-transparent border border-[#CD7F32]/30 hover:border-[#CD7F32] rounded-xl text-center transition-all"
                >
                  <span className="text-[10px] block">🥉 #3</span>
                  <span className="text-[8px] font-mono text-[#CD7F32] font-bold block">₹3.5K / 4W</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleOverrideLeaderboardSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
                  Manual Rank Position (#)
                </label>
                <input
                  type="number"
                  min="1"
                  value={overrideRank}
                  onChange={(e) => setOverrideRank(e.target.value)}
                  placeholder="e.g. 1 (Leave empty for winnings sort)"
                  className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
                <span className="text-[8px] text-gray-500 mt-1 block">
                  Assign exact ranking order position (1, 2, 3...)
                </span>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
                  Custom Total Winnings (₹)
                </label>
                <input
                  type="number"
                  value={overrideWinnings}
                  onChange={(e) => setOverrideWinnings(e.target.value)}
                  placeholder="e.g. 5000 (Leave empty for natural match earnings)"
                  className="w-full bg-[#0F1115] border border-white/5 focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
                  Custom Tournaments Won
                </label>
                <input
                  type="number"
                  value={overrideWins}
                  onChange={(e) => setOverrideWins(e.target.value)}
                  placeholder="e.g. 8 (Leave empty for natural win count)"
                  className="w-full bg-[#0F1115] border border-white/5 focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingOverride}
                  className="w-full py-3 bg-[#FF6B00] hover:bg-[#E65100] disabled:opacity-50 text-black text-xs font-black uppercase rounded-2xl tracking-tighter active:scale-95 transition-all shadow-lg shadow-[#FF6B00]/10 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingOverride ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[3]" />}
                  SAVE RANK & WINNINGS
                </button>

                <button
                  type="button"
                  onClick={() => handleResetSingleOverride(overridingUserId)}
                  className="w-full py-2.5 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-gray-400 hover:text-red-400 text-[10px] font-bold uppercase rounded-xl tracking-wider transition-all"
                >
                  Reset To Natural Match History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {(errorMsg || successMsg) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1A1D24] border border-white/5 rounded-3xl p-6 shadow-2xl relative text-center">
            {successMsg ? (
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <ShieldAlert className="w-6 h-6 text-red-500" />
              </div>
            )}
            
            <h3 className={`text-sm font-black tracking-tighter uppercase mb-2 ${successMsg ? "text-emerald-500" : "text-red-500"}`}>
              {successMsg ? "SUCCESS" : "ERROR"}
            </h3>
            
            <p className="text-xs text-gray-400 mb-6">
              {successMsg || errorMsg}
            </p>
            
            <button
              onClick={() => { setErrorMsg(""); setSuccessMsg(""); }}
              className="w-full py-3 bg-[#0F1115] border border-white/10 hover:bg-white/5 text-white text-xs font-bold rounded-2xl transition-all uppercase tracking-tighter"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Admin Withdrawal Auto-Generated QR Inspector & Approval Modal */}
      {adminSelectedWithdrawalForQr && (
        <WithdrawalQrModal
          withdrawal={adminSelectedWithdrawalForQr}
          isOpen={true}
          isAdmin={true}
          onClose={() => setAdminSelectedWithdrawalForQr(null)}
          onApprove={async (id) => {
            await handleResolveWithdrawal(id, "Approve");
            setAdminSelectedWithdrawalForQr(null);
          }}
          onReject={async (id) => {
            await handleResolveWithdrawal(id, "Reject");
            setAdminSelectedWithdrawalForQr(null);
          }}
        />
      )}

      {/* Comprehensive Tournament Form Modal (Create & Edit) */}
      {formModalOpen && (
        <TournamentFormModal
          initialTournament={editingTournament}
          onClose={() => {
            setFormModalOpen(false);
            setEditingTournament(null);
          }}
          onSave={handleSaveTournamentModal}
        />
      )}

      {/* Room Details & Pass Modal (Room ID, Password, Release Timer, Publish Toggle) */}
      {roomModalTournament && (
        <RoomDetailsModal
          tournament={roomModalTournament}
          onClose={() => setRoomModalTournament(null)}
          onSaveRoom={handleSaveRoomModal}
          onClearRoom={handleClearRoomModal}
        />
      )}

      {/* Tournament Registrations & Roster Modal */}
      {registrationsModalTournament && (
        <RegistrationsModal
          tournament={registrationsModalTournament}
          onClose={() => {
            setRegistrationsModalTournament(null);
            fetchAdminData();
          }}
        />
      )}

      {/* Multi-Match Management Modal */}
      {matchesModalTournament && (
        <MatchesModal
          tournament={matchesModalTournament}
          onClose={() => {
            setMatchesModalTournament(null);
            fetchAdminData();
          }}
        />
      )}

      {/* Tournament Scores, Leaderboard, & Podium Winner Modal */}
      {scoresModalTournament && (
        <TournamentScoresModal
          tournament={scoresModalTournament}
          onClose={() => {
            setScoresModalTournament(null);
            fetchAdminData();
          }}
          onWinnerDeclared={() => fetchAdminData()}
        />
      )}

      {/* Broadcast In-App Notifications Modal */}
      {showBroadcastModal && (
        <BroadcastNotificationModal
          tournaments={tournaments}
          users={users}
          initialTournamentId={broadcastTargetTournId}
          onClose={() => {
            setShowBroadcastModal(false);
            setBroadcastTargetTournId(undefined);
          }}
          onBroadcastSent={() => {
            fetchAdminData();
          }}
        />
      )}

      {/* Safe Delete & Cancellation Dependency Inspector Modal */}
      {safeDeleteTournament && (
        <SafeDeleteTournamentModal
          tournament={safeDeleteTournament}
          onClose={() => setSafeDeleteTournament(null)}
          onDeleted={() => {
            setSafeDeleteTournament(null);
            setSuccessMsg("Tournament permanently purged from registry.");
            fetchAdminData();
          }}
          onCancelled={() => {
            setSafeDeleteTournament(null);
            setSuccessMsg("Tournament marked as Cancelled. Wallet refunds distributed to all registered players.");
            fetchAdminData();
          }}
        />
      )}
    </div>
  );
}
