import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Tournament, User, LeaderboardEntry, AppNotification } from "../types";
import { Calendar, Trophy, Coins, UserCheck, Play, Swords, Loader2, Search, Crown, Medal, Users, MapPin, CheckCircle2, AlertCircle, Bell, Sparkles, ChevronRight, ShieldCheck, MessageSquare, Headphones, Zap, Share2 } from "lucide-react";
import { RegistrationModal } from "./RegistrationModal";
import { QuickMatchLobbyModal } from "./QuickMatchLobbyModal";
import { ShareTournamentModal } from "./ShareTournamentModal";

interface HomeViewProps {
  currentUser: User;
  onJoined: (newBalance: number) => void;
  onNavigateToWallet?: () => void;
  onOpenNotifications?: () => void;
  onOpenSupport?: (ticketId?: string) => void;
  unreadNotificationsCount?: number;
  notifications?: AppNotification[];
}

export default function HomeView({ 
  currentUser, 
  onJoined, 
  onNavigateToWallet,
  onOpenNotifications,
  onOpenSupport,
  unreadNotificationsCount = 0,
  notifications = []
}: HomeViewProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [registeringTournament, setRegisteringTournament] = useState<Tournament | null>(null);
  const [quickLobbyTournament, setQuickLobbyTournament] = useState<Tournament | null>(null);
  const [shareTournament, setShareTournament] = useState<Tournament | null>(null);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
    fetchLeaderboard();
  }, [currentUser.id]);

  // Deep-link handling: if URL contains ?tournament=id or ?tournament_id=id, automatically open it
  useEffect(() => {
    if (tournaments.length === 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const deepTournamentId = params.get("tournament") || params.get("tournament_id") || params.get("join");
      if (deepTournamentId) {
        const found = tournaments.find((t) => t.id === deepTournamentId);
        if (found) {
          if (found.is_user_registered) {
            setQuickLobbyTournament(found);
          } else {
            setRegisteringTournament(found);
          }
        }
      }
    } catch (e) {
      console.error("Error reading URL search params for deep link:", e);
    }
  }, [tournaments]);

  const handleShareClick = async (e: React.MouseEvent, t: Tournament) => {
    e.stopPropagation();
    
    // Generate preview URL
    let previewUrl = `${window.location.origin}/?tournament=${t.id}`;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tournament", t.id);
      if (currentUser?.username) {
        url.searchParams.set("ref", currentUser.username);
      }
      previewUrl = url.toString();
    } catch {
      // fallback
    }

    const shareTitle = `🎮 Join ${t.title} (${t.game_name})!`;
    const shareText = `🔥 Battle in ${t.title}!\n🏆 Prize Pool: ₹${t.prize_pool} | 🎟️ Entry: ${t.entry_fee ? `₹${t.entry_fee}` : "FREE"}\n⏰ Match Time: ${formatDate(t.match_time)}\n👉 Join my lobby:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: previewUrl
        });
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          // If native share fails, open rich share modal
          setShareTournament(t);
        }
        return;
      }
    }

    // Default to rich preview share modal if Web Share is unavailable
    setShareTournament(t);
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await api.getTournaments(currentUser.id);
      if (res.success) {
        setTournaments(res.tournaments);
      }
    } catch (err) {
      console.error("Error loading tournaments", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const res = await api.getLeaderboard();
      if (res.success) {
        setLeaderboard(res.leaderboard);
      }
    } catch (err) {
      console.error("Error loading leaderboard", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleJoinClick = (t: Tournament) => {
    setRegisteringTournament(t);
  };

  const handleRegistrationSuccess = (newBalance?: number) => {
    if (newBalance !== undefined) {
      onJoined(newBalance);
    }
    fetchTournaments();
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return isoStr;
    }
  };

  // Filter tournaments to show active/upcoming
  const upcomingTournaments = tournaments.filter(
    (t) => 
      t.status !== "Completed" &&
      t.status !== "Draft" &&
      (t.title.toLowerCase().includes(search.toLowerCase()) || 
       t.game_name.toLowerCase().includes(search.toLowerCase()))
  );

  const liveTournaments = tournaments.filter(
    (t) => t.status === "Live"
  );

  const latestUnreadNotif = notifications.find((n) => !n.is_read) || notifications[0];

  return (
    <div className="space-y-5">

      {/* Hero Interactive Greeting */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#FF6B00] to-[#E65100] border border-white/5 p-5 shadow-xl">
        <div className="absolute right-0 bottom-0 translate-y-3 translate-x-3 text-white/10 pointer-events-none">
          <Swords className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold">Gamer Arena</span>
            {unreadNotificationsCount > 0 && onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="flex items-center gap-1 bg-black/30 hover:bg-black/40 text-white px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border border-white/20 active:scale-95 shadow-sm"
              >
                <Bell className="w-3 h-3 text-yellow-300 animate-bounce" />
                <span>{unreadNotificationsCount} NEW</span>
              </button>
            )}
          </div>
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">WELCOME, {currentUser.username}!</h2>
          <p className="text-xs text-white/90 leading-relaxed max-w-[240px]">Assemble your squad and battle for glory in real-time tournaments.</p>
        </div>
      </div>

      {/* =====================================================================
          GAMER NOTIFICATION COLUMN / BANNER CARD
          ===================================================================== */}
      {latestUnreadNotif && onOpenNotifications && (
        <div 
          onClick={onOpenNotifications}
          className={`cursor-pointer rounded-2xl p-3.5 border transition-all active:scale-[0.99] flex items-center justify-between gap-3 ${
            !latestUnreadNotif.is_read
              ? "bg-[#1A1D24] border-[#FF6B00]/40 shadow-lg shadow-[#FF6B00]/5 ring-1 ring-[#FF6B00]/20 hover:border-[#FF6B00]/70"
              : "bg-[#161920]/80 border-white/5 hover:border-white/15"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              !latestUnreadNotif.is_read 
                ? "bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30" 
                : "bg-white/5 text-gray-400 border border-white/10"
            }`}>
              <Bell className="w-4 h-4" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#FF6B00]">
                  {!latestUnreadNotif.is_read ? "⚡ New Notification" : "Latest Announcement"}
                </span>
                {!latestUnreadNotif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse shrink-0" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white truncate max-w-[210px]">
                {latestUnreadNotif.title}
              </h4>
              <p className="text-[11px] text-gray-400 truncate max-w-[230px]">
                {latestUnreadNotif.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-gray-400 hover:text-white">
            {unreadNotificationsCount > 1 && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#FF6B00]/15 text-[#FF6B00] text-[10px] font-mono font-bold">
                +{unreadNotificationsCount - 1}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}

      {/* =====================================================================
          GAMER SUPPORT & CONTACT ADMIN BANNER
          ===================================================================== */}
      {onOpenSupport && (
        <div className="bg-[#111b21] border border-[#202c33] hover:border-[#25D366]/40 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <span className="text-xl">💬</span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-tight">Need Room ID or Help? Chat With Admin</h3>
                <span className="px-2 py-0.5 bg-[#25D366]/15 text-[#25D366] text-[9px] font-mono font-bold rounded-full border border-[#25D366]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                  WhatsApp Live
                </span>
              </div>
              <p className="text-xs text-gray-300 max-w-md leading-relaxed">
                Connect directly with tournament admins just like on WhatsApp for instant Room credentials, payment proof, or match disputes.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenSupport()}
            className="w-full sm:w-auto px-5 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black uppercase rounded-2xl text-xs flex items-center justify-center gap-2 shrink-0 tracking-tighter shadow-lg shadow-[#25D366]/20 active:scale-95 transition-all relative z-10 cursor-pointer"
          >
            <span className="text-sm">💬</span>
            <span>CHAT WITH ADMIN</span>
          </button>
        </div>
      )}

      {/* Live Tournaments Stream */}

      {liveTournaments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <h3 className="text-xs font-mono tracking-widest text-red-500 uppercase font-bold">
              Matches Underway (Live)
            </h3>
          </div>

          <div className="grid gap-3">
            {liveTournaments.map((t) => {
              const isRegistered = Boolean(t.is_user_registered);
              return (
                <div 
                  key={t.id} 
                  className="bg-red-500/5 border border-red-500/10 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-red-500/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                        Room Setup Complete
                      </span>
                      {isRegistered && (
                        <span className="text-[9px] bg-[#00E676]/10 text-[#00E676] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border border-[#00E676]/20">
                          CONFIRMED
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">{t.title}</h4>
                    <p className="text-xs text-slate-400">{t.game_name} {t.map_mode ? `• ${t.map_mode}` : ""}</p>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-2.5">
                    <div className="text-left md:text-right mr-2">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">Prize Pool</div>
                      <div className="text-sm font-black text-red-400">₹{t.prize_pool}</div>
                    </div>

                    <button
                      onClick={(e) => handleShareClick(e, t)}
                      title="Share Match & Invite Squad"
                      className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-2xl flex items-center gap-1.5 border border-white/10 transition-all active:scale-95 text-xs font-bold"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span className="hidden sm:inline">INVITE</span>
                    </button>

                    {isRegistered && (
                      <button
                        onClick={() => setQuickLobbyTournament(t)}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#00E676] to-[#00C853] hover:from-[#00C853] hover:to-[#00B248] text-black font-black text-xs uppercase rounded-2xl flex items-center gap-1.5 shadow-lg shadow-[#00E676]/20 active:scale-95 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black stroke-none" />
                        <span>QUICK JOIN</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Arena Leaderboard Section */}
      <div className="space-y-3.5 bg-[#1A1D24]/50 border border-white/5 rounded-3xl p-4.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-tighter">
              Arena Leaderboard
            </h3>
          </div>
          <span className="text-[9px] text-[#FF6B00] font-mono uppercase tracking-wider font-bold bg-[#FF6B00]/10 px-2 py-0.5 rounded-md">
            TOP PLAYERS
          </span>
        </div>

        {leaderboardLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
            <span className="text-[10px] font-mono">Retrieving Champions...</span>
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-[10px] text-gray-500 text-center py-4">
            No tournament winnings recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Visual ranking podium for Top 3 */}
            <div className="grid grid-cols-3 gap-2.5 items-end pt-2 pb-1">
              
              {/* 2nd Place (Silver) */}
              <div className="flex flex-col items-center">
                {leaderboard[1] ? (
                  <div className="bg-[#1A1D24] border border-white/5 rounded-2xl p-2.5 text-center flex flex-col items-center justify-between h-[115px] w-full relative shadow-md">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D1D1D1]/15 text-[#D1D1D1] border border-[#D1D1D1]/30 rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black font-mono">
                      2
                    </div>
                    <div className="space-y-0.5 w-full mt-1.5">
                      <p className="text-[9px] font-black text-gray-300 truncate uppercase tracking-tighter">
                        {leaderboard[1].username}
                      </p>
                      <p className="text-[8px] text-gray-500 font-bold uppercase leading-none">
                        {leaderboard[1].tournaments_won} Wins
                      </p>
                    </div>
                    <div className="bg-white/5 text-gray-300 font-mono text-[9px] py-0.5 px-2 rounded-lg font-bold border border-white/10 mt-1">
                      ₹{leaderboard[1].total_winnings}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1A1D24]/10 border border-dashed border-white/5 rounded-2xl h-[110px] w-full flex items-center justify-center">
                    <span className="text-[9px] text-gray-700 font-bold uppercase font-mono">2ND</span>
                  </div>
                )}
              </div>

              {/* 1st Place (Gold/Crown) */}
              <div className="flex flex-col items-center">
                {leaderboard[0] ? (
                  <div className="bg-gradient-to-b from-[#1A1D24] to-[#252018] border border-[#FF6B00]/20 rounded-2xl p-3 text-center flex flex-col items-center justify-between h-[135px] w-full relative shadow-lg shadow-[#FF6B00]/5">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black font-mono">
                      👑
                    </div>
                    <div className="space-y-0.5 w-full mt-2">
                      <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
                        {leaderboard[0].username}
                      </p>
                      <p className="text-[8px] text-[#FF6B00] font-black uppercase leading-none tracking-wider">
                        {leaderboard[0].tournaments_won} Wins
                      </p>
                    </div>
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] font-mono text-[10px] py-1 px-2.5 rounded-xl font-black border border-[#FF6B00]/20 mt-1">
                      ₹{leaderboard[0].total_winnings}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1A1D24]/10 border border-dashed border-white/5 rounded-2xl h-[130px] w-full flex items-center justify-center">
                    <span className="text-[9px] text-gray-700 font-bold uppercase font-mono">1ST</span>
                  </div>
                )}
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="flex flex-col items-center">
                {leaderboard[2] ? (
                  <div className="bg-[#1A1D24] border border-white/5 rounded-2xl p-2.5 text-center flex flex-col items-center justify-between h-[105px] w-full relative shadow-md">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#CD7F32]/15 text-[#CD7F32] border border-[#CD7F32]/30 rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black font-mono">
                      3
                    </div>
                    <div className="space-y-0.5 w-full mt-1">
                      <p className="text-[9px] font-black text-gray-300 truncate uppercase tracking-tighter">
                        {leaderboard[2].username}
                      </p>
                      <p className="text-[8px] text-gray-500 font-bold uppercase leading-none">
                        {leaderboard[2].tournaments_won} Wins
                      </p>
                    </div>
                    <div className="bg-white/5 text-gray-400 font-mono text-[9px] py-0.5 px-2 rounded-lg font-bold border border-white/10 mt-1">
                      ₹{leaderboard[2].total_winnings}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1A1D24]/10 border border-dashed border-white/5 rounded-2xl h-[100px] w-full flex items-center justify-center">
                    <span className="text-[9px] text-gray-700 font-bold uppercase font-mono">3RD</span>
                  </div>
                )}
              </div>

            </div>

            {/* List for the rest of Top 7 */}
            {leaderboard.length > 3 && (
              <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                {leaderboard.slice(3, 7).map((player, index) => {
                  const rank = index + 4;
                  return (
                    <div 
                      key={player.id} 
                      className="bg-[#1A1D24]/60 border border-white/5 rounded-2xl px-3 py-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-bold font-mono text-gray-500 w-4 select-none shrink-0">
                          #{rank}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-[10px] font-bold text-gray-200 uppercase tracking-tight truncate">
                            {player.username}
                          </h4>
                          <p className="text-[8px] text-gray-500 uppercase tracking-tight">
                            {player.tournaments_won} wins
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px] font-bold text-gray-300 shrink-0">
                        ₹{player.total_winnings}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tournament Search & List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-white/90 uppercase tracking-tighter">
            Upcoming Tournaments
          </h3>
          <span className="text-[10px] text-[#FF6B00] font-mono font-bold uppercase">
            {upcomingTournaments.length} available
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments or games..."
            className="w-full bg-[#1A1D24] border border-white/5 focus:border-[#FF6B00]/40 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
            <span className="text-xs font-mono">Loading battle schedules...</span>
          </div>
        ) : upcomingTournaments.length === 0 ? (
          <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-8 text-center text-gray-500">
            <Calendar className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="text-xs font-bold text-gray-400">No upcoming tournaments found</p>
            <p className="text-[10px] text-gray-600 mt-1">Check back later or search for something else.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcomingTournaments.map((t) => {
              const slotsFilled = t.registered_count || 0;
              const maxSlots = t.max_players || 100;
              const slotsLeft = Math.max(0, maxSlots - slotsFilled);
              const percentFilled = Math.min(100, Math.round((slotsFilled / maxSlots) * 100));
              const isRegistered = Boolean(t.is_user_registered);
              const isSoldOut = slotsLeft <= 0;
              const isClosed = t.status === "Registration Closed";
              const isLive = t.status === "Live";
              const isCancelled = t.status === "Cancelled";

              return (
                <div 
                  key={t.id}
                  className="bg-[#1A1D24] rounded-3xl border border-white/5 overflow-hidden flex flex-col hover:border-white/15 transition-all shadow-xl"
                >
                  {/* Banner Header if available */}
                  {t.banner_url && (
                    <div className="relative h-28 w-full overflow-hidden bg-black/40">
                      <img
                        src={t.banner_url}
                        alt={t.title}
                        className="w-full h-full object-cover opacity-80"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D24] via-[#1A1D24]/40 to-transparent" />
                      <div className="absolute top-3 right-3">
                        {isLive ? (
                          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            LIVE NOW
                          </span>
                        ) : isRegistered ? (
                          <span className="bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md">
                            <CheckCircle2 className="w-3 h-3" />
                            REGISTERED
                          </span>
                        ) : isClosed ? (
                          <span className="bg-gray-700/40 text-gray-300 border border-white/10 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md">
                            REGISTRATION CLOSED
                          </span>
                        ) : isSoldOut ? (
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md">
                            SOLD OUT
                          </span>
                        ) : (
                          <span className="bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md">
                            OPEN FOR ENTRY
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4 flex flex-col gap-3">
                    {/* Card Title Header (when no banner, badge shows here) */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-white font-bold text-sm tracking-tight truncate">{t.title}</h4>
                          <span className="text-[9px] font-mono uppercase bg-white/5 text-gray-300 px-2 py-0.5 rounded-md border border-white/5">
                            {t.tournament_type || "Solo"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{t.game_name}</span>
                          {t.map_mode && <span>• {t.map_mode}</span>}
                          <span>• {formatDate(t.match_time)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => handleShareClick(e, t)}
                          title="Invite Friends / Share Match"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#FF6B00] border border-white/5 transition-all active:scale-95 flex items-center gap-1 text-[10px] font-mono font-bold"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                          <span className="hidden sm:inline">SHARE</span>
                        </button>

                        {!t.banner_url && (
                          <div>
                            {isLive ? (
                              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                LIVE
                              </span>
                            ) : isRegistered ? (
                              <span className="bg-[#00E676]/10 text-[#00E676] text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                REGISTERED
                              </span>
                            ) : isClosed ? (
                              <span className="bg-gray-800 text-gray-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                CLOSED
                              </span>
                            ) : isSoldOut ? (
                              <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                FULL
                              </span>
                            ) : (
                              <span className="bg-[#00E676]/10 text-[#00E676] text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                OPEN
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details grid matching elegant design */}
                    <div className="grid grid-cols-3 gap-2 bg-black/25 p-3 rounded-2xl text-center border border-white/5">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Entry Fee</p>
                        <p className="text-xs text-white font-bold">
                          {t.entry_fee === 0 ? "FREE" : `₹${t.entry_fee}`}
                        </p>
                      </div>
                      <div className="border-x border-white/5 px-1">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Mode / Type</p>
                        <p className="text-xs text-white font-bold">{t.tournament_type || "Solo"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Prize Pool</p>
                        <p className="text-xs text-[#FF6B00] font-bold">₹{t.prize_pool}</p>
                      </div>
                    </div>

                    {/* Capacity Slot Progress Bar */}
                    <div className="space-y-1 bg-black/15 p-2 rounded-xl border border-white/5">
                      <div className="flex justify-between text-[10px] font-mono text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#FF6B00]" />
                          Slots: <strong className="text-white">{slotsFilled}</strong> / {maxSlots}
                        </span>
                        <span>{slotsLeft} spots remaining</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isSoldOut ? "bg-amber-400" : "bg-[#FF6B00]"
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>

                    {/* Action button: Clearly visible JOIN TOURNAMENT / QUICK JOIN LOBBY */}
                    {isRegistered ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between bg-[#00E676]/10 border border-[#00E676]/25 rounded-2xl px-3 py-2 text-xs">
                          <div className="flex items-center gap-1.5 text-[#00E676] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>CONFIRMED REGISTRATION</span>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-gray-300">
                            PASS: {t.user_registration_id || "ACTIVE"}
                          </span>
                        </div>

                        <button
                          onClick={() => setQuickLobbyTournament(t)}
                          className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-tight flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                            isLive || t.room_published
                              ? "bg-gradient-to-r from-[#00E676] to-[#00C853] hover:from-[#00C853] hover:to-[#00B248] text-black shadow-[#00E676]/20 animate-pulse"
                              : "bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] hover:from-[#E65100] hover:to-[#FF6B00] text-black shadow-[#FF6B00]/20"
                          }`}
                        >
                          <Zap className="w-4 h-4 fill-black stroke-none" />
                          <span>{isLive || t.room_published ? "⚡ QUICK JOIN LIVE LOBBY" : "⚡ QUICK JOIN MATCH LOBBY"}</span>
                        </button>
                      </div>
                    ) : isLive ? (
                      <div className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase rounded-2xl tracking-tight flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                        <span>MATCH IN PROGRESS</span>
                      </div>
                    ) : isClosed ? (
                      <button
                        disabled
                        className="w-full py-3 bg-white/5 text-gray-500 text-xs font-black uppercase rounded-2xl tracking-tight cursor-not-allowed"
                      >
                        REGISTRATION CLOSED
                      </button>
                    ) : isSoldOut ? (
                      <button
                        disabled
                        className="w-full py-3 bg-white/5 text-amber-500/70 text-xs font-black uppercase rounded-2xl tracking-tight cursor-not-allowed"
                      >
                        SLOTS FULL (SOLD OUT)
                      </button>
                    ) : isCancelled ? (
                      <button
                        disabled
                        className="w-full py-3 bg-white/5 text-red-500/70 text-xs font-black uppercase rounded-2xl tracking-tight cursor-not-allowed"
                      >
                        TOURNAMENT CANCELLED
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinClick(t)}
                        className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black uppercase rounded-2xl tracking-tighter active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20"
                      >
                        <Play className="w-4 h-4 fill-black stroke-none" />
                        <span>JOIN TOURNAMENT / REGISTER NOW</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Player Registration Modal */}
      {registeringTournament && (
        <RegistrationModal
          tournament={registeringTournament}
          currentUser={currentUser}
          onClose={() => setRegisteringTournament(null)}
          onSuccess={handleRegistrationSuccess}
          onNavigateToWallet={onNavigateToWallet}
        />
      )}

      {/* Instant Quick Match Lobby Modal for Registered Players */}
      {quickLobbyTournament && (
        <QuickMatchLobbyModal
          tournament={quickLobbyTournament}
          currentUser={currentUser}
          onClose={() => setQuickLobbyTournament(null)}
          onOpenSupport={onOpenSupport}
        />
      )}

      {/* Share Match Lobby & Preview Deep-Link Modal */}
      {shareTournament && (
        <ShareTournamentModal
          tournament={shareTournament}
          currentUser={currentUser}
          onClose={() => setShareTournament(null)}
        />
      )}
    </div>
  );
}
