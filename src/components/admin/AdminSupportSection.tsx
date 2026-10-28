import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Search, Filter, CheckCircle2, Clock, RotateCcw, 
  Trash2, Send, Paperclip, AlertCircle, Sparkles, User, Shield, 
  Flame, RefreshCw, X, ChevronRight, Trophy, Gamepad2, Key, Coins, 
  ExternalLink, HelpCircle, ArrowLeft, ArrowUpRight, Check
} from "lucide-react";
import { api } from "../../lib/api";
import { 
  SupportTicket, SupportMessage, SupportStatus, SupportPriority, 
  SupportCategory 
} from "../../types";

const CANNED_RESPONSES = [
  {
    label: "🔑 Room ID Published",
    text: "The Room ID & Password for your tournament have been published! Please check your tournament details card or notifications to join the lobby."
  },
  {
    label: "💳 Deposit Approved",
    text: "Your UPI deposit has been verified and added to your wallet balance. You can now join upcoming tournaments!"
  },
  {
    label: "💸 Withdrawal Processed",
    text: "Your withdrawal payout request has been processed successfully to your UPI ID. Please check your bank / UPI statement."
  },
  {
    label: "🎮 Score & Match Investigation",
    text: "We are actively reviewing the match screenshots and leaderboard scores with match referees. Please allow 10-15 minutes for verification."
  },
  {
    label: "⏰ Match Time Updated",
    text: "The match schedule has been updated by the admin team. Please ensure you are ready in the lobby 10 minutes prior."
  }
];

export const AdminSupportSection: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Selected Ticket for Conversation
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttachment, setReplyAttachment] = useState("");
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<{ ticketId: string; message: SupportMessage } | null>(null);
  const [deletingMessage, setDeletingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, priorityFilter]);

  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [selectedTicket?.messages]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getSupportTickets({
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        search: search.trim() || undefined
      });
      if (res.success) {
        setTickets(res.tickets || []);
        // Refresh selected ticket if active
        if (selectedTicket) {
          const updated = (res.tickets || []).find((t: SupportTicket) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err: any) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Attachment must be smaller than 5MB");
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      setReplyAttachment(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !replyAttachment)) return;

    setErrorMsg(null);
    const textToSend = replyText.trim();
    const attachToSend = replyAttachment;

    // Optimistically update admin conversation
    const tempMsg: SupportMessage = {
      id: `admin-temp-${Date.now()}`,
      ticket_id: selectedTicket.id,
      sender_type: "admin",
      sender_id: "admin_root",
      sender_name: "Admin Support Team",
      message: textToSend || "📷 [Sent photo attachment]",
      attachment_url: attachToSend || undefined,
      created_at: new Date().toISOString()
    };

    setSelectedTicket({
      ...selectedTicket,
      messages: [...(selectedTicket.messages || []), tempMsg],
      last_message: tempMsg.message,
      last_reply_by: "admin",
      updated_at: new Date().toISOString()
    });
    setReplyText("");
    setReplyAttachment("");

    try {
      setReplying(true);
      const res = await api.replySupportTicket(selectedTicket.id, {
        sender_type: "admin",
        sender_id: "admin_root",
        sender_name: "Admin Support Team",
        message: textToSend || "📷 [Sent photo attachment]",
        attachment_url: attachToSend || undefined
      });

      if (res.success && res.ticket) {
        setSelectedTicket(res.ticket);
        fetchTickets();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit admin reply");
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: SupportStatus) => {
    try {
      setStatusUpdating(true);
      setErrorMsg(null);
      const res = await api.updateSupportTicketStatus(ticketId, { status });
      if (res.success) {
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(res.ticket);
        }
        fetchTickets();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update ticket status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleUpdatePriority = async (ticketId: string, priority: SupportPriority) => {
    try {
      const res = await api.updateSupportTicketStatus(ticketId, { priority });
      if (res.success) {
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(res.ticket);
        }
        setSuccessMsg(`Ticket priority updated to ${priority}.`);
        fetchTickets();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update priority");
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const res = await api.deleteSupportTicket(ticketId, { role: "admin" });
      if (res.success) {
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null);
        }
        setDeleteConfirmId(null);
        setSuccessMsg("Support ticket permanently deleted.");
        fetchTickets();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete ticket");
    }
  };

  const handleDeleteMessage = async (ticketId: string, msg: SupportMessage) => {
    try {
      setDeletingMessage(true);
      const res = await api.deleteSupportMessage(ticketId, msg.id, { role: "admin" });
      if (res.success) {
        if (selectedTicket?.id === ticketId) {
          if (res.ticket) {
            setSelectedTicket(res.ticket);
          } else {
            setSelectedTicket({
              ...selectedTicket,
              messages: selectedTicket.messages.filter((m) => m.id !== msg.id)
            });
          }
        }
        setSuccessMsg("Support message permanently deleted.");
        fetchTickets();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete message");
    } finally {
      setDeletingMessage(false);
      setMessageToDelete(null);
    }
  };

  // Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const repliedCount = tickets.filter((t) => t.status === "Replied").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;
  const urgentCount = tickets.filter((t) => t.priority === "Urgent" && t.status !== "Resolved").length;

  const filteredTickets = tickets.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.ticket_code.toLowerCase().includes(q) ||
      t.username.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.messages.some((m) => m.message.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Metrics */}
      <div className="bg-[#1A1D24] p-5 rounded-3xl border border-white/5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">
                Support & Gamer Messages
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Manage incoming help requests, room credential queries, and gamer messaging with instant replies.
            </p>
          </div>

          <button
            onClick={fetchTickets}
            disabled={loading}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#FF6B00]" : ""}`} />
            <span>Refresh Inbox</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
          <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-3">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total</span>
            <span className="text-lg font-black text-white">{totalCount}</span>
          </div>
          <div className="bg-[#0F1115] border border-amber-500/20 rounded-2xl p-3">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Open
            </span>
            <span className="text-lg font-black text-amber-400">{openCount}</span>
          </div>
          <div className="bg-[#0F1115] border border-blue-500/20 rounded-2xl p-3">
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> In Progress
            </span>
            <span className="text-lg font-black text-blue-400">{inProgressCount}</span>
          </div>
          <div className="bg-[#0F1115] border border-emerald-500/20 rounded-2xl p-3">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Replied
            </span>
            <span className="text-lg font-black text-emerald-400">{repliedCount}</span>
          </div>
          <div className="bg-[#0F1115] border border-red-500/30 rounded-2xl p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-400" /> Urgent
            </span>
            <span className="text-lg font-black text-red-400">{urgentCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#1A1D24] p-4 rounded-3xl border border-white/5 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ticket ID (#A10245), Gamer username, or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0F1115] border border-white/10 focus:border-[#FF6B00] rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F1115] border border-white/10 focus:border-[#FF6B00] rounded-2xl px-2.5 py-2 text-xs text-white outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Replied">Replied</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0F1115] border border-white/10 focus:border-[#FF6B00] rounded-2xl px-2.5 py-2 text-xs text-white outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Room ID / Password">Room ID / Pass</option>
              <option value="Match">Match</option>
              <option value="Tournament">Tournament</option>
              <option value="Registration">Registration</option>
              <option value="Payment">Payment</option>
              <option value="Withdrawal">Withdrawal</option>
              <option value="Account">Account</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#0F1115] border border-white/10 focus:border-[#FF6B00] rounded-2xl px-2.5 py-2 text-xs text-white outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">🚨 Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List View & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Tickets List (hidden on mobile when a ticket is actively selected) */}
        <div className={`${selectedTicket ? "hidden lg:block lg:col-span-5" : "col-span-1 lg:col-span-12"} space-y-3`}>
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-xs bg-[#1A1D24] border border-white/5 rounded-3xl">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FF6B00] mb-2" />
              Loading gamer tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 bg-[#1A1D24] border border-white/5 rounded-3xl p-8 space-y-2">
              <MessageSquare className="w-8 h-8 text-gray-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Tickets Found</h4>
              <p className="text-xs text-gray-400">
                {search || statusFilter !== "all" || categoryFilter !== "all"
                  ? "No tickets match your filter criteria."
                  : "All gamer tickets are clear and resolved!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const isUrgent = t.priority === "Urgent";
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 sm:p-4 rounded-3xl border transition-all cursor-pointer space-y-2 relative ${
                      isSelected
                        ? "bg-[#212631] border-[#FF6B00] shadow-lg ring-1 ring-[#FF6B00]"
                        : isUrgent && t.status !== "Resolved"
                        ? "bg-red-500/5 border-red-500/30 hover:border-red-500/60"
                        : "bg-[#1A1D24] border-white/5 hover:border-white/20"
                    }`}
                  >
                    {/* Top row: Ticket ID + Gamer Name + Priority + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black font-mono text-[#FF6B00] shrink-0">
                          {t.ticket_code}
                        </span>
                        <span className="text-xs font-bold text-white flex items-center gap-1 truncate">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{t.username}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.priority === "Urgent" && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" /> URGENT
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          t.status === "Open"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : t.status === "In Progress"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : t.status === "Replied"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    {/* Subject & snippet */}
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{t.subject}</h4>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {t.last_message || t.messages[0]?.message}
                      </p>
                    </div>

                    {/* Footer tag info */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-white/5 font-mono">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 bg-black/30 rounded-md text-gray-300 truncate max-w-[120px]">
                          {t.category}
                        </span>
                        {t.tournament_title && (
                          <span className="text-gray-400 truncate max-w-[130px]">
                            🏆 {t.tournament_title}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0">
                        {new Date(t.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Conversation & Reply Center */}
        {selectedTicket && (
          <div className="lg:col-span-7 bg-[#1A1D24] border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col shadow-2xl space-y-3">
            
            {/* Header / Ticket Summary */}
            <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center gap-1 text-xs font-bold transition-all lg:hidden shrink-0 cursor-pointer"
                  title="Back to Tickets"
                >
                  <ArrowLeft className="w-4 h-4 text-[#FF6B00]" />
                  <span className="hidden xs:inline">Back</span>
                </button>

                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#E65100] flex items-center justify-center text-black font-black text-sm shrink-0 shadow-md">
                  {selectedTicket.username.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-white truncate">
                      {selectedTicket.username}
                    </span>
                    <span className="text-[10px] font-black font-mono text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.5 rounded-md border border-[#FF6B00]/30 shrink-0">
                      {selectedTicket.ticket_code}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
                      ID: {selectedTicket.user_id.substring(0, 8)}
                    </span>
                  </div>
                  <h3 className="text-xs text-gray-300 truncate max-w-[220px] sm:max-w-md font-medium mt-0.5">
                    {selectedTicket.subject}
                  </h3>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(selectedTicket.id)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                  title="Delete Entire Ticket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all hidden lg:block cursor-pointer"
                  title="Close Ticket View"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Controls Bar: Status Pills & Priority Selector */}
            <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold pr-1 hidden sm:inline">Status:</span>
                <div className="flex gap-1">
                  {(["Open", "In Progress", "Replied", "Resolved"] as SupportStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                      className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedTicket.status === st
                          ? "bg-[#FF6B00] text-black shadow-md font-black"
                          : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold hidden sm:inline">Priority:</span>
                <select
                  value={selectedTicket.priority}
                  onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as SupportPriority)}
                  className="bg-[#1A1D24] border border-white/10 rounded-xl px-2 py-1 text-[10px] font-mono font-bold text-white outline-none cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">🚨 Urgent</option>
                </select>
              </div>
            </div>

            {/* Conversation Messages Thread (WhatsApp styled) */}
            <div className="space-y-3 min-h-[220px] max-h-[380px] sm:max-h-[440px] overflow-y-auto no-scrollbar p-3 sm:p-4 bg-[#0B141A] rounded-2xl border border-white/5 flex flex-col">
              
              {/* Date Header Badge */}
              <div className="flex justify-center my-1">
                <span className="px-3 py-0.5 rounded-full bg-[#182229] border border-white/5 text-[10px] font-mono text-gray-400 shadow-sm">
                  {new Date(selectedTicket.created_at).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric"
                  })}
                </span>
              </div>

              {selectedTicket.messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center text-gray-500 text-xs py-8">
                  No messages yet. Send a reply below.
                </div>
              ) : (
                selectedTicket.messages.map((msg, idx) => {
                  const isAdmin = msg.sender_type === "admin";
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                    >
                      {/* Sender label */}
                      <div className="flex items-center gap-1 mb-1 px-1">
                        {isAdmin ? (
                          <>
                            <span className="text-[10px] font-bold text-[#FF6B00]">Admin Team</span>
                            <div className="w-3.5 h-3.5 rounded-full bg-[#FF6B00] flex items-center justify-center text-black">
                              <Shield className="w-2 h-2" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center text-gray-300">
                              <User className="w-2 h-2" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-300">
                              {selectedTicket.username}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Chat Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-2.5 sm:p-3 text-xs leading-relaxed space-y-1.5 relative group shadow-md ${
                          isAdmin
                            ? "bg-[#005c4b] text-white rounded-tr-none border border-[#02735e]"
                            : "bg-[#202c33] text-gray-100 rounded-tl-none border border-[#2a3942]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        
                        {msg.attachment_url && (
                          <div className="pt-1">
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-xl overflow-hidden border border-black/20 max-h-48"
                            >
                              <img
                                src={msg.attachment_url}
                                alt="Attachment"
                                className="w-full h-auto object-cover max-h-48 rounded-xl hover:opacity-90 transition-opacity"
                              />
                            </a>
                          </div>
                        )}

                        {/* Bubble Footer: Timestamp, WhatsApp Ticks, Delete Icon */}
                        <div className="flex items-center justify-end gap-1.5 text-[9px] text-gray-300/80 font-mono pt-0.5">
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isAdmin && (
                            <span className="text-[#53bdeb] font-bold text-[11px] leading-none" title="Delivered">✓✓</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setMessageToDelete({ ticketId: selectedTicket.id, message: msg })}
                            className="p-1 -mr-1 rounded hover:bg-black/30 text-gray-400 hover:text-red-400 transition-all cursor-pointer opacity-80 hover:opacity-100"
                            title="Delete this message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Canned Responses: Horizontal Scrollable Strip (Never stacks vertically!) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold flex items-center gap-1">
                  ⚡ 1-Click Quick Replies:
                </span>
                <span className="text-[9px] text-gray-500 font-mono">swipe to see more →</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {CANNED_RESPONSES.map((cr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(cr.text)}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-[#FF6B00]/15 hover:border-[#FF6B00]/40 text-[10px] font-mono text-gray-300 hover:text-white border border-white/5 transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
                  >
                    {cr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Success & Error Banners */}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-xl flex items-center justify-between animate-in fade-in">
                <span>{successMsg}</span>
                <button type="button" onClick={() => setSuccessMsg(null)} className="text-gray-400 hover:text-white ml-2 cursor-pointer">✕</button>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-xl flex items-center justify-between animate-in fade-in">
                <span>{errorMsg}</span>
                <button type="button" onClick={() => setErrorMsg(null)} className="text-gray-400 hover:text-white ml-2 cursor-pointer">✕</button>
              </div>
            )}

            {/* Admin Reply Composer Bar */}
            <form onSubmit={handleSendAdminReply} className="space-y-2 pt-1">
              {replyAttachment && (
                <div className="relative inline-block">
                  <img
                    src={replyAttachment}
                    alt="Reply Preview"
                    className="w-14 h-14 object-cover rounded-xl border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setReplyAttachment("")}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer shadow"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2">
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
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all shrink-0 cursor-pointer"
                  title="Attach Screenshot / Image"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder="Type reply to gamer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 min-w-0 bg-[#0F1115] border border-white/10 focus:border-[#FF6B00] rounded-2xl px-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={replying || (!replyText.trim() && !replyAttachment)}
                  className="px-3.5 sm:px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E65100] disabled:opacity-40 text-black font-black text-xs uppercase rounded-2xl transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-[#FF6B00]/20 cursor-pointer active:scale-95"
                >
                  {replying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 fill-black" />
                      <span>Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        )}

        {/* Delete Support Ticket Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-[#1A1D24] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Delete Support Ticket?</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    This entire conversation thread and history will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTicket(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all flex items-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Ticket</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Individual Message Confirmation Modal */}
        {messageToDelete && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-[#1A1D24] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Delete Message?</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    This message will be permanently purged from the database.
                  </p>
                </div>
              </div>

              <div className="bg-[#0F1115] p-3 rounded-2xl border border-white/5 text-xs text-gray-300 italic truncate max-h-24 overflow-hidden">
                "{messageToDelete.message.message}"
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
                  disabled={deletingMessage}
                  onClick={() => handleDeleteMessage(messageToDelete.ticketId, messageToDelete.message)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all flex items-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 cursor-pointer"
                >
                  {deletingMessage ? (
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

      </div>

    </div>
  );
};
