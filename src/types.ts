export interface NotificationPreferences {
  match_start: boolean;
  tournament_results: boolean;
  room_credentials: boolean;
  schedule_updates: boolean;
  wallet_payouts: boolean;
  admin_announcements: boolean;
  push_enabled?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  mobile_number?: string;
  wallet_balance: number;
  upi_id?: string;
  is_blocked?: boolean;
  custom_total_winnings?: number;
  custom_tournaments_won?: number;
  custom_rank?: number;
  notification_settings?: NotificationPreferences;
}

export interface Admin {
  id: string;
  username: string;
  mobile?: string;
  email?: string;
}

export interface SecurityAuditLog {
  id: string;
  event: string;
  role: "user" | "admin";
  target_identifier: string;
  success: boolean;
  message: string;
  timestamp: string;
  ip?: string;
}

export type TournamentType = 'Solo' | 'Duo' | 'Squad';
export type TournamentStatus = 'Draft' | 'Upcoming' | 'Registration Open' | 'Registration Closed' | 'Live' | 'Completed' | 'Cancelled';
export type MatchStatus = 'Upcoming' | 'Live' | 'Completed';

export interface Tournament {
  id: string;
  title: string;
  game_name: string;
  tournament_type: TournamentType;
  entry_fee: number;
  prize_pool: number;
  max_players: number;
  match_time: string; // Tournament Date & Time
  registration_start_time?: string;
  registration_end_time?: string;
  room_time?: string; // Match/Room Start Time
  map_mode?: string; // Map/Mode e.g. Erangel TPP, Bermuda
  rules?: string; // Tournament Rules
  description?: string;
  banner_url?: string;
  commission_percentage?: number;
  room_id?: string;
  room_password?: string;
  room_published?: boolean;
  room_publish_time?: string;
  status: TournamentStatus;
  winner_id?: string;
  created_at: string;

  // Hydrated / computed helpers
  registered_count?: number;
  is_user_registered?: boolean;
  user_registration_id?: string;
  user_participant?: Participant;
  is_room_visible?: boolean;
}

export interface TeammateInfo {
  name: string;
  in_game_id: string;
}

export interface Participant {
  id: string;
  registration_id: string; // e.g. "REG-BGMI-7482"
  user_id: string;
  tournament_id: string;
  username?: string; // Hydrated username from user profile
  in_game_name: string; // In-game nickname / IGN
  in_game_id: string; // In-game player ID / UID
  team_name?: string;
  teammates?: TeammateInfo[];
  tournament_type: TournamentType;
  status: 'Confirmed' | 'Disqualified' | 'Refunded';
  slot_number?: number;
  entry_fee_paid?: number;
  created_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  match_number: number;
  title: string; // e.g. "Match #1 - Erangel TPP", "Grand Finals"
  map_mode?: string;
  match_time: string;
  scheduled_time?: string;
  room_id?: string;
  room_password?: string;
  room_published?: boolean;
  room_publish_time?: string;
  status: MatchStatus;
  notes?: string;
  created_at: string;
}

export interface TournamentScoreEntry {
  id: string;
  tournament_id: string;
  match_id?: string;
  user_id?: string;
  participant_id?: string;
  team_name: string;
  player_name: string;
  in_game_id?: string;
  rank: number;
  placement_points: number;
  kills: number;
  kill_points: number;
  bonus_points: number;
  manual_score_override?: number;
  manual_override_score?: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export type TournamentScore = TournamentScoreEntry;

export interface TournamentLeaderboardSettings {
  tournament_id: string;
  is_locked: boolean;
  is_published: boolean;
  last_updated: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

export interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  transaction_id: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  created_at: string;
  username?: string; // Hydrated helper
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Rejected';
  created_at: string;
  username?: string; // Hydrated helper
  upi_id?: string; // Hydrated helper
  qr_code_url?: string; // Auto-generated UPI QR code for payout
  processed_at?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 
    | 'withdrawal_applied' 
    | 'withdrawal_approved' 
    | 'withdrawal_rejected' 
    | 'deposit_approved' 
    | 'deposit_rejected' 
    | 'tournament_joined' 
    | 'tournament_update' 
    | 'tournament_live' 
    | 'tournament_result' 
    | 'room_published' 
    | 'match_scheduled' 
    | 'leaderboard_updated' 
    | 'tournament_cancelled' 
    | 'admin_announcement' 
    | 'direct_message' 
    | 'wallet_adjustment' 
    | 'support_reply'
    | 'support_resolved'
    | 'support_ticket'
    | 'support_status'
    | 'security_alert'
    | 'system';
  reference_id?: string;
  ticket_id?: string;
  ticket_code?: string;
  tournament_id?: string;
  tournament_title?: string;
  sender?: string; // "Admin" or "System"
  action_label?: string;
  action_tab?: string; // e.g. 'tournaments' | 'wallet' | 'support'
  broadcast_id?: string;
  amount?: number;
  qr_code_url?: string;
  status?: string;
  is_read: boolean;
  created_at: string;
  reactions?: Record<string, number>;
  user_reaction?: string;
}

export type SupportCategory = 
  | "Tournament" 
  | "Registration" 
  | "Match" 
  | "Room ID / Password" 
  | "Payment" 
  | "Withdrawal" 
  | "Account" 
  | "Other";

export type SupportStatus = "Open" | "In Progress" | "Replied" | "Resolved";
export type SupportPriority = "Low" | "Normal" | "High" | "Urgent";

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: "user" | "admin";
  sender_id: string;
  sender_name: string;
  message: string;
  attachment_url?: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_code: string; // e.g. #A10245
  user_id: string;
  username: string;
  user_email?: string;
  user_mobile?: string;
  subject: string;
  category: SupportCategory;
  tournament_id?: string;
  tournament_title?: string;
  status: SupportStatus;
  priority: SupportPriority;
  attachment_url?: string;
  messages: SupportMessage[];
  last_message?: string;
  last_reply_by: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  target: 'all' | 'tournament' | 'user';
  target_id?: string;
  target_name?: string;
  tournament_id?: string;
  tournament_title?: string;
  sender: string;
  created_at: string;
  recipients_count: number;
  recipient_user_ids: string[];
  read_count?: number;
  unread_count?: number;
  reactions?: Record<string, number>;
}

export interface TournamentDependencyStats {
  tournament_id: string;
  title: string;
  game_name: string;
  status: TournamentStatus;
  registered_count: number;
  total_entry_fees: number;
  matches_count: number;
  scores_count: number;
  has_room: boolean;
  has_results: boolean;
  can_safe_delete: boolean;
}

export interface AppSettings {
  upi_id: string;
  qr_code_url: string;
  admin_mobile: string;
  admin_username?: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  email?: string;
  total_winnings: number;
  tournaments_won: number;
  wallet_balance: number;
  custom_rank?: number;
  custom_total_winnings?: number;
  custom_tournaments_won?: number;
  has_override?: boolean;
  raw_winnings?: number;
  raw_wins?: number;
}
