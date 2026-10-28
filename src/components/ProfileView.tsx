import React, { useState } from "react";
import { api } from "../lib/api";
import { 
  User as UserIcon, MessageSquare, Headphones, Loader2, 
  UserCog, Mail, ShieldCheck, Key, LogOut, CheckCircle2, 
  Bell, Swords, Trophy, Clock, Coins, Sparkles, Check, 
  AlertCircle, Radio, Send, Volume2, ShieldAlert, Zap, Trash2
} from "lucide-react";
import { User as UserType, NotificationPreferences } from "../types";
import { Switch } from "./Switch";
import { motion, AnimatePresence } from "motion/react";

interface ProfileViewProps {
  currentUser: UserType;
  onProfileUpdated: (updatedUser: UserType) => void;
  onLogout: () => void;
  onOpenSupport?: () => void;
}

export default function ProfileView({ currentUser, onProfileUpdated, onLogout, onOpenSupport }: ProfileViewProps) {
  // Main Fields
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [upiId, setUpiId] = useState(currentUser.upi_id || "");

  // Password Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification Preferences
  const defaultNotifSettings: NotificationPreferences = {
    match_start: true,
    tournament_results: true,
    room_credentials: true,
    schedule_updates: true,
    wallet_payouts: true,
    admin_announcements: true,
    push_enabled: true
  };

  const [notifSettings, setNotifSettings] = useState<NotificationPreferences>(() => {
    if (currentUser.notification_settings) {
      return { ...defaultNotifSettings, ...currentUser.notification_settings };
    }
    try {
      const saved = localStorage.getItem(`notif_prefs_${currentUser.id}`);
      if (saved) {
        return { ...defaultNotifSettings, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return defaultNotifSettings;
  });

  const [savingNotifKey, setSavingNotifKey] = useState<string | null>(null);
  const [notifToast, setNotifToast] = useState<string | null>(null);
  const [testPushBanner, setTestPushBanner] = useState<{ title: string; message: string; type: string } | null>(null);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const notificationEventTypes: Array<{
    key: keyof Omit<NotificationPreferences, "push_enabled">;
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    tag?: string;
  }> = [
    {
      key: "match_start",
      title: "Match Start",
      description: "Push alert 15 minutes before your registered match begins and when room countdown starts",
      icon: Swords,
      iconColor: "text-[#FF6B00]",
      iconBg: "bg-[#FF6B00]/10 border-[#FF6B00]/20",
      tag: "CRITICAL"
    },
    {
      key: "tournament_results",
      title: "Tournament Results",
      description: "Instant notification when match standings, kill leaderboards, and winners are published",
      icon: Trophy,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10 border-amber-400/20",
      tag: "RESULTS"
    },
    {
      key: "room_credentials",
      title: "Room ID & Password",
      description: "Immediate push alert the moment the private custom room ID and password are released",
      icon: Key,
      iconColor: "text-[#00E676]",
      iconBg: "bg-[#00E676]/10 border-[#00E676]/20",
      tag: "INSTANT"
    },
    {
      key: "schedule_updates",
      title: "Match Schedule Updates",
      description: "Timely alerts if match timings, map modes, or bracket slot adjustments occur",
      icon: Clock,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-400/10 border-blue-400/20"
    },
    {
      key: "wallet_payouts",
      title: "Prize Payouts & Wallet Credits",
      description: "Push alerts for credited prize earnings, deposit approvals, and withdrawal completions",
      icon: Coins,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-400/10 border-emerald-400/20"
    },
    {
      key: "admin_announcements",
      title: "Official Announcements",
      description: "Major tournament launches, priority admin broadcasts, and community updates",
      icon: Sparkles,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-400/10 border-purple-400/20"
    }
  ];

  const handleToggleNotif = async (key: keyof NotificationPreferences, value: boolean) => {
    const updated = {
      ...notifSettings,
      [key]: value
    };
    setNotifSettings(updated);

    try {
      localStorage.setItem(`notif_prefs_${currentUser.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setSavingNotifKey(key);
    try {
      await api.updateNotificationSettings(currentUser.id, updated);
      onProfileUpdated({
        ...currentUser,
        notification_settings: updated
      });
      const name = key === "push_enabled" 
        ? "Push Notifications" 
        : notificationEventTypes.find(e => e.key === key)?.title || key;
      setNotifToast(value ? `✓ Enabled ${name}` : `Muted ${name}`);
      setTimeout(() => setNotifToast(null), 2500);
    } catch (e) {
      console.error("Failed to sync notification settings", e);
    } finally {
      setSavingNotifKey(null);
    }
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPerm(perm);
        if (perm === "granted") {
          setNotifToast("🔔 Browser push notifications permission granted!");
          setTimeout(() => setNotifToast(null), 3000);
        }
      } catch (e) {
        console.error("Failed to request permission", e);
      }
    }
  };

  const handleSendTestPush = (type: "match_start" | "tournament_results") => {
    const data = type === "match_start" ? {
      title: "⚔️ Match Start: BGMI Erangel Pro Cup",
      message: "Room ID & Password released! Match starts in 15 minutes. Join Slot #04.",
      type: "Match Start Alert"
    } : {
      title: "🏆 Tournament Results Announced!",
      message: "Final leaderboard is live! Winner: Gamer99 (Rank #1) • ₹1,000 Winnings Credited.",
      type: "Tournament Results"
    };

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(data.title, {
          body: data.message,
          icon: "/favicon.ico"
        });
      } catch {
        // Fallback to in-app banner
      }
    }

    setTestPushBanner(data);
    setTimeout(() => {
      setTestPushBanner(null);
    }, 4500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const payload: any = {
        username,
        email,
        upi_id: upiId,
        notification_settings: notifSettings
      };

      // If user wants to change password
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("New password confirmation does not match.");
        }
        payload.password = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.updateProfile(currentUser.id, payload);
      if (res.success) {
        setFeedback({
          type: "success",
          text: "🎉 Your profile details and notification preferences have been saved!"
        });
        
        onProfileUpdated(res.user);

        // Reset password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to update profile coordinates."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMyAccount = async () => {
    try {
      setDeleteLoading(true);
      const res = await api.deleteAccount(currentUser.id);
      if (res.success) {
        onLogout();
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to delete gamer account." });
        setShowDeleteModal(false);
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to delete gamer account." });
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isMasterPushDisabled = notifSettings.push_enabled === false;

  return (
    <div className="space-y-6 relative">
      
      {/* Test Push Banner Notification Toast Preview */}
      <AnimatePresence>
        {testPushBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-50 bg-[#16181F]/95 border border-[#FF6B00]/40 rounded-2xl p-3.5 shadow-2xl shadow-black/80 flex items-start gap-3 backdrop-blur-md"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/20 border border-[#FF6B00]/30 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-[#FF6B00] animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono text-[#FF6B00] uppercase font-bold tracking-wider">
                  {testPushBanner.type} • PUSH ALERT
                </span>
                <span className="text-[9px] text-gray-500 font-mono">Just Now</span>
              </div>
              <h4 className="text-xs font-bold text-white mt-0.5">{testPushBanner.title}</h4>
              <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">{testPushBanner.message}</p>
            </div>
            <button
              onClick={() => setTestPushBanner(null)}
              className="text-gray-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Preference Toast */}
      <AnimatePresence>
        {notifToast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#16181F] border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-medium text-white"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
            <span>{notifToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Header */}
      <div className="bg-[#1A1D24] p-5 rounded-3xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/5 rounded-full blur-2xl" />
        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[#FF6B00] font-black text-xl uppercase shadow-md select-none shrink-0 italic">
          {currentUser.username.substring(0, 2)}
        </div>
        <div className="space-y-0.5">
          <h2 className="text-base font-black text-white tracking-tight uppercase">{currentUser.username}</h2>
          <p className="text-xs text-gray-500 font-medium leading-none">{currentUser.email}</p>
          <span className="inline-flex items-center gap-1.5 text-[9px] bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-2 py-0.5 rounded-full font-bold mt-1.5 uppercase">
            <ShieldCheck className="w-3 h-3" /> ACTIVE GAMER
          </span>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-5">
        
        {/* Main section */}
        <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
            <UserCog className="w-4.5 h-4.5 text-[#FF6B00]" />
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-tighter">
              Profile Configurations
            </h3>
          </div>

          {/* Feedback alerts inside form */}
          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-medium border ${
              feedback.type === "success" 
                ? "bg-[#00E676]/10 border-[#00E676]/20 text-[#00E676]" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {feedback.text}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* Saved Personal UPI ID */}
          <div>
            <label className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest block mb-1">
              Your Saved UPI ID (For Withdrawals)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. gamer99@okaxis"
              className="w-full bg-[#0F1115] border border-[#FF6B00]/20 focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-650 outline-none transition-all font-mono"
            />
            <span className="text-[9px] text-gray-500 mt-1 block leading-tight">
              ⚡ All withdrawal payouts will be dispatched manually by Admin to this UPI account.
            </span>
          </div>
        </div>

        {/* =====================================================================
            NOTIFICATION SETTINGS SECTION (NEW)
            ===================================================================== */}
        <div id="notification-settings-section" className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-[#FF6B00]" />
              <h3 className="text-xs font-bold text-white/90 uppercase tracking-tighter">
                Notification Settings
              </h3>
            </div>
            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border border-[#FF6B00]/20 bg-[#FF6B00]/10 text-[#FF6B00] font-bold">
              PUSH ALERTS
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Customize which instant push alerts and tournament updates you receive on your device.
          </p>

          {/* Master Push Notification Switch */}
          <div className="p-3.5 rounded-2xl bg-[#0F1115] border border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Zap className={`w-4 h-4 ${notifSettings.push_enabled !== false ? "text-[#FF6B00]" : "text-gray-500"}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">Allow Push Notifications</span>
                  {notifSettings.push_enabled !== false ? (
                    <span className="text-[8px] font-mono text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 rounded uppercase font-bold">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded uppercase font-bold">
                      MUTED
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                  Master switch for all device push alerts and alerts banners
                </p>
              </div>
            </div>

            <Switch
              id="switch-master-push"
              ariaLabel="Toggle all push notifications"
              checked={notifSettings.push_enabled !== false}
              onChange={(checked) => handleToggleNotif("push_enabled", checked)}
            />
          </div>

          {/* Browser Permission Info / CTA */}
          {browserPerm !== "unsupported" && (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] font-mono text-gray-400">Browser Push:</span>
                {browserPerm === "granted" ? (
                  <span className="text-[10px] font-mono text-[#00E676] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Granted
                  </span>
                ) : browserPerm === "denied" ? (
                  <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Blocked in browser
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Not yet granted
                  </span>
                )}
              </div>

              {browserPerm === "default" && (
                <button
                  type="button"
                  onClick={handleRequestBrowserPermission}
                  className="text-[10px] font-bold font-mono px-2.5 py-1 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/30 text-[#FF6B00] rounded-xl transition-all"
                >
                  Enable Browser Push
                </button>
              )}
            </div>
          )}

          {/* Event-specific Push Notification Switches */}
          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold px-1">
              Event Types & Triggers
            </div>

            <div className="divide-y divide-white/5 bg-[#0F1115] border border-white/5 rounded-2xl overflow-hidden">
              {notificationEventTypes.map((item) => {
                const IconComponent = item.icon;
                const isChecked = notifSettings[item.key] && !isMasterPushDisabled;
                const isSavingThis = savingNotifKey === item.key;

                return (
                  <div 
                    key={item.key}
                    className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                      isMasterPushDisabled ? "opacity-40" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl ${item.iconBg} border flex items-center justify-center shrink-0 mt-0.5`}>
                        <IconComponent className={`w-4 h-4 ${item.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-tight">
                            {item.title}
                          </span>
                          {item.tag && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5 uppercase">
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSavingThis && (
                        <Loader2 className="w-3 h-3 text-[#FF6B00] animate-spin" />
                      )}
                      <Switch
                        id={`switch-${item.key}`}
                        ariaLabel={`Toggle ${item.title} push alerts`}
                        checked={Boolean(notifSettings[item.key])}
                        disabled={isMasterPushDisabled}
                        onChange={(checked) => handleToggleNotif(item.key, checked)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Push Triggers */}
          <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <span className="text-[10px] font-mono text-gray-400">
              Preview how push alerts appear:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendTestPush("match_start")}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Swords className="w-3 h-3 text-[#FF6B00]" />
                <span>Test Match Start</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendTestPush("tournament_results")}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Test Results</span>
              </button>
            </div>
          </div>
        </div>

        {/* Change password section */}
        <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
            <Key className="w-4.5 h-4.5 text-[#FF6B00]" />
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-tighter">
              Access Password (Optional)
            </h3>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Current Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Support & Contact Admin Section */}
        {onOpenSupport && (
          <div className="bg-[#111b21] border border-[#202c33] hover:border-[#25D366]/40 rounded-3xl p-5 space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  WhatsApp Admin Support & Chat
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#25D366] bg-[#25D366]/15 px-2 py-0.5 rounded-full border border-[#25D366]/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                Live 24/7
              </span>
            </div>
            <p className="text-xs text-gray-300">
              Have queries about tournament schedules, room passwords, UPI deposits, or prize withdrawals? Connect directly just like on WhatsApp!
            </p>
            <button
              type="button"
              onClick={onOpenSupport}
              className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-xs uppercase rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/15 active:scale-95 cursor-pointer"
            >
              <span className="text-sm">💬</span>
              CHAT WITH ADMIN (WHATSAPP LIVE)
            </button>
          </div>
        )}

        {/* Submit & Logout */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3.5 bg-[#FF6B00] text-black font-black uppercase rounded-2xl text-xs tracking-tighter hover:bg-[#E65100] transition-all shadow-lg shadow-[#FF6B00]/10 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                SAVING...
              </>
            ) : (
              "SAVE CHANGES"
            )}
          </button>
          
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold rounded-2xl text-xs tracking-tighter uppercase transition-all flex items-center justify-center gap-1"
          >
            <LogOut className="w-4 h-4" />
            LOGOUT
          </button>
        </div>

        {/* Danger Zone: Delete Gamer Account */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                Danger Zone: Gamer Account
              </h3>
            </div>
            <span className="text-[10px] font-mono text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
              IRREVERSIBLE
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Permanently delete your gamer account, tournament history, and registration coordinates from ARTIFICIAL SAMRAJYA.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            DELETE GAMER ACCOUNT
          </button>
        </div>

      </form>

      {/* Delete Gamer Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1A1D24] border border-red-500/30 rounded-3xl p-6 shadow-2xl relative space-y-4">
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
                    Irreversible Action
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="p-1 text-gray-400 hover:text-white text-lg disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete your gamer account <strong className="text-white">({currentUser.username})</strong>? All registrations, wallet balance (₹{currentUser.wallet_balance}), and records will be deleted immediately.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="py-3 bg-[#0F1115] hover:bg-white/5 text-gray-300 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteMyAccount}
                disabled={deleteLoading}
                className="py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{deleteLoading ? "DELETING..." : "CONFIRM DELETE"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

