import React, { useState } from "react";
import { Tournament, User } from "../types";
import { 
  X, Share2, Copy, Check, MessageSquare, Send, 
  Twitter, Trophy, Gamepad2, Clock, Users, Sparkles,
  ExternalLink, Coins, ShieldCheck, QrCode
} from "lucide-react";

interface ShareTournamentModalProps {
  tournament: Tournament;
  currentUser?: User;
  onClose: () => void;
}

export function ShareTournamentModal({
  tournament,
  currentUser,
  onClose
}: ShareTournamentModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFullMessage, setCopiedFullMessage] = useState(false);
  const [nativeShareSuccess, setNativeShareSuccess] = useState(false);

  // Generate clean deep-link preview URL
  const getPreviewUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tournament", tournament.id);
      if (currentUser?.username) {
        url.searchParams.set("ref", currentUser.username);
      }
      return url.toString();
    } catch {
      return `${window.location.origin}/?tournament=${tournament.id}`;
    }
  };

  const previewUrl = getPreviewUrl();

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString("en-IN", {
        weekday: "short",
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

  const formattedTime = formatDate(tournament.match_time);

  // Formatted invitation text
  const shareTitle = `🎮 Battle in ${tournament.title}!`;
  const shareText = [
    `🔥 *${tournament.title}* (${tournament.game_name})`,
    `🏆 Prize Pool: ₹${tournament.prize_pool}`,
    `🎟️ Entry Fee: ${tournament.entry_fee ? `₹${tournament.entry_fee}` : "FREE"}`,
    `⚔️ Format: ${tournament.tournament_type || "Solo"} • Map: ${tournament.map_mode || "Battle Royale"}`,
    `⏰ Match Time: ${formattedTime}`,
    currentUser?.username ? `👤 Invited by: ${currentUser.username}` : "",
    `\n👉 Click to join my tournament lobby & claim your slot:`
  ].filter(Boolean).join("\n");

  const fullShareContent = `${shareText}\n${previewUrl}`;

  // 1. Web Share API invocation
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: previewUrl
        });
        setNativeShareSuccess(true);
        setTimeout(() => setNativeShareSuccess(false), 3000);
      } catch (err: any) {
        // Ignore AbortError if user closes share sheet
        if (err.name !== "AbortError") {
          console.error("Web Share failed, fallback to copy", err);
          handleCopyLink();
        }
      }
    } else {
      // Fallback: Copy link
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyFullMessage = () => {
    navigator.clipboard.writeText(fullShareContent);
    setCopiedFullMessage(true);
    setTimeout(() => setCopiedFullMessage(false), 2500);
  };

  // Direct Social Share URLs
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareContent)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(previewUrl)}&text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(previewUrl)}`;

  const hasNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#0F1115] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Gradient Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF6B00] via-[#00E676] to-[#FF6B00]" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-[#16181F]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#FF6B00]">
                  INVITE SQUAD & FRIENDS
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight line-clamp-1">
                Share Match Lobby
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Tournament Preview Card (What friends see) */}
          <div className="bg-gradient-to-br from-[#1A1D24] to-[#12141A] border border-[#FF6B00]/25 rounded-2xl p-3.5 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 text-[9px] font-mono font-bold uppercase">
                    {tournament.game_name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-[9px] font-mono font-bold uppercase">
                    {tournament.tournament_type || "Solo"}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white leading-snug mt-1">
                  {tournament.title}
                </h4>
              </div>

              <div className="text-right shrink-0 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
                <span className="text-[8px] font-mono uppercase text-gray-400 block">Prize Pool</span>
                <span className="text-xs font-black text-[#00E676]">₹{tournament.prize_pool}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300 font-mono bg-black/30 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#FF6B00] shrink-0" />
                <span className="truncate">{formattedTime}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Coins className="w-3 h-3 text-[#00E676] shrink-0" />
                <span>Entry: {tournament.entry_fee ? `₹${tournament.entry_fee}` : "FREE"}</span>
              </div>
            </div>

            {currentUser?.username && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <Sparkles className="w-3 h-3 text-[#00E676]" />
                <span>Invited by <strong className="text-white">@{currentUser.username}</strong></span>
              </div>
            )}
          </div>

          {/* Native Web Share Primary CTA */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] hover:from-[#E65100] hover:to-[#FF6B00] text-black font-black text-xs uppercase tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20 active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4 fill-black stroke-none" />
              <span>{nativeShareSuccess ? "INVITE SENT VIA SHARE SHEET!" : "INVITE VIA WEB SHARE"}</span>
            </button>
          )}

          {/* Social Quick Share Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
              Direct Social Share
            </span>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-bold text-[11px] uppercase flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>WhatsApp</span>
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-2 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-[#0088cc] font-bold text-[11px] uppercase flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Send className="w-4 h-4 fill-current" />
                <span>Telegram</span>
              </a>

              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-2 rounded-xl bg-[#1DA1F2]/15 hover:bg-[#1DA1F2]/25 border border-[#1DA1F2]/30 text-[#1DA1F2] font-bold text-[11px] uppercase flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Twitter className="w-4 h-4 fill-current" />
                <span>X (Twitter)</span>
              </a>
            </div>
          </div>

          {/* Copy Preview Link Input Bar */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
              Match Preview Deep-Link
            </span>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-1.5 pl-3">
              <input
                type="text"
                readOnly
                value={previewUrl}
                className="bg-transparent text-xs text-gray-300 font-mono flex-1 outline-none truncate select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xs uppercase flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-md shadow-[#00E676]/20"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY LINK</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Copy Full Message Option */}
          <button
            onClick={handleCopyFullMessage}
            className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] font-bold uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            {copiedFullMessage ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00E676]" />
                <span className="text-[#00E676]">FULL INVITE TEXT COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy Full Match Invite Message (For Discord / Groups)</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-gray-500 text-center leading-relaxed">
            Anyone opening this link will be directed straight to this tournament lobby to view match rules and register.
          </p>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-white/5 bg-[#16181F]/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
