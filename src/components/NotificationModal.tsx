import React, { useState } from "react";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trophy, 
  Gamepad2, 
  ArrowUpRight, 
  Coins, 
  QrCode, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  Key,
  Info,
  Sliders,
  Share2,
  Flame
} from "lucide-react";
import { AppNotification } from "../types";
import { EmptyState } from "./EmptyState";
import { api } from "../lib/api";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  userId: string;
  onMarkRead: (id?: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onOpenQr?: (qrUrl: string, amount?: number, status?: string) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenSupport?: (ticketId?: string) => void;
}

const REACTION_EMOJIS = ["🔥", "🏆", "❤️", "👍", "🎮", "⚡"];

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  userId,
  onMarkRead,
  onClearAll,
  onDeleteNotification,
  onOpenQr,
  onNavigateTab,
  onOpenSupport
}) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "broadcasts" | "tournaments" | "wallet">("all");
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  
  // Interactive reaction counters per notification
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReact = async (e: React.MouseEvent, notifId: string, emoji: string) => {
    e.stopPropagation();
    
    // Toggle reaction
    const currentReaction = userReactions[notifId];
    const isRemoving = currentReaction === emoji;
    
    setUserReactions(prev => ({
      ...prev,
      [notifId]: isRemoving ? "" : emoji
    }));

    setReactions(prev => {
      const current = { ...(prev[notifId] || {}) };
      if (isRemoving) {
        current[emoji] = Math.max(0, (current[emoji] || 1) - 1);
      } else {
        if (currentReaction && current[currentReaction]) {
          current[currentReaction] = Math.max(0, current[currentReaction] - 1);
        }
        current[emoji] = (current[emoji] || 0) + 1;
      }
      return { ...prev, [notifId]: current };
    });

    try {
      await api.reactToNotification(notifId, emoji);
    } catch {
      // optimistic update is sufficient
    }
  };

  const handleShareToWhatsApp = (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    const text = `📢 *Artificial Samrajya Official Announcement*\n\n*${notif.title}*\n${notif.message}\n\n🎮 Download & Play Tournaments: https://artificialsamrajya.com`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === "broadcasts") {
      return (
        notif.type === "admin_announcement" || 
        notif.type === "direct_message" || 
        notif.sender === "Admin" ||
        Boolean(notif.broadcast_id)
      );
    }
    if (activeFilter === "tournaments") {
      return (
        notif.type.startsWith("tournament_") ||
        notif.type === "room_published" ||
        Boolean(notif.tournament_id)
      );
    }
    if (activeFilter === "wallet") {
      return (
        notif.type.startsWith("withdrawal_") || 
        notif.type.startsWith("deposit_") || 
        notif.type === "wallet_adjustment" ||
        notif.amount !== undefined
      );
    }
    return true;
  });

  const getNotificationIcon = (notif: AppNotification) => {
    if (notif.broadcast_id || notif.type === "admin_announcement") {
      return (
        <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
          <span className="text-base">📢</span>
        </div>
      );
    }

    if (notif.type === "direct_message") {
      return (
        <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    }

    if (notif.type === "tournament_live" || notif.type === "room_published") {
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 animate-pulse">
          <Key className="w-4 h-4" />
        </div>
      );
    }

    switch (notif.type) {
      case "withdrawal_applied":
        return (
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case "withdrawal_approved":
        return (
          <div className="w-10 h-10 rounded-2xl bg-[#00E676]/15 border border-[#00E676]/30 flex items-center justify-center text-[#00E676] shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case "withdrawal_rejected":
        return (
          <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        );
      case "deposit_approved":
        return (
          <div className="w-10 h-10 rounded-2xl bg-[#00E676]/15 border border-[#00E676]/30 flex items-center justify-center text-[#00E676] shrink-0">
            <Coins className="w-4 h-4" />
          </div>
        );
      case "deposit_rejected":
        return (
          <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case "tournament_result":
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
        );
      case "tournament_joined":
      case "tournament_update":
        return (
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Gamepad2 className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "Just now";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Recent";
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    try {
      setDeletingId(notifId);
      await onDeleteNotification(notifId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="notification-modal-content"
        className="w-full max-w-lg bg-[#0F1115] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] space-y-3 sm:space-y-4 overflow-hidden"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
              <span className="text-base">📢</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  Notification & Broadcasts
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6B00] text-black">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400">
                Official announcements & tournament broadcast channel
              </p>
            </div>
          </div>

          <button
            id="close-notifications-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all shrink-0 ${
                activeFilter === "all"
                  ? "bg-[#FF6B00] text-black shadow-md shadow-[#FF6B00]/20 font-black"
                  : "bg-[#1A1D24] text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              ALL ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter("broadcasts")}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all shrink-0 flex items-center gap-1.5 ${
                activeFilter === "broadcasts"
                  ? "bg-[#25D366] text-black shadow-md shadow-[#25D366]/20 font-black"
                  : "bg-[#1A1D24] text-[#25D366] hover:bg-[#25D366]/10 border border-[#25D366]/30"
              }`}
            >
              <span className="text-xs">📢</span>
              <span>WA BROADCASTS</span>
            </button>
            <button
              onClick={() => setActiveFilter("tournaments")}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all shrink-0 ${
                activeFilter === "tournaments"
                  ? "bg-[#FF6B00] text-black shadow-md shadow-[#FF6B00]/20 font-black"
                  : "bg-[#1A1D24] text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              TOURNAMENTS
            </button>
            <button
              onClick={() => setActiveFilter("wallet")}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all shrink-0 ${
                activeFilter === "wallet"
                  ? "bg-[#FF6B00] text-black shadow-md shadow-[#FF6B00]/20 font-black"
                  : "bg-[#1A1D24] text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              WALLET
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {onNavigateTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab("profile");
                }}
                className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-[#FF6B00] px-2 py-1 rounded-lg bg-white/5 border border-white/5 hover:border-[#FF6B00]/30 transition-colors"
                title="Notification Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>PREFS</span>
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={() => onMarkRead()}
                className="flex items-center gap-1 text-[10px] font-mono text-[#00E676] hover:text-[#00C853] font-bold px-2 py-1 rounded-lg bg-[#00E676]/10 border border-[#00E676]/20 transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                READ ALL
              </button>
            )}
            {notifications.length > 0 && (
              <button
                disabled={clearing}
                onClick={async () => {
                  setClearing(true);
                  await onClearAll();
                  setClearing(false);
                }}
                className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scrollable Feed */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1 flex flex-col justify-start">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              type={activeFilter === "all" ? "notifications" : "notifications_filtered"}
              filterName={
                activeFilter === "broadcasts" 
                  ? "WhatsApp Channel Broadcasts" 
                  : activeFilter === "tournaments" 
                  ? "Tournaments & Match Credentials" 
                  : activeFilter === "wallet" 
                  ? "Wallet & UPI Payments" 
                  : "All"
              }
              onClearFilter={activeFilter !== "all" ? () => setActiveFilter("all") : undefined}
              primaryActionLabel="EXPLORE TOURNAMENTS"
              onPrimaryAction={() => {
                onClose();
                onNavigateTab?.("home");
              }}
              secondaryActionLabel="CONTACT ADMIN CHAT"
              onSecondaryAction={onOpenSupport ? () => {
                onClose();
                onOpenSupport();
              } : undefined}
            />
          ) : (
            filteredNotifications.map((notif) => {
              const isExpanded = Boolean(expandedIds[notif.id]);
              const isBroadcast = Boolean(notif.broadcast_id) || notif.type === "admin_announcement" || notif.sender === "Admin";
              const isDeleting = deletingId === notif.id;
              const notifReactions = reactions[notif.id] || notif.reactions || {};
              const userSelectedReaction = userReactions[notif.id] || notif.user_reaction;

              // ===================================================================
              // WHATSAPP CHANNEL BROADCAST CARD LAYOUT
              // ===================================================================
              if (isBroadcast) {
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) onMarkRead(notif.id);
                      toggleExpand(notif.id);
                    }}
                    className={`rounded-2xl border transition-all overflow-hidden relative cursor-pointer shadow-lg ${
                      !notif.is_read
                        ? "bg-[#111b21] border-[#25D366]/40 shadow-[#25D366]/5 ring-1 ring-[#25D366]/20"
                        : "bg-[#111b21]/90 border-[#202c33] hover:border-[#25D366]/30"
                    }`}
                  >
                    {/* WhatsApp Channel Card Top Banner */}
                    <div className="px-3.5 py-2.5 bg-[#1f2c34] border-b border-[#2a3942] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0 shadow-sm">
                          <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              Artificial Samrajya Channel
                            </span>
                            <span className="w-3.5 h-3.5 rounded-full bg-[#25D366] text-black inline-flex items-center justify-center text-[9px] font-black shrink-0">
                              ✓
                            </span>
                          </div>
                          <span className="text-[10px] text-[#00a884] font-medium block">
                            📢 Official Broadcast Channel • {formatDateTime(notif.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                        )}
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={(e) => handleDeleteItem(e, notif.id)}
                          className="p-1 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                          title="Delete broadcast"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* WhatsApp Channel Message Body */}
                    <div className="p-3.5 space-y-2.5">
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug flex items-center gap-1.5">
                        <span className="text-emerald-400">⚡</span>
                        {notif.title}
                      </h4>

                      <p className={`text-xs text-gray-200 leading-relaxed font-sans ${
                        isExpanded ? "whitespace-pre-line" : "line-clamp-3"
                      }`}>
                        {notif.message}
                      </p>

                      {notif.message.length > 100 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(notif.id);
                          }}
                          className="text-[11px] font-mono text-[#00a884] hover:underline flex items-center gap-1 font-bold"
                        >
                          {isExpanded ? (
                            <>Show less <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Read full announcement <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      )}

                      {/* Linked Tournament Box */}
                      {(notif.tournament_id || notif.tournament_title) && (
                        <div className="p-2.5 rounded-xl bg-[#202c33] border border-[#2a3942] text-white text-xs flex items-center justify-between gap-2 mt-1">
                          <div className="flex items-center gap-2 truncate">
                            <Gamepad2 className="w-4 h-4 text-[#00a884] shrink-0" />
                            <span className="font-bold truncate text-[11px]">
                              {notif.tournament_title || `Tournament #${notif.tournament_id}`}
                            </span>
                          </div>
                          {onNavigateTab && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateTab("tournaments");
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#00a884] hover:bg-[#029070] text-white text-[10px] font-bold uppercase transition-all shrink-0"
                            >
                              Join Tournament
                            </button>
                          )}
                        </div>
                      )}

                      {/* WhatsApp Channel Reactions & Share Bar */}
                      <div className="pt-2 border-t border-[#202c33] flex items-center justify-between gap-2 flex-wrap">
                        {/* Interactive Emoji Reactions */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {REACTION_EMOJIS.map((emoji) => {
                            const count = notifReactions[emoji] || 0;
                            const isSelected = userSelectedReaction === emoji;

                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => handleReact(e, notif.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all active:scale-90 ${
                                  isSelected
                                    ? "bg-[#00a884]/25 border-[#00a884] text-white font-bold"
                                    : "bg-[#202c33] border-white/5 text-gray-300 hover:border-white/20"
                                }`}
                                title={`React with ${emoji}`}
                              >
                                <span>{emoji}</span>
                                {count > 0 && (
                                  <span className="text-[10px] font-mono font-bold text-gray-300">{count}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* WhatsApp Forward / Share Button */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={(e) => handleShareToWhatsApp(e, notif)}
                            className="px-2.5 py-1 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                            title="Share on WhatsApp"
                          >
                            <span className="text-xs">💬</span>
                            <span>Forward on WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ===================================================================
              // STANDARD SYSTEM NOTIFICATION CARD (Tournament, Wallet, etc.)
              // ===================================================================
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) onMarkRead(notif.id);
                    toggleExpand(notif.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all space-y-3 relative cursor-pointer ${
                    !notif.is_read
                      ? "bg-[#161920] border-[#FF6B00]/40 shadow-lg shadow-[#FF6B00]/5 ring-1 ring-[#FF6B00]/20"
                      : "bg-[#0F1115]/85 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notif)}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-xs font-bold text-white tracking-tight truncate">
                            {notif.title}
                          </h4>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#FF6B00] shrink-0 animate-pulse" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-gray-400">
                            {formatDateTime(notif.created_at)}
                          </span>
                          
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={(e) => handleDeleteItem(e, notif.id)}
                            className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                            title="Delete this notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className={`text-xs text-gray-300 leading-relaxed font-sans pt-1 ${
                        isExpanded ? "whitespace-pre-line" : "line-clamp-2"
                      }`}>
                        {notif.message}
                      </p>

                      {notif.message.length > 90 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(notif.id);
                          }}
                          className="text-[10px] font-mono text-[#FF6B00] hover:underline flex items-center gap-0.5 pt-0.5"
                        >
                          {isExpanded ? (
                            <>Show less <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Read full message <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      )}

                      {/* Linked Tournament Box */}
                      {(notif.tournament_id || notif.tournament_title) && (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center justify-between gap-2 mt-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <Gamepad2 className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                            <span className="font-bold truncate text-[11px]">
                              {notif.tournament_title || `Tournament #${notif.tournament_id}`}
                            </span>
                          </div>
                          {onNavigateTab && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateTab("tournaments");
                                onClose();
                              }}
                              className="px-2 py-0.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-[10px] font-mono font-bold uppercase transition-colors shrink-0"
                            >
                              Check Details
                            </button>
                          )}
                        </div>
                      )}

                      {/* Amount & Status Badges */}
                      {(notif.amount !== undefined || notif.status) && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap font-mono text-[10px]">
                          {notif.amount !== undefined && (
                            <span className="px-2 py-0.5 rounded-md bg-[#00E676]/10 text-[#00E676] font-bold border border-[#00E676]/20">
                              ₹{notif.amount}
                            </span>
                          )}
                          {notif.status && (
                            <span className={`px-2 py-0.5 rounded-md font-bold ${
                              notif.status === "Completed"
                                ? "bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20"
                                : notif.status === "Rejected"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20"
                            }`}>
                              Status: {notif.status}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notification Bottom Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs font-mono">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notif.qr_code_url && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenQr) {
                              onOpenQr(notif.qr_code_url!, notif.amount, notif.status);
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 text-[#FF6B00] font-bold flex items-center gap-1.5 border border-[#FF6B00]/30 transition-colors text-[11px]"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          VIEW QR CODE
                        </button>
                      )}

                      {notif.action_label && onNavigateTab && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateTab(notif.action_tab || "tournaments");
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 text-[#FF6B00] font-bold flex items-center gap-1 border border-[#FF6B00]/30 transition-colors text-[11px]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {notif.action_label}
                        </button>
                      )}

                      {(notif.type.startsWith("withdrawal_") || notif.type.startsWith("deposit_")) && onNavigateTab && !notif.qr_code_url && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateTab("wallet");
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold flex items-center gap-1 border border-white/10 transition-colors text-[11px]"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          VIEW WALLET
                        </button>
                      )}

                      {(notif.ticket_id || notif.type.startsWith("support_")) && onOpenSupport && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSupport(notif.ticket_id);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30 transition-colors text-[11px]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          OPEN CHAT / REPLY
                        </button>
                      )}
                    </div>

                    {!notif.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(notif.id);
                        }}
                        className="text-gray-400 hover:text-[#00E676] flex items-center gap-1 text-[10px] font-bold transition-colors ml-auto"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-400 shrink-0">
          <span className="flex items-center gap-1 text-[#25D366]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Official WhatsApp Broadcast Channel
          </span>
          <span>{notifications.length} Total Alerts</span>
        </div>
      </div>
    </div>
  );
};
