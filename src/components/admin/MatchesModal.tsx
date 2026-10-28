import React, { useState, useEffect } from "react";
import { Tournament, TournamentMatch } from "../../types";
import { api } from "../../lib/api";
import { X, Gamepad2, Plus, Clock, Key, Eye, EyeOff, Edit, Trash2, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface MatchesModalProps {
  tournament: Tournament;
  onClose: () => void;
}

export function MatchesModal({ tournament, onClose }: MatchesModalProps) {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create / Edit Match form state
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);
  const [matchNumber, setMatchNumber] = useState(1);
  const [title, setTitle] = useState("Match #1 - Erangel");
  const [mapMode, setMapMode] = useState(tournament.map_mode || "Erangel / TPP");
  const [scheduledTime, setScheduledTime] = useState(tournament.match_time || "");
  const [roomId, setRoomId] = useState(tournament.room_id || "");
  const [roomPassword, setRoomPassword] = useState(tournament.room_password || "");
  const [roomPublished, setRoomPublished] = useState(Boolean(tournament.room_published));
  const [status, setStatus] = useState<"Scheduled" | "Live" | "Completed" | "Cancelled">("Scheduled");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [tournament.id]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.getTournamentMatches(tournament.id);
      if (res.success) {
        setMatches(res.matches || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load tournament matches.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMatch(null);
    setMatchNumber(matches.length + 1);
    setTitle(`Match #${matches.length + 1} - ${tournament.map_mode || "Erangel"}`);
    setMapMode(tournament.map_mode || "Erangel / TPP");
    setScheduledTime(tournament.match_time || "");
    setRoomId("");
    setRoomPassword("");
    setRoomPublished(false);
    setStatus("Scheduled");
    setNotes("");
    setShowForm(true);
  };

  const handleOpenEdit = (m: TournamentMatch) => {
    setEditingMatch(m);
    setMatchNumber(m.match_number);
    setTitle(m.title);
    setMapMode(m.map_mode || "");
    setScheduledTime(m.scheduled_time || "");
    setRoomId(m.room_id || "");
    setRoomPassword(m.room_password || "");
    setRoomPublished(Boolean(m.room_published));
    setStatus(m.status);
    setNotes(m.notes || "");
    setShowForm(true);
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);
      if (editingMatch) {
        const res = await api.updateTournamentMatch(editingMatch.id, {
          match_number: matchNumber,
          title: title.trim(),
          map_mode: mapMode.trim(),
          scheduled_time: scheduledTime,
          room_id: roomId.trim(),
          room_password: roomPassword.trim(),
          room_published: roomPublished,
          status,
          notes: notes.trim()
        });
        if (res.success) {
          setSuccess("Match updated successfully.");
        }
      } else {
        const res = await api.createTournamentMatch(tournament.id, {
          match_number: matchNumber,
          title: title.trim(),
          map_mode: mapMode.trim(),
          scheduled_time: scheduledTime,
          room_id: roomId.trim(),
          room_password: roomPassword.trim(),
          room_published: roomPublished,
          status,
          notes: notes.trim()
        });
        if (res.success) {
          setSuccess("New match added successfully.");
        }
      }
      setShowForm(false);
      await loadMatches();
    } catch (err: any) {
      setError(err.message || "Failed to save match.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Match Operations & Schedule
              </h3>
              <p className="text-[10px] text-gray-400 truncate max-w-[300px]">
                {tournament.title} • {matches.length} Matches Scheduled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black uppercase rounded-xl flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Match
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
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

        {/* List of Matches */}
        <div className="mt-4 overflow-y-auto flex-1 space-y-3 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
              <span className="text-xs font-mono">Loading matches...</span>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs space-y-2">
              <p>No matches created for this tournament yet.</p>
              <button
                onClick={handleOpenAdd}
                className="text-[#FF6B00] text-xs font-bold underline"
              >
                Create First Match
              </button>
            </div>
          ) : (
            matches.map((m) => (
              <div
                key={m.id}
                className="bg-black/30 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-white/5 text-[#FF6B00] font-bold px-2 py-0.5 rounded border border-white/5">
                        #{m.match_number}
                      </span>
                      <h4 className="text-xs font-black text-white">{m.title}</h4>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        m.status === "Live"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : m.status === "Completed"
                          ? "bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Map: <strong className="text-gray-300 font-normal">{m.map_mode || "N/A"}</strong> • Time: <strong className="text-gray-300 font-normal">{m.scheduled_time ? new Date(m.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD"}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Credentials badge */}
                <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase">Room ID</span>
                      <span className="text-white font-bold">{m.room_id || "Not Set"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase">Pass</span>
                      <span className="text-white font-bold">{m.room_password || "None"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    {m.room_published ? (
                      <span className="text-[#00E676] flex items-center gap-1 font-bold">
                        <Eye className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create / Edit Form Modal Sub-layer */}
        {showForm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <form
              onSubmit={handleSaveMatch}
              className="w-full max-w-md bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-3.5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="text-xs font-black uppercase text-white">
                  {editingMatch ? "Edit Match" : "Add Match to Schedule"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Match #</label>
                  <input
                    type="number"
                    min="1"
                    value={matchNumber}
                    onChange={(e) => setMatchNumber(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Match #1 - Erangel"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Map / Mode</label>
                  <input
                    type="text"
                    value={mapMode}
                    onChange={(e) => setMapMode(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Match Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Room ID</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="e.g. 518392"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Password</label>
                  <input
                    type="text"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roomPublished}
                  onChange={(e) => setRoomPublished(e.target.checked)}
                  className="accent-[#FF6B00] rounded"
                />
                <span>Publish room credentials to players</span>
              </label>

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
                  disabled={saving}
                  className="px-5 py-2 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black uppercase rounded-xl transition-all"
                >
                  {saving ? "Saving..." : "Save Match"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
