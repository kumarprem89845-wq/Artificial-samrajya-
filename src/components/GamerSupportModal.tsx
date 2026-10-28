import React, { useState, useEffect, useRef } from "react";
import { 
  X, Send, Paperclip, Smile, Mic, CheckCheck, Check, Clock,
  ShieldCheck, ExternalLink, Image as ImageIcon, ArrowLeft, 
  RefreshCw, Play, Pause, Key, Coins, Trophy, Gamepad2, 
  Sparkles, Flame, Phone, MessageSquare, ChevronRight,
  MoreVertical, HelpCircle, AlertCircle, Trash2, CheckCircle2, Copy
} from "lucide-react";
import { api } from "../lib/api";
import { 
  User as UserType, SupportTicket, SupportMessage, SupportCategory, 
  SupportStatus, Tournament 
} from "../types";

interface GamerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  initialTicketId?: string;
  onTicketCreated?: () => void;
}

const QUICK_CHIPS = [
  { label: "🔑 Room ID & Password", text: "Hi Admin, I need the Room ID and Password for my upcoming match." },
  { label: "💳 Payment Proof", text: "Hi Admin, I have deposited the entry fee. Here is my transaction proof screenshot." },
  { label: "🏆 Match Score Issue", text: "Hi Admin, I have a dispute / query regarding my tournament match score and rank." },
  { label: "💸 Withdrawal Status", text: "Hi Admin, please check the status of my UPI withdrawal request." },
  { label: "🎮 Slot & In-Game Name", text: "Hi Admin, I want to verify my slot and In-Game Name for the tournament." }
];

const EMOJI_LIST = ["🎮", "🔥", "🏆", "👍", "❤️", "⚡", "💸", "🔑", "🙏", "🤝", "✅", "😎", "🎯", "🛡️"];

export const GamerSupportModal: React.FC<GamerSupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTicketId,
  onTicketCreated
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Chat Input State
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [adminHelpline, setAdminHelpline] = useState("7667265813");
  const [sendError, setSendError] = useState<string | null>(null);

  // Message & Chat Deletion State
  const [messageToDelete, setMessageToDelete] = useState<SupportMessage | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [clearChatConfirm, setClearChatConfirm] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [deleteTicketConfirm, setDeleteTicketConfirm] = useState(false);
  const [deleteTicketTargetId, setDeleteTicketTargetId] = useState<string | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadTickets();
      loadTournaments();
      loadAdminMobile();
    }
  }, [isOpen, currentUser]);

  // Handle initial ticket or select latest
  useEffect(() => {
    if (tickets.length > 0) {
      if (initialTicketId) {
        const found = tickets.find(
          (t) => t.id === initialTicketId || t.ticket_code.toLowerCase() === initialTicketId.toLowerCase()
        );
        if (found) {
          setActiveTicket(found);
          setShowAllChats(false);
          return;
        }
      }
      if (!activeTicket) {
        // Find most recent active ticket, or default to the newest one
        const openTicket = tickets.find(t => t.status !== "Resolved") || tickets[0];
        setActiveTicket(openTicket);
      }
    }
  }, [tickets, initialTicketId]);

  // Scroll on message updates
  useEffect(() => {
    if (activeTicket?.messages) {
      scrollToBottom();
    }
  }, [activeTicket?.messages?.length]);

  // Live auto-polling every 3.5 seconds when chat is open
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const interval = setInterval(() => {
      syncLatestMessages();
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, activeTicket?.id]);

  const loadAdminMobile = async () => {
    try {
      const res = await api.getAppSettings();
      if (res.success && res.settings?.admin_mobile) {
        setAdminHelpline(res.settings.admin_mobile);
      }
    } catch {
      // fallback
    }
  };

  const loadTickets = async () => {
    if (!currentUser) return;
    try {
      setFetching(true);
      const res = await api.getSupportTickets({ user_id: currentUser.id });
      if (res.success) {
        const list = res.tickets || [];
        setTickets(list);
        if (activeTicket) {
          const updated = list.find((t: SupportTicket) => t.id === activeTicket.id);
          if (updated) setActiveTicket(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setFetching(false);
    }
  };

  const syncLatestMessages = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getSupportTickets({ user_id: currentUser.id });
      if (res.success) {
        const list = res.tickets || [];
        setTickets(list);
        if (activeTicket) {
          const updated = list.find((t: SupportTicket) => t.id === activeTicket.id);
          if (updated && updated.messages.length !== activeTicket.messages.length) {
            setActiveTicket(updated);
          }
        }
      }
    } catch {
      // silently ignore polling errors
    }
  };

  const loadTournaments = async () => {
    try {
      const res = await api.getTournaments(currentUser?.id);
      if (res.success) {
        setTournaments(res.tournaments || []);
      }
    } catch (err) {
      console.error("Failed to load tournaments", err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSendError("Please upload an image smaller than 5MB");
      return;
    }

    setSendError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Send message - with instant optimistic UI, auto-ticket recovery, and zero lag
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : messageText).trim();
    const attachmentToSend = attachment;
    if (!textToSend && !attachmentToSend) return;

    setSendError(null);

    // 1. Instantly clear input fields for responsive, zero-lag feel
    setMessageText("");
    setAttachment("");
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // 2. Build optimistic message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const optimisticMsg: SupportMessage = {
      id: tempId,
      ticket_id: activeTicket?.id || `temp-tkt-${Date.now()}`,
      sender_type: "user",
      sender_id: currentUser.id,
      sender_name: currentUser.username,
      message: textToSend || "📷 [Sent photo attachment]",
      attachment_url: attachmentToSend || undefined,
      created_at: new Date().toISOString()
    };

    // 3. Immediately render message bubble in chat stream
    if (activeTicket) {
      setActiveTicket({
        ...activeTicket,
        messages: [...(activeTicket.messages || []), optimisticMsg],
        last_message: optimisticMsg.message,
        last_reply_by: "user",
        updated_at: new Date().toISOString()
      });
    } else {
      const tempTicket: SupportTicket = {
        id: optimisticMsg.ticket_id,
        ticket_code: "#A...",
        user_id: currentUser.id,
        username: currentUser.username,
        subject: textToSend.length > 30 ? textToSend.substring(0, 30) + "..." : textToSend || "Support Chat",
        category: "Other",
        status: "Open",
        priority: "Normal",
        messages: [optimisticMsg],
        last_message: optimisticMsg.message,
        last_reply_by: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setActiveTicket(tempTicket);
    }
    scrollToBottom();

    // 4. Dispatch over API with automatic fallback
    try {
      setLoading(true);

      const isRealExistingTicket = Boolean(
        activeTicket && 
        activeTicket.id && 
        !activeTicket.id.startsWith("temp-") && 
        !activeTicket.id.startsWith("tkt-temp-")
      );

      let res: any = null;

      if (isRealExistingTicket && activeTicket) {
        try {
          res = await api.replySupportTicket(activeTicket.id, {
            sender_type: "user",
            sender_id: currentUser.id,
            sender_name: currentUser.username,
            message: textToSend || "📷 [Sent photo attachment]",
            attachment_url: attachmentToSend || undefined
          });
        } catch {
          // If replying to the specific ticket ID encounters an issue, fallback to create/sync
          res = await api.createSupportTicket({
            user_id: currentUser.id,
            username: currentUser.username,
            user_email: currentUser.email,
            subject: textToSend.length > 30 ? textToSend.substring(0, 30) + "..." : textToSend || "Support Chat",
            category: "Other",
            message: textToSend || "📷 [Sent photo attachment]",
            attachment_url: attachmentToSend || undefined
          });
        }
      } else {
        res = await api.createSupportTicket({
          user_id: currentUser.id,
          username: currentUser.username,
          user_email: currentUser.email,
          subject: textToSend.length > 30 ? textToSend.substring(0, 30) + "..." : textToSend || "Support Chat",
          category: "Other",
          message: textToSend || "📷 [Sent photo attachment]",
          attachment_url: attachmentToSend || undefined
        });
      }

      if (res && res.success && res.ticket) {
        setActiveTicket(res.ticket);
        loadTickets();
        onTicketCreated?.();
        scrollToBottom();
      }
    } catch (err: any) {
      console.error("Support message delivery error:", err);
      setSendError(err.message || "Failed to deliver message to admin. Tap to retry.");
    } finally {
      setLoading(false);
    }
  };

  // Simulate sending a WhatsApp voice note
  const handleSendVoiceNote = async () => {
    setIsRecordingVoice(true);
    setTimeout(async () => {
      setIsRecordingVoice(false);
      await handleSendMessage("🎙️ [Voice Message • 0:14]");
    }, 1400);
  };

  // Open Direct WhatsApp app with Admin number
  const handleOpenDirectWhatsApp = () => {
    const defaultText = `Hello Artificial Samrajya Admin, I am Gamer @${currentUser.username} (ID: ${currentUser.id.slice(0, 8)}). I need support regarding tournament & room credentials.`;
    const cleanNumber = adminHelpline.replace(/[^0-9]/g, "");
    const formatted = cleanNumber.startsWith("91") ? cleanNumber : `91${cleanNumber}`;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(defaultText)}`;
    window.open(url, "_blank");
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 2800);
  };

  // Delete an individual message (Gamer can delete their sent messages)
  const handleDeleteMessage = async (msg: SupportMessage) => {
    if (!activeTicket) return;
    setDeletingMessageId(msg.id);

    // Optimistically remove from active chat view
    const remainingMessages = (activeTicket.messages || []).filter((m) => m.id !== msg.id);
    const newLastMsg = remainingMessages.length > 0 
      ? remainingMessages[remainingMessages.length - 1].message 
      : "No messages yet";
    const newLastReplyBy = remainingMessages.length > 0 
      ? remainingMessages[remainingMessages.length - 1].sender_type 
      : undefined;

    const updatedActive = {
      ...activeTicket,
      messages: remainingMessages,
      last_message: newLastMsg,
      last_reply_by: newLastReplyBy || activeTicket.last_reply_by,
      updated_at: new Date().toISOString()
    };
    setActiveTicket(updatedActive);
    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updatedActive : t)));

    // If it was just an optimistic temp message, no server request needed
    if (msg.id.startsWith("temp-")) {
      setDeletingMessageId(null);
      setMessageToDelete(null);
      showToast("Message deleted");
      return;
    }

    try {
      const res = await api.deleteSupportMessage(activeTicket.id, msg.id, {
        user_id: currentUser.id,
        role: "user"
      });
      if (res && res.success && res.ticket) {
        setActiveTicket(res.ticket);
        setTickets((prev) => prev.map((t) => (t.id === res.ticket.id ? res.ticket : t)));
      }
      showToast("Message deleted");
    } catch (err: any) {
      console.error("Delete message error:", err);
      setSendError(err.message || "Failed to delete message. Please retry.");
      loadTickets();
    } finally {
      setDeletingMessageId(null);
      setMessageToDelete(null);
    }
  };

  // Clear all messages in current chat
  const handleClearChat = async () => {
    if (!activeTicket) return;
    setClearingChat(true);

    try {
      const isReal = Boolean(
        activeTicket.id && 
        !activeTicket.id.startsWith("temp-") && 
        !activeTicket.id.startsWith("tkt-temp-")
      );
      if (isReal) {
        const res = await api.clearSupportChat(activeTicket.id, {
          user_id: currentUser.id,
          role: "user"
        });
        if (res && res.success && res.ticket) {
          setActiveTicket(res.ticket);
          setTickets((prev) => prev.map((t) => (t.id === res.ticket.id ? res.ticket : t)));
        } else {
          setActiveTicket({ ...activeTicket, messages: [], last_message: "Chat cleared" });
        }
      } else {
        setActiveTicket({ ...activeTicket, messages: [], last_message: "Chat cleared" });
      }
      showToast("Chat history cleared");
    } catch (err: any) {
      console.error("Clear chat error:", err);
      setSendError(err.message || "Failed to clear chat");
    } finally {
      setClearingChat(false);
      setClearChatConfirm(false);
      setShowMenu(false);
    }
  };

  // Delete support ticket completely
  const handleDeleteTicket = async (ticketId?: string) => {
    const targetId = ticketId || activeTicket?.id;
    if (!targetId) return;

    setDeletingTicket(true);
    try {
      const isReal = Boolean(!targetId.startsWith("temp-") && !targetId.startsWith("tkt-temp-"));
      if (isReal) {
        await api.deleteSupportTicket(targetId, {
          user_id: currentUser.id,
          role: "user"
        });
      }

      setTickets((prev) => {
        const nextList = prev.filter((t) => t.id !== targetId);
        if (activeTicket?.id === targetId) {
          setActiveTicket(nextList.length > 0 ? nextList[0] : null);
        }
        return nextList;
      });

      if (activeTicket?.id === targetId) {
        setShowAllChats(false);
      }
      showToast("Conversation deleted");
    } catch (err: any) {
      console.error("Delete conversation error:", err);
      setSendError(err.message || "Failed to delete conversation");
    } finally {
      setDeletingTicket(false);
      setDeleteTicketConfirm(false);
      setDeleteTicketTargetId(null);
      setShowMenu(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="gamer-support-modal"
        className="w-full max-w-lg bg-[#0b141a] border border-[#202c33] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[94vh] sm:h-[85vh] overflow-hidden relative"
      >
        
        {/* =====================================================================
            WHATSAPP CHAT HEADER
            ===================================================================== */}
        <div className="px-3.5 py-2.5 bg-[#1f2c34] text-white flex items-center justify-between gap-2.5 shrink-0 border-b border-[#2a3942] shadow-md z-10">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back button */}
            <button
              onClick={() => {
                if (showAllChats) {
                  setShowAllChats(false);
                } else {
                  onClose();
                }
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Admin Avatar with glowing green online ring */}
            <div className="relative shrink-0 cursor-pointer" onClick={() => setShowMenu(!showMenu)}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00a884] to-[#25D366] p-[2px] shadow-sm">
                <div className="w-full h-full rounded-full bg-[#111b21] flex items-center justify-center text-white font-black text-xs">
                  <ShieldCheck className="w-5 h-5 text-[#25D366]" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00E676] border-2 border-[#1f2c34] animate-pulse" />
            </div>

            {/* Title & Online Status */}
            <div className="min-w-0 cursor-pointer" onClick={() => setShowMenu(!showMenu)}>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight truncate">
                  Artificial Samrajya Support
                </h3>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#25D366] text-black">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#00a884]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-ping" />
                <span className="font-medium">online</span>
                <span className="text-gray-400 font-mono text-[10px]">• 24/7 Match Help</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Direct WhatsApp Action Button */}
            <button
              onClick={handleOpenDirectWhatsApp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="Chat directly on WhatsApp app"
            >
              <span className="text-sm">💬</span>
              <span className="hidden xs:inline">WhatsApp</span>
            </button>

            {/* Direct Call / Helpline */}
            <a
              href={`tel:${adminHelpline}`}
              className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95"
              title={`Call Admin Helpline: ${adminHelpline}`}
            >
              <Phone className="w-4 h-4 text-emerald-400" />
            </a>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-[#202c33] border border-[#2a3942] rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowAllChats(!showAllChats);
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-gray-200 hover:bg-white/10 flex items-center justify-between"
                  >
                    <span>{showAllChats ? "Return to Current Chat" : "All Past Conversations"}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10">{tickets.length}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTicket(null);
                      setShowAllChats(false);
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#00a884] hover:bg-white/10 flex items-center gap-2 font-bold"
                  >
                    <span>+ Start New Chat Topic</span>
                  </button>
                  <button
                    onClick={() => {
                      loadTickets();
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-gray-200 hover:bg-white/10 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    <span>Refresh Messages</span>
                  </button>

                  {activeTicket && (
                    <>
                      <div className="h-px bg-white/10 my-1" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setClearChatConfirm(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-amber-300 hover:bg-white/10 flex items-center gap-2 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Clear Chat History</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setDeleteTicketConfirm(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete Conversation</span>
                      </button>
                    </>
                  )}

                  <div className="h-px bg-white/10 my-1" />
                  <div className="px-3.5 py-1 text-[10px] text-gray-400 font-mono">
                    Helpline: +91 {adminHelpline}
                  </div>
                </div>
              )}
            </div>

            {/* Close Modal */}
            <button
              id="close-gamer-support-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =====================================================================
            VIEW ALL CHATS LIST (If toggled from menu)
            ===================================================================== */}
        {showAllChats ? (
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2 bg-[#111b21]">
            <div className="flex items-center justify-between pb-2 border-b border-[#202c33]">
              <span className="text-xs font-bold text-gray-300">All Support Conversations</span>
              <button
                onClick={() => setShowAllChats(false)}
                className="text-xs font-bold text-[#00a884] hover:underline"
              >
                Back to Chat
              </button>
            </div>
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                No previous conversations. Start typing below to talk with Admin!
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setActiveTicket(t);
                    setShowAllChats(false);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    activeTicket?.id === t.id
                      ? "bg-[#202c33] border-[#00a884]/50 shadow-md"
                      : "bg-[#182229] border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#00a884]">{t.ticket_code}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300">{t.category}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        t.status === "Replied" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-400"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-white truncate mt-1">
                      {t.subject || t.last_message}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {new Date(t.updated_at || t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTicketTargetId(t.id);
                      }}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* =====================================================================
              WHATSAPP CHAT STREAM BODY
              ===================================================================== */
          <div 
            className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3 bg-[#0b141a] relative"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(17, 27, 33, 0.7) 0%, rgba(11, 20, 26, 0.95) 100%)`
            }}
          >
            {/* End-to-end encryption notice (WhatsApp signature) */}
            <div className="flex justify-center my-1">
              <div className="bg-[#182229]/95 border border-[#2a3942]/60 rounded-xl px-3 py-1.5 text-center max-w-xs shadow-sm">
                <p className="text-[10px] text-[#ffd279] flex items-center justify-center gap-1.5 leading-relaxed font-sans">
                  <span>🔒</span>
                  <span>Messages and calls are end-to-end encrypted with Artificial Samrajya Admin.</span>
                </p>
              </div>
            </div>

            {/* Date divider */}
            <div className="flex justify-center my-2">
              <span className="bg-[#182229] border border-[#2a3942]/50 text-gray-400 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider font-mono">
                TODAY
              </span>
            </div>

            {/* Admin Welcome message if fresh session */}
            {(!activeTicket || activeTicket.messages.length === 0) && (
              <div className="flex flex-col items-start space-y-1 max-w-[85%] animate-in fade-in">
                <div className="bg-[#202c33] text-white p-3 rounded-2xl rounded-tl-sm border border-[#2a3942] shadow-md space-y-2">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-white/5">
                    <span className="text-[10px] font-bold text-[#00a884] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#25D366]" />
                      Artificial Samrajya Support Team
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-200">
                    Hello <strong className="text-[#00E676]">@{currentUser.username}</strong>! 👋 Welcome to Official Tournament Support.
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    How can we help you today? Aap apna query neeche type kar sakte hain ya quick options me se choose karein:
                  </p>
                  <div className="text-[10px] text-gray-400 font-mono text-right pt-0.5">
                    Just now
                  </div>
                </div>
              </div>
            )}

            {/* Quick suggested WhatsApp chips */}
            {(!activeTicket || activeTicket.messages.length <= 2) && (
              <div className="py-1 space-y-1.5">
                <span className="text-[10px] font-mono text-gray-400 block px-1 uppercase tracking-wider">
                  ⚡ Quick Messages (Tap to Send)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.text)}
                      disabled={loading}
                      className="px-2.5 py-1.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] border border-[#00a884]/30 text-gray-200 hover:text-white text-[11px] font-medium transition-all active:scale-95 text-left flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubble List */}
            {activeTicket?.messages.map((msg, idx) => {
              const isAdmin = msg.sender_type === "admin";
              const isVoiceMsg = msg.message.includes("[Voice Message");

              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isAdmin ? "items-start" : "items-end"} animate-in fade-in duration-150`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed space-y-1.5 shadow-md relative ${
                      isAdmin
                        ? "bg-[#202c33] text-gray-100 rounded-tl-sm border border-[#2a3942]"
                        : "bg-[#005c4b] text-white rounded-tr-sm border border-[#02735e]"
                    }`}
                  >
                    {/* Header for Admin messages */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 pb-0.5">
                        <span className="text-[10px] font-bold text-[#00a884] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#25D366]" />
                          Admin Support
                        </span>
                      </div>
                    )}

                    {/* Image Attachment (WhatsApp Photo Card) */}
                    {msg.attachment_url && (
                      <div className="rounded-xl overflow-hidden border border-black/20 my-1 bg-black/30">
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block group relative"
                        >
                          <img
                            src={msg.attachment_url}
                            alt="Attachment"
                            className="w-full max-h-48 object-cover rounded-xl group-hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> View Full
                            </span>
                          </div>
                        </a>
                      </div>
                    )}

                    {/* Voice Message Simulation */}
                    {isVoiceMsg ? (
                      <div className="flex items-center gap-3 py-1 px-1 min-w-[200px]">
                        <button
                          onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                          className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                        >
                          {playingVoiceId === msg.id ? (
                            <Pause className="w-4 h-4 fill-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-0.5 h-4">
                            {[4, 8, 12, 6, 14, 10, 5, 12, 8, 14, 6, 9, 13, 7, 11].map((h, i) => (
                              <span
                                key={i}
                                style={{ height: `${h}px` }}
                                className={`w-1 rounded-full ${
                                  playingVoiceId === msg.id && i < 8 ? "bg-[#53bdeb]" : "bg-white/40"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-mono text-gray-300 block">0:14</span>
                        </div>
                      </div>
                    ) : (
                      /* Text Message */
                      <p className="whitespace-pre-wrap break-words text-xs font-normal">
                        {msg.message}
                      </p>
                    )}

                    {/* WhatsApp Timestamp & Double Blue Ticks & Delete Message Button */}
                    <div className="flex items-center justify-end gap-1.5 text-[9px] text-gray-300/80 font-mono pt-0.5">
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {!isAdmin && (
                        msg.id.startsWith("temp-") ? (
                          <Clock className="w-3 h-3 text-gray-300 animate-pulse" title="Sending..." />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] stroke-[2.5]" title="Delivered & Read" />
                        )
                      )}
                      
                      {/* Delete Message Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageToDelete(msg);
                        }}
                        className="opacity-70 hover:opacity-100 p-0.5 rounded hover:bg-black/25 text-gray-300 hover:text-red-400 transition-all cursor-pointer ml-1"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* =====================================================================
            ATTACHMENT PREVIEW CHIP (If uploaded)
            ===================================================================== */}
        {attachment && (
          <div className="px-4 py-2 bg-[#1f2c34] border-t border-[#2a3942] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={attachment}
                alt="Selected"
                className="w-10 h-10 object-cover rounded-xl border border-white/20 shrink-0"
              />
              <span className="text-xs text-gray-300 truncate font-medium">Image attached ready to send</span>
            </div>
            <button
              onClick={() => setAttachment("")}
              className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1 rounded-lg hover:bg-white/5"
            >
              Remove
            </button>
          </div>
        )}

        {/* =====================================================================
            EMOJI TRAY (Toggleable)
            ===================================================================== */}
        {showEmojiPicker && (
          <div className="p-2.5 bg-[#1f2c34] border-t border-[#2a3942] flex flex-wrap gap-2 shrink-0 animate-in slide-in-from-bottom-2">
            {EMOJI_LIST.map((em, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMessageText(prev => prev + em);
                  inputRef.current?.focus();
                }}
                className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg active:scale-90 transition-transform"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Inline Send Error Banner */}
        {sendError && (
          <div className="bg-red-500/15 border-t border-red-500/30 px-3.5 py-2 flex items-center justify-between text-[11px] text-red-300 shrink-0 animate-in slide-in-from-bottom-1">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="truncate">{sendError}</span>
            </div>
            <button 
              type="button"
              onClick={() => setSendError(null)}
              className="p-1 hover:text-white text-gray-400 text-xs shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* =====================================================================
            WHATSAPP BOTTOM INPUT FOOTER
            ===================================================================== */}
        <div className="p-2.5 bg-[#1f2c34] border-t border-[#2a3942] flex items-center gap-2 shrink-0">
          
          {/* WhatsApp Pill Input Container */}
          <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 flex items-center gap-2 shadow-inner border border-white/5">
            
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded-full text-gray-400 hover:text-white transition-colors"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5 text-gray-400 hover:text-amber-400 transition-colors" />
            </button>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-transparent text-white placeholder-gray-400 text-xs sm:text-sm outline-none font-normal"
            />

            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded-full text-gray-400 hover:text-white transition-colors"
              title="Attach Screenshot / Image"
            >
              <Paperclip className="w-4.5 h-4.5 -rotate-45" />
            </button>
          </div>

          {/* WhatsApp Circular Action Button (Send or Voice Note) */}
          {messageText.trim() || attachment ? (
            <button
              id="send-support-message-btn"
              type="button"
              onClick={() => handleSendMessage()}
              className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#029070] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Send Message"
            >
              <Send className="w-4.5 h-4.5 fill-white ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendVoiceNote}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer ${
                isRecordingVoice
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-[#00a884] hover:bg-[#029070] text-white"
              }`}
              title="Send Voice Note"
            >
              <Mic className="w-4.5 h-4.5" />
            </button>
          )}

        </div>

        {/* =====================================================================
            TOAST NOTIFICATION BANNER
            ===================================================================== */}
        {successToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#00a884] text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{successToast}</span>
          </div>
        )}

        {/* =====================================================================
            DELETE MESSAGE CONFIRMATION MODAL
            ===================================================================== */}
        {messageToDelete && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-[#1f2c34] border border-[#2a3942] rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Delete message?</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    This message will be permanently deleted from the conversation.
                  </p>
                </div>
              </div>

              <div className="bg-[#111b21] p-3 rounded-2xl border border-white/5 text-xs text-gray-300 italic truncate max-h-20 overflow-hidden">
                "{messageToDelete.message}"
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setMessageToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={Boolean(deletingMessageId)}
                  onClick={() => handleDeleteMessage(messageToDelete)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all flex items-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 cursor-pointer"
                >
                  {deletingMessageId ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            CLEAR CHAT CONFIRMATION MODAL
            ===================================================================== */}
        {clearChatConfirm && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-[#1f2c34] border border-[#2a3942] rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Clear chat history?</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Messages will be removed from this conversation.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setClearChatConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={clearingChat}
                  onClick={handleClearChat}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  {clearingChat ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Chat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            DELETE CONVERSATION CONFIRMATION MODAL
            ===================================================================== */}
        {(deleteTicketConfirm || deleteTicketTargetId) && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-[#1f2c34] border border-[#2a3942] rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Delete conversation?</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    This support conversation will be deleted permanently.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTicketConfirm(false);
                    setDeleteTicketTargetId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingTicket}
                  onClick={() => handleDeleteTicket(deleteTicketTargetId || undefined)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all flex items-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 cursor-pointer"
                >
                  {deletingTicket ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Conversation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
