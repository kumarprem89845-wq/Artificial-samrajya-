import React from "react";
import { 
  Gamepad2, Trophy, Bell, ShieldCheck, Sparkles, 
  ArrowRight, Coins, MessageSquare, Plus, RefreshCw, Zap,
  CheckCircle2, Swords, Flame, Radio, Award
} from "lucide-react";
import { motion } from "motion/react";

interface EmptyStateProps {
  type: "upcoming_tournaments" | "completed_tournaments" | "notifications" | "notifications_filtered";
  filterName?: string;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  onClearFilter?: () => void;
}

export function EmptyState({
  type,
  filterName,
  onPrimaryAction,
  primaryActionLabel,
  onSecondaryAction,
  secondaryActionLabel,
  onClearFilter
}: EmptyStateProps) {

  // =========================================================================
  // 1. UPCOMING / LIVE TOURNAMENTS EMPTY STATE
  // =========================================================================
  if (type === "upcoming_tournaments") {
    return (
      <div className="bg-gradient-to-b from-[#1A1D24] via-[#14161D] to-[#0F1115] border border-white/10 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl space-y-6">
        {/* Background Cyber Ambient Accents */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#00E676]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Branded Graphic Illustration: Cyber Shield & Esports Controller */}
        <div className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
          {/* Animated Orbital Pulse Rings */}
          <div className="absolute inset-0 rounded-full border border-[#FF6B00]/20 animate-ping opacity-25" />
          <div className="absolute inset-2 rounded-full border border-dashed border-[#FF6B00]/30 animate-spin" style={{ animationDuration: "16s" }} />
          
          {/* Glowing Vector Hex Shield Frame */}
          <svg className="w-full h-full text-[#FF6B00]" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0F1115" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B00" />
                <stop offset="50%" stopColor="#00E676" />
                <stop offset="100%" stopColor="#FF6B00" />
              </linearGradient>
            </defs>
            <polygon
              points="60,8 108,32 108,88 60,112 12,88 12,32"
              fill="url(#shieldGrad)"
              stroke="url(#borderGrad)"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          </svg>

          {/* Centered Graphic Icons */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#222733] to-[#12141A] border border-[#FF6B00]/40 flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
              <Gamepad2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#FF6B00] stroke-[1.8]" />
            </div>
          </div>

          {/* Floating Corner Badges */}
          <div className="absolute -top-1 right-2 px-2 py-0.5 rounded-full bg-[#00E676]/15 border border-[#00E676]/30 text-[#00E676] text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Sparkles className="w-2.5 h-2.5" />
            Lobbies Open
          </div>
        </div>

        {/* Descriptive Text & Typography */}
        <div className="space-y-2 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-gray-300">
            <Radio className="w-3 h-3 text-[#FF6B00] animate-pulse" />
            No Active Tournament Registrations
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
            Ready to Enter the Arena?
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            You haven't enlisted in any upcoming tournament lobbies yet. Register for daily BGMI, Free Fire, or COD matches to unlock room credentials, compete, and claim cash prize pools.
          </p>
        </div>

        {/* Value Highlights Pill Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-gray-400 font-mono">
          <span className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/5 flex items-center gap-1.5 text-gray-300">
            <CheckCircle2 className="w-3 h-3 text-[#00E676]" />
            Instant Room ID & Pass
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/5 flex items-center gap-1.5 text-gray-300">
            <CheckCircle2 className="w-3 h-3 text-[#00E676]" />
            Automated UPI Payouts
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/5 flex items-center gap-1.5 text-gray-300">
            <CheckCircle2 className="w-3 h-3 text-[#00E676]" />
            Solo, Duo & Squad Lobbies
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
          {onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#E65100] text-black font-black text-xs uppercase tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20 active:scale-95 transition-all"
            >
              <Swords className="w-4 h-4 fill-black stroke-none" />
              <span>{primaryActionLabel || "BROWSE & JOIN TOURNAMENTS"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-tight flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
            >
              <Coins className="w-4 h-4 text-[#FF6B00]" />
              <span>{secondaryActionLabel || "TOP UP WALLET"}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. COMPLETED TOURNAMENTS HISTORY EMPTY STATE
  // =========================================================================
  if (type === "completed_tournaments") {
    return (
      <div className="bg-gradient-to-b from-[#1A1D24] via-[#14161D] to-[#0F1115] border border-white/10 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl space-y-6">
        {/* Ambient Gold & Green Backdrops */}
        <div className="absolute -top-16 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-0 w-48 h-48 bg-[#00E676]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Branded Graphic Illustration: Victory Trophy & Stars Emblem */}
        <div className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
          {/* Subtle Outer Glow Circle */}
          <div className="absolute inset-0 rounded-full border border-amber-500/20 bg-amber-500/5 animate-pulse" />
          <div className="absolute inset-3 rounded-full border border-dashed border-amber-500/30" />

          {/* SVG Laurel & Trophy Base */}
          <svg className="w-full h-full text-amber-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="50" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
            <path
              d="M30 45 C25 65 35 85 60 95 C85 85 95 65 90 45"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 3"
            />
          </svg>

          {/* Central Trophy Box */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#282115] to-[#12141A] border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/15">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 stroke-[1.8]" />
            </div>
          </div>

          {/* Champion Badge */}
          <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Award className="w-2.5 h-2.5" />
            Battle Records
          </div>
        </div>

        {/* Descriptive Text */}
        <div className="space-y-2 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-gray-300">
            <Flame className="w-3 h-3 text-amber-400" />
            No Completed Battles Recorded
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
            Your Victory History Starts Now
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Every tournament match you complete will be archived here with detailed kill logs, official scoreboard standings, winner certificates, and prize earnings.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 max-w-xs mx-auto">
          {onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-[#FF6B00] hover:from-amber-600 hover:to-[#E65100] text-black font-black text-xs uppercase tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Swords className="w-4 h-4 fill-black stroke-none" />
              <span>{primaryActionLabel || "JOIN YOUR FIRST MATCH"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. NOTIFICATIONS MODAL EMPTY STATE (ALL OR FILTERED)
  // =========================================================================
  const isFiltered = type === "notifications_filtered";

  return (
    <div className="bg-gradient-to-b from-[#14161D] to-[#0D0F14] border border-white/10 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden space-y-5 my-auto">
      {/* Ambient Pulsing Radar Backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#FF6B00]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Branded Graphic Illustration: Signal Bell & Cyber Radar Arc */}
      <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
        {/* Animated Sweep Circle */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-2 rounded-full border border-dashed border-[#FF6B00]/30 animate-spin" style={{ animationDuration: "12s" }} />

        {/* Center Bell Shield */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#1E222D] to-[#11131A] border border-[#FF6B00]/30 flex items-center justify-center shadow-lg shadow-[#FF6B00]/10">
          <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-[#FF6B00] stroke-[1.8]" />
        </div>

        {/* Radar Ping Dot */}
        <div className="absolute top-2 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00E676]/15 border border-[#00E676]/30 text-[#00E676] text-[8px] font-mono font-bold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
          Radar Clear
        </div>
      </div>

      {/* Description Content */}
      <div className="space-y-1.5 max-w-sm mx-auto">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono uppercase tracking-wider text-gray-400">
          <ShieldCheck className="w-3 h-3 text-[#00E676]" />
          {isFiltered ? `Filter: ${filterName || "Category"} Empty` : "Inbox Zero • All Caught Up"}
        </div>
        <h4 className="text-base font-black text-white uppercase tracking-tight">
          {isFiltered ? `No ${filterName || "Matching"} Notifications` : "No New Alerts or Messages"}
        </h4>
        <p className="text-xs text-gray-400 leading-relaxed">
          {isFiltered 
            ? `There are no notifications under "${filterName}". Tournament room credentials, UPI wallet status, and admin announcements will populate here as they happen.`
            : "You're completely up to date! Live room passwords, schedule updates, deposit verifications, and prize disbursements will arrive here in real time."
          }
        </p>
      </div>

      {/* Call To Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1 max-w-xs mx-auto">
        {isFiltered && onClearFilter && (
          <button
            onClick={onClearFilter}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>SHOW ALL ALERTS</span>
          </button>
        )}

        {onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#E65100] text-black font-black text-xs uppercase tracking-tight flex items-center justify-center gap-1.5 shadow-md shadow-[#FF6B00]/20 active:scale-95 transition-all"
          >
            <Swords className="w-3.5 h-3.5 fill-black stroke-none" />
            <span>{primaryActionLabel || "EXPLORE MATCHES"}</span>
          </button>
        )}

        {onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0F1115] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#00E676]" />
            <span>{secondaryActionLabel || "CONTACT ADMIN"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
