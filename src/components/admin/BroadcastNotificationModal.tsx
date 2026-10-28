import React, { useState } from "react";
import { Tournament, User } from "../../types";
import { api } from "../../lib/api";
import { 
  X, 
  Bell, 
  Send, 
  Users, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  Gamepad2, 
  ShieldCheck, 
  Sparkles,
  MessageSquare
} from "lucide-react";

interface BroadcastNotificationModalProps {
  tournaments: Tournament[];
  users: User[];
  initialTargetType?: "all" | "tournament" | "user";
  initialTournamentId?: string;
  initialUserId?: string;
  onClose: () => void;
  onBroadcastSent?: () => void;
}

export function BroadcastNotificationModal({ 
  tournaments, 
  users, 
  initialTargetType,
  initialTournamentId,
  initialUserId,
  onClose,
  onBroadcastSent 
}: BroadcastNotificationModalProps) {
  const [targetType, setTargetType] = useState<"all" | "tournament" | "user">(
    initialTargetType || (initialTournamentId ? "tournament" : initialUserId ? "user" : "all")
  );
  const [selectedTournamentId, setSelectedTournamentId] = useState(
    initialTournamentId || tournaments[0]?.id || ""
  );
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(
    initialUserId || users[0]?.id || ""
  );
  
  // Optional tournament link for "all" or "user" targets
  const [linkedTournamentId, setLinkedTournamentId] = useState<string>(initialTournamentId || "");

  const [title, setTitle] = useState("Important Battle Update");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"admin_announcement" | "direct_message" | "tournament_update" | "tournament_live" | "system">("admin_announcement");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter users based on search (ID, Username, Email, Mobile)
  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const query = userSearch.toLowerCase().trim();
    return (
      u.id.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      (u.mobile_number && u.mobile_number.includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query))
    );
  });

  const selectedUser = users.find((u) => u.id === selectedUserId);

  // Quick Preset Templates
  const applyPreset = (presetTitle: string, presetMessage: string, presetType: any) => {
    setTitle(presetTitle);
    setMessage(presetMessage);
    setNotificationType(presetType);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Please provide both title and message.");
      return;
    }

    if (targetType === "tournament" && !selectedTournamentId) {
      setError("Please select a target tournament.");
      return;
    }

    if (targetType === "user" && !selectedUserId) {
      setError("Please select a recipient gamer.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const effectiveTournamentId = targetType === "tournament" 
        ? selectedTournamentId 
        : linkedTournamentId || undefined;

      const res = await api.broadcastNotification({
        title: title.trim(),
        message: message.trim(),
        type: notificationType,
        target_type: targetType,
        tournament_id: effectiveTournamentId,
        user_id: targetType === "user" ? selectedUserId : undefined
      });

      if (res.success) {
        setSuccess(`Delivered to ${res.sentCount || (targetType === "user" ? 1 : "targeted")} gamer(s) successfully!`);
        setMessage("");
        if (onBroadcastSent) {
          onBroadcastSent();
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to broadcast notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Admin Notification Dispatch
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Push instant broadcasts & private gamer messages with live in-app alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Quick Templates Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#FF6B00]" />
            Quick Template Presets
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset(
                "Room Details Published 🔑", 
                "Room ID and Password have been published for your tournament match! Please check your tournament details and join the match lobby immediately.",
                "tournament_live"
              )}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-all"
            >
              🔑 Room Details Published
            </button>
            <button
              type="button"
              onClick={() => applyPreset(
                "Match Timing Updated ⏰", 
                "Your tournament match timing has been updated. Please check the tournament details and be ready in game 15 minutes before start.",
                "tournament_update"
              )}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-all"
            >
              ⏰ Match Timing Update
            </button>
            <button
              type="button"
              onClick={() => applyPreset(
                "Direct Message from Admin ✉️", 
                "Please update and verify your in-game Character ID and name before the match commences.",
                "direct_message"
              )}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-all"
            >
              ✉️ Update Game ID
            </button>
            <button
              type="button"
              onClick={() => applyPreset(
                "Important Rules Reminder ⚠️", 
                "Strict Fair Play Reminder: Emulators, hacks, and teaming are strictly prohibited. Violators will face permanent bans without refund.",
                "admin_announcement"
              )}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-all"
            >
              ⚠️ Rules Reminder
            </button>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          
          {/* Target Audience Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
              Recipient Target Audience *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("all")}
                className={`py-2.5 px-2 text-xs rounded-xl font-bold border transition-all flex flex-col items-center gap-1 ${
                  targetType === "all"
                    ? "bg-[#FF6B00] text-black border-[#FF6B00] shadow-md shadow-[#FF6B00]/20"
                    : "bg-[#0F1115] text-gray-400 border-white/5 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Gamers</span>
                <span className="text-[9px] opacity-75 font-mono">({users.length} registered)</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType("tournament")}
                className={`py-2.5 px-2 text-xs rounded-xl font-bold border transition-all flex flex-col items-center gap-1 ${
                  targetType === "tournament"
                    ? "bg-[#FF6B00] text-black border-[#FF6B00] shadow-md shadow-[#FF6B00]/20"
                    : "bg-[#0F1115] text-gray-400 border-white/5 hover:text-white"
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Tournament</span>
                <span className="text-[9px] opacity-75 font-mono">Participants</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType("user")}
                className={`py-2.5 px-2 text-xs rounded-xl font-bold border transition-all flex flex-col items-center gap-1 ${
                  targetType === "user"
                    ? "bg-[#FF6B00] text-black border-[#FF6B00] shadow-md shadow-[#FF6B00]/20"
                    : "bg-[#0F1115] text-gray-400 border-white/5 hover:text-white"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Specific Gamer</span>
                <span className="text-[9px] opacity-75 font-mono">Private DM</span>
              </button>
            </div>
          </div>

          {/* Specific Target Field: Tournament */}
          {targetType === "tournament" && (
            <div className="space-y-1.5 bg-[#0F1115] p-3 rounded-2xl border border-white/5">
              <label className="text-[10px] font-mono text-[#FF6B00] uppercase tracking-wider block font-bold">
                Select Target Tournament *
              </label>
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B00]/50"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.game_name} - {t.tournament_type}) - Status: {t.status}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 font-mono">
                Only confirmed participants registered in this tournament will receive this notification.
              </p>
            </div>
          )}

          {/* Specific Target Field: User Search & Selection */}
          {targetType === "user" && (
            <div className="space-y-2 bg-[#0F1115] p-3 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-[#FF6B00] uppercase tracking-wider block font-bold">
                  Search & Select Gamer (By ID, Username, or Mobile) *
                </label>
                {selectedUser && (
                  <span className="text-[10px] font-mono text-[#00E676] font-bold">
                    Selected: {selectedUser.username}
                  </span>
                )}
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by Gamer ID (user-1), username, or mobile..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-[#FF6B00]/50"
                />
              </div>

              {/* Users list dropdown */}
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-3 text-xs text-gray-500">
                    No gamers found matching "{userSearch}"
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        selectedUserId === u.id
                          ? "bg-[#FF6B00]/15 border-[#FF6B00] text-white"
                          : "bg-black/20 border-white/5 hover:bg-white/5 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold font-mono">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block leading-none">{u.username}</span>
                          <span className="text-[10px] font-mono text-gray-400">
                            ID: {u.id} {u.mobile_number ? `• ${u.mobile_number}` : ""}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#00E676] font-bold">
                        ₹{u.wallet_balance}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Private Direct Message: Only this recipient will see this message. It will not be exposed to other gamers.</span>
              </div>
            </div>
          )}

          {/* Optional Tournament Link (when target is all or user) */}
          {targetType !== "tournament" && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Attach Related Tournament (Optional)
              </label>
              <select
                value={linkedTournamentId}
                onChange={(e) => setLinkedTournamentId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="">-- No linked tournament --</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.game_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title & Message */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Notification Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Match Timing Update"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B00]/50"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Alert Category
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value as any)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="admin_announcement">Announcement</option>
                <option value="direct_message">Direct Message</option>
                <option value="tournament_update">Match Update</option>
                <option value="tournament_live">Room Details</option>
                <option value="system">System Notice</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
              Complete Message Body *
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type complete notification message..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#FF6B00]/50 resize-none"
              required
            />
          </div>

          {/* Live WhatsApp Channel Broadcast Preview Card */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#25D366] uppercase tracking-wider block font-bold flex items-center gap-1">
                <span>💬</span> WhatsApp Channel & Broadcast Preview
              </span>
              <span className="text-[9px] font-mono text-gray-400">
                Live Gamer View
              </span>
            </div>

            <div className="rounded-2xl bg-[#111b21] border border-[#202c33] shadow-xl overflow-hidden space-y-0">
              {/* WhatsApp Channel Card Top Banner */}
              <div className="px-3.5 py-2 bg-[#1f2c34] border-b border-[#2a3942] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white">Artificial Samrajya Channel</span>
                      <span className="w-3 h-3 rounded-full bg-[#25D366] text-black inline-flex items-center justify-center text-[8px] font-black">✓</span>
                    </div>
                    <span className="text-[9px] text-[#00a884] font-medium block">
                      📢 Official Broadcast • Today, Just now
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">2.8k Gamers</span>
              </div>

              {/* Message Body */}
              <div className="p-3 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400">⚡</span>
                  {title || "Broadcast Title"}
                </h4>
                <p className="text-xs text-gray-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {message || "Complete message text will appear here in WhatsApp Channel layout..."}
                </p>

                {/* WhatsApp Reactions Bar Preview */}
                <div className="pt-2 border-t border-[#202c33] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    {["🔥 28", "🏆 15", "❤️ 9", "👍 14", "🎮 32"].map((em, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-[#202c33] text-gray-300 font-mono border border-white/5">
                        {em}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-[#25D366] flex items-center gap-1">
                    <span>💬</span> Forward on WhatsApp
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const text = `📢 *Artificial Samrajya Official Broadcast*\n\n*${title}*\n${message}\n\n🎮 Play Now: https://artificialsamrajya.com`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="px-3.5 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <span>💬</span>
              <span>Share to WhatsApp Group</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs rounded-xl transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-black uppercase rounded-xl tracking-tight transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-[#25D366]/20"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Broadcast...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-black" />
                    Dispatch WhatsApp Broadcast
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
