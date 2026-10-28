import React, { useState } from "react";
import { Tournament, TournamentType, TournamentStatus } from "../../types";
import { X, Calendar, Trophy, Gamepad2, Shield, DollarSign, Users, Clock, MapPin, Image, FileText, CheckCircle2 } from "lucide-react";

interface TournamentFormModalProps {
  initialTournament?: Tournament | null;
  onClose: () => void;
  onSave: (data: Partial<Tournament>) => Promise<void>;
}

export function TournamentFormModal({ initialTournament, onClose, onSave }: TournamentFormModalProps) {
  const isEditing = Boolean(initialTournament);

  const [title, setTitle] = useState(initialTournament?.title || "");
  const [gameName, setGameName] = useState(initialTournament?.game_name || "Battlegrounds Mobile India");
  const [tournamentType, setTournamentType] = useState<TournamentType>(initialTournament?.tournament_type || "Solo");
  const [entryFee, setEntryFee] = useState(initialTournament?.entry_fee !== undefined ? String(initialTournament.entry_fee) : "50");
  const [prizePool, setPrizePool] = useState(initialTournament?.prize_pool !== undefined ? String(initialTournament.prize_pool) : "1000");
  const [maxPlayers, setMaxPlayers] = useState(initialTournament?.max_players !== undefined ? String(initialTournament.max_players) : "100");
  const [matchTime, setMatchTime] = useState(initialTournament?.match_time || "");
  const [regStartTime, setRegStartTime] = useState(initialTournament?.registration_start_time || "");
  const [regEndTime, setRegEndTime] = useState(initialTournament?.registration_end_time || "");
  const [roomTime, setRoomTime] = useState(initialTournament?.room_time || "");
  const [mapMode, setMapMode] = useState(initialTournament?.map_mode || "Erangel / TPP");
  const [rules, setRules] = useState(
    initialTournament?.rules || 
    "1. Emulators & hacks are strictly forbidden.\n2. In-game name must match your registration ID.\n3. Room ID & Password will be released 15 minutes before the match start time."
  );
  const [description, setDescription] = useState(
    initialTournament?.description || 
    "Official competitive tournament by Artificial Samrajya eSports. Play fair, survive to the end, and claim the cash prize!"
  );
  const [bannerUrl, setBannerUrl] = useState(
    initialTournament?.banner_url || 
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80"
  );
  const [status, setStatus] = useState<TournamentStatus>(initialTournament?.status || "Upcoming");
  const [commissionPct, setCommissionPct] = useState(
    initialTournament?.commission_percentage !== undefined ? String(initialTournament.commission_percentage) : "20"
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Tournament Name is required.");
      return;
    }
    if (!gameName.trim()) {
      setError("Game Name is required.");
      return;
    }
    if (!matchTime) {
      setError("Tournament Date & Match Time is required.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        title: title.trim(),
        game_name: gameName.trim(),
        tournament_type: tournamentType,
        entry_fee: Number(entryFee) || 0,
        prize_pool: Number(prizePool) || 0,
        max_players: Number(maxPlayers) || 100,
        match_time: matchTime,
        registration_start_time: regStartTime || undefined,
        registration_end_time: regEndTime || undefined,
        room_time: roomTime || undefined,
        map_mode: mapMode.trim(),
        rules: rules.trim(),
        description: description.trim(),
        banner_url: bannerUrl.trim(),
        status,
        commission_percentage: Number(commissionPct) || 20
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save tournament.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="text-sm font-black text-white uppercase tracking-tight">
              {isEditing ? "Edit Tournament Details" : "Create New Tournament"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl">
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 pt-4 pr-1 flex-1">
          {/* Tournament Name & Game Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Tournament Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. BGMI Squad War Season 4"
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Game Name *
              </label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="e.g. Battlegrounds Mobile India"
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Type, Format, Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Tournament Type
              </label>
              <select
                value={tournamentType}
                onChange={(e) => setTournamentType(e.target.value as TournamentType)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              >
                <option value="Solo">Solo (1v1)</option>
                <option value="Duo">Duo (2v2)</option>
                <option value="Squad">Squad (4v4)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Max Players / Slots
              </label>
              <input
                type="number"
                min="2"
                max="100"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Tournament Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              >
                <option value="Draft">Draft</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Registration Open">Registration Open</option>
                <option value="Registration Closed">Registration Closed</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Entry Fee, Prize Pool, Commission */}
          <div className="grid grid-cols-3 gap-3 bg-black/20 p-3 rounded-2xl border border-white/5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Prize Pool (₹)
              </label>
              <input
                type="number"
                min="0"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2 text-xs text-[#00E676] font-bold outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Commission %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Timings: Match Time, Reg Start, Reg End, Room Time */}
          <div className="space-y-2 bg-black/20 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] font-mono text-[#FF6B00] uppercase tracking-wider font-bold block flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Schedules & Deadlines
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Tournament Date & Match Time *
                </label>
                <input
                  type="datetime-local"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Room Opening / Start Time
                </label>
                <input
                  type="datetime-local"
                  value={roomTime}
                  onChange={(e) => setRoomTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Registration Start Time
                </label>
                <input
                  type="datetime-local"
                  value={regStartTime}
                  onChange={(e) => setRegStartTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Registration Deadline (End Time)
                </label>
                <input
                  type="datetime-local"
                  value={regEndTime}
                  onChange={(e) => setRegEndTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Map / Mode & Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Map / Game Mode
              </label>
              <input
                type="text"
                value={mapMode}
                onChange={(e) => setMapMode(e.target.value)}
                placeholder="e.g. Erangel / TPP, Bermuda, Crash"
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Banner / Poster URL
              </label>
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
              Tournament Rules
            </label>
            <textarea
              rows={3}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Enter competitive guidelines, prohibited weapons, etc."
              className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none resize-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
              Description / Overview
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about the battle event"
              className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none resize-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-gray-400 hover:text-white bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black uppercase rounded-xl tracking-tight transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? "Saving..." : isEditing ? "Update Tournament" : "Create Tournament"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
