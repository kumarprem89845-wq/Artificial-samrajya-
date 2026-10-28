import React, { useState, useEffect } from "react";
import { Tournament, Participant } from "../../types";
import { api } from "../../lib/api";
import { X, Users, Search, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle, Loader2, UserX } from "lucide-react";

interface RegistrationsModalProps {
  tournament: Tournament;
  onClose: () => void;
}

export function RegistrationsModal({ tournament, onClose }: RegistrationsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Disqualification state
  const [disqualifyingParticipant, setDisqualifyingParticipant] = useState<Participant | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("Violation of tournament rules");
  const [refundFee, setRefundFee] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, [tournament.id]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.getTournamentParticipants(tournament.id);
      if (res.success) {
        setParticipants(res.participants || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load participants.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDisqualify = async () => {
    if (!disqualifyingParticipant) return;
    try {
      setActionLoading(true);
      const res = await api.disqualifyParticipant(
        tournament.id,
        disqualifyingParticipant.id,
        disqualifyReason,
        refundFee
      );
      if (res.success) {
        setSuccess(`Player ${disqualifyingParticipant.in_game_name} disqualified.`);
        setDisqualifyingParticipant(null);
        await loadParticipants();
      }
    } catch (err: any) {
      setError(err.message || "Failed to disqualify participant.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.in_game_name && p.in_game_name.toLowerCase().includes(q)) ||
      (p.in_game_id && p.in_game_id.toLowerCase().includes(q)) ||
      (p.registration_id && p.registration_id.toLowerCase().includes(q)) ||
      (p.team_name && p.team_name.toLowerCase().includes(q)) ||
      (p.username && p.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Registrations & Player Roster
              </h3>
              <p className="text-[10px] text-gray-400">
                {tournament.title} • {participants.length} / {tournament.max_players} Slots Filled
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl shrink-0">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 p-3 bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] text-xs rounded-2xl shrink-0">
            {success}
          </div>
        )}

        {/* Search Bar */}
        <div className="mt-4 shrink-0 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by In-Game Name, UID, Registration ID, or Team..."
            className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
        </div>

        {/* Participants Table / List */}
        <div className="mt-4 overflow-y-auto flex-1 pr-1 space-y-2.5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
              <span className="text-xs font-mono">Loading participants...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No registered participants found.
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="bg-black/30 border border-white/5 hover:border-white/10 rounded-2xl p-3.5 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                {/* Left slot & credentials */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-[#FF6B00] shrink-0">
                    #{p.slot_number || "•"}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white tracking-tight">
                        {p.in_game_name}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        UID: {p.in_game_id}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        p.status === "Confirmed" 
                          ? "bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20" 
                          : p.status === "Disqualified"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>User: <strong className="text-gray-300 font-normal">{p.username || "Gamer"}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-[#FF6B00] font-bold">{p.registration_id}</span>
                      {p.entry_fee_paid !== undefined && (
                        <>
                          <span>•</span>
                          <span>Fee: ₹{p.entry_fee_paid}</span>
                        </>
                      )}
                    </div>

                    {/* Team & Teammates if present */}
                    {p.team_name && (
                      <div className="mt-1 pt-1 text-[11px] text-gray-300 border-t border-white/5">
                        <span className="text-gray-500 uppercase font-mono text-[9px] mr-1">Team:</span>
                        <strong className="text-white font-bold">{p.team_name}</strong>
                        {p.teammates && p.teammates.length > 0 && (
                          <span className="text-gray-400 ml-2">
                            ({p.teammates.map((tm) => `${tm.name} [${tm.in_game_id}]`).join(", ")})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {p.status === "Confirmed" && (
                    <button
                      type="button"
                      onClick={() => setDisqualifyingParticipant(p)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs rounded-xl border border-red-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Disqualify
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Disqualification Confirmation Modal */}
        {disqualifyingParticipant && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-sm bg-[#1A1D24] border border-red-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <ShieldAlert className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase">Disqualify Participant</h4>
              </div>

              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-xs space-y-1">
                <p className="text-white font-bold">{disqualifyingParticipant.in_game_name}</p>
                <p className="text-gray-400 font-mono text-[10px]">ID: {disqualifyingParticipant.registration_id}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Disqualification Reason
                </label>
                <input
                  type="text"
                  value={disqualifyReason}
                  onChange={(e) => setDisqualifyReason(e.target.value)}
                  placeholder="e.g. Unfair gameplay or emulator usage"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={refundFee}
                  onChange={(e) => setRefundFee(e.target.checked)}
                  className="accent-[#FF6B00] rounded"
                />
                <span>Refund entry fee (₹{disqualifyingParticipant.entry_fee_paid || tournament.entry_fee}) to gamer wallet</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setDisqualifyingParticipant(null)}
                  className="px-4 py-2 bg-white/5 text-gray-400 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDisqualify}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase rounded-xl transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Confirm Disqualify"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
