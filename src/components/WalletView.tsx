import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Transaction, User, AppSettings, WithdrawalRequest } from "../types";
import { 
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, 
  Loader2, QrCode, Clipboard, AlertCircle, Sparkles, AlertTriangle, Bell, ShieldCheck
} from "lucide-react";
import { WithdrawalQrModal } from "./WithdrawalQrModal";

interface WalletViewProps {
  currentUser: User;
  onBalanceUpdated: (newBalance: number) => void;
  onOpenNotifications?: () => void;
}

export default function WalletView({ currentUser, onBalanceUpdated, onOpenNotifications }: WalletViewProps) {
  const [balance, setBalance] = useState(currentUser.wallet_balance);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawalForQr, setSelectedWithdrawalForQr] = useState<WithdrawalRequest | null>(null);

  // Form Fields
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTxId, setDepositTxId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ 
    type: "success" | "error"; 
    text: string; 
    qrUrl?: string; 
    withdrawal?: WithdrawalRequest 
  } | null>(null);

  useEffect(() => {
    fetchWalletAndSettings();
  }, [currentUser.id]);

  const fetchWalletAndSettings = async () => {
    try {
      setLoading(true);
      const [walletRes, settingsRes, withdrawalsRes] = await Promise.all([
        api.getWallet(currentUser.id),
        api.getAppSettings(),
        api.getUserWithdrawals(currentUser.id).catch(() => ({ success: false, withdrawals: [] }))
      ]);

      if (walletRes.success) {
        setBalance(walletRes.balance);
        setTransactions(walletRes.transactions);
        onBalanceUpdated(walletRes.balance);
      }
      if (settingsRes.success) {
        setSettings(settingsRes.settings);
      }
      if (withdrawalsRes?.success) {
        setUserWithdrawals(withdrawalsRes.withdrawals);
      }
    } catch (e) {
      console.error("Error reading wallet details", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setFormLoading(true);

    try {
      const res = await api.submitDeposit({
        user_id: currentUser.id,
        amount: Number(depositAmount),
        transaction_id: depositTxId
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: "✅ Deposit request submitted successfully! An instant confirmation notification has been sent to your Player ID. Admin will verify and credit your balance within 5-15 mins."
        });
        setDepositAmount("");
        setDepositTxId("");
        // Refresh transaction list
        fetchWalletAndSettings();
        setTimeout(() => {
          setShowDepositModal(false);
        }, 1500);
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to submit deposit request. Double-check details."
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setFormLoading(true);

    try {
      const res = await api.submitWithdrawal({
        user_id: currentUser.id,
        amount: Number(withdrawAmount)
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: `💸 Withdrawal of ₹${withdrawAmount} applied successfully for Player ID #${currentUser.id}! Required payout QR code is auto-generated and queued for Admin verification. Instant notification 🔔 sent to your ID.`,
          qrUrl: res.qr_code_url,
          withdrawal: res.withdrawal
        });
        setWithdrawAmount("");
        
        // Update local and parental balance
        setBalance(res.newBalance);
        onBalanceUpdated(res.newBalance);
        fetchWalletAndSettings();
        setShowWithdrawModal(false);
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to submit withdrawal request."
      });
    } finally {
      setFormLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied UPI ID: " + text);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
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

  return (
    <div className="space-y-6">

      {/* Prominent Balance Card */}
      <div className="relative bg-[#1A1D24] p-6 rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
        {/* Glow behind wallet */}
        <div className="absolute -right-12 -top-12 w-44 h-44 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 bg-white/5 px-3.5 py-1.5 rounded-2xl border border-white/10">
              <Wallet className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-bold">
                Wallet Engine
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="text-[10px] font-mono text-[#FF6B00] bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <Bell className="w-3 h-3" />
                  ALERTS 🔔
                </button>
              )}
              <span className="text-[10px] font-mono text-[#00E676] bg-[#00E676]/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                ₹ INR Account
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-medium">Available Balance</span>
            <div className="text-3xl font-display font-black text-white flex items-baseline gap-1">
              ₹{balance.toLocaleString("en-IN")}
              <span className="text-[10px] font-mono text-[#00E676] font-bold bg-[#00E676]/10 px-2 py-0.5 rounded ml-2 uppercase tracking-wide">
                100% SECURE
              </span>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => {
                setMessage(null);
                setShowDepositModal(true);
              }}
              className="py-3.5 bg-[#FF6B00] text-black font-black uppercase rounded-2xl text-xs tracking-tighter hover:bg-[#E65100] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B00]/10 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              ADD MONEY
            </button>
            <button
              onClick={() => {
                setMessage(null);
                setShowWithdrawModal(true);
              }}
              className="py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-2xl text-xs tracking-tighter uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 text-[#FF6B00]" />
              WITHDRAW
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawal Requests & Auto-Generated QRs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white/90 uppercase tracking-tighter flex items-center gap-2">
            <QrCode className="w-3.5 h-3.5 text-[#FF6B00]" />
            Withdrawal Requests & Payout QRs
          </h3>
          <span className="text-[9px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
            Admin Verified
          </span>
        </div>

        {userWithdrawals.length === 0 ? (
          <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-6 text-center text-gray-500 shadow-xl">
            <ArrowUpRight className="w-8 h-8 mx-auto text-gray-700 mb-1.5" />
            <p className="text-xs font-bold text-gray-400">No Withdrawal Requests</p>
            <p className="text-[10px] text-gray-600 mt-1">
              Apply for a withdrawal to automatically compile a custom payout QR code and track real-time status alerts.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {userWithdrawals.map((w) => (
              <div 
                key={w.id} 
                className="bg-[#1A1D24] border border-white/5 p-4 rounded-3xl space-y-3 shadow-xl hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-mono">₹{w.amount}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        w.status === "Completed"
                          ? "bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30"
                          : w.status === "Rejected"
                          ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 animate-pulse"
                      }`}>
                        {w.status === "Completed" ? "✅ Paid / Approved" : w.status === "Rejected" ? "❌ Rejected & Refunded" : "⏳ Pending Verification"}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Destination: <strong className="text-white">{w.upi_id || currentUser.upi_id}</strong>
                    </p>
                  </div>

                  <span className="text-[9px] font-mono text-gray-500">
                    {formatDate(w.created_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#FF6B00]" />
                    Player ID #{currentUser.id}
                  </span>

                  <button
                    onClick={() => setSelectedWithdrawalForQr({
                      ...w,
                      username: currentUser.username,
                      upi_id: w.upi_id || currentUser.upi_id
                    })}
                    className="px-3 py-1.5 bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    VIEW AUTO-GENERATED QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white/90 uppercase tracking-tighter">
          Account Transactions
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
            <span className="text-xs font-mono">Decoding ledgers...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-6 text-center text-gray-500">
            <Clipboard className="w-8 h-8 mx-auto text-gray-700 mb-1.5" />
            <p className="text-xs font-bold text-gray-400">No transaction logs</p>
            <p className="text-[10px] text-gray-600 mt-1">Deposits, entries and victories will display here.</p>
          </div>
        ) : (
          <div className="bg-[#1A1D24] border border-white/5 rounded-3xl divide-y divide-white/5 overflow-hidden shadow-xl">
            {transactions.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    t.type === "credit" ? "bg-[#00E676]/10 text-[#00E676]" : "bg-red-500/10 text-red-400"
                  }`}>
                    {t.type === "credit" ? <ArrowDownLeft className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white tracking-tight leading-tight">
                      {t.description}
                    </p>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {formatDate(t.created_at)}
                    </span>
                  </div>
                </div>
                <div className={`text-right font-display font-bold text-sm shrink-0 ${
                  t.type === "credit" ? "text-[#00E676]" : "text-red-400"
                }`}>
                  {t.type === "credit" ? "+" : "-"}₹{t.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =======================================================================
          MODAL: ADD MONEY / MANUAL UPI DEPOSIT
          ======================================================================= */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-sm bg-[#1A1D24] border border-white/5 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#FF6B00]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Manual UPI Deposit
                </h3>
              </div>
              <button 
                onClick={() => setShowDepositModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
              >
                ✕
              </button>
            </div>

            {settings ? (
              <div className="space-y-4">
                
                {/* Instructions */}
                <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-xl p-3 text-[11px] text-[#FF6B00] flex items-start gap-2">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>Scan the QR code below or copy the UPI ID to complete the manual transfer, then input your Transaction ID for verification.</span>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3 rounded-2xl max-w-[180px] mx-auto shadow-md">
                  <img 
                    src={settings.qr_code_url} 
                    alt="UPI QR Code" 
                    className="w-full h-auto rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* UPI ID Copy Card */}
                <div className="bg-[#0F1115] p-3 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] text-gray-500 uppercase font-mono block">Admin UPI ID</span>
                    <span className="font-mono text-white font-bold block truncate select-all">{settings.upi_id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.upi_id)}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[#FF6B00] font-bold shrink-0 transition-all flex items-center gap-1 text-[11px] uppercase tracking-tighter"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>

                {/* Feedback block inside modal (Removed) */}

                {/* Submission Form */}
                <form onSubmit={handleDepositSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Amount Deposited (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      max="10000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      UPI Reference Transaction ID (12-Digit)
                    </label>
                    <input
                      type="text"
                      required
                      value={depositTxId}
                      onChange={(e) => setDepositTxId(e.target.value)}
                      placeholder="Enter 12-digit transaction ID"
                      className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                    />
                    <span className="text-[9px] text-gray-500 mt-0.5 block">
                      ⚠️ Crucial: Inputting an incorrect TxID results in immediate rejection.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-3 bg-[#FF6B00] text-black text-xs font-black uppercase rounded-2xl tracking-tighter active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        SUBMITTING DEPOSIT...
                      </>
                    ) : (
                      "SUBMIT DEPOSIT DETAILS"
                    )}
                  </button>
                </form>

              </div>
            ) : (
              <div className="py-6 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
                <span>Loading manual deposit coordinates...</span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: WITHDRAW
          ======================================================================= */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#1A1D24] border border-white/5 rounded-3xl p-5 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-[#FF6B00]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  UPI Withdrawal Request
                </h3>
              </div>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Wallet Info */}
              <div className="bg-[#0F1115] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-400">Your Current Balance</span>
                <span className="text-sm font-bold text-[#00E676]">₹{balance}</span>
              </div>

              {/* Saved UPI coordinates warning/status */}
              {currentUser.upi_id ? (
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1 text-xs">
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Your Saved Destination UPI ID</span>
                  <span className="font-mono text-white font-bold block bg-[#0F1115] px-2.5 py-1.5 border border-white/5 rounded truncate text-center">
                    {currentUser.upi_id}
                  </span>
                  <span className="text-[9px] text-gray-500 mt-1 block text-center">
                    ℹ️ Want to change? Update your UPI ID under the <b>Profile</b> page.
                  </span>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3.5 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">Missing destination UPI ID!</span>
                    Please save your personal UPI ID in your Profile tab before requesting withdrawals.
                  </div>
                </div>
              )}

              {/* Modal feedback alert (Removed) */}

              {/* Submission Form */}
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Amount to Withdraw (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    max={balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Minimum withdrawal ₹100"
                    disabled={!currentUser.upi_id}
                    className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none transition-all"
                  />
                  <span className="text-[9px] text-gray-500 mt-0.5 block">
                    ⚡ Withdrawals are finalized by Admin and sent to your saved UPI address.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={formLoading || !currentUser.upi_id || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > balance}
                  className="w-full py-3 bg-[#FF6B00] text-black text-xs font-black uppercase rounded-2xl tracking-tighter active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      SUBMITTING REQUEST...
                    </>
                  ) : (
                    "SUBMIT WITHDRAWAL REQUEST"
                  )}
                </button>
              </form>

            </div>

          </div>
        </div>
      )}


      {/* Feedback Modal */}
      {message && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1A1D24] border border-white/5 rounded-3xl p-6 shadow-2xl relative text-center">
            {message.type === "success" ? (
              <div className="w-12 h-12 bg-[#00E676]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00E676]/20">
                <span className="text-xl">✅</span>
              </div>
            ) : (
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <span className="text-xl">⚠️</span>
              </div>
            )}
            
            <h3 className={`text-sm font-black tracking-tighter uppercase mb-2 ${message.type === "success" ? "text-[#00E676]" : "text-red-500"}`}>
              {message.type === "success" ? "SUCCESS" : "ERROR"}
            </h3>
            
            <p className="text-xs text-gray-400 mb-6">
              {message.text}
            </p>
            
            <div className="space-y-2">
              {message.withdrawal && (
                <button
                  type="button"
                  onClick={() => {
                    const wth = message.withdrawal;
                    setMessage(null);
                    setSelectedWithdrawalForQr(wth || null);
                  }}
                  className="w-full py-3 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black rounded-2xl transition-all uppercase tracking-tighter flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B00]/20"
                >
                  <QrCode className="w-4 h-4" />
                  VIEW AUTO-GENERATED QR
                </button>
              )}

              <button
                onClick={() => setMessage(null)}
                className="w-full py-3 bg-[#0F1115] border border-white/10 hover:bg-white/5 text-white text-xs font-bold rounded-2xl transition-all uppercase tracking-tighter"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Generated Withdrawal QR Modal */}
      {selectedWithdrawalForQr && (
        <WithdrawalQrModal
          withdrawal={{
            ...selectedWithdrawalForQr,
            username: currentUser.username,
            upi_id: selectedWithdrawalForQr.upi_id || currentUser.upi_id
          }}
          isOpen={true}
          onClose={() => setSelectedWithdrawalForQr(null)}
        />
      )}
    </div>
  );
}
