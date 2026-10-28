import React, { useState, useEffect } from "react";
import { Tournament, TournamentDependencyStats } from "../../types";
import { api } from "../../lib/api";
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  Ban, 
  Users, 
  Coins, 
  Gamepad2, 
  Trophy, 
  Key, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";

interface SafeDeleteTournamentModalProps {
  tournament: Tournament;
  onClose: () => void;
  onDeleted: () => void;
  onCancelled: () => void;
}

export function SafeDeleteTournamentModal({
  tournament,
  onClose,
  onDeleted,
  onCancelled
}: SafeDeleteTournamentModalProps) {
  const [stats, setStats] = useState<TournamentDependencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showPermanentConfirm, setShowPermanentConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDependencyStats();
  }, [tournament.id]);

  const fetchDependencyStats = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.checkTournamentDependencies(tournament.id);
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze tournament dependencies.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    try {
      setDeleting(true);
      setError("");
      const res = await api.deleteTournament(tournament.id);
      if (res.success) {
        setSuccess(res.message || "Tournament deleted permanently.");
        setTimeout(() => {
          onDeleted();
        }, 900);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete tournament.");
      setDeleting(false);
    }
  };

  const handleCancelTournament = async () => {
    try {
      setCancelling(true);
      setError("");
      const res = await api.cancelTournament(tournament.id, cancelReason || "Tournament cancelled by administration");
      if (res.success) {
        setSuccess(res.message || "Tournament cancelled and players refunded successfully.");
        setTimeout(() => {
          onCancelled();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "Failed to cancel tournament.");
      setCancelling(false);
    }
  };

  const hasDependencies = stats 
    ? (stats.registered_count > 0 || stats.matches_count > 0 || stats.scores_count > 0)
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Tournament Deletion & Safety Check
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                {tournament.title} <span className="font-mono text-[10px] text-gray-500">({tournament.game_name})</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={deleting || cancelling}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
            <span className="text-xs font-mono">Analyzing database dependencies & records...</span>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Dependency Audit Cards */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider block">
                Record Audit Status
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-2.5 text-center">
                  <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Registered</span>
                  <span className="text-xs font-black text-white">
                    {stats?.registered_count || 0} Players
                  </span>
                </div>
                <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-2.5 text-center">
                  <Coins className="w-4 h-4 text-[#00E676] mx-auto mb-1" />
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Entry Fees</span>
                  <span className="text-xs font-black text-[#00E676]">
                    ₹{stats?.total_entry_fees || 0}
                  </span>
                </div>
                <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-2.5 text-center">
                  <Gamepad2 className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Matches</span>
                  <span className="text-xs font-black text-white">
                    {stats?.matches_count || 0}
                  </span>
                </div>
                <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-2.5 text-center">
                  <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Score Logs</span>
                  <span className="text-xs font-black text-white">
                    {stats?.scores_count || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Branching: Has Active Dependencies vs Clean Tournament */}
            {hasDependencies ? (
              <div className="space-y-4">
                
                {/* Warning Card */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Important Records Found</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    This tournament has <strong>{stats?.registered_count} registered player(s)</strong> and <strong>₹{stats?.total_entry_fees} in entry fees</strong> collected. 
                    Deleting this tournament directly will permanently delete match logs and registration entries.
                  </p>
                </div>

                <div className="text-xs font-mono text-gray-400 uppercase tracking-wider pt-1">
                  Choose Recommended Action:
                </div>

                {/* Option 1: Cancel Tournament (Recommended) */}
                <div className="p-4 bg-[#0F1115] border border-white/10 hover:border-[#FF6B00]/40 rounded-2xl space-y-3 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#FF6B00]/20 text-[#FF6B00] text-[9px] font-mono font-bold rounded-md uppercase">
                          Choice 1 (Recommended)
                        </span>
                        <h4 className="text-sm font-bold text-white">Cancel Tournament & Refund</h4>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Closes tournament registrations, preserves audit records, and <strong>automatically refunds 100% of entry fees</strong> directly into each registered gamer's wallet balance with in-app refund alerts.
                      </p>
                    </div>
                    <Ban className="w-6 h-6 text-[#FF6B00] shrink-0" />
                  </div>

                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Optional reason (e.g. Schedule conflict, server maintenance)..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                  />

                  <button
                    onClick={handleCancelTournament}
                    disabled={cancelling || deleting}
                    className="w-full py-2.5 px-4 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black uppercase rounded-xl tracking-tight transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Cancelling & Refunding Players...
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        Cancel Tournament & Refund All Players
                      </>
                    )}
                  </button>
                </div>

                {/* Option 2: Permanent Delete */}
                <div className="p-4 bg-[#0F1115] border border-red-500/20 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-mono font-bold rounded-md uppercase">
                          Choice 2 (High Risk)
                        </span>
                        <h4 className="text-sm font-bold text-white">Permanent Delete</h4>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Permanently purge this tournament from the platform. Associated matches, roster slots, and scores will be deleted. Gamer accounts and other tournaments remain safe.
                      </p>
                    </div>
                    <Trash2 className="w-6 h-6 text-red-400 shrink-0" />
                  </div>

                  {!showPermanentConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowPermanentConfirm(true)}
                      className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>I understand, proceed to Permanent Delete</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-red-500/20">
                      <p className="text-xs text-red-400 font-bold">
                        Are you sure you want to permanently delete this tournament? This action cannot be undone.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPermanentConfirm(false)}
                          disabled={deleting}
                          className="py-2 text-xs rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all font-bold"
                        >
                          Keep Safe
                        </button>
                        <button
                          type="button"
                          onClick={handlePermanentDelete}
                          disabled={deleting}
                          className="py-2 text-xs rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-tight transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Tournament
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* Clean Tournament (No registered players or records) */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No active dependencies found (0 registered players, 0 matches). Clean permanent deletion is safe.</span>
                </div>

                <div className="p-4 bg-[#0F1115] border border-white/5 rounded-2xl space-y-2">
                  <p className="text-xs text-gray-300">
                    Are you sure you want to permanently delete this tournament? This action cannot be undone.
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Tournament ID: {tournament.id}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={deleting}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePermanentDelete}
                    disabled={deleting}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl tracking-tight transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-lg shadow-red-600/20"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Tournament
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
