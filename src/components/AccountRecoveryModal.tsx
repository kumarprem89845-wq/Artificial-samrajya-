import React, { useState, useEffect } from "react";
import { 
  KeyRound, ShieldCheck, Mail, Phone, Lock, Eye, EyeOff, 
  ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldAlert,
  Clock, Sparkles, UserCheck, Key
} from "lucide-react";
import { api } from "../lib/api";

interface AccountRecoveryModalProps {
  isOpen: boolean;
  initialRole?: "user" | "admin";
  onClose: () => void;
  onSuccess: (role: "user" | "admin", username?: string) => void;
}

export const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({
  isOpen,
  initialRole = "user",
  onClose,
  onSuccess
}) => {
  const [role, setRole] = useState<"user" | "admin">(initialRole);
  const [step, setStep] = useState<"request" | "verify" | "reset" | "emergency_admin" | "success">("request");
  
  // Step 1: Identifier
  const [identifier, setIdentifier] = useState("");
  
  // Step 2: Verification
  const [resetToken, setResetToken] = useState("");
  const [contactMasked, setContactMasked] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  
  // Step 3: New Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Emergency Root Admin Recovery
  const [superAdminKey, setSuperAdminKey] = useState("");
  
  // General State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Sync role when initialRole changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setStep("request");
      setIdentifier("");
      setOtp("");
      setDevOtp(null);
      setNewPassword("");
      setConfirmPassword("");
      setSuperAdminKey("");
      setError(null);
      setSuccessInfo(null);
    }
  }, [isOpen, initialRole]);

  // Expiration Countdown
  useEffect(() => {
    if (expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresIn]);

  // Resend Cooldown Countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Password validation rules
  const isMinLength = newPassword.length >= 8;
  const hasLettersAndNumbers = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isWeak = [
    "password", "password1", "password123", "12345678", "123456789", 
    "admin123", "samrajya123", "qwertyui"
  ].includes(newPassword.toLowerCase().trim());
  const isPasswordValid = isMinLength && !isWeak;

  // Format seconds into MM:SS
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // STEP 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your registered Email, Mobile Number, or Username.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const res = await api.requestPasswordReset({
        role,
        identifier: identifier.trim()
      });

      if (res.success) {
        setResetToken(res.resetToken || "");
        setContactMasked(res.contact_masked || "registered channel");
        setExpiresIn(res.expires_in_seconds || (role === "admin" ? 300 : 600));
        setResendCooldown(60); // 60s cooldown

        if (res.dev_otp) {
          setDevOtp(res.dev_otp);
        }

        // Move to step 2
        setStep("verify");
        setSuccessInfo(res.message);
      } else {
        setError(res.message || "Unable to initiate password reset. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.requestPasswordReset({
        role,
        identifier: identifier.trim()
      });

      if (res.success) {
        if (res.resetToken) setResetToken(res.resetToken);
        if (res.dev_otp) setDevOtp(res.dev_otp);
        setExpiresIn(res.expires_in_seconds || (role === "admin" ? 300 : 600));
        setResendCooldown(60);
        setSuccessInfo("A new verification code has been generated and dispatched.");
      } else {
        setError(res.message || "Failed to resend code.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyResetOtp({
        resetToken,
        otp: otp.trim()
      });

      if (res.success) {
        setStep("reset");
        setSuccessInfo("Verification code accepted! Set your new password.");
      } else {
        setError(res.message || "Invalid verification code.");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError("Please ensure your password is at least 8 characters long and not easily guessed.");
      return;
    }

    if (!passwordsMatch) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.resetPassword({
        resetToken,
        otp: otp.trim(),
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setStep("success");
      } else {
        setError(res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setError(err?.message || "Error updating password.");
    } finally {
      setLoading(false);
    }
  };

  // EMERGENCY ROOT RECOVERY (Admin Only)
  const handleEmergencyAdminRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!superAdminKey.trim()) {
      setError("Please enter the Emergency Super-Admin Master Key.");
      return;
    }

    if (!isPasswordValid) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!passwordsMatch) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.emergencyAdminRecovery({
        superAdminKey: superAdminKey.trim(),
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setStep("success");
      } else {
        setError(res.message || "Emergency root recovery rejected.");
      }
    } catch (err: any) {
      setError(err?.message || "Emergency recovery failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onClose();
    onSuccess(role, identifier);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        id="account-recovery-modal"
        className="w-full max-w-md bg-[#16181E] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00]">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight text-white uppercase">
              {role === "admin" ? "Admin Security Recovery" : "Account Recovery"}
            </h3>
            <p className="text-[11px] text-gray-400">
              {role === "admin" ? "ARTIFICIAL SAMARAJYA Administrative Security" : "Gamer Password Recovery"}
            </p>
          </div>
        </div>

        {/* Role Switcher Tabs (if in request or emergency step) */}
        {(step === "request" || step === "emergency_admin") && (
          <div className="flex items-center gap-1.5 p-1 bg-[#0D0F14] border border-white/5 rounded-2xl my-4">
            <button
              type="button"
              onClick={() => {
                setRole("user");
                setStep("request");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                role === "user" && step !== "emergency_admin"
                  ? "bg-[#FF6B00] text-black shadow-lg shadow-[#FF6B00]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Gamer Recovery
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("admin");
                setStep("request");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                role === "admin"
                  ? "bg-[#FF6B00] text-black shadow-lg shadow-[#FF6B00]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin Recovery
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-red-400 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Info/Notice Alert */}
        {successInfo && step !== "success" && (
          <div className="mb-4 p-3 bg-[#00E676]/10 border border-[#00E676]/20 rounded-2xl flex items-start gap-2.5 text-xs text-[#00E676] animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0 mt-0.5" />
            <div className="flex-1">{successInfo}</div>
          </div>
        )}

        {/* STEP 1: REQUEST OTP */}
        {step === "request" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                {role === "admin" ? "Admin Email or Mobile" : "Registered Email or Mobile"}
              </label>
              <div className="relative">
                {role === "admin" ? (
                  <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                ) : (
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                )}
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === "admin" ? "admin@artificialsamrajya.com or 7667265813" : "e.g. gamer99@example.com or 9876543210"}
                  className="w-full bg-[#0D0F14] border border-white/10 focus:border-[#FF6B00] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                Enter the email address or phone number linked with your account. A secure 6-digit one-time code will be dispatched.
              </p>
            </div>

            {/* Privacy & Anti-Enumeration Shield notice */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
              <p className="text-[10px] text-gray-400 leading-tight">
                Privacy Protected: Our zero-disclosure security system never exposes account registration status to unauthorized requests.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#ff8533] text-black text-xs font-black uppercase rounded-2xl tracking-wider active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  DISPATCHING CODE...
                </>
              ) : (
                <>
                  SEND VERIFICATION CODE
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Emergency Root Key option for Admin */}
            {role === "admin" && (
              <div className="pt-2 text-center border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setStep("emergency_admin");
                    setError(null);
                    setSuccessInfo(null);
                  }}
                  className="text-xs text-gray-400 hover:text-[#FF6B00] transition-colors flex items-center justify-center gap-1.5 mx-auto font-medium"
                >
                  <Key className="w-3.5 h-3.5" />
                  Lost Recovery Access? Use Emergency Super-Admin Key
                </button>
              </div>
            )}
          </form>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-xs text-gray-300">
                A 6-digit code has been dispatched to:
              </p>
              <p className="text-sm font-bold text-[#FF6B00] mt-0.5">
                {contactMasked}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-gray-400">
                <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Code expires in:</span>
                <span className={`font-mono font-bold ${expiresIn < 60 ? "text-red-400" : "text-[#FF6B00]"}`}>
                  {formatTimer(expiresIn)}
                </span>
              </div>
            </div>

            {/* Test Helper Preview Card (Enables seamless local evaluation) */}
            {devOtp && (
              <div className="p-3 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider block">
                    ⚡ Sandbox Testing Code
                  </span>
                  <span className="text-base font-mono font-black text-white tracking-widest">
                    {devOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(devOtp)}
                  className="px-2.5 py-1.5 bg-[#FF6B00] text-black text-[10px] font-bold rounded-lg uppercase active:scale-95 transition-all"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full bg-[#0D0F14] border border-white/10 focus:border-[#FF6B00] rounded-xl text-center py-3 text-2xl font-mono tracking-widest text-white placeholder-gray-700 outline-none transition-all"
                autoFocus
              />
              <p className="text-[10px] text-gray-500 mt-1 text-center">
                Maximum 3 attempts permitted before session lock.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6 || expiresIn === 0}
              className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#ff8533] text-black text-xs font-black uppercase rounded-2xl tracking-wider active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  VERIFYING CODE...
                </>
              ) : (
                <>
                  VERIFY & PROCEED
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setError(null);
                }}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                ← Change Email/Phone
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="text-xs text-[#FF6B00] hover:text-[#ff8533] font-semibold disabled:text-gray-600 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CREATE NEW PASSWORD */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-[#00E676]/10 border border-[#00E676]/20 rounded-2xl flex items-center gap-2 text-xs text-[#00E676]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Identity confirmed! Please create a strong new password.</span>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#0D0F14] border border-white/10 focus:border-[#FF6B00] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-[#0D0F14] border border-white/10 focus:border-[#FF6B00] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Live Security Checklist */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isMinLength ? "bg-[#00E676] text-black" : "bg-gray-800 text-gray-500"
                }`}>
                  ✓
                </span>
                <span className={isMinLength ? "text-gray-200" : "text-gray-500"}>
                  Minimum 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  !isWeak && newPassword.length > 0 ? "bg-[#00E676] text-black" : "bg-gray-800 text-gray-500"
                }`}>
                  ✓
                </span>
                <span className={!isWeak && newPassword.length > 0 ? "text-gray-200" : "text-gray-500"}>
                  Not a common/weak password
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  passwordsMatch ? "bg-[#00E676] text-black" : "bg-gray-800 text-gray-500"
                }`}>
                  ✓
                </span>
                <span className={passwordsMatch ? "text-[#00E676]" : "text-gray-500"}>
                  {passwordsMatch ? "Passwords match perfectly" : "Passwords must match"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#ff8533] text-black text-xs font-black uppercase rounded-2xl tracking-wider active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  UPDATING PASSWORD...
                </>
              ) : (
                <>
                  SAVE PASSWORD & SECURE ACCOUNT
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* EMERGENCY SUPER-ADMIN RECOVERY (Admin Root Master Key) */}
        {step === "emergency_admin" && (
          <form onSubmit={handleEmergencyAdminRecovery} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold">Authorized Root Recovery</p>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                  Use your secure platform master recovery key to reset admin credentials when secondary communication channels are unreachable.
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Emergency Super-Admin Master Key
                </label>
                <button
                  type="button"
                  onClick={() => setSuperAdminKey("SAMRAJYA-SUPERADMIN-ROOT-KEY-2026")}
                  className="text-[10px] text-[#FF6B00] hover:underline font-semibold"
                >
                  Insert Default Key
                </button>
              </div>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={superAdminKey}
                  onChange={(e) => setSuperAdminKey(e.target.value)}
                  placeholder="SAMRAJYA-SUPERADMIN-ROOT-KEY-2026"
                  className="w-full bg-[#0D0F14] border border-white/10 focus:border-[#FF6B00] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all font-mono"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                New Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#0D0F14] border border-white/10 focus:border-[#FF6B00] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                Confirm New Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new admin password"
                  className="w-full bg-[#0D0F14] border border-white/10 focus:border-[#FF6B00] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !superAdminKey || !isPasswordValid || !passwordsMatch}
              className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#ff8533] text-black text-xs font-black uppercase rounded-2xl tracking-wider active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  AUTHENTICATING ROOT KEY...
                </>
              ) : (
                <>
                  OVERRIDE & UPDATE ADMIN CREDENTIALS
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setError(null);
                }}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                ← Return to standard OTP recovery
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "success" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-[#00E676]/10 border border-[#00E676]/30 rounded-3xl flex items-center justify-center mx-auto text-[#00E676] animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-black text-white uppercase tracking-tight">
                Password Changed Successfully
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-xs mx-auto">
                {role === "admin"
                  ? "Your administrative password has been updated. All prior active sessions have been revoked for your protection."
                  : "Your password has been changed successfully. A security notification has been dispatched to your profile."}
              </p>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-gray-300">
              Please login with your new password to access your account.
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 bg-[#00E676] hover:bg-[#00c864] text-black text-xs font-black uppercase rounded-2xl tracking-wider active:scale-95 transition-all shadow-lg shadow-[#00E676]/20 flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              RETURN TO LOGIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
