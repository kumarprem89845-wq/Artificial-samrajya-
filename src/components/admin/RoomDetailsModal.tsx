import React, { useState } from "react";
import { Tournament } from "../../types";
import { X, Key, Send, Trash2, Eye, EyeOff, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface RoomDetailsModalProps {
  tournament: Tournament;
  onClose: () => void;
  onSaveRoom: (roomId: string, roomPassword: string, roomTime: string, publish: boolean) => Promise<void>;
  onClearRoom: () => Promise<void>;
}

export function RoomDetailsModal({ tournament, onClose, onSaveRoom, onClearRoom }: RoomDetailsModalProps) {
  const [roomId, setRoomId] = useState(tournament.room_id || "");
  const [roomPassword, setRoomPassword] = useState(tournament.room_password || "");
  const [roomTime, setRoomTime] = useState(tournament.room_time || tournament.match_time || "");
  const [publish, setPublish] = useState(Boolean(tournament.room_published));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (publishNow?: boolean) => {
    setMsg(null);
    if (!roomId.trim() && !publishNow) {
      setMsg({ type: "error", text: "Room ID is required to save credentials." });
      return;
    }

    try {
      setSaving(true);
      const willPublish = publishNow !== undefined ? publishNow : publish;
      await onSaveRoom(roomId.trim(), roomPassword.trim(), roomTime, willPublish);
      setPublish(willPublish);
      setMsg({ 
        type: "success", 
        text: willPublish 
          ? "Room credentials saved and broadcasted to all registered gamers!" 
          : "Room details saved in draft mode (hidden from players until published)." 
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update room details." });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear room details for this tournament?")) return;
    try {
      setSaving(true);
      await onClearRoom();
      setRoomId("");
      setRoomPassword("");
      setPublish(false);
      setMsg({ type: "success", text: "Room credentials removed." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to clear room." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#1A1D24] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Room Management</h3>
              <p className="text-[10px] text-gray-400 truncate max-w-[240px]">{tournament.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {msg && (
          <div className={`p-3 rounded-2xl text-xs mb-4 ${
            msg.type === "success" 
              ? "bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676]" 
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}>
            {msg.text}
          </div>
        )}

        {/* Room Publish Status Banner */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between mb-4 ${
          publish 
            ? "bg-[#00E676]/10 border-[#00E676]/20 text-[#00E676]" 
            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
        }`}>
          <div className="flex items-center gap-2">
            {publish ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <div>
              <p className="text-xs font-bold uppercase tracking-tight">
                {publish ? "Room Details LIVE" : "Room Hidden (Draft)"}
              </p>
              <p className="text-[10px] opacity-80">
                {publish 
                  ? "Visible to registered participants in their dashboard." 
                  : "Players cannot view credentials until published."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSave(!publish)}
            disabled={saving || !roomId}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all disabled:opacity-40 ${
              publish 
                ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" 
                : "bg-[#00E676] text-black hover:bg-[#00c853]"
            }`}
          >
            {publish ? "Unpublish" : "Publish Now"}
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
              Room ID *
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. 5928104"
              className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
              Room Password
            </label>
            <input
              type="text"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder="e.g. 1234 or leave blank if none"
              className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
              Match / Lobby Start Time
            </label>
            <input
              type="datetime-local"
              value={roomTime}
              onChange={(e) => setRoomTime(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
            />
          </div>

          <div className="p-3 bg-black/20 rounded-2xl border border-white/5 text-[10px] text-gray-400 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-300 font-bold">
              <Send className="w-3 h-3 text-[#FF6B00]" />
              <span>Smart Notification Dispatch</span>
            </div>
            <p>
              When published, an instant in-app notification with Room ID and Password will be sent to all confirmed players of this tournament.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          {tournament.room_id ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs rounded-xl transition-all"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleSave(publish)}
              disabled={saving || !roomId}
              className="px-5 py-2 bg-[#FF6B00] hover:bg-[#E65100] text-black text-xs font-black uppercase rounded-xl tracking-tight transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
