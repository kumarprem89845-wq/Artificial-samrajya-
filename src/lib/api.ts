import { 
  User, Tournament, Participant, Transaction, DepositRequest, WithdrawalRequest, AppSettings 
} from "../types";

const API_BASE = "/api";

export async function request(path: string, method = "GET", body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (credentials: any) => request("/auth/login", "POST", credentials),
  register: (userData: any) => request("/auth/register", "POST", userData),
  getProfile: (userId: string) => request(`/auth/profile/${userId}`),
  updateProfile: (userId: string, data: any) => request(`/auth/profile/${userId}`, "POST", data),

  // Tournaments
  getTournaments: (userId?: string) => request(`/tournaments${userId ? `?user_id=${userId}` : ""}`),
  getTournament: (id: string, userId?: string) => request(`/tournaments/${id}${userId ? `?user_id=${userId}` : ""}`),
  getTournamentById: (id: string, userId?: string) => request(`/tournaments/${id}${userId ? `?user_id=${userId}` : ""}`),
  getLeaderboard: () => request("/leaderboard"),
  joinTournament: (
    registrationOrTournId: string | {
      tournament_id: string;
      user_id: string;
      in_game_name?: string;
      in_game_id?: string;
      team_name?: string;
      teammates?: Array<{ name: string; in_game_id: string }>;
      tournament_type?: string;
    },
    userId?: string,
    extra?: {
      in_game_name?: string;
      in_game_id?: string;
      team_name?: string;
      teammates?: Array<{ name: string; in_game_id: string }>;
      tournament_type?: string;
    }
  ) => {
    let payload: any;
    if (typeof registrationOrTournId === "object") {
      payload = registrationOrTournId;
    } else {
      payload = {
        tournament_id: registrationOrTournId,
        user_id: userId,
        in_game_name: extra?.in_game_name || "ProGamer",
        in_game_id: extra?.in_game_id || "UID-1000",
        ...extra
      };
    }
    return request("/tournaments/join", "POST", payload);
  },
  getUserTournaments: (userId: string) => request(`/user/${userId}/tournaments`),
  getTournamentParticipants: (tournamentId: string) => request(`/tournaments/${tournamentId}/participants`),

  // Matches & Match Roster
  getTournamentMatches: (tournamentId: string) => request(`/tournaments/${tournamentId}/matches`),
  getTournamentScores: (tournamentId: string, matchId?: string) => 
    request(`/tournaments/${tournamentId}/scores${matchId ? `?match_id=${matchId}` : ""}`),

  // Wallet & Withdrawals
  getWallet: (userId: string) => request(`/user/${userId}/wallet`),
  submitDeposit: (depositData: { user_id: string; amount: number; transaction_id: string }) => 
    request("/user/deposit", "POST", depositData),
  submitWithdrawal: (withdrawData: { user_id: string; amount: number }) => 
    request("/user/withdraw", "POST", withdrawData),
  getUserWithdrawals: (userId: string) => request(`/user/${userId}/withdrawals`),
  getAppSettings: () => request("/settings"),

  // In-App Notifications & Push Preferences
  getNotifications: (userId: string) => request(`/user/${userId}/notifications`),
  markNotificationRead: (userId: string, notificationId?: string) => 
    request(`/user/${userId}/notifications/read`, "POST", { notificationId }),
  clearNotifications: (userId: string) => 
    request(`/user/${userId}/notifications/clear`, "POST"),
  deleteNotification: (userId: string, notificationId: string) => 
    request(`/user/${userId}/notifications/${notificationId}`, "DELETE"),
  getNotificationSettings: (userId: string) => 
    request(`/user/${userId}/notification-settings`),
  updateNotificationSettings: (userId: string, settings: any) => 
    request(`/user/${userId}/notification-settings`, "POST", settings),

  // Admin Actions — Tournaments & Status Lifecycle
  getAdminStats: () => request("/admin/stats"),
  createTournament: (data: any) => request("/admin/tournaments", "POST", data),
  updateTournament: (id: string, data: any) => request(`/admin/tournaments/${id}`, "PUT", data),
  updateTournamentStatus: (id: string, status: string) => 
    request(`/admin/tournaments/${id}/status`, "POST", { status }),
  cancelTournament: (id: string, reason?: string) => 
    request(`/admin/tournaments/${id}/cancel`, "POST", { reason }),
  deleteTournament: (id: string) => request(`/admin/tournaments/${id}`, "DELETE"),
  checkTournamentDependencies: (id: string) => 
    request(`/admin/tournaments/${id}/dependency-check`),
  duplicateTournament: (id: string) => 
    request(`/admin/tournaments/${id}/duplicate`, "POST"),

  // Admin Actions — Registrations & Participants
  getAllRegistrations: (tournamentId?: string) => 
    request(`/admin/registrations${tournamentId ? `?tournament_id=${tournamentId}` : ""}`),
  disqualifyParticipant: (tournamentIdOrPartId: string, participantIdOrRefund?: any, reason?: string, refund = true) => {
    let participantId = tournamentIdOrPartId;
    let shouldRefund = refund;
    let reasonText = reason;
    if (typeof participantIdOrRefund === "string") {
      participantId = participantIdOrRefund;
      shouldRefund = refund;
      reasonText = reason;
    } else if (typeof participantIdOrRefund === "boolean") {
      shouldRefund = participantIdOrRefund;
    }
    return request(`/admin/registrations/${participantId}/disqualify`, "POST", { refund: shouldRefund, reason: reasonText });
  },

  // Admin Actions — Room Management
  updateRoomInfo: (id: string, data: any) => request(`/admin/tournaments/${id}/room`, "POST", data),
  publishRoom: (id: string, is_published: boolean) => 
    request(`/admin/tournaments/${id}/room/publish`, "POST", { publish: is_published }),
  deleteRoom: (id: string) => request(`/admin/tournaments/${id}/room`, "DELETE"),

  // Admin Actions — Matches inside Tournament
  createMatch: (tournamentId: string, data: any) => 
    request(`/admin/tournaments/${tournamentId}/matches`, "POST", data),
  createTournamentMatch: (tournamentId: string, data: any) => 
    request(`/admin/tournaments/${tournamentId}/matches`, "POST", data),
  updateMatch: (matchId: string, data: any) => 
    request(`/admin/matches/${matchId}`, "PUT", data),
  updateTournamentMatch: (matchId: string, data: any) => 
    request(`/admin/matches/${matchId}`, "PUT", data),
  deleteMatch: (matchId: string) => 
    request(`/admin/matches/${matchId}`, "DELETE"),
  publishMatchRoom: (matchId: string, is_published: boolean) => 
    request(`/admin/matches/${matchId}/publish-room`, "POST", { publish: is_published }),

  // Admin Actions — Leaderboard & Scoreboard
  addScoreEntry: (tournamentId: string, data: any) => 
    request(`/admin/tournaments/${tournamentId}/scores`, "POST", data),
  recordTournamentScore: (tournamentId: string, data: any) => 
    request(`/admin/tournaments/${tournamentId}/scores`, "POST", data),
  updateScoreEntry: (scoreId: string, data: any) => 
    request(`/admin/scores/${scoreId}`, "PUT", data),
  updateTournamentScore: (scoreId: string, data: any) => 
    request(`/admin/scores/${scoreId}`, "PUT", data),
  deleteScoreEntry: (scoreId: string) => 
    request(`/admin/scores/${scoreId}`, "DELETE"),
  getLeaderboardSettings: (tournamentId: string) => 
    request(`/admin/tournaments/${tournamentId}/leaderboard-settings`),
  updateLeaderboardSettings: (tournamentId: string, data: { is_locked?: boolean; is_published?: boolean }) => 
    request(`/admin/tournaments/${tournamentId}/leaderboard-settings`, "POST", data),
  resetTournamentScores: (tournamentId: string) => 
    request(`/admin/tournaments/${tournamentId}/scores/reset`, "POST"),

  // Admin Actions — Custom Notifications
  sendCustomNotification: (data: {
    target: "all" | "tournament" | "user";
    target_id?: string;
    title: string;
    message: string;
    type?: string;
  }) => request("/admin/notifications/send", "POST", data),
  broadcastNotification: (data: {
    title: string;
    message: string;
    type?: string;
    target_type: "all" | "tournament" | "user";
    tournament_id?: string;
    user_id?: string;
  }) => request("/admin/notifications/send", "POST", {
    target: data.target_type,
    target_id: data.target_type === "tournament" ? data.tournament_id : data.user_id,
    tournament_id: data.tournament_id,
    title: data.title,
    message: data.message,
    type: data.type
  }),
  getNotificationHistory: () => request("/admin/notifications/history"),
  reactToBroadcast: (broadcastId: string, emoji: string) => 
    request(`/broadcasts/${broadcastId}/react`, "POST", { emoji }),
  reactToNotification: (notificationId: string, emoji: string) => 
    request(`/notifications/${notificationId}/react`, "POST", { emoji }),

  // Support Tickets & Help Desk (Gamer & Admin)
  getSupportTickets: (params?: { user_id?: string; status?: string; category?: string; priority?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.user_id) query.append("user_id", params.user_id);
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.category && params.category !== "all") query.append("category", params.category);
    if (params?.priority && params.priority !== "all") query.append("priority", params.priority);
    if (params?.search) query.append("search", params.search);
    const queryString = query.toString();
    return request(`/support/tickets${queryString ? `?${queryString}` : ""}`);
  },
  getSupportTicketById: (ticketId: string) => 
    request(`/support/tickets/${ticketId}`),
  createSupportTicket: (data: { 
    user_id: string; 
    username?: string;
    user_email?: string;
    user_mobile?: string;
    subject?: string; 
    category?: string; 
    message: string; 
    attachment_url?: string; 
    tournament_id?: string; 
  }) => request("/support/tickets", "POST", data),
  replySupportTicket: (ticketId: string, data: { 
    sender_type: "user" | "admin"; 
    sender_id?: string; 
    sender_name?: string; 
    message: string; 
    attachment_url?: string; 
  }) => request(`/support/tickets/${ticketId}/reply`, "POST", data),
  updateSupportTicketStatus: (ticketId: string, data: { 
    status?: string; 
    priority?: string; 
  }) => request(`/support/tickets/${ticketId}/status`, "PATCH", data),
  deleteSupportTicket: (ticketId: string, params?: { user_id?: string; role?: "user" | "admin" }) => {
    const query = new URLSearchParams();
    if (params?.user_id) query.append("user_id", params.user_id);
    if (params?.role) query.append("role", params.role);
    const queryString = query.toString();
    return request(`/support/tickets/${ticketId}${queryString ? `?${queryString}` : ""}`, "DELETE", params);
  },
  deleteSupportMessage: (
    ticketId: string, 
    messageId: string, 
    params?: { user_id?: string; role?: "user" | "admin" }
  ) => {
    const query = new URLSearchParams();
    if (params?.user_id) query.append("user_id", params.user_id);
    if (params?.role) query.append("role", params.role);
    const queryString = query.toString();
    return request(`/support/tickets/${ticketId}/messages/${messageId}${queryString ? `?${queryString}` : ""}`, "DELETE", params);
  },
  clearSupportChat: (ticketId: string, data?: { user_id?: string; role?: "user" | "admin" }) => 
    request(`/support/tickets/${ticketId}/clear`, "POST", data),

  // Declare Winner
  declareWinner: (id: string, winnerId: string) => 
    request(`/admin/tournaments/${id}/declare-winner`, "POST", { winner_id: winnerId }),
  declareTournamentWinner: (id: string, winnerId: string, prize?: number) => 
    request(`/admin/tournaments/${id}/declare-winner`, "POST", { winner_id: winnerId, prize }),

  // Admin Users & Wallet & Overrides
  getAdminUsers: () => request("/admin/users"),
  toggleBlockUser: (id: string) => request(`/admin/users/${id}/toggle-block`, "POST"),
  deleteUser: (id: string) => request(`/admin/users/${id}`, "DELETE"),
  deleteAccount: (id: string) => request(`/auth/profile/${id}`, "DELETE"),
  adjustUserBalance: (id: string, data: { amount: number; description: string }) => 
    request(`/admin/users/${id}/adjust-balance`, "POST", data),
  overrideLeaderboard: (
    id: string, 
    data: { 
      custom_total_winnings?: string | number; 
      custom_tournaments_won?: string | number;
      custom_rank?: string | number;
      reset?: boolean;
    }
  ) => request(`/admin/users/${id}/leaderboard-override`, "POST", data),
  reorderLeaderboard: (ranking_order: string[]) => 
    request("/admin/leaderboard/reorder", "POST", { ranking_order }),
  resetAllLeaderboardOverrides: () => 
    request("/admin/leaderboard/reset-all", "POST"),
  getAdminDeposits: () => request("/admin/deposits"),
  resolveDeposit: (id: string, action: "Approve" | "Reject") => 
    request(`/admin/deposits/${id}/resolve`, "POST", { action }),
  getAdminWithdrawals: () => request("/admin/withdrawals"),
  resolveWithdrawal: (id: string, action: "Approve" | "Reject") => 
    request(`/admin/withdrawals/${id}/resolve`, "POST", { action }),
  updateSettings: (data: any) => request("/admin/settings", "POST", data),

  // Account Recovery & Forgot Password (Gamer & Admin)
  requestPasswordReset: (data: { role: "user" | "admin"; identifier: string }) =>
    request("/auth/forgot-password/request", "POST", data),
  verifyResetOtp: (data: { resetToken: string; otp: string }) =>
    request("/auth/forgot-password/verify-otp", "POST", data),
  resetPassword: (data: { resetToken: string; otp: string; newPassword: string; confirmPassword: string }) =>
    request("/auth/forgot-password/reset", "POST", data),
  emergencyAdminRecovery: (data: { superAdminKey: string; newPassword: string; confirmPassword: string }) =>
    request("/auth/forgot-password/emergency-admin-recovery", "POST", data),
  getSecurityAuditLogs: () => request("/admin/security-audit-logs")
};
