import React, { useState } from "react";
import { QrCode, CheckCircle2, Clock, XCircle, Copy, ExternalLink, ShieldCheck, User } from "lucide-react";
import { WithdrawalRequest } from "../types";

interface WithdrawalQrModalProps {
  withdrawal: WithdrawalRequest & { username?: string; upi_id?: string };
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const WithdrawalQrModal: React.FC<WithdrawalQrModalProps> = ({
  withdrawal,
  isOpen,
  onClose,
  isAdmin = false,
  onApprove,
  onReject
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !withdrawal) return null;

  const upiId = withdrawal.upi_id || "N/A";
  const username = withdrawal.username || "Gamer";
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(username)}&am=${withdrawal.amount}&cu=INR`;
  const qrUrl = withdrawal.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;

  const handleCopyUpi = () => {
    if (upiId && upiId !== "N/A") {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    switch (withdrawal.status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PAYMENT PROCESSED / APPROVED
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            REJECTED & REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            ADMIN VERIFICATION PENDING
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00]">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono tracking-widest text-[#FF6B00] uppercase font-bold">
                Auto-Generated Payout QR
              </span>
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              Withdrawal Payout Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status Pill */}
        <div className="flex justify-center">
          {getStatusBadge()}
        </div>

        {/* QR Code Frame */}
        <div className="flex flex-col items-center justify-center p-5 bg-[#0F1115] border border-white/10 rounded-2xl space-y-3 shadow-inner">
          <div className="p-3 bg-white rounded-2xl shadow-xl">
            <img
              src={qrUrl}
              alt="Auto-Generated Withdrawal QR"
              className="w-48 h-48 object-contain rounded-lg"
              loading="lazy"
            />
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              ₹{withdrawal.amount}
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              Auto-Compiled UPI Payment Intent QR
            </p>
          </div>
        </div>

        {/* Gamer & Payout Metadata */}
        <div className="space-y-2.5 bg-[#121418] border border-white/5 p-4 rounded-2xl text-xs font-mono">
          <div className="flex items-center justify-between text-gray-400">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-500" />
              Player ID:
            </span>
            <span className="text-white font-bold">#{withdrawal.user_id}</span>
          </div>

          <div className="flex items-center justify-between text-gray-400">
            <span>Gamer Name:</span>
            <span className="text-white font-bold">{username}</span>
          </div>

          <div className="flex items-center justify-between text-gray-400 pt-1 border-t border-white/5">
            <span>Destination UPI:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#FF6B00] font-bold select-all">{upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Copy UPI ID"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          {copied && (
            <p className="text-[10px] text-[#00E676] text-right font-sans">UPI ID copied to clipboard!</p>
          )}

          <div className="flex items-center justify-between text-gray-400 pt-1 border-t border-white/5">
            <span>Request ID:</span>
            <span className="text-gray-300 font-mono text-[10px]">{withdrawal.id}</span>
          </div>

          <div className="flex items-center justify-between text-gray-400">
            <span>Submitted At:</span>
            <span className="text-gray-300 text-[10px]">
              {new Date(withdrawal.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Security & Notification Notice */}
        <div className="p-3.5 bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-2xl flex items-start gap-3 text-[11px] text-gray-300">
          <ShieldCheck className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-[#FF6B00] uppercase text-[10px] tracking-wide">
              Smart Notification & Verification
            </p>
            <p className="text-gray-400 leading-relaxed text-[10px]">
              Every status change (Applied, Approved, Rejected) instantly alerts Player ID <strong className="text-white">#{withdrawal.user_id}</strong> via the in-app notification center 🔔.
            </p>
          </div>
        </div>

        {/* Admin Action Buttons if opened by Admin */}
        {isAdmin && withdrawal.status === "Pending" && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                if (onApprove) onApprove(withdrawal.id);
                onClose();
              }}
              className="py-3 bg-[#00E676] hover:bg-[#00C853] text-black font-black uppercase rounded-2xl text-xs tracking-tight transition-transform active:scale-95 shadow-lg shadow-[#00E676]/20"
            >
              APPROVE & MARK PAID
            </button>
            <button
              onClick={() => {
                if (onReject) onReject(withdrawal.id);
                onClose();
              }}
              className="py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold uppercase rounded-2xl text-xs tracking-tight transition-transform active:scale-95"
            >
              REJECT & REFUND
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#0F1115] hover:bg-white/5 border border-white/10 text-white font-bold rounded-2xl text-xs uppercase tracking-tight transition-colors"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
