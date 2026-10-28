import React, { useState } from "react";
import { Tournament, User, TeammateInfo } from "../types";
import { api } from "../lib/api";
import { 
  X, Trophy, Shield, Wallet, Users, AlertCircle, CheckCircle2, 
  Loader2, Copy, Check, Clock, Gamepad2, ArrowRight, Share2, Sparkles
} from "lucide-react";
import { ShareTournamentModal } from "./ShareTournamentModal";

interface RegistrationModalProps {
  tournament: Tournament;
  currentUser: User;
  onClose: () => void;
  onSuccess: (newBalance?: number) => void;
  onNavigateToWallet?: () => void;
}

export function RegistrationModal({ 
  tournament, 
  currentUser, 
  onClose, 
  onSuccess,
  onNavigateToWallet 
}: RegistrationModalProps) {
  const isDuo = tournament.tournament_type === "Duo";
  const isSquad = tournament.tournament_type === "Squad";
  const entryFee = tournament.entry_fee || 0;
  const userBalance = currentUser.wallet_balance || 0;
  const hasSufficientBalance = userBalance >= entryFee;

  // Form Fields
  const [inGameName, setInGameName] = useState(currentUser.username || "");
  const [inGameId, setInGameId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teammates, setTeammates] = useState<TeammateInfo[]>(
    isDuo ? [{ name: "", in_game_id: "" }] : isSquad ? [
      { name: "", in_game_id: "" },
      { name: "", in_game_id: "" },
      { name: "", in_game_id: "" }
    ] : []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeredData, setRegisteredData] = useState<{
    registration_id: string;
    slot_number: number;
    newBalance: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleTeammateChange = (index: number, field: keyof TeammateInfo, value: string) => {
    const updated = [...teammates];
    updated[index] = { ...updated[index], [field]: value };
    setTeammates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!inGameName.trim()) {
      setError("Please provide your In-Game Name (IGN).");
      return;
    }
    if (!inGameId.trim()) {
      setError("Please provide your In-Game Player ID (UID).");
      return;
    }
    if ((isDuo || isSquad) && !teamName.trim()) {
      setError("Please provide your Team Name.");
      return;
    }

    if (isDuo || isSquad) {
      for (let i = 0; i < teammates.length; i++) {
        if (!teammates[i].name.trim() || !teammates[i].in_game_id.trim()) {
          setError(`Please provide Name and UID for Teammate #${i + 1}.`);
          return;
        }
      }
    }

    if (!hasSufficientBalance) {
      setError(`Insufficient wallet balance. You need ₹${entryFee - userBalance} more to join.`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.joinTournament({
        tournament_id: tournament.id,
        user_id: currentUser.id,
        in_game_name: inGameName.trim(),
        in_game_id: inGameId.trim(),
        team_name: (isDuo || isSquad) ? teamName.trim() : undefined,
        teammates: (isDuo || isSquad) ? teammates : undefined,
        tournament_type: tournament.tournament_type
      });

      if (res.success) {
        setRegisteredData({
          registration_id: res.registration_id || res.participant?.registration_id || "REG-CONFIRMED",
          slot_number: res.slot_number || res.participant?.slot_number || 1,
          newBalance: res.newBalance !== undefined ? res.newBalance : userBalance - entryFee
        });
        onSuccess(res.newBalance);
      }
    } catch (err: any) {
      setError(err.message || "Failed to register for tournament.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRegId = () => {
    if (!registeredData) return;
    navigator.clipboard.writeText(registeredData.registration_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                {registeredData ? "Registration Confirmed" : "Tournament Registration"}
              </h3>
              <p className="text-[10px] text-gray-400 truncate max-w-[260px]">
                {tournament.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#FF6B00] flex items-center gap-1.5 transition-all text-xs font-bold border border-white/5"
              title="Share Tournament Link"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span className="text-[10px] font-mono">SHARE</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {registeredData ? (
          /* Success Screen */
          <div className="pt-6 pb-2 text-center space-y-4 flex-1 overflow-y-auto">
            <div className="w-14 h-14 bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-white uppercase tracking-tight">
                You're In the Battle!
              </h4>
              <p className="text-xs text-gray-400">
                Your entry has been locked and slot confirmed.
              </p>
            </div>

            {/* Registration Pass Card */}
            <div className="bg-black/40 border border-[#FF6B00]/30 rounded-2xl p-4 text-left space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF6B00]/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Registration Pass</span>
                <span className="text-[10px] font-mono bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-2 py-0.5 rounded font-bold">
                  Slot #{registeredData.slot_number}
                </span>
              </div>

              <div className="flex items-center justify-between bg-[#1A1D24] p-3 rounded-xl border border-white/5">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block font-mono">Registration ID</span>
                  <span className="text-sm font-mono font-black text-white">{registeredData.registration_id}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRegId}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block">In-Game Name</span>
                  <span className="text-white font-bold">{inGameName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block">UID</span>
                  <span className="font-mono text-white font-bold">{inGameId}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1D24] p-3 rounded-2xl border border-white/5 text-[11px] text-gray-400 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Next Steps:</span>
              </div>
              <p>
                Room ID and Password credentials will be published in your <strong>"My Matches"</strong> dashboard 15 minutes before the match start time.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="w-full py-3.5 bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] hover:from-[#E65100] hover:to-[#FF6B00] text-black text-xs font-black uppercase rounded-2xl tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20 active:scale-[0.98] transition-all"
              >
                <Share2 className="w-4 h-4 fill-black stroke-none" />
                <span>INVITE SQUAD / SHARE MATCH LINK</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold uppercase rounded-2xl tracking-tight transition-all"
              >
                Done & Return to Arena
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="pt-4 space-y-4 overflow-y-auto flex-1 pr-1">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl">
                {error}
              </div>
            )}

            {/* Tournament Quick Spec */}
            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-[#FF6B00] font-bold uppercase tracking-wider block">
                  {tournament.game_name} • {tournament.tournament_type}
                </span>
                <h4 className="text-xs font-black text-white mt-0.5">{tournament.title}</h4>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gray-500 uppercase font-mono block">Entry Fee</span>
                <span className="text-sm font-black text-white">₹{entryFee}</span>
              </div>
            </div>

            {/* Wallet Check Card */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              hasSufficientBalance 
                ? "bg-[#00E676]/5 border-[#00E676]/20" 
                : "bg-red-500/10 border-red-500/20"
            }`}>
              <div className="flex items-center gap-2.5">
                <Wallet className={`w-4 h-4 ${hasSufficientBalance ? "text-[#00E676]" : "text-red-400"}`} />
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Your Wallet Balance</span>
                  <span className="text-xs font-black text-white">₹{userBalance.toFixed(2)}</span>
                </div>
              </div>

              {!hasSufficientBalance && onNavigateToWallet && (
                <button
                  type="button"
                  onClick={onNavigateToWallet}
                  className="px-3 py-1 bg-[#FF6B00] hover:bg-[#E65100] text-black text-[10px] font-black uppercase rounded-lg transition-all"
                >
                  Deposit +
                </button>
              )}
            </div>

            {/* Primary Gamer Credentials */}
            <div className="space-y-3 bg-black/20 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block">
                {isDuo || isSquad ? "Team Leader / Player 1 Details" : "Gamer Credentials"}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    In-Game Name (IGN) *
                  </label>
                  <input
                    type="text"
                    value={inGameName}
                    onChange={(e) => setInGameName(e.target.value)}
                    placeholder="e.g. DynamoGaming"
                    className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    In-Game Player ID (UID) *
                  </label>
                  <input
                    type="text"
                    value={inGameId}
                    onChange={(e) => setInGameId(e.target.value)}
                    placeholder="e.g. 518392019"
                    className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-gray-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Team Details (Duo or Squad) */}
            {(isDuo || isSquad) && (
              <div className="space-y-3 bg-black/20 p-3.5 rounded-2xl border border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Team Immortal"
                    className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block">
                    Teammate Roster ({teammates.length} Members)
                  </span>

                  {teammates.map((tm, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-mono text-gray-500 uppercase">Teammate #{idx + 2} IGN</label>
                        <input
                          type="text"
                          value={tm.name}
                          onChange={(e) => handleTeammateChange(idx, "name", e.target.value)}
                          placeholder="IGN"
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-mono text-gray-500 uppercase">UID</label>
                        <input
                          type="text"
                          value={tm.in_game_id}
                          onChange={(e) => handleTeammateChange(idx, "in_game_id", e.target.value)}
                          placeholder="Player ID"
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules Acceptance Notice */}
            <p className="text-[10px] text-gray-500 text-center">
              By proceeding, you agree to fair competitive play and the entry fee of ₹{entryFee} will be deducted from your wallet.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !hasSufficientBalance}
                className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black uppercase rounded-xl tracking-tight transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>Pay ₹{entryFee} & Join</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {showShareModal && (
        <ShareTournamentModal
          tournament={tournament}
          currentUser={currentUser}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
