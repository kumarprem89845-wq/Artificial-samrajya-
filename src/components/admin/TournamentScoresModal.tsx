import React, { useState, useEffect } from "react";
import { Tournament, TournamentScore, Participant } from "../../types";
import { api } from "../../lib/api";
import { 
  X, Trophy, Medal, Plus, Edit2, Lock, Unlock, Eye, EyeOff, 
  RotateCcw, CheckCircle2, AlertTriangle, Loader2, Save, Trash2, Award
} from "lucide-react";

interface TournamentScoresModalProps {
  tournament: Tournament;
  onClose: () => void;
  onWinnerDeclared?: () => void;
}

export function TournamentScoresModal({ tournament, onClose, onWinnerDeclared }: TournamentScoresModalProps) {
  const [scores, setScores] = useState<TournamentScore[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Leaderboard settings
  const [isLocked, setIsLocked] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Add / Edit Score Form
  const [showForm, setShowForm] = useState(false);
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [inGameId, setInGameId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [rank, setRank] = useState(1);
  const [kills, setKills] = useState(0);
  const [placementPoints, setPlacementPoints] = useState(10);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [scoreOverride, setScoreOverride] = useState("");
  const [savingScore, setSavingScore] = useState(false);

  // Winner Declaration
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerParticipantId, setWinnerParticipantId] = useState("");
  const [winnerPrize, setWinnerPrize] = useState(String(tournament.prize_pool || 0));
  const [declaringWinner, setDeclaringWinner] = useState(false);

  useEffect(() => {
    loadData();
  }, [tournament.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [scoresRes, partRes, setRes] = useState([
        await api.getTournamentScores(tournament.id),
        await api.getTournamentParticipants(tournament.id),
        await api.getLeaderboardSettings(tournament.id)
      ]);

      if (scoresRes.success) setScores(scoresRes.scores || []);
      if (partRes.success) setParticipants(partRes.participants || []);
      if (setRes.success && setRes.settings) {
        setIsLocked(Boolean(setRes.settings.is_locked));
        setIsPublished(Boolean(setRes.settings.is_published));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load scores and leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    try {
      setSettingsLoading(true);
      const newLocked = !isLocked;
      const res = await api.updateLeaderboardSettings(tournament.id, { is_locked: newLocked });
      if (res.success) {
        setIsLocked(newLocked);
        setSuccess(newLocked ? "Scoreboard locked against modifications." : "Scoreboard unlocked for editing.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update leaderboard lock.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setSettingsLoading(true);
      const newPublished = !isPublished;
      const res = await api.updateLeaderboardSettings(tournament.id, { is_published: newPublished });
      if (res.success) {
        setIsPublished(newPublished);
        setSuccess(newPublished 
          ? "Leaderboard published! Participants notified to check standings." 
          : "Leaderboard unpublished (hidden from public view).");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update publish status.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleResetScores = async () => {
    if (!confirm("Are you sure you want to reset all recorded scores for this tournament?")) return;
    try {
      setSettingsLoading(true);
      const res = await api.resetTournamentScores(tournament.id);
      if (res.success) {
        setSuccess("Scoreboard has been reset.");
        await loadData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset scores.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingScoreId(null);
    setSelectedParticipantId("");
    setPlayerName("");
    setInGameId("");
    setTeamName("");
    setRank(scores.length + 1);
    setKills(0);
    setPlacementPoints(scores.length === 0 ? 15 : scores.length === 1 ? 12 : 10);
    setBonusPoints(0);
    setScoreOverride("");
    setShowForm(true);
  };

  const handleSelectParticipant = (pId: string) => {
    setSelectedParticipantId(pId);
    const p = participants.find((item) => item.id === pId);
    if (p) {
      setPlayerName(p.in_game_name);
      setInGameId(p.in_game_id);
      setTeamName(p.team_name || "");
    }
  };

  const handleOpenEdit = (sc: TournamentScore) => {
    setEditingScoreId(sc.id);
    setSelectedParticipantId(sc.participant_id || "");
    setPlayerName(sc.player_name);
    setInGameId(sc.in_game_id);
    setTeamName(sc.team_name || "");
    setRank(sc.rank);
    setKills(sc.kills);
    setPlacementPoints(sc.placement_points);
    setBonusPoints(sc.bonus_points || 0);
    setScoreOverride(sc.manual_override_score !== undefined ? String(sc.manual_override_score) : "");
    setShowForm(true);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Player or Team name is required.");
      return;
    }

    try {
      setSavingScore(true);
      const p = participants.find((item) => item.id === selectedParticipantId);
      const payload = {
        participant_id: selectedParticipantId || undefined,
        user_id: p?.user_id || undefined,
        player_name: playerName.trim(),
        in_game_id: inGameId.trim(),
        team_name: teamName.trim() || undefined,
        rank: Number(rank) || 1,
        kills: Number(kills) || 0,
        placement_points: Number(placementPoints) || 0,
        bonus_points: Number(bonusPoints) || 0,
        manual_override_score: scoreOverride !== "" ? Number(scoreOverride) : undefined
      };

      if (editingScoreId) {
        const res = await api.updateTournamentScore(editingScoreId, payload);
        if (res.success) setSuccess("Score updated.");
      } else {
        const res = await api.recordTournamentScore(tournament.id, payload);
        if (res.success) setSuccess("Score recorded.");
      }

      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save score.");
    } finally {
      setSavingScore(false);
    }
  };

  const handleConfirmWinner = async () => {
    if (!winnerParticipantId) {
      setError("Please select a winning participant.");
      return;
    }

    try {
      setDeclaringWinner(true);
      const res = await api.declareTournamentWinner(
        tournament.id,
        winnerParticipantId,
        Number(winnerPrize) || tournament.prize_pool
      );

      if (res.success) {
        setSuccess("Tournament winner declared and prize credited to gamer wallet!");
        setShowWinnerModal(false);
        if (onWinnerDeclared) onWinnerDeclared();
        await loadData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to declare winner.");
    } finally {
      setDeclaringWinner(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Tournament Leaderboard & Scoring
              </h3>
              <p className="text-[10px] text-gray-400 truncate max-w-[320px]">
                {tournament.title} • Prize: ₹{tournament.prize_pool}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <button
              onClick={handleToggleLock}
              disabled={settingsLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isLocked 
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                  : "bg-white/5 text-gray-300 hover:text-white"
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {isLocked ? "Locked" : "Unlocked"}
            </button>

            <button
              onClick={handleTogglePublish}
              disabled={settingsLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-1.5 transition-all ${
                isPublished 
                  ? "bg-[#00E676] text-black hover:bg-[#00c853]" 
                  : "bg-white/10 text-gray-300 hover:text-white"
              }`}
            >
              {isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {isPublished ? "Published" : "Publish"}
            </button>

            <button
              onClick={() => setShowWinnerModal(true)}
              className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black uppercase rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Award className="w-3.5 h-3.5" />
              Declare Winner
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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

        {/* Toolbar */}
        <div className="mt-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">
              {scores.length} Player Scores Recorded
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetScores}
              disabled={isLocked || settingsLoading || scores.length === 0}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-1 transition-all disabled:opacity-40"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={handleOpenAdd}
              disabled={isLocked}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Score Entry
            </button>
          </div>
        </div>

        {/* Scoreboard Table */}
        <div className="mt-3 overflow-y-auto flex-1 border border-white/5 rounded-2xl bg-black/30">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
              <span className="text-xs font-mono">Loading scoreboard...</span>
            </div>
          ) : scores.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs space-y-2">
              <p>No scores entered yet for this tournament.</p>
              {!isLocked && (
                <button
                  onClick={handleOpenAdd}
                  className="text-[#FF6B00] text-xs font-bold underline"
                >
                  Record First Score
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-black/50 border-b border-white/5 text-[10px] font-mono text-gray-400 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">Player / Team</th>
                  <th className="p-3">UID</th>
                  <th className="p-3 text-center">Kills</th>
                  <th className="p-3 text-center">Place Pts</th>
                  <th className="p-3 text-center">Bonus</th>
                  <th className="p-3 text-center">Override</th>
                  <th className="p-3 text-center font-bold text-[#FF6B00]">Total Pts</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scores.map((sc) => (
                  <tr key={sc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-center font-mono font-bold">
                      {sc.rank === 1 ? (
                        <span className="text-yellow-400 font-black">🥇 1</span>
                      ) : sc.rank === 2 ? (
                        <span className="text-slate-300 font-black">🥈 2</span>
                      ) : sc.rank === 3 ? (
                        <span className="text-amber-600 font-black">🥉 3</span>
                      ) : (
                        <span className="text-gray-400">#{sc.rank}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white tracking-tight">{sc.player_name}</div>
                      {sc.team_name && (
                        <div className="text-[10px] text-gray-400">{sc.team_name}</div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-gray-400">
                      {sc.in_game_id || "•"}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-white">
                      {sc.kills}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-300">
                      {sc.placement_points}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-400">
                      {sc.bonus_points || 0}
                    </td>
                    <td className="p-3 text-center font-mono text-amber-400">
                      {sc.manual_override_score !== undefined ? sc.manual_override_score : "—"}
                    </td>
                    <td className="p-3 text-center font-mono font-black text-sm text-[#FF6B00]">
                      {sc.total_points}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(sc)}
                        disabled={isLocked}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all disabled:opacity-30"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add/Edit Score Submodal */}
        {showForm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <form
              onSubmit={handleSaveScore}
              className="w-full max-w-md bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="text-xs font-black uppercase text-white">
                  {editingScoreId ? "Edit Score Entry" : "Record Match Score"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Participant Selector if available */}
              {participants.length > 0 && !editingScoreId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">
                    Select From Registered Players
                  </label>
                  <select
                    value={selectedParticipantId}
                    onChange={(e) => handleSelectParticipant(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="">-- Choose Registered Gamer --</option>
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.in_game_name} (UID: {p.in_game_id}) {p.team_name ? `[${p.team_name}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Player / IGN *</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="e.g. Mortal"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">In-Game UID</label>
                  <input
                    type="text"
                    value={inGameId}
                    onChange={(e) => setInGameId(e.target.value)}
                    placeholder="e.g. 51829103"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Team Name (Optional)</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Team Soul"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Finish Rank</label>
                  <input
                    type="number"
                    min="1"
                    value={rank}
                    onChange={(e) => setRank(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Kills</label>
                  <input
                    type="number"
                    min="0"
                    value={kills}
                    onChange={(e) => setKills(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Placement Pts</label>
                  <input
                    type="number"
                    min="0"
                    value={placementPoints}
                    onChange={(e) => setPlacementPoints(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Bonus Pts</label>
                  <input
                    type="number"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              {/* Manual Override Score */}
              <div className="space-y-1 bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20">
                <label className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                  Manual Total Score Override (Optional)
                </label>
                <input
                  type="number"
                  value={scoreOverride}
                  onChange={(e) => setScoreOverride(e.target.value)}
                  placeholder="Leave empty for auto-calculated (Kills + Placement + Bonus)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <p className="text-[9px] text-gray-500">
                  When set, overrides the calculated sum and forces this exact total point value.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-white/5 text-gray-400 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScore}
                  className="px-5 py-2 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black uppercase rounded-xl transition-all"
                >
                  {savingScore ? "Saving..." : "Save Score"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Winner Declaration Modal */}
        {showWinnerModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#1A1D24] border border-[#00E676]/30 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-[#00E676]">
                  <Award className="w-5 h-5" />
                  <h4 className="text-sm font-black uppercase">Declare Tournament Winner</h4>
                </div>
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Select Winner (Participant) *
                </label>
                <select
                  value={winnerParticipantId}
                  onChange={(e) => setWinnerParticipantId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                >
                  <option value="">-- Choose Champion --</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.in_game_name} (User: {p.username || "Gamer"} | UID: {p.in_game_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Prize Pool to Credit (₹)
                </label>
                <input
                  type="number"
                  value={winnerPrize}
                  onChange={(e) => setWinnerPrize(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#00E676] font-bold outline-none"
                />
              </div>

              <div className="p-3 bg-[#00E676]/10 border border-[#00E676]/20 rounded-2xl text-[10px] text-gray-300 space-y-1">
                <p className="font-bold text-[#00E676]">Automatic Actions upon confirmation:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-400">
                  <li>Winner wallet will be instantly credited with ₹{winnerPrize}.</li>
                  <li>Tournament status will transition to "Completed".</li>
                  <li>Winner and all participants will receive in-app victory notifications.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowWinnerModal(false)}
                  className="px-4 py-2 bg-white/5 text-gray-400 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWinner}
                  disabled={declaringWinner || !winnerParticipantId}
                  className="px-5 py-2.5 bg-[#00E676] hover:bg-[#00c853] text-black text-xs font-black uppercase rounded-xl transition-all disabled:opacity-40"
                >
                  {declaringWinner ? "Processing..." : "Confirm & Award Prize"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
