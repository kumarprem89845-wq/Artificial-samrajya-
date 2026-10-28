import React, { useState } from "react";
import { api } from "../lib/api";
import { Shield, User, Mail, Lock, Gamepad2, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import { AccountRecoveryModal } from "./AccountRecoveryModal";

interface LoginViewProps {
  onLoginSuccess: (user: any, role: "user" | "admin") => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Account Recovery Modal State
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryRole, setRecoveryRole] = useState<"user" | "admin">("user");

  // Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (activeTab === "login" || isAdminMode) {
        // Login Request
        const res = await api.login({
          username,
          password,
          isAdmin: isAdminMode
        });
        if (res.success) {
          setSuccess("Login successful!");
          setTimeout(() => {
            onLoginSuccess(res.user, res.role);
          }, 600);
        }
      } else {
        // Registration Request
        const res = await api.register({
          username,
          email,
          password
        });
        if (res.success) {
          setSuccess("Account registered successfully! Logging you in...");
          setTimeout(() => {
            onLoginSuccess(res.user, "user");
          }, 800);
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-[#1A1D24] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#FF6B00]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00E676]/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/10 rounded-2xl mb-3">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tighter uppercase">
            ARTIFICIAL SAMARAJYA
          </h1>
          <p className="text-[10px] text-[#FF6B00] font-mono tracking-widest uppercase font-bold mt-1">
            eSPORTS TOURNAMENT ARENA
          </p>
        </div>

        {/* Role Toggle Switcher */}
        <div className="flex bg-[#0F1115] p-1 rounded-2xl mb-6 border border-white/5">
          <button
            onClick={() => {
              setIsAdminMode(false);
              setActiveTab("login");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              !isAdminMode 
                ? "bg-[#FF6B00] text-black shadow-md font-black uppercase tracking-tighter" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            Gamer Panel
          </button>
          <button
            onClick={() => {
              setIsAdminMode(true);
              setActiveTab("login");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              isAdminMode 
                ? "bg-[#FF6B00] text-black shadow-md font-black uppercase tracking-tighter" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Panel
          </button>
        </div>

        {/* Tabs for Login / Sign Up (Only for Gamers) */}
        {!isAdminMode && (
          <div className="flex border-b border-white/5 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 pb-3 text-xs uppercase font-bold tracking-wider transition-all relative ${
                activeTab === "login" 
                  ? "text-[#FF6B00]" 
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Sign In
              {activeTab === "login" && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B00]" 
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 pb-3 text-xs uppercase font-bold tracking-wider transition-all relative ${
                activeTab === "signup" 
                  ? "text-[#FF6B00]" 
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Sign Up
              {activeTab === "signup" && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B00]" 
                />
              )}
            </button>
          </div>
        )}

        {/* Info label for Admin */}
        {isAdminMode && (
          <div className="bg-[#0F1115] p-3 rounded-2xl border border-white/5 mb-6 flex items-start gap-2.5">
            <Shield className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400">
              <span className="font-bold text-white block">Authorized Access Only</span>
              Enter administrator coordinates to orchestrate tournaments.
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>
          </div>

          {!isAdminMode && activeTab === "signup" && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Password
              </label>
              {(activeTab === "login" || isAdminMode) && (
                <button
                  type="button"
                  id="forgot-password-button"
                  onClick={() => {
                    setRecoveryRole(isAdminMode ? "admin" : "user");
                    setIsRecoveryOpen(true);
                  }}
                  className="text-xs text-[#FF6B00] hover:text-[#ff8533] font-bold hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0F1115] border border-white/5 focus:border-[#FF6B00]/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#ff8533] text-black text-xs font-black uppercase rounded-2xl tracking-tighter active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-lg shadow-[#FF6B00]/10 cursor-pointer"
          >
            {loading ? "AUTHENTICATING..." : activeTab === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        </form>
      </div>

      {/* Feedback Modal */}
      {(error || success) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1A1D24] border border-white/5 rounded-3xl p-6 shadow-2xl relative text-center">
            {success ? (
              <div className="w-12 h-12 bg-[#00E676]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00E676]/20">
                <span className="text-xl">✅</span>
              </div>
            ) : (
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <span className="text-xl">⚠️</span>
              </div>
            )}
            
            <h3 className={`text-sm font-black tracking-tighter uppercase mb-2 ${success ? "text-[#00E676]" : "text-red-500"}`}>
              {success ? "SUCCESS" : "ERROR"}
            </h3>
            
            <p className="text-xs text-gray-400 mb-6">
              {success || error}
            </p>
            
            <button
              onClick={() => { setError(""); setSuccess(""); }}
              className="w-full py-3 bg-[#0F1115] border border-white/10 hover:bg-white/5 text-white text-xs font-bold rounded-2xl transition-all uppercase tracking-tighter"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Account Recovery Modal */}
      <AccountRecoveryModal
        isOpen={isRecoveryOpen}
        initialRole={recoveryRole}
        onClose={() => setIsRecoveryOpen(false)}
        onSuccess={(role, identifier) => {
          setIsRecoveryOpen(false);
          setSuccess("Password changed successfully! Please login with your new credentials.");
          if (role === "admin") {
            setIsAdminMode(true);
            setUsername("admin");
          } else if (identifier && !identifier.includes("@") && !/^\d+$/.test(identifier)) {
            setUsername(identifier);
          }
          setPassword("");
        }}
      />
    </div>
  );
}
