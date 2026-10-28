import React, { useState, useEffect } from "react";
import { Tournament, User } from "../types";
import { api } from "../lib/api";
import { 
  X, ShieldCheck, Key, Copy, Check, Gamepad2, Clock, 
  RefreshCw, ExternalLink, MessageSquare, AlertCircle, 
  Users, Trophy, Zap, Sparkles, ChevronRight, Eye, EyeOff, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ShareTournamentModal } from "./ShareTournamentModal";

interface QuickMatchLobbyModalProps {
  tournament: Tournament;
  currentUser: User;
  onClose: () => void;
  onOpenSupport?: (tournamentId?: string) => void;
}

export function QuickMatchLobbyModal({
  tournament: initialTournament,
  currentUser,
  onClose,
  onOpenSupport
}: QuickMatchLobbyModalProps) {
  const [tournament, setTournament] = useState<Tournament>(initialTournament);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState(false);

  // Live polling for room credentials if not yet published
  useEffect(() => {
    let interval: any = null;

    const fetchLatest = async () => {
      try {
        const res = await api.getTournament(initialTournament.id, currentUser.id);
        if (res.success && res.tournament) {
          setTournament(res.tournament);
        }
      } catch (err) {
        console.error("Failed to fetch fresh tournament details", err);
      }
    };

    fetchLatest();

    // If room is not published, check every 8 seconds
    if (!tournament.room_published) {
      interval = setInterval(fetchLatest, 8000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [initialTournament.id, currentUser.id, tournament.room_published]);

  // Calculate live countdown to match time
  useEffect(() => {
    const updateCountdown = () => {
      try {
        const matchDate = new Date(tournament.match_time).getTime();
        const now = Date.now();
        const diff = matchDate - now;

        if (diff <= 0) {
          if (tournament.status === "Live") {
            setTimeLeftStr("MATCH IS LIVE NOW");
          } else {
            setTimeLeftStr("STARTING ANY MOMENT");
          }
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 24) {
          const days = Math.floor(hours / 24);
          setTimeLeftStr(`Starts in ${days}d ${hours % 24}h`);
        } else if (hours > 0) {
          setTimeLeftStr(`Starts in ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeftStr(`Starts in ${minutes}m ${seconds}s`);
        }
      } catch {
        setTimeLeftStr("");
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [tournament.match_time, tournament.status]);

  const handleCopy = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField((curr) => (curr === fieldKey ? null : curr));
    }, 2000);
  };

  const handleCopyAll = () => {
    const lines = [
      `🎮 TOURNAMENT: ${tournament.title}`,
      `🎯 GAME: ${tournament.game_name} (${tournament.map_mode || "Battle Royale"})`,
      `🎫 PASS ID: ${tournament.user_registration_id || "CONFIRMED"}`,
      tournament.room_id ? `🔑 ROOM ID: ${tournament.room_id}` : "",
      tournament.room_password ? `🔒 PASSWORD: ${tournament.room_password}` : "",
      tournament.user_participant?.slot_number ? `📍 SLOT NUMBER: #${tournament.user_participant.slot_number}` : "",
      `⏰ TIME: ${new Date(tournament.match_time).toLocaleString("en-IN")}`
    ].filter(Boolean).join("\n");

    handleCopy(lines, "all");
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.getTournament(tournament.id, currentUser.id);
      if (res.success && res.tournament) {
        setTournament(res.tournament);
      }
    } catch (err) {
      console.error("Refresh error", err);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const isRoomLive = Boolean(tournament.room_published && tournament.room_id);
  const isMatchLive = tournament.status === "Live";
  const userPart = tournament.user_participant;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  const getGameLaunchScheme = () => {
    const gn = (tournament.game_name || "").toLowerCase();
    if (gn.includes("bgmi") || gn.includes("battlegrounds")) {
      return "com.pubg.imobile";
    }
    if (gn.includes("free fire") || gn.includes("ff")) {
      return "com.dts.freefireth";
    }
    if (gn.includes("cod") || gn.includes("call of duty")) {
      return "com.activision.callofduty.shooter";
    }
    return null;
  };

  const handleGameLaunch = () => {
    const scheme = getGameLaunchScheme();
    if (scheme) {
      // Try launching app scheme or intent
      window.location.href = `${scheme}://`;
      setTimeout(() => {
        // Fallback or instructions
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#0F1115] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing cyber top edge */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF6B00] via-[#00E676] to-[#FF6B00] animate-pulse" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between gap-3 bg-[#16181F]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0 shadow-lg shadow-[#FF6B00]/10">
              <Zap className="w-5 h-5 fill-[#FF6B00]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  CONFIRMED PLAYER
                </span>
                {isMatchLive ? (
                  <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    LIVE MATCH
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10 text-[9px] font-mono font-bold uppercase tracking-wider">
                    {tournament.tournament_type || "SOLO"}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight mt-1 line-clamp-1">
                {tournament.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#FF6B00] transition-colors shrink-0 flex items-center gap-1.5 border border-white/5 text-xs font-bold"
              title="Share Lobby & Invite Friends"
            >
              <Share2 className="w-4 h-4 text-[#FF6B00]" />
              <span className="hidden sm:inline text-[10px] font-mono">INVITE</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Match Status & Live Countdown Bar */}
          <div className="bg-[#1A1D24] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-bold">
                <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Match Time: {formatDate(tournament.match_time)}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                {tournament.game_name} {tournament.map_mode ? `• ${tournament.map_mode}` : ""}
              </p>
            </div>

            <div className="text-right">
              {timeLeftStr && (
                <div className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-[10px] font-mono font-black text-[#FF6B00]">
                  {timeLeftStr}
                </div>
              )}
            </div>
          </div>

          {/* Registration Pass & Player Details Card */}
          <div className="bg-gradient-to-br from-[#1A1D24] to-[#12141A] border border-[#00E676]/20 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#00E676]/15 flex items-center justify-center text-[#00E676]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Player Registration Pass</span>
                  <span className="text-xs font-mono font-black text-[#00E676]">
                    {tournament.user_registration_id || "VERIFIED PASS"}
                  </span>
                </div>
              </div>

              {tournament.user_registration_id && (
                <button
                  onClick={() => handleCopy(tournament.user_registration_id!, "pass")}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-300 flex items-center gap-1 border border-white/10 transition-colors"
                >
                  {copiedField === "pass" ? (
                    <>
                      <Check className="w-3 h-3 text-[#00E676]" />
                      <span className="text-[#00E676] font-bold">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>COPY PASS</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-gray-400 uppercase font-mono block">Gamer IGN</span>
                <span className="font-bold text-white truncate block mt-0.5">
                  {userPart?.in_game_name || currentUser.username}
                </span>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-gray-400 uppercase font-mono block">Game UID</span>
                <span className="font-bold text-gray-300 font-mono truncate block mt-0.5">
                  {userPart?.in_game_id || "CONFIRMED"}
                </span>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
                <span className="text-[9px] text-gray-400 uppercase font-mono block">Assigned Slot</span>
                <span className="font-black text-[#FF6B00] font-mono block mt-0.5">
                  {userPart?.slot_number ? `Slot #${userPart.slot_number}` : "Auto-Assigned"}
                </span>
              </div>
            </div>

            {userPart?.team_name && (
              <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-[10px] text-gray-300 flex items-center justify-between">
                <span className="text-gray-400">Team: <strong className="text-white">{userPart.team_name}</strong></span>
                {userPart.teammates && userPart.teammates.length > 0 && (
                  <span>Teammates: {userPart.teammates.map(t => t.name).filter(Boolean).join(", ")}</span>
                )}
              </div>
            )}
          </div>

          {/* ROOM CREDENTIALS LOBBY ACCESS SECTION */}
          {isRoomLive ? (
            <div className="bg-gradient-to-b from-[#14231E] to-[#111A16] border-2 border-[#00E676]/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl relative overflow-hidden">
              {/* Pulsating badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00E676] animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#00E676]">
                    CUSTOM ROOM CREDENTIALS UNLOCKED
                  </span>
                </div>

                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
                  title="Refresh Credentials"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#00E676]" : ""}`} />
                </button>
              </div>

              {/* Room ID & Password High-Impact Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Room ID Box */}
                <div className="bg-black/60 border border-[#00E676]/30 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3 text-[#00E676]" />
                      Room ID
                    </span>
                    <button
                      onClick={() => handleCopy(tournament.room_id || "", "room_id")}
                      className="text-[10px] font-mono text-[#00E676] hover:underline flex items-center gap-1 font-bold"
                    >
                      {copiedField === "room_id" ? (
                        <>
                          <Check className="w-3 h-3 text-[#00E676]" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div 
                    onClick={() => handleCopy(tournament.room_id || "", "room_id")}
                    className="py-2.5 px-3 bg-[#1A1D24] hover:bg-[#222630] border border-white/10 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <span className="font-mono text-lg sm:text-xl font-black text-white tracking-widest selection:bg-[#00E676]">
                      {tournament.room_id}
                    </span>
                  </div>
                </div>

                {/* Password Box */}
                <div className="bg-black/60 border border-[#00E676]/30 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3 text-[#FF6B00]" />
                      Room Password
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] text-gray-400 hover:text-white"
                        title={showPassword ? "Hide" : "Show"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopy(tournament.room_password || "", "room_pass")}
                        className="text-[10px] font-mono text-[#FF6B00] hover:underline flex items-center gap-1 font-bold"
                      >
                        {copiedField === "room_pass" ? (
                          <>
                            <Check className="w-3 h-3 text-[#00E676]" />
                            <span className="text-[#00E676]">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div 
                    onClick={() => handleCopy(tournament.room_password || "", "room_pass")}
                    className="py-2.5 px-3 bg-[#1A1D24] hover:bg-[#222630] border border-white/10 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <span className="font-mono text-lg sm:text-xl font-black text-[#FF6B00] tracking-widest">
                      {showPassword ? (tournament.room_password || "None") : "••••••"}
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Buttons: Copy All & Launch Game */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  onClick={handleCopyAll}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all"
                >
                  {copiedField === "all" ? (
                    <>
                      <Check className="w-4 h-4 text-[#00E676]" />
                      <span className="text-[#00E676]">ALL CREDENTIALS COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>COPY ALL LOBBY DETAILS</span>
                    </>
                  )}
                </button>

                {getGameLaunchScheme() && (
                  <button
                    onClick={handleGameLaunch}
                    className="py-3 px-4 rounded-xl bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-[#00E676]/20 active:scale-95 transition-all"
                  >
                    <Gamepad2 className="w-4 h-4 fill-black" />
                    <span>OPEN {tournament.game_name.split(" ")[0].toUpperCase()}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Room Details Locked - Countdown & Auto Refresh Notice */
            <div className="bg-[#1A1D24] border border-white/10 rounded-3xl p-5 space-y-3.5 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">
                      Room Credentials Generating...
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Unlocks automatically 10–15 minutes prior to match kickoff.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 flex items-center gap-1.5 border border-white/10 transition-all shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#FF6B00]" : ""}`} />
                  <span>CHECK NOW</span>
                </button>
              </div>

              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
                  <span>Live Auto-Sync Active</span>
                </div>
                <span className="text-[#FF6B00] font-mono font-bold">
                  {timeLeftStr || "Ready"}
                </span>
              </div>

              <p className="text-[10px] text-gray-500 leading-relaxed">
                🔔 You will receive an instant push notification on this screen as soon as the tournament host publishes the room credentials.
              </p>
            </div>
          )}

          {/* Quick Step-by-Step Join Instructions */}
          <div className="bg-[#1A1D24]/60 border border-white/5 rounded-2xl p-4 space-y-2.5 text-xs">
            <h5 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-[#FF6B00]" />
              Quick Match Join Protocol
            </h5>
            <ol className="space-y-1.5 text-[11px] text-gray-300 list-decimal list-inside">
              <li>Open <strong>{tournament.game_name}</strong> on your device.</li>
              <li>Go to <strong>Custom Match / Custom Room</strong> lobby in the game.</li>
              <li>Enter the <strong>Room ID</strong> and <strong>Password</strong> shown above.</li>
              <li>Join your assigned <strong>Slot {userPart?.slot_number ? `#${userPart.slot_number}` : ""}</strong> and await the match start.</li>
            </ol>
          </div>

          {/* Contact Support Footer */}
          {onOpenSupport && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onOpenSupport(tournament.id);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#00E676]" />
                <span>Room or Slot Issue? Contact Admin</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/5 bg-[#16181F]/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/30 text-[#FF6B00] font-bold text-xs uppercase flex items-center gap-1.5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>INVITE TEAMMATES</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase transition-all"
          >
            DISMISS
          </button>
        </div>

      </div>

      {showShareModal && (
        <ShareTournamentModal
          tournament={tournament}
          currentUser={currentUser}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
