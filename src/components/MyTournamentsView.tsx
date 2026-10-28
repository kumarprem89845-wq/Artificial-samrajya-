import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Tournament, User } from "../types";
import { Trophy, Key, Eye, Clock, ListCollapse, Gamepad2, AlertCircle, Copy, Check, Lock, ShieldCheck, Users, Zap, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { QuickMatchLobbyModal } from "./QuickMatchLobbyModal";
import { EmptyState } from "./EmptyState";
import { ShareTournamentModal } from "./ShareTournamentModal";

interface MyTournamentsViewProps {
  currentUser: User;
  onOpenSupport?: (ticketId?: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function MyTournamentsView({ currentUser, onOpenSupport, onNavigateTab }: MyTournamentsViewProps) {
  const [joinedTournaments, setJoinedTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"upcoming" | "completed">("upcoming");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [quickLobbyTournament, setQuickLobbyTournament] = useState<Tournament | null>(null);
  const [shareTournament, setShareTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    fetchMyMatches();
  }, [currentUser.id]);

  const fetchMyMatches = async () => {
    try {
      setLoading(true);
      const res = await api.getUserTournaments(currentUser.id);
      if (res.success) {
        setJoinedTournaments(res.tournaments);
      }
    } catch (e) {
      console.error("Error reading user tournaments", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField((curr) => (curr === fieldName ? null : curr));
    }, 2000);
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

  // Divide tournaments
  const upcomingMatches = joinedTournaments.filter((t) => t.status !== "Completed");
  const completedMatches = joinedTournaments.filter((t) => t.status === "Completed");

  return (
    <div className="space-y-6">
      
      {/* Tab Selectors */}
      <div className="flex bg-[#1A1D24] border border-white/5 p-1 rounded-2xl">
        <button
          onClick={() => setActiveSubTab("upcoming")}
          className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all relative flex items-center justify-center gap-2 ${
            activeSubTab === "upcoming" ? "text-[#FF6B00] font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          {activeSubTab === "upcoming" && (
            <motion.div
              layoutId="subTabHighlight"
              className="absolute inset-0 bg-black/40 border border-white/5 rounded-xl"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Clock className="w-4 h-4 shrink-0" />
            Upcoming / Live
            {upcomingMatches.length > 0 && (
              <span className="bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold">
                {upcomingMatches.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab("completed")}
          className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all relative flex items-center justify-center gap-2 ${
            activeSubTab === "completed" ? "text-[#FF6B00] font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          {activeSubTab === "completed" && (
            <motion.div
              layoutId="subTabHighlight"
              className="absolute inset-0 bg-black/40 border border-white/5 rounded-xl"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 shrink-0" />
            Completed History
          </span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Fetching registrations...</span>
        </div>
      ) : activeSubTab === "upcoming" ? (
        /* Upcoming & Live Matches List */
        <div className="space-y-4">
          {upcomingMatches.length === 0 ? (
            <EmptyState
              type="upcoming_tournaments"
              primaryActionLabel="BROWSE TOURNAMENTS"
              onPrimaryAction={() => onNavigateTab ? onNavigateTab("home") : undefined}
              secondaryActionLabel="TOP UP WALLET"
              onSecondaryAction={() => onNavigateTab ? onNavigateTab("wallet") : undefined}
            />
          ) : (
            upcomingMatches.map((t) => {
              const isRoomLive = Boolean(t.room_published && t.room_id);

              return (
                <div 
                  key={t.id} 
                  className={`bg-[#1A1D24] border rounded-3xl p-5 shadow-xl transition-all relative overflow-hidden ${
                    t.status === "Live" ? "border-red-500/30 ring-1 ring-red-500/10" : "border-white/5"
                  }`}
                >
                  {/* Visual Glow for live */}
                  {t.status === "Live" && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                  )}

                  <div className="flex items-start justify-between mb-3.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          t.status === "Live" 
                            ? "bg-red-500/15 text-red-400 animate-pulse" 
                            : "bg-[#FF6B00]/10 text-[#FF6B00]"
                        }`}>
                          {t.status === "Live" ? "● MATCH LIVE" : "CONFIRMED"}
                        </span>
                        {t.tournament_type && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 uppercase">
                            {t.tournament_type}
                          </span>
                        )}
                        {t.user_registration_id && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20">
                            Pass: {t.user_registration_id}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-tight mt-1.5">{t.title}</h4>
                      <p className="text-xs text-slate-400">
                        {t.game_name} {t.map_mode ? `• ${t.map_mode}` : ""}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase font-mono">Match Time</span>
                        <span className="text-xs text-white font-bold block mt-0.5">{formatDate(t.match_time)}</span>
                      </div>
                      <button
                        onClick={() => setShareTournament(t)}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#FF6B00] border border-white/5 text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                        title="Invite Friends to Match"
                      >
                        <Share2 className="w-3 h-3 text-[#FF6B00]" />
                        <span>INVITE</span>
                      </button>
                    </div>
                  </div>

                  {/* Room ID & Password conditionally displayed ONLY when room_published is true */}
                  {isRoomLive ? (
                    <div className="bg-black/35 p-4 rounded-2xl border border-[#00E676]/30 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2 text-xs text-[#00E676] font-bold">
                          <Key className="w-4 h-4 shrink-0 text-[#00E676]" />
                          <span>CUSTOM ROOM CREDENTIALS UNLOCKED</span>
                        </div>
                        <button
                          onClick={() => setQuickLobbyTournament(t)}
                          className="bg-[#00E676] hover:bg-[#00C853] text-black text-[10px] font-black uppercase px-3 py-1 rounded-xl tracking-wider flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-[#00E676]/20"
                        >
                          <Zap className="w-3 h-3 fill-black stroke-none" />
                          <span>QUICK LOBBY</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                            <span>Room ID</span>
                            <button
                              onClick={() => handleCopy(t.room_id || "", `room-${t.id}`)}
                              className="text-[10px] text-[#FF6B00] hover:text-white flex items-center gap-1 transition-all"
                            >
                              {copiedField === `room-${t.id}` ? (
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
                          <div
                            onClick={() => handleCopy(t.room_id || "", `room-${t.id}`)}
                            className="font-mono text-white font-black text-sm bg-[#1A1D24] hover:bg-[#252830] px-3 py-2 rounded-xl border border-white/10 text-center cursor-pointer transition-all flex items-center justify-center"
                          >
                            {t.room_id}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                            <span>Password</span>
                            <button
                              onClick={() => handleCopy(t.room_password || "", `pass-${t.id}`)}
                              className="text-[10px] text-[#FF6B00] hover:text-white flex items-center gap-1 transition-all"
                            >
                              {copiedField === `pass-${t.id}` ? (
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
                          <div
                            onClick={() => handleCopy(t.room_password || "", `pass-${t.id}`)}
                            className="font-mono text-white font-black text-sm bg-[#1A1D24] hover:bg-[#252830] px-3 py-2 rounded-xl border border-white/10 text-center cursor-pointer transition-all flex items-center justify-center"
                          >
                            {t.room_password || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="text-[10px] text-gray-300 flex items-center gap-1.5 truncate">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
                          <span className="truncate">Enter room inside {t.game_name}</span>
                        </div>

                        <button
                          onClick={() => setQuickLobbyTournament(t)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-[10px] font-bold uppercase rounded-xl flex items-center gap-1 shrink-0 transition-all"
                        >
                          <Zap className="w-3 h-3 text-[#00E676]" />
                          <span>FULL LOBBY OVERLAY</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/25 p-3.5 rounded-2xl border border-white/5 text-xs text-gray-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Lock className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-white font-bold text-[11px]">Room Details Locked</p>
                          <p className="text-[10px] text-gray-400 leading-relaxed">
                            Room ID and Password unlock 15 minutes prior to match.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setQuickLobbyTournament(t)}
                        className="w-full sm:w-auto px-3.5 py-2 bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 text-[#FF6B00] font-bold text-[10px] uppercase rounded-xl border border-[#FF6B00]/30 flex items-center justify-center gap-1.5 shrink-0 transition-all"
                      >
                        <Zap className="w-3 h-3" />
                        <span>QUICK MATCH PASS</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Completed Match History List */
        <div className="space-y-4">
          {completedMatches.length === 0 ? (
            <EmptyState
              type="completed_tournaments"
              primaryActionLabel="JOIN YOUR FIRST TOURNAMENT"
              onPrimaryAction={() => onNavigateTab ? onNavigateTab("home") : undefined}
            />
          ) : (
            completedMatches.map((t) => {
              const isWinner = t.winner_id === currentUser.id;
              return (
                <div 
                  key={t.id} 
                  className={`bg-[#1A1D24] border rounded-3xl p-5 shadow-xl transition-all relative overflow-hidden ${
                    isWinner ? "border-[#00E676]/30 shadow-[#00E676]/2" : "border-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono bg-black/40 text-gray-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          COMPLETED
                        </span>
                        {isWinner && (
                          <span className="text-[9px] font-mono bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-[#00E676] shrink-0" />
                            CHAMPION
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-tight mt-1.5">{t.title}</h4>
                      <p className="text-xs text-slate-400">{t.game_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-500 block uppercase font-mono">Prize Pool</span>
                      <span className="text-sm font-black text-[#00E676] block mt-0.5">₹{t.prize_pool}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Your Outcome:</span>
                    <span className={`font-black uppercase tracking-wider ${
                      isWinner ? "text-[#00E676]" : "text-gray-400"
                    }`}>
                      {isWinner ? `Winner (+₹${t.prize_pool})` : "Participated"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Quick Match Lobby Modal */}
      {quickLobbyTournament && (
        <QuickMatchLobbyModal
          tournament={quickLobbyTournament}
          currentUser={currentUser}
          onClose={() => setQuickLobbyTournament(null)}
          onOpenSupport={onOpenSupport}
        />
      )}

      {/* Share Tournament Modal */}
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
