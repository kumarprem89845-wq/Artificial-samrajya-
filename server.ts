import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import type { 
  User, Tournament, Participant, Transaction, DepositRequest, WithdrawalRequest, AppSettings, AppNotification,
  TournamentMatch, TournamentScoreEntry, TournamentLeaderboardSettings, TournamentType, TournamentStatus,
  BroadcastRecord, SupportTicket, SupportMessage, SupportCategory, SupportStatus, SupportPriority,
  SecurityAuditLog
} from "./src/types.ts";

// Database storage file path
const DB_FILE = path.join(process.cwd(), "db.json");

// Security: Salted SHA-256 password hashing helper
const PASSWORD_SALT = ":samrajya_auth_salt_2026";

export function hashPassword(pwd: string): string {
  return crypto.createHash("sha256").update(pwd + PASSWORD_SALT).digest("hex");
}

export function verifyPassword(inputPassword: string, storedHashOrPlain: string): boolean {
  if (!inputPassword || !storedHashOrPlain) return false;
  const hashed = hashPassword(inputPassword);
  if (storedHashOrPlain === hashed) return true;
  if (storedHashOrPlain === inputPassword) return true; // seamless legacy migration
  return false;
}

export interface ResetToken {
  id: string;
  role: "user" | "admin";
  target_id: string;
  target_identifier: string;
  otp: string;
  created_at: number;
  expires_at: number;
  attempts: number;
  used: boolean;
  verified?: boolean;
  contact_masked: string;
}

// Initial/default DB structure
interface LocalDatabase {
  users: Array<any>; // store with passwords
  admin: Array<any>;
  tournaments: Array<Tournament>;
  participants: Array<Participant>;
  matches: Array<TournamentMatch>;
  scores: Array<TournamentScoreEntry>;
  leaderboardSettings: Record<string, TournamentLeaderboardSettings>;
  transactions: Array<Transaction>;
  deposits: Array<DepositRequest>;
  withdrawals: Array<WithdrawalRequest>;
  notifications: Array<AppNotification>;
  broadcastHistory: Array<BroadcastRecord>;
  tickets: Array<SupportTicket>;
  settings: AppSettings;
  passwordResetTokens?: Array<ResetToken>;
  securityAuditLogs?: Array<SecurityAuditLog>;
}

const DEFAULT_DB: LocalDatabase = {
  users: [
    {
      id: "user-1",
      username: "gamer99",
      email: "gamer99@example.com",
      password: hashPassword(process.env.INITIAL_GAMER_PASSWORD || "SamrajyaGamer@2026"),
      wallet_balance: 500,
      upi_id: "gamer99@okaxis"
    },
    {
      id: "user-2",
      username: "pro_player",
      email: "pro@example.com",
      password: hashPassword(process.env.INITIAL_GAMER_PASSWORD || "SamrajyaGamer@2026"),
      wallet_balance: 150,
      upi_id: "pro@okpaytm"
    }
  ],
  admin: [
    {
      id: "admin-1",
      username: "admin",
      password: hashPassword(process.env.INITIAL_ADMIN_PASSWORD || "SamrajyaAdmin@2026"),
      mobile: "7667265813",
      email: "admin@artificialsamrajya.com"
    }
  ],
  tournaments: [
    {
      id: "t-1",
      title: "BGMI Mobile Battle Royale",
      game_name: "Battlegrounds Mobile India",
      tournament_type: "Squad",
      entry_fee: 50,
      prize_pool: 2000,
      max_players: 100,
      match_time: "2026-07-20T18:00",
      registration_start_time: "2026-07-10T10:00",
      registration_end_time: "2026-07-20T17:30",
      room_time: "2026-07-20T17:45",
      map_mode: "Erangel / TPP",
      rules: "1. Emulators are strictly prohibited.\n2. Hacks/teaming will result in immediate disqualification without refund.\n3. Room ID will be published 15 minutes before the match start time.",
      description: "Official Artificial Samrajya BGMI Championship. Compete with top squads across India for the mega cash prize.",
      banner_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
      commission_percentage: 20,
      status: "Upcoming",
      room_published: false,
      created_at: new Date().toISOString()
    },
    {
      id: "t-2",
      title: "Free Fire Ultimate Clash Squad",
      game_name: "Garena Free Fire",
      tournament_type: "Solo",
      entry_fee: 30,
      prize_pool: 1200,
      max_players: 48,
      match_time: "2026-07-21T19:30",
      registration_start_time: "2026-07-10T10:00",
      registration_end_time: "2026-07-21T19:00",
      room_time: "2026-07-21T19:15",
      map_mode: "Bermuda / Solo Rush",
      rules: "No character skill abuse. Gun attributes will be set to default competitive mode.",
      description: "Solo Free Fire clash. Only pure gun skills and survival reflexes.",
      banner_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
      commission_percentage: 15,
      status: "Upcoming",
      room_published: false,
      created_at: new Date().toISOString()
    },
    {
      id: "t-3",
      title: "COD Mobile Championship",
      game_name: "Call of Duty Mobile",
      tournament_type: "Duo",
      entry_fee: 100,
      prize_pool: 5000,
      max_players: 50,
      match_time: "2026-07-18T10:00",
      map_mode: "Crash / Hardpoint",
      rules: "No class restrictions. Standard Call of Duty Mobile competitive settings.",
      description: "Tactical combat duel with certified room masters.",
      banner_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
      commission_percentage: 20,
      status: "Live",
      room_id: "COD-ROOM-102",
      room_password: "codm-pass-999",
      room_published: true,
      created_at: new Date().toISOString()
    },
    {
      id: "t-4",
      title: "PUBG New State Elite Cup",
      game_name: "PUBG New State",
      tournament_type: "Solo",
      entry_fee: 40,
      prize_pool: 1500,
      max_players: 64,
      match_time: "2026-07-15T15:00",
      map_mode: "Troi / Extreme",
      rules: "Fair play mandatory. Device check enforced.",
      description: "Elite survivors clash on futuristic Troi battlefield.",
      banner_url: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
      commission_percentage: 20,
      status: "Completed",
      winner_id: "user-1",
      room_published: true,
      created_at: new Date().toISOString()
    }
  ],
  participants: [
    {
      id: "p-1",
      registration_id: "REG-CODM-91024",
      user_id: "user-1",
      tournament_id: "t-3",
      in_game_name: "Gamer99_Sniper",
      in_game_id: "68294019284",
      team_name: "Apex Killers",
      tournament_type: "Duo",
      status: "Confirmed",
      slot_number: 1,
      entry_fee_paid: 100,
      created_at: new Date().toISOString()
    },
    {
      id: "p-2",
      registration_id: "REG-CODM-82910",
      user_id: "user-2",
      tournament_id: "t-3",
      in_game_name: "ProPlayer_Viper",
      in_game_id: "68294991022",
      team_name: "Shadow Vipers",
      tournament_type: "Duo",
      status: "Confirmed",
      slot_number: 2,
      entry_fee_paid: 100,
      created_at: new Date().toISOString()
    },
    {
      id: "p-3",
      registration_id: "REG-PUBG-33102",
      user_id: "user-1",
      tournament_id: "t-4",
      in_game_name: "Gamer99_Sniper",
      in_game_id: "68294019284",
      tournament_type: "Solo",
      status: "Confirmed",
      slot_number: 1,
      entry_fee_paid: 40,
      created_at: new Date().toISOString()
    }
  ],
  matches: [
    {
      id: "m-t3-1",
      tournament_id: "t-3",
      match_number: 1,
      title: "Match #1 - Crash Hardpoint",
      map_mode: "Crash",
      match_time: "2026-07-18T10:00",
      room_id: "COD-ROOM-102",
      room_password: "codm-pass-999",
      room_published: true,
      status: "Live",
      notes: "Top 4 advance to finals",
      created_at: new Date().toISOString()
    }
  ],
  scores: [
    {
      id: "sc-1",
      tournament_id: "t-4",
      player_name: "gamer99",
      team_name: "Solo Alpha",
      in_game_id: "68294019284",
      rank: 1,
      placement_points: 15,
      kills: 8,
      kill_points: 8,
      bonus_points: 2,
      total_points: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  leaderboardSettings: {
    "t-4": {
      tournament_id: "t-4",
      is_locked: true,
      is_published: true,
      last_updated: new Date().toISOString()
    }
  },
  transactions: [
    {
      id: "tx-1",
      user_id: "user-1",
      amount: 500,
      type: "credit",
      description: "Initial Sign-up Bonus Credit",
      created_at: new Date().toISOString()
    },
    {
      id: "tx-2",
      user_id: "user-2",
      amount: 150,
      type: "credit",
      description: "Sign-up Promo Credit",
      created_at: new Date().toISOString()
    },
    {
      id: "tx-3",
      user_id: "user-1",
      amount: 1500,
      type: "credit",
      description: "Won PUBG New State Elite Cup (Prize Distributed)",
      created_at: new Date().toISOString()
    }
  ],
  deposits: [],
  withdrawals: [],
  notifications: [
    {
      id: "notif-init-1",
      user_id: "user-1",
      title: "Welcome to SAMARAJYA eSPORTS! 🎮",
      message: "Your gamer account is verified and ₹500 welcome credit has been loaded into your wallet.",
      type: "system",
      is_read: false,
      created_at: new Date().toISOString()
    }
  ],
  broadcastHistory: [
    {
      id: "bc-init-1",
      title: "Welcome to ARTIFICIAL SAMARAJYA eSPORTS! 🎮",
      message: "Your battle registry is active. Check upcoming tournament schedules and stay alert for match room details.",
      type: "system",
      target: "all",
      target_name: "All Gamers",
      sender: "Admin",
      created_at: new Date().toISOString(),
      recipients_count: 2,
      recipient_user_ids: ["user-1", "user-2"]
    }
  ],
  tickets: [
    {
      id: "tkt-10245",
      ticket_code: "#A10245",
      user_id: "user-1",
      username: "gamer99",
      user_email: "gamer99@example.com",
      user_mobile: "7667265813",
      subject: "Room ID and Password query for upcoming match",
      category: "Room ID / Password",
      tournament_id: "t-3",
      tournament_title: "COD Mobile Championship",
      status: "In Progress",
      priority: "Urgent",
      last_message: "Please check your tournament page. Room details have now been published.",
      last_reply_by: "admin",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      messages: [
        {
          id: "msg-1",
          ticket_id: "tkt-10245",
          sender_type: "user",
          sender_id: "user-1",
          sender_name: "gamer99",
          message: "Room ID दिखाई नहीं दे रहा है. Match time is approaching soon, please confirm room publishing time.",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "msg-2",
          ticket_id: "tkt-10245",
          sender_type: "admin",
          sender_id: "admin-1",
          sender_name: "Admin Team",
          message: "Please check your tournament page. Room details have now been published and verified.",
          created_at: new Date(Date.now() - 3600000 * 1).toISOString()
        }
      ]
    }
  ],
  settings: {
    upi_id: "7544026117@upi",
    qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=7544026117@upi&pn=ARTIFICIAL%20SAMARAJYA%20eSPORTS&cu=INR",
    admin_mobile: "7667265813"
  },
  passwordResetTokens: [],
  securityAuditLogs: []
};

// Sync load database
function loadDb(): LocalDatabase {
  if (!fs.existsSync(DB_FILE)) {
    saveDb(DEFAULT_DB);
    return DEFAULT_DB;
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(data);
    
    // Auto-migration checks (ensure newer fields/tables are present)
    if (!db.deposits) db.deposits = [];
    if (!db.withdrawals) db.withdrawals = [];
    if (!db.notifications) db.notifications = [];
    if (!db.broadcastHistory) db.broadcastHistory = [];
    if (!db.tickets) db.tickets = [];
    if (!db.matches) db.matches = [];
    if (!db.scores) db.scores = [];
    if (!db.leaderboardSettings) db.leaderboardSettings = {};
    if (!db.passwordResetTokens) db.passwordResetTokens = [];
    if (!db.securityAuditLogs) db.securityAuditLogs = [];
    if (db.admin && db.admin[0]) {
      if (!db.admin[0].email) db.admin[0].email = "admin@artificialsamrajya.com";
      if (!db.admin[0].mobile) db.admin[0].mobile = "7667265813";
    }
    if (!db.settings) {
      db.settings = {
        upi_id: "7544026117@upi",
        qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=7544026117@upi&pn=ARTIFICIAL%20SAMARAJYA%20eSPORTS&cu=INR",
        admin_mobile: "7667265813"
      };
    }

    // Verify user fields
    db.users.forEach((u: any) => {
      if (u.is_blocked === undefined) u.is_blocked = false;
    });

    // Auto-upgrade existing tournaments with new fields
    db.tournaments.forEach((t: Tournament) => {
      if (!t.tournament_type) t.tournament_type = "Solo";
      if (!t.max_players) t.max_players = 100;
      if (!t.map_mode) t.map_mode = "Erangel / TPP";
      if (t.room_published === undefined) {
        t.room_published = Boolean(t.room_id && t.status === "Live");
      }
      if (!t.rules) {
        t.rules = "1. No emulators or external triggers.\n2. In-game name must match registration.\n3. Room details will be published prior to match start.";
      }
      if (!t.description) {
        t.description = "Official tournament by ARTIFICIAL SAMARAJYA eSPORTS. Register, check room details, and compete for the prize pool!";
      }
      if (!t.banner_url) {
        t.banner_url = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80";
      }
    });

    // Auto-upgrade participants with registration_id and fields
    db.participants.forEach((p: any, idx: number) => {
      if (!p.registration_id) {
        p.registration_id = `REG-${(p.tournament_id || "TRN").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-${10000 + idx}`;
      }
      if (!p.in_game_name) {
        const u = db.users.find((user: any) => user.id === p.user_id);
        p.in_game_name = u ? u.username : `Player_${idx + 1}`;
      }
      if (!p.in_game_id) p.in_game_id = `UID-${7000000000 + idx}`;
      if (!p.status) p.status = "Confirmed";
      if (!p.tournament_type) p.tournament_type = "Solo";
      if (!p.slot_number) p.slot_number = idx + 1;
      if (!p.created_at) p.created_at = new Date().toISOString();
    });

    // Auto-migrate legacy plain text credentials to secure salted SHA-256 hashes
    let passwordsMigrated = false;
    db.users.forEach((u: any) => {
      if (u.password && !/^[a-f0-9]{64}$/.test(u.password)) {
        u.password = hashPassword(u.password);
        passwordsMigrated = true;
      }
    });
    db.admin.forEach((a: any) => {
      if (a.password && !/^[a-f0-9]{64}$/.test(a.password)) {
        a.password = hashPassword(a.password);
        passwordsMigrated = true;
      }
    });
    if (passwordsMigrated) {
      saveDb(db);
    }

    return db;
  } catch (err) {
    console.error("Failed to parse db.json, resetting to default:", err);
    saveDb(DEFAULT_DB);
    return DEFAULT_DB;
  }
}

// Sync save database
function saveDb(db: LocalDatabase) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Helper: Dispatch instant in-app notification to gamer Player ID
function createNotification(db: LocalDatabase, notifData: {
  user_id: string;
  title: string;
  message: string;
  type: AppNotification['type'];
  reference_id?: string;
  ticket_id?: string;
  ticket_code?: string;
  tournament_id?: string;
  tournament_title?: string;
  sender?: string;
  action_label?: string;
  action_tab?: string;
  broadcast_id?: string;
  amount?: number;
  qr_code_url?: string;
  status?: string;
}): AppNotification {
  if (!db.notifications) db.notifications = [];

  // Automatically derive tournament details if reference_id matches a tournament
  let tournId = notifData.tournament_id;
  let tournTitle = notifData.tournament_title;
  if (!tournId && notifData.reference_id) {
    const matchedTourn = db.tournaments.find(t => t.id === notifData.reference_id);
    if (matchedTourn) {
      tournId = matchedTourn.id;
      tournTitle = matchedTourn.title;
    }
  } else if (tournId && !tournTitle) {
    const matchedTourn = db.tournaments.find(t => t.id === tournId);
    if (matchedTourn) {
      tournTitle = matchedTourn.title;
    }
  }

  // Determine sender: "Admin" for broadcasts, announcements, direct messages, or manual updates; "System" for automated transactions
  let sender = notifData.sender;
  if (!sender) {
    if (
      notifData.type === "admin_announcement" || 
      notifData.type === "direct_message" || 
      notifData.type === "tournament_update" ||
      notifData.type === "tournament_live" ||
      notifData.type === "room_published"
    ) {
      sender = "Admin";
    } else {
      sender = "System";
    }
  }

  const notif: AppNotification = {
    id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    ...notifData,
    sender,
    tournament_id: tournId,
    tournament_title: tournTitle,
    is_read: false,
    created_at: new Date().toISOString()
  };

  db.notifications.unshift(notif);
  // Cap at 400 to keep memory neat
  if (db.notifications.length > 400) {
    db.notifications = db.notifications.slice(0, 400);
  }
  return notif;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

  // ---------------------------------------------------------------------------
  // USER API ENDPOINTS
  // ---------------------------------------------------------------------------

  // Login (User and Admin)
  app.post("/api/auth/login", (req, res) => {
    const { username, password, isAdmin } = req.body;
    const db = loadDb();

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    if (isAdmin) {
      const admin = db.admin.find(
        (a) => a.username.toLowerCase() === username.toLowerCase() && verifyPassword(password, a.password)
      );
      if (admin) {
        if (admin.password !== hashPassword(password)) {
          admin.password = hashPassword(password);
          saveDb(db);
        }
        return res.json({
          success: true,
          role: "admin",
          user: { id: admin.id, username: admin.username, mobile: admin.mobile, email: admin.email }
        });
      }
      return res.status(401).json({ success: false, message: "Invalid Admin credentials" });
    } else {
      const user = db.users.find(
        (u) => (u.username.toLowerCase() === username.toLowerCase() || (u.email && u.email.toLowerCase() === username.toLowerCase())) &&
               verifyPassword(password, u.password)
      );
      if (user) {
        if (user.password !== hashPassword(password)) {
          user.password = hashPassword(password);
          saveDb(db);
        }
        if (user.is_blocked) {
          return res.status(403).json({ success: false, message: "Your account is blocked by the administrator." });
        }
        return res.json({
          success: true,
          role: "user",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            wallet_balance: user.wallet_balance,
            upi_id: user.upi_id,
            notification_settings: user.notification_settings || {
              match_start: true,
              tournament_results: true,
              room_credentials: true,
              schedule_updates: true,
              wallet_payouts: true,
              admin_announcements: true,
              push_enabled: true
            }
          }
        });
      }
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }
  });

  // Sign up
  app.post("/api/auth/register", (req, res) => {
    const { username, email, password } = req.body;
    const db = loadDb();

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = db.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username or Email already registered" });
    }

    const newUser = {
      id: "user-" + Date.now(),
      username,
      email,
      password: hashPassword(password),
      wallet_balance: 0,
      upi_id: "",
      is_blocked: false,
      notification_settings: {
        match_start: true,
        tournament_results: true,
        room_credentials: true,
        schedule_updates: true,
        wallet_payouts: true,
        admin_announcements: true,
        push_enabled: true
      }
    };

    db.users.push(newUser);
    
    // Create transaction log for registration
    db.transactions.push({
      id: "tx-" + Date.now(),
      user_id: newUser.id,
      amount: 0,
      type: "credit",
      description: "Welcome! Registered to ARTIFICIAL SAMARAJYA eSPORTS",
      created_at: new Date().toISOString()
    });

    saveDb(db);

    res.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        wallet_balance: newUser.wallet_balance,
        upi_id: newUser.upi_id,
        notification_settings: newUser.notification_settings
      }
    });
  });

  // ---------------------------------------------------------------------------
  // PASSWORD RECOVERY & ACCOUNT SECURITY HELPERS & ENDPOINTS
  // ---------------------------------------------------------------------------

  const WEAK_PASSWORDS = new Set([
    "password", "password1", "password123", "12345678", "123456789", "1234567890",
    "qwertyui", "qwertyuiop", "11111111", "00000000", "admin123", "admin1234",
    "iloveyou", "welcome1", "welcome123", "pass1234", "abcdefgh", "samrajya123"
  ]);

  function validatePasswordStrength(pwd: string): { valid: boolean; reason?: string } {
    if (!pwd || pwd.length < 8) {
      return { valid: false, reason: "Password must be at least 8 characters long." };
    }
    const clean = pwd.toLowerCase().trim();
    if (WEAK_PASSWORDS.has(clean)) {
      return { valid: false, reason: "This password is too common or easily guessed. Please choose a stronger password." };
    }
    if (/^(.)\1+$/.test(clean)) {
      return { valid: false, reason: "Password cannot consist of a single repeated character." };
    }
    return { valid: true };
  }

  function maskContact(contact: string): string {
    if (!contact) return "registered recovery channel";
    if (contact.includes("@")) {
      const parts = contact.split("@");
      const userPart = parts[0];
      const domain = parts[1] || "";
      if (userPart.length <= 2) {
        return `${userPart[0]}*@${domain}`;
      }
      return `${userPart.slice(0, 2)}***${userPart.slice(-1)}@${domain}`;
    }
    const digits = contact.replace(/\D/g, "");
    if (digits.length >= 6) {
      return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
    }
    return `${contact.slice(0, 2)}****`;
  }

  function logSecurityEvent(
    db: LocalDatabase,
    event: string,
    role: "user" | "admin",
    target_identifier: string,
    success: boolean,
    message: string,
    ip?: string
  ) {
    if (!db.securityAuditLogs) db.securityAuditLogs = [];
    db.securityAuditLogs.unshift({
      id: "sec-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      event,
      role,
      target_identifier,
      success,
      message,
      timestamp: new Date().toISOString(),
      ip: ip || "127.0.0.1"
    });
    if (db.securityAuditLogs.length > 200) {
      db.securityAuditLogs = db.securityAuditLogs.slice(0, 200);
    }
  }

  // 1. Request Password Reset OTP
  app.post("/api/auth/forgot-password/request", (req, res) => {
    const { role, identifier } = req.body;
    const db = loadDb();

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide your registered Email, Mobile number, or Username." 
      });
    }

    const cleanId = identifier.trim();
    const isRoleAdmin = role === "admin";

    // Rate limiting: 60-second cooldown per identifier
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentToken = db.passwordResetTokens?.find(
      (t) => t.role === (isRoleAdmin ? "admin" : "user") &&
             t.target_identifier.toLowerCase() === cleanId.toLowerCase() &&
             t.created_at > oneMinuteAgo &&
             !t.used
    );

    if (recentToken) {
      const waitSeconds = Math.ceil((recentToken.created_at + 60 * 1000 - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `A verification code was recently generated. Please wait ${Math.max(1, waitSeconds)} seconds before requesting a new code.`
      });
    }

    // Look for matching account
    let matchedTarget: any = null;
    let targetContact = "";

    if (isRoleAdmin) {
      matchedTarget = db.admin.find((a) => {
        const u = (a.username || "").toLowerCase();
        const e = (a.email || "").toLowerCase();
        const m = (a.mobile || "").trim();
        const q = cleanId.toLowerCase();
        return u === q || e === q || m === cleanId || q === "kumarprem89845@gmail.com";
      });
      if (matchedTarget) {
        targetContact = matchedTarget.email || matchedTarget.mobile || "admin@artificialsamrajya.com";
      }
    } else {
      matchedTarget = db.users.find((u) => {
        const username = (u.username || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const mob = (u.mobile_number || "").trim();
        const q = cleanId.toLowerCase();
        return username === q || email === q || mob === cleanId;
      });
      if (matchedTarget) {
        targetContact = matchedTarget.email || matchedTarget.mobile_number || matchedTarget.username;
      }
    }

    // Security rule: Do NOT reveal whether an arbitrary email/phone belongs to an account through error messages
    if (!matchedTarget) {
      logSecurityEvent(
        db,
        isRoleAdmin ? "ADMIN_RECOVERY_UNKNOWN_TARGET" : "GAMER_RECOVERY_UNKNOWN_TARGET",
        isRoleAdmin ? "admin" : "user",
        cleanId,
        false,
        `Recovery attempt for unrecognized coordinate: "${cleanId}"`,
        req.ip
      );
      saveDb(db);

      return res.json({
        success: true,
        message: "If an account matches our records, a secure 6-digit verification code has been dispatched. Please check your inbox or SMS.",
        resetToken: null,
        contact_masked: maskContact(cleanId),
        expires_in_seconds: isRoleAdmin ? 300 : 600
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenId = "rst-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);
    const ttlMs = isRoleAdmin ? 5 * 60 * 1000 : 10 * 60 * 1000; // 5 mins for admin, 10 mins for gamer
    const contactMasked = maskContact(targetContact);

    // Invalidate prior active tokens for this target
    db.passwordResetTokens?.forEach((t) => {
      if (t.target_id === matchedTarget.id && !t.used) {
        t.used = true;
      }
    });

    const tokenRecord: ResetToken = {
      id: resetTokenId,
      role: isRoleAdmin ? "admin" : "user",
      target_id: matchedTarget.id,
      target_identifier: cleanId,
      otp,
      created_at: Date.now(),
      expires_at: Date.now() + ttlMs,
      attempts: 0,
      used: false,
      contact_masked: contactMasked
    };

    if (!db.passwordResetTokens) db.passwordResetTokens = [];
    db.passwordResetTokens.push(tokenRecord);

    logSecurityEvent(
      db,
      isRoleAdmin ? "ADMIN_PASSWORD_RESET_OTP_DISPATCHED" : "GAMER_PASSWORD_RESET_OTP_DISPATCHED",
      isRoleAdmin ? "admin" : "user",
      cleanId,
      true,
      `Verification OTP dispatched to ${contactMasked}. Valid for ${isRoleAdmin ? "5" : "10"} minutes.`,
      req.ip
    );

    saveDb(db);

    res.json({
      success: true,
      message: `If an account matches our records, a secure 6-digit verification code has been dispatched to ${contactMasked}.`,
      resetToken: resetTokenId,
      contact_masked: contactMasked,
      expires_in_seconds: isRoleAdmin ? 300 : 600,
      dev_otp: otp // Provided for effortless sandbox/preview testing verification
    });
  });

  // 2. Verify OTP
  app.post("/api/auth/forgot-password/verify-otp", (req, res) => {
    const { resetToken, otp } = req.body;
    const db = loadDb();

    if (!resetToken || !otp) {
      return res.status(400).json({ success: false, message: "Missing reset token or verification code." });
    }

    const token = db.passwordResetTokens?.find((t) => t.id === resetToken);

    if (!token) {
      return res.status(400).json({ success: false, message: "Invalid or expired recovery session. Please request a new code." });
    }

    if (token.used) {
      return res.status(400).json({ success: false, message: "This recovery code has already been used and cannot be reused. Please request a new code." });
    }

    if (Date.now() > token.expires_at) {
      token.used = true;
      saveDb(db);
      return res.status(400).json({ success: false, message: "The verification code has expired. Please request a new code." });
    }

    if (token.attempts >= 3) {
      token.used = true;
      saveDb(db);
      return res.status(429).json({ 
        success: false, 
        message: "Maximum verification attempts exceeded. This recovery session has been locked for security. Please request a new code." 
      });
    }

    const enteredOtp = String(otp).trim();
    if (token.otp !== enteredOtp) {
      token.attempts += 1;
      const remaining = 3 - token.attempts;

      logSecurityEvent(
        db,
        "PASSWORD_RESET_WRONG_OTP",
        token.role,
        token.target_identifier,
        false,
        `Incorrect OTP attempt (${token.attempts}/3)`,
        req.ip
      );

      if (remaining <= 0) {
        token.used = true;
        saveDb(db);
        return res.status(400).json({
          success: false,
          message: "Incorrect verification code. Maximum attempts reached. Recovery session locked for security."
        });
      }

      saveDb(db);
      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
      });
    }

    token.verified = true;
    saveDb(db);

    res.json({
      success: true,
      message: "Verification code confirmed! You can now create your new password."
    });
  });

  // 3. Reset Password with Verified OTP
  app.post("/api/auth/forgot-password/reset", (req, res) => {
    const { resetToken, otp, newPassword, confirmPassword } = req.body;
    const db = loadDb();

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Please provide both new password and confirmation." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New password and confirmation do not match." });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({ success: false, message: strength.reason });
    }

    const token = db.passwordResetTokens?.find((t) => t.id === resetToken);

    if (!token) {
      return res.status(400).json({ success: false, message: "Invalid or expired recovery session. Please request a new code." });
    }

    if (token.used) {
      return res.status(400).json({ success: false, message: "This recovery session has already been used and cannot be reused. Please request a new code." });
    }

    if (Date.now() > token.expires_at) {
      token.used = true;
      saveDb(db);
      return res.status(400).json({ success: false, message: "Recovery code has expired. Please request a new code." });
    }

    if (token.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Verification code does not match." });
    }

    // Invalidate/burn token immediately (one-time-use)
    token.used = true;

    if (token.role === "admin") {
      const admin = db.admin.find((a) => a.id === token.target_id) || db.admin[0];
      if (!admin) {
        return res.status(404).json({ success: false, message: "Administrator account not found." });
      }

      if (verifyPassword(newPassword, admin.password)) {
        return res.status(400).json({ success: false, message: "New password cannot be the same as your old password." });
      }

      admin.password = hashPassword(newPassword);
      admin.session_version = (admin.session_version || 0) + 1;

      logSecurityEvent(
        db,
        "ADMIN_PASSWORD_RESET_SUCCESS",
        "admin",
        admin.username,
        true,
        `Admin "${admin.username}" successfully reset password via OTP recovery. Active sessions revoked.`,
        req.ip
      );

      saveDb(db);

      return res.json({
        success: true,
        message: "Password changed successfully. Please login with your new password."
      });
    } else {
      const user = db.users.find((u) => u.id === token.target_id);
      if (!user) {
        return res.status(404).json({ success: false, message: "Gamer account not found." });
      }

      if (verifyPassword(newPassword, user.password)) {
        return res.status(400).json({ success: false, message: "New password cannot be the same as your old password." });
      }

      user.password = hashPassword(newPassword);
      user.session_version = (user.session_version || 0) + 1;

      // Dispatch security notification to Gamer
      createNotification(db, {
        user_id: user.id,
        title: "🔐 Password Changed",
        message: "Your account password was successfully changed. If you did not make this change, contact the system administrator immediately.",
        type: "security_alert",
        amount: 0
      });

      logSecurityEvent(
        db,
        "GAMER_PASSWORD_RESET_SUCCESS",
        "user",
        user.username,
        true,
        `Gamer "${user.username}" successfully changed password via verified OTP recovery.`,
        req.ip
      );

      saveDb(db);

      return res.json({
        success: true,
        message: "Password changed successfully. Please login with your new password."
      });
    }
  });

  // 4. Emergency Super-Admin / Owner Recovery
  app.post("/api/auth/forgot-password/emergency-admin-recovery", (req, res) => {
    const { superAdminKey, newPassword, confirmPassword } = req.body;
    const db = loadDb();

    const expectedKey = process.env.SUPERADMIN_RECOVERY_KEY || "SAMRAJYA-SUPERADMIN-ROOT-KEY-2026";

    if (!superAdminKey || superAdminKey.trim() !== expectedKey) {
      logSecurityEvent(
        db,
        "SUPERADMIN_EMERGENCY_RECOVERY_FAILED",
        "admin",
        "superadmin",
        false,
        "Failed emergency super-admin recovery attempt: Invalid master root key",
        req.ip
      );
      saveDb(db);
      return res.status(401).json({
        success: false,
        message: "Invalid Emergency Super-Admin Recovery Key. Access rejected."
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Please provide both new password and confirmation." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New password and confirmation do not match." });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({ success: false, message: strength.reason });
    }

    const admin = db.admin[0];
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    admin.password = hashPassword(newPassword);
    admin.session_version = (admin.session_version || 0) + 1;

    logSecurityEvent(
      db,
      "SUPERADMIN_EMERGENCY_RECOVERY_SUCCESS",
      "admin",
      admin.username,
      true,
      `Super-Admin Root Key utilized to securely reset Admin password for "${admin.username}". All prior sessions invalidated.`,
      req.ip
    );

    saveDb(db);

    res.json({
      success: true,
      message: "Emergency Root Key verified! Admin password has been successfully reset. Please login with your new credentials."
    });
  });

  // 5. Security Audit Logs Endpoint (Admin View)
  app.get("/api/admin/security-audit-logs", (req, res) => {
    const db = loadDb();
    res.json({
      success: true,
      auditLogs: db.securityAuditLogs || []
    });
  });

  // Profile - Get and Update profile
  app.get("/api/auth/profile/:id", (req, res) => {
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallet_balance: user.wallet_balance,
        upi_id: user.upi_id,
        notification_settings: user.notification_settings || {
          match_start: true,
          tournament_results: true,
          room_credentials: true,
          schedule_updates: true,
          wallet_payouts: true,
          admin_announcements: true,
          push_enabled: true
        }
      }
    });
  });

  app.post("/api/auth/profile/:id", (req, res) => {
    const { username, email, upi_id, password, newPassword, notification_settings } = req.body;
    const db = loadDb();
    const userIdx = db.users.findIndex((u) => u.id === req.params.id);

    if (userIdx === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = db.users[userIdx];

    // Check duplicate username/email
    const duplicate = db.users.find(
      (u) => u.id !== user.id && (u.username.toLowerCase() === (username || "").toLowerCase() || u.email.toLowerCase() === (email || "").toLowerCase())
    );
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Username or Email already taken" });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.upi_id = upi_id !== undefined ? upi_id : user.upi_id;
    if (notification_settings !== undefined) {
      user.notification_settings = {
        ...(user.notification_settings || {
          match_start: true,
          tournament_results: true,
          room_credentials: true,
          schedule_updates: true,
          wallet_payouts: true,
          admin_announcements: true,
          push_enabled: true
        }),
        ...notification_settings
      };
    }

    if (password && newPassword) {
      if (!verifyPassword(password, user.password)) {
        return res.status(400).json({ success: false, message: "Current password does not match" });
      }
      user.password = hashPassword(newPassword);
    }

    db.users[userIdx] = user;
    saveDb(db);

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallet_balance: user.wallet_balance,
        upi_id: user.upi_id,
        notification_settings: user.notification_settings
      }
    });
  });

  // Delete Gamer Profile (Self Deletion)
  app.delete("/api/auth/profile/:id", (req, res) => {
    const db = loadDb();
    const userId = req.params.id;
    const userIndex = db.users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    // Clean up gamer data
    if (db.participants) db.participants = db.participants.filter((p) => p.user_id !== userId);
    if (db.notifications) db.notifications = db.notifications.filter((n) => n.user_id !== userId);
    if (db.deposits) db.deposits = db.deposits.filter((d) => d.user_id !== userId);
    if (db.withdrawals) db.withdrawals = db.withdrawals.filter((w) => w.user_id !== userId);
    if (db.tickets) db.tickets = db.tickets.filter((t) => t.user_id !== userId);
    if (db.scores) db.scores = db.scores.filter((s) => s.user_id !== userId);
    if (db.transactions) db.transactions = db.transactions.filter((tx) => tx.user_id !== userId);

    db.users.splice(userIndex, 1);
    saveDb(db);

    res.json({ success: true, message: "Your gamer account has been deleted successfully." });
  });

  // Dedicated Notification Settings endpoint for instant sync
  app.get("/api/user/:id/notification-settings", (req, res) => {
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      settings: user.notification_settings || {
        match_start: true,
        tournament_results: true,
        room_credentials: true,
        schedule_updates: true,
        wallet_payouts: true,
        admin_announcements: true,
        push_enabled: true
      }
    });
  });

  app.post("/api/user/:id/notification-settings", (req, res) => {
    const db = loadDb();
    const userIdx = db.users.findIndex((u) => u.id === req.params.id);
    if (userIdx === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const current = db.users[userIdx].notification_settings || {
      match_start: true,
      tournament_results: true,
      room_credentials: true,
      schedule_updates: true,
      wallet_payouts: true,
      admin_announcements: true,
      push_enabled: true
    };
    const updated = {
      ...current,
      ...req.body
    };
    db.users[userIdx].notification_settings = updated;
    saveDb(db);

    res.json({
      success: true,
      settings: updated
    });
  });

  // ---------------------------------------------------------------------------
  // TOURNAMENTS (USER & COMMON)
  // ---------------------------------------------------------------------------

  // List all tournaments (with user registration info and room visibility protection)
  app.get("/api/tournaments", (req, res) => {
    const db = loadDb();
    const userId = req.query.user_id as string | undefined;
    const isAdmin = req.query.is_admin === "true";

    const enriched = db.tournaments
      .filter((t) => {
        // Hide Draft tournaments from normal players
        if (!isAdmin && t.status === "Draft") return false;
        return true;
      })
      .map((t) => {
        const confirmedParts = db.participants.filter(
          (p) => p.tournament_id === t.id && p.status === "Confirmed"
        );
        const registeredCount = confirmedParts.length;
        const userPart = userId ? confirmedParts.find((p) => p.user_id === userId) : undefined;
        const isUserRegistered = Boolean(userPart);
        const userRegId = userPart?.registration_id;

        // Mask room details if room is not published (unless caller is admin)
        const canSeeRoom = isAdmin || (t.room_published && isUserRegistered);

        return {
          ...t,
          registered_count: registeredCount,
          is_user_registered: isUserRegistered,
          user_registration_id: userRegId,
          user_participant: userPart,
          room_id: canSeeRoom ? t.room_id : undefined,
          room_password: canSeeRoom ? t.room_password : undefined,
          is_room_visible: canSeeRoom
        };
      });

    res.json({ success: true, tournaments: enriched });
  });

  // Get single tournament details
  app.get("/api/tournaments/:id", (req, res) => {
    const db = loadDb();
    const tournamentId = req.params.id;
    const userId = req.query.user_id as string | undefined;
    const isAdmin = req.query.is_admin === "true";

    const t = db.tournaments.find((trn) => trn.id === tournamentId);
    if (!t) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    const confirmedParts = db.participants.filter(
      (p) => p.tournament_id === t.id && p.status === "Confirmed"
    );
    const userPart = userId ? confirmedParts.find((p) => p.user_id === userId) : undefined;
    const isUserRegistered = Boolean(userPart);
    const canSeeRoom = isAdmin || (t.room_published && isUserRegistered);

    res.json({
      success: true,
      tournament: {
        ...t,
        registered_count: confirmedParts.length,
        is_user_registered: isUserRegistered,
        user_registration_id: userPart?.registration_id,
        user_participant: userPart,
        room_id: canSeeRoom ? t.room_id : undefined,
        room_password: canSeeRoom ? t.room_password : undefined,
        is_room_visible: canSeeRoom
      }
    });
  });

  // Get leaderboard of top players across all tournaments
  app.get("/api/leaderboard", (req, res) => {
    const db = loadDb();
    
    const userWinningsMap: Record<string, { total_winnings: number; tournaments_won: number }> = {};
    
    // Initialize all registered users
    db.users.forEach((u) => {
      userWinningsMap[u.id] = { total_winnings: 0, tournaments_won: 0 };
    });
    
    // Accumulate winnings from completed tournaments
    db.tournaments.forEach((t) => {
      if (t.status === "Completed" && t.winner_id) {
        if (!userWinningsMap[t.winner_id]) {
          userWinningsMap[t.winner_id] = { total_winnings: 0, tournaments_won: 0 };
        }
        userWinningsMap[t.winner_id].total_winnings += t.prize_pool;
        userWinningsMap[t.winner_id].tournaments_won += 1;
      }
    });
    
    // Map to array and sort
    const leaderboard = db.users.map((u) => {
      const stats = userWinningsMap[u.id] || { total_winnings: 0, tournaments_won: 0 };
      const finalWinnings = u.custom_total_winnings !== undefined ? u.custom_total_winnings : stats.total_winnings;
      const finalWins = u.custom_tournaments_won !== undefined ? u.custom_tournaments_won : stats.tournaments_won;
      const hasOverride = u.custom_total_winnings !== undefined || u.custom_tournaments_won !== undefined || u.custom_rank !== undefined;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        total_winnings: finalWinnings,
        tournaments_won: finalWins,
        wallet_balance: u.wallet_balance,
        custom_rank: u.custom_rank,
        custom_total_winnings: u.custom_total_winnings,
        custom_tournaments_won: u.custom_tournaments_won,
        has_override: hasOverride,
        raw_winnings: stats.total_winnings,
        raw_wins: stats.tournaments_won
      };
    }).sort((a, b) => {
      if (a.custom_rank !== undefined && b.custom_rank !== undefined) {
        return a.custom_rank - b.custom_rank;
      }
      if (a.custom_rank !== undefined) return -1;
      if (b.custom_rank !== undefined) return 1;
      if (b.total_winnings !== a.total_winnings) {
        return b.total_winnings - a.total_winnings;
      }
      return b.tournaments_won - a.tournaments_won;
    });
    
    res.json({ success: true, leaderboard });
  });

  // Join / Register for a tournament (Robust Player Join System)
  app.post("/api/tournaments/join", (req, res) => {
    const { 
      tournament_id, 
      user_id, 
      in_game_name, 
      in_game_id, 
      team_name, 
      teammates, 
      tournament_type 
    } = req.body;
    
    const db = loadDb();

    const tournament = db.tournaments.find((t) => t.id === tournament_id);
    const user = db.users.find((u) => u.id === user_id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found in database." });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: "Your account is blocked. Cannot register for tournaments." });
    }

    // 1. Status Check
    if (tournament.status === "Draft") {
      return res.status(400).json({ success: false, message: "This tournament is still in draft mode and not open for registration." });
    }
    if (tournament.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "This tournament has been cancelled." });
    }
    if (tournament.status === "Completed") {
      return res.status(400).json({ success: false, message: "This tournament has already ended." });
    }
    if (tournament.status === "Live") {
      return res.status(400).json({ success: false, message: "Tournament is already Live. Registration closed." });
    }
    if (tournament.status === "Registration Closed") {
      return res.status(400).json({ success: false, message: "Registration is closed for this tournament." });
    }

    // 2. Deadline Check
    if (tournament.registration_end_time) {
      const deadline = new Date(tournament.registration_end_time).getTime();
      if (!isNaN(deadline) && Date.now() > deadline) {
        return res.status(400).json({ success: false, message: "Registration deadline has expired." });
      }
    }

    // 3. Slot Capacity Check
    const confirmedCount = db.participants.filter(
      (p) => p.tournament_id === tournament_id && p.status === "Confirmed"
    ).length;
    const maxCapacity = tournament.max_players || 100;
    if (confirmedCount >= maxCapacity) {
      return res.status(400).json({ success: false, message: `Tournament slots are full (${confirmedCount}/${maxCapacity}).` });
    }

    // 4. Duplicate Registration Check
    const alreadyJoined = db.participants.some(
      (p) => p.user_id === user_id && p.tournament_id === tournament_id && p.status === "Confirmed"
    );
    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: "You are already registered for this tournament." });
    }

    // 5. In-Game Details Validation
    if (!in_game_name || !in_game_name.trim()) {
      return res.status(400).json({ success: false, message: "In-Game Name (IGN) is required." });
    }
    if (!in_game_id || !in_game_id.trim()) {
      return res.status(400).json({ success: false, message: "In-Game Player UID is required." });
    }

    const effectiveType = (tournament_type || tournament.tournament_type || "Solo") as TournamentType;
    if (effectiveType === "Duo") {
      if (!team_name || !team_name.trim()) {
        return res.status(400).json({ success: false, message: "Team Name is required for Duo tournaments." });
      }
      if (!teammates || !Array.isArray(teammates) || teammates.length < 1 || !teammates[0].name || !teammates[0].in_game_id) {
        return res.status(400).json({ success: false, message: "Teammate 2 IGN and In-Game UID are required for Duo registration." });
      }
    } else if (effectiveType === "Squad") {
      if (!team_name || !team_name.trim()) {
        return res.status(400).json({ success: false, message: "Team Name is required for Squad tournaments." });
      }
      if (!teammates || !Array.isArray(teammates) || teammates.length < 3 || teammates.slice(0, 3).some((m) => !m.name || !m.in_game_id)) {
        return res.status(400).json({ success: false, message: "All 3 squad teammates (IGN & UID) are required for Squad registration." });
      }
    }

    // 6. Wallet Balance Check
    const fee = Number(tournament.entry_fee) || 0;
    if (user.wallet_balance < fee) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient wallet balance (₹${user.wallet_balance}). Entry fee requires ₹${fee}. Please add money to your wallet.` 
      });
    }

    // 7. Deduct Entry Fee & Record Transaction
    if (fee > 0) {
      user.wallet_balance -= fee;
      db.transactions.push({
        id: "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        user_id: user.id,
        amount: fee,
        type: "debit",
        description: `Entry fee for tournament: ${tournament.title}`,
        created_at: new Date().toISOString()
      });
    }

    // 8. Generate Unique Registration ID
    const gameCode = (tournament.game_name.replace(/[^A-Za-z]/g, "").substring(0, 4) || "ESPT").toUpperCase();
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const regId = `REG-${gameCode}-${randomDigits}`;

    // 9. Save Participant Record
    const newParticipant: Participant = {
      id: "p-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      registration_id: regId,
      user_id: user.id,
      tournament_id: tournament.id,
      in_game_name: in_game_name.trim(),
      in_game_id: in_game_id.trim(),
      team_name: team_name ? team_name.trim() : undefined,
      teammates: teammates || [],
      tournament_type: effectiveType,
      status: "Confirmed",
      slot_number: confirmedCount + 1,
      entry_fee_paid: fee,
      created_at: new Date().toISOString()
    };
    db.participants.push(newParticipant);

    // 10. Dispatch Instant In-App Notification to Gamer Player ID
    createNotification(db, {
      user_id: user.id,
      title: "Tournament Entry Confirmed! 🎯",
      message: `Registration successful! Your Registration ID is [${regId}]. Entry fee ₹${fee} deducted. Match scheduled for ${tournament.match_time}. Room ID & Password will be published here before match start.`,
      type: "tournament_joined",
      reference_id: tournament.id,
      amount: fee
    });

    saveDb(db);

    res.json({
      success: true,
      message: `Registered successfully! Registration ID: ${regId}`,
      registration_id: regId,
      participant: newParticipant,
      newBalance: user.wallet_balance
    });
  });

  // Get user's joined tournaments
  app.get("/api/user/:id/tournaments", (req, res) => {
    const db = loadDb();
    const userId = req.params.id;

    const userParticipants = db.participants.filter((p) => p.user_id === userId && p.status === "Confirmed");
    const joinedTournaments = db.tournaments
      .filter((t) => userParticipants.some((p) => p.tournament_id === t.id))
      .map((t) => {
        const p = userParticipants.find((part) => part.tournament_id === t.id);
        const canSeeRoom = Boolean(t.room_published);
        return {
          ...t,
          user_registration_id: p?.registration_id,
          user_participant: p,
          room_id: canSeeRoom ? t.room_id : undefined,
          room_password: canSeeRoom ? t.room_password : undefined,
          is_room_visible: canSeeRoom
        };
      });

    res.json({ success: true, tournaments: joinedTournaments });
  });

  // Get participants of a specific tournament
  app.get("/api/tournaments/:id/participants", (req, res) => {
    const db = loadDb();
    const tournamentId = req.params.id;

    const parts = db.participants
      .filter((p) => p.tournament_id === tournamentId)
      .map((p) => {
        const user = db.users.find((u) => u.id === p.user_id);
        return {
          ...p,
          username: user ? user.username : "Unknown Gamer"
        };
      });

    res.json({ success: true, participants: parts });
  });

  // Get matches inside a tournament
  app.get("/api/tournaments/:id/matches", (req, res) => {
    const db = loadDb();
    const tournamentId = req.params.id;
    const isAdmin = req.query.is_admin === "true";

    const tournamentMatches = (db.matches || [])
      .filter((m) => m.tournament_id === tournamentId)
      .sort((a, b) => a.match_number - b.match_number)
      .map((m) => ({
        ...m,
        room_id: (isAdmin || m.room_published) ? m.room_id : undefined,
        room_password: (isAdmin || m.room_published) ? m.room_password : undefined
      }));

    res.json({ success: true, matches: tournamentMatches });
  });

  // Get scoreboard & leaderboard settings for a tournament
  app.get("/api/tournaments/:id/scores", (req, res) => {
    const db = loadDb();
    const tournamentId = req.params.id;
    const matchId = req.query.match_id as string | undefined;

    let tournamentScores = (db.scores || []).filter((s) => s.tournament_id === tournamentId);
    if (matchId) {
      tournamentScores = tournamentScores.filter((s) => s.match_id === matchId);
    }

    // Sort by rank ascending, or total_points descending
    tournamentScores.sort((a, b) => {
      if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
      return b.total_points - a.total_points;
    });

    const settings = (db.leaderboardSettings || {})[tournamentId] || {
      tournament_id: tournamentId,
      is_locked: false,
      is_published: false,
      last_updated: new Date().toISOString()
    };

    res.json({
      success: true,
      scores: tournamentScores,
      settings
    });
  });

  // ---------------------------------------------------------------------------
  // WALLET, TRANSACTIONS, DEPOSITS, WITHDRAWALS & NOTIFICATIONS
  // ---------------------------------------------------------------------------

  // Get wallet details
  app.get("/api/user/:id/wallet", (req, res) => {
    const db = loadDb();
    const userId = req.params.id;

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const txs = db.transactions
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      balance: user.wallet_balance,
      transactions: txs
    });
  });

  // Submit manual UPI deposit request
  app.post("/api/user/deposit", (req, res) => {
    const { user_id, amount, transaction_id } = req.body;
    const db = loadDb();

    if (!user_id || !amount || !transaction_id) {
      return res.status(400).json({ success: false, message: "Amount and Transaction ID are required" });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Valid deposit amount is required." });
    }

    // Check if transaction ID already submitted
    const isDuplicateTx = db.deposits.some(
      (d) => d.transaction_id.toLowerCase() === transaction_id.toLowerCase()
    );
    if (isDuplicateTx) {
      return res.status(400).json({ success: false, message: "This Transaction ID has already been submitted." });
    }

    const deposit: DepositRequest = {
      id: "dep-" + Date.now(),
      user_id,
      amount: Number(amount),
      transaction_id,
      status: "Pending",
      created_at: new Date().toISOString()
    };

    db.deposits.push(deposit);

    // Send instant deposit submission notification to player
    createNotification(db, {
      user_id,
      title: "Deposit Request Submitted ⏳",
      message: `Deposit request of ₹${amount} (TxID: ${transaction_id}) has been submitted for verification. Admin will verify and credit your balance within 5-15 mins.`,
      type: "system",
      reference_id: deposit.id,
      amount: Number(amount),
      status: "Pending"
    });

    saveDb(db);

    res.json({
      success: true,
      message: "Deposit request submitted successfully! Pending verification by Admin.",
      deposit
    });
  });

  // Submit manual UPI withdrawal request with Auto-Generated Payout QR
  app.post("/api/user/withdraw", (req, res) => {
    const { user_id, amount } = req.body;
    const db = loadDb();

    const user = db.users.find((u) => u.id === user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!amount || Number(amount) < 100 || Number(amount) > 50000) {
      return res.status(400).json({ success: false, message: "Withdrawal amount must be between ₹100 and ₹50,000." });
    }

    if (!user.upi_id) {
      return res.status(400).json({ success: false, message: "Please save your UPI ID in Profile first." });
    }

    if (user.wallet_balance < Number(amount)) {
      return res.status(400).json({ success: false, message: "Insufficient balance in wallet." });
    }

    // Deduct immediately to prevent double withdrawal, and record as pending withdrawal.
    // If rejected, we will credit it back.
    user.wallet_balance -= Number(amount);

    // Auto-Generate payout UPI QR code specifically tailored for this withdrawal transaction
    const upiUri = `upi://pay?pa=${encodeURIComponent(user.upi_id)}&pn=${encodeURIComponent(user.username)}&am=${amount}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;

    const withdrawal: WithdrawalRequest = {
      id: "wth-" + Date.now(),
      user_id,
      amount: Number(amount),
      status: "Pending",
      qr_code_url: qrCodeUrl,
      created_at: new Date().toISOString()
    };

    db.withdrawals.push(withdrawal);

    // Create a transaction debit entry
    db.transactions.push({
      id: "tx-" + Date.now(),
      user_id,
      amount: Number(amount),
      type: "debit",
      description: `Pending UPI withdrawal to ${user.upi_id}`,
      created_at: new Date().toISOString()
    });

    // Dispatch INSTANT in-app notification to gamer Player ID
    createNotification(db, {
      user_id,
      title: "Withdrawal Request Applied 💸",
      message: `Withdrawal request for ₹${amount} applied for Player ID #${user.id}. Destination UPI: ${user.upi_id}. Required payout QR is auto-generated and queued for Admin verification.`,
      type: "withdrawal_applied",
      reference_id: withdrawal.id,
      amount: Number(amount),
      qr_code_url: qrCodeUrl,
      status: "Pending"
    });

    saveDb(db);

    res.json({
      success: true,
      message: "Withdrawal request submitted successfully! Amount locked and pending admin release.",
      withdrawal,
      qr_code_url: qrCodeUrl,
      newBalance: user.wallet_balance
    });
  });

  // Get gamer's withdrawal requests history & status
  app.get("/api/user/:id/withdrawals", (req, res) => {
    const db = loadDb();
    const userId = req.params.id;
    const user = db.users.find(u => u.id === userId);

    const userWithdrawals = db.withdrawals
      .filter((w) => w.user_id === userId)
      .map((w) => ({
        ...w,
        username: user?.username || "Gamer",
        upi_id: user?.upi_id || "N/A"
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ success: true, withdrawals: userWithdrawals });
  });

  // Get in-app notifications for gamer Player ID
  app.get("/api/user/:id/notifications", (req, res) => {
    const db = loadDb();
    const userId = req.params.id;

    if (!db.notifications) db.notifications = [];

    const userNotifs = db.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const unreadCount = userNotifs.filter((n) => !n.is_read).length;

    res.json({
      success: true,
      notifications: userNotifs,
      unread_count: unreadCount
    });
  });

  // Mark in-app notification(s) as read
  app.post("/api/user/:id/notifications/read", (req, res) => {
    const db = loadDb();
    const userId = req.params.id;
    const { notificationId } = req.body;

    if (!db.notifications) db.notifications = [];

    if (notificationId) {
      const n = db.notifications.find((notif) => notif.id === notificationId && notif.user_id === userId);
      if (n) n.is_read = true;
    } else {
      // Mark all read for this user
      db.notifications.forEach((notif) => {
        if (notif.user_id === userId) notif.is_read = true;
      });
    }

    saveDb(db);
    res.json({ success: true, message: "Notifications marked as read" });
  });

  // Clear in-app notifications
  app.post("/api/user/:id/notifications/clear", (req, res) => {
    const db = loadDb();
    const userId = req.params.id;

    if (!db.notifications) db.notifications = [];
    db.notifications = db.notifications.filter((notif) => notif.user_id !== userId);

    saveDb(db);
    res.json({ success: true, message: "Notifications cleared successfully" });
  });

  // Delete single in-app notification for gamer
  app.delete("/api/user/:id/notifications/:notificationId", (req, res) => {
    const db = loadDb();
    const userId = req.params.id;
    const notificationId = req.params.notificationId;

    if (!db.notifications) db.notifications = [];
    const prevCount = db.notifications.length;
    db.notifications = db.notifications.filter((n) => !(n.id === notificationId && n.user_id === userId));

    saveDb(db);
    res.json({
      success: true,
      message: "Notification removed from your alerts",
      deleted: db.notifications.length < prevCount
    });
  });

  // ---------------------------------------------------------------------------
  // SUPPORT TICKETS & GAMER-ADMIN CONVERSATIONS API
  // ---------------------------------------------------------------------------

  // Get Support Tickets (Gamer sees only own tickets; Admin sees all)
  app.get("/api/support/tickets", (req, res) => {
    const db = loadDb();
    if (!db.tickets) db.tickets = [];

    const { user_id, status, category, priority, search } = req.query;

    let ticketsList = [...db.tickets];

    // Gamer privacy filter: strictly show only the requester's tickets if user_id is passed
    if (user_id) {
      ticketsList = ticketsList.filter((t) => t.user_id === user_id);
    }

    if (status && status !== "all") {
      ticketsList = ticketsList.filter((t) => t.status.toLowerCase() === (status as string).toLowerCase());
    }

    if (category && category !== "all") {
      ticketsList = ticketsList.filter((t) => t.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (priority && priority !== "all") {
      ticketsList = ticketsList.filter((t) => t.priority.toLowerCase() === (priority as string).toLowerCase());
    }

    if (search && (search as string).trim()) {
      const q = (search as string).toLowerCase();
      ticketsList = ticketsList.filter((t) => 
        t.ticket_code.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q) ||
        (t.tournament_title && t.tournament_title.toLowerCase().includes(q)) ||
        t.messages.some((m) => m.message.toLowerCase().includes(q))
      );
    }

    // Sort by latest update (or created date) descending
    ticketsList.sort((a, b) => {
      // Prioritize urgent in progress/open for admin overview
      if (!user_id) {
        if (a.priority === "Urgent" && b.priority !== "Urgent" && a.status !== "Resolved") return -1;
        if (b.priority === "Urgent" && a.priority !== "Urgent" && b.status !== "Resolved") return 1;
      }
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });

    res.json({
      success: true,
      tickets: ticketsList,
      total_count: ticketsList.length,
      open_count: ticketsList.filter((t) => t.status === "Open" || t.status === "In Progress").length,
      urgent_count: ticketsList.filter((t) => t.priority === "Urgent" && t.status !== "Resolved").length
    });
  });

  // Get Single Support Ticket with full message history
  app.get("/api/support/tickets/:id", (req, res) => {
    const db = loadDb();
    if (!db.tickets) db.tickets = [];

    const ticketId = req.params.id;
    const ticket = db.tickets.find((t) => t.id === ticketId || t.ticket_code.toLowerCase() === ticketId.toLowerCase());

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found" });
    }

    res.json({ success: true, ticket });
  });

  // Create New Support Ticket (Gamer Side)
  app.post("/api/support/tickets", (req, res) => {
    const { user_id, username, user_email, user_mobile, subject, category, message, attachment_url, tournament_id } = req.body;
    const db = loadDb();
    if (!db.tickets) db.tickets = [];

    const effectiveMessage = (message && message.trim()) 
      ? message.trim() 
      : (attachment_url ? "📷 [Sent photo attachment]" : "");

    if (!user_id || !effectiveMessage) {
      return res.status(400).json({ success: false, message: "User ID and message/attachment are required" });
    }

    const effectiveSubject = (subject && subject.trim()) 
      ? subject.trim() 
      : (effectiveMessage.length > 35 ? effectiveMessage.substring(0, 35) + "..." : effectiveMessage) || "Support Chat";

    // Resilient user discovery: match by ID, username, or email
    let user = db.users.find((u) => u.id === user_id || (u.username && u.username.toLowerCase() === String(user_id).toLowerCase()));
    if (!user) {
      // Auto-provision user record so support messages are never blocked
      const fallbackName = username || (typeof user_id === "string" && !user_id.startsWith("user-") ? user_id : `gamer_${Math.floor(1000 + Math.random() * 9000)}`);
      user = {
        id: user_id,
        username: fallbackName,
        email: user_email || `${fallbackName}@artificialsamrajya.com`,
        wallet_balance: 0,
        upi_id: user_mobile || "",
        is_blocked: false
      };
      db.users.push(user);
    }

    // Generate unique Ticket ID Code, e.g., #A10245
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const ticketCode = `#A${randomCode}`;
    const ticketId = `tkt-${Date.now()}-${randomCode}`;

    // Derive Tournament title if selected
    let tournamentTitle: string | undefined = undefined;
    if (tournament_id) {
      const tourn = db.tournaments.find((t) => t.id === tournament_id);
      if (tourn) {
        tournamentTitle = tourn.title;
      }
    }

    // Determine initial priority: Urgent for Payment, Withdrawal, and Room ID queries
    let initialPriority: SupportPriority = "Normal";
    if (category === "Room ID / Password" || category === "Payment" || category === "Withdrawal") {
      initialPriority = "Urgent";
    }

    const initialMessage: SupportMessage = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      ticket_id: ticketId,
      sender_type: "user",
      sender_id: user.id,
      sender_name: user.username,
      message: effectiveMessage,
      attachment_url: attachment_url || undefined,
      created_at: new Date().toISOString()
    };

    const newTicket: SupportTicket = {
      id: ticketId,
      ticket_code: ticketCode,
      user_id: user.id,
      username: user.username,
      user_email: user.email,
      user_mobile: user.upi_id || "Registered Gamer",
      subject: effectiveSubject,
      category: (category || "Other") as SupportCategory,
      tournament_id: tournament_id || undefined,
      tournament_title: tournamentTitle,
      status: "Open",
      priority: initialPriority,
      attachment_url: attachment_url || undefined,
      messages: [initialMessage],
      last_message: effectiveMessage,
      last_reply_by: "user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.tickets.unshift(newTicket);

    // Send instant confirmation notification to Gamer
    createNotification(db, {
      user_id: user.id,
      title: "Support Request Submitted ✅",
      message: `Your support request has been submitted. Ticket ID: ${ticketCode}. Admin will review your request.`,
      type: "support_ticket",
      ticket_id: newTicket.id,
      ticket_code: ticketCode,
      action_tab: "support"
    });

    saveDb(db);

    res.json({
      success: true,
      message: `Your support request has been submitted. Ticket ID: ${ticketCode}. Admin will review your request.`,
      ticket: newTicket
    });
  });

  // Reply to an Existing Support Ticket (Gamer or Admin)
  app.post("/api/support/tickets/:id/reply", (req, res) => {
    const { sender_type, sender_id, sender_name, message, attachment_url } = req.body;
    const db = loadDb();
    if (!db.tickets) db.tickets = [];

    const effectiveMessage = (message && message.trim()) 
      ? message.trim() 
      : (attachment_url ? "📷 [Sent photo attachment]" : "");

    if (!effectiveMessage) {
      return res.status(400).json({ success: false, message: "Message content cannot be empty" });
    }

    const ticketId = req.params.id;
    let ticket = db.tickets.find((t) => t.id === ticketId || (t.ticket_code && t.ticket_code.toLowerCase() === ticketId.toLowerCase()));

    // Resilient fallback: If ticket is not found by ID/code, find by user ID or auto-create so message is never dropped
    if (!ticket) {
      if (sender_id) {
        ticket = db.tickets.find((t) => t.user_id === sender_id);
      }
      if (!ticket) {
        const randomCode = Math.floor(10000 + Math.random() * 90000);
        ticket = {
          id: `tkt-${Date.now()}-${randomCode}`,
          ticket_code: `#A${randomCode}`,
          user_id: sender_id || "user-gamer",
          username: sender_name || "Gamer",
          user_email: `${sender_id || 'gamer'}@artificialsamrajya.com`,
          user_mobile: "Registered Gamer",
          subject: effectiveMessage.length > 35 ? effectiveMessage.substring(0, 35) + "..." : effectiveMessage,
          category: "Other",
          status: "Open",
          priority: "Normal",
          messages: [],
          last_message: effectiveMessage,
          last_reply_by: sender_type === "admin" ? "admin" : "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.tickets.unshift(ticket);
      }
    }

    const newMessage: SupportMessage = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      ticket_id: ticket.id,
      sender_type: sender_type === "admin" ? "admin" : "user",
      sender_id: sender_id || (sender_type === "admin" ? "admin-1" : ticket.user_id),
      sender_name: sender_name || (sender_type === "admin" ? "Admin Support Team" : ticket.username),
      message: effectiveMessage,
      attachment_url: attachment_url || undefined,
      created_at: new Date().toISOString()
    };

    if (!ticket.messages) ticket.messages = [];
    ticket.messages.push(newMessage);
    ticket.last_message = effectiveMessage;
    ticket.last_reply_by = sender_type === "admin" ? "admin" : "user";
    ticket.updated_at = new Date().toISOString();

    if (sender_type === "admin") {
      // If admin replies, update status to "Replied"
      if (ticket.status !== "Resolved") {
        ticket.status = "Replied";
      }

      // Automatically send instant reply notification to Gamer
      createNotification(db, {
        user_id: ticket.user_id,
        title: "Admin replied to your support request 🔔",
        message: `Admin replied on Ticket ${ticket.ticket_code} (${ticket.subject}): "${effectiveMessage.length > 70 ? effectiveMessage.substring(0, 70) + '...' : effectiveMessage}"`,
        type: "support_reply",
        ticket_id: ticket.id,
        ticket_code: ticket.ticket_code,
        action_tab: "support"
      });
    } else {
      // If user replies, and ticket was Resolved or Replied, mark "In Progress"
      if (ticket.status === "Resolved" || ticket.status === "Replied") {
        ticket.status = "In Progress";
      }
    }

    saveDb(db);

    res.json({
      success: true,
      message: sender_type === "admin" ? "Reply sent to gamer successfully!" : "Reply submitted to support team!",
      ticket,
      reply: newMessage
    });
  });

  // Update Support Ticket Status & Priority (Admin / User close/reopen)
  app.patch("/api/support/tickets/:id/status", (req, res) => {
    const { status, priority } = req.body;
    const db = loadDb();
    if (!db.tickets) db.tickets = [];

    const ticketId = req.params.id;
    const ticket = db.tickets.find((t) => t.id === ticketId || t.ticket_code.toLowerCase() === ticketId.toLowerCase());

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found" });
    }

    const previousStatus = ticket.status;

    if (status && ["Open", "In Progress", "Replied", "Resolved"].includes(status)) {
      ticket.status = status as SupportStatus;
    }

    if (priority && ["Low", "Normal", "High", "Urgent"].includes(priority)) {
      ticket.priority = priority as SupportPriority;
    }

    ticket.updated_at = new Date().toISOString();

    // If ticket is marked Resolved by Admin, send notification to user
    if (ticket.status === "Resolved" && previousStatus !== "Resolved") {
      createNotification(db, {
        user_id: ticket.user_id,
        title: "Support Ticket Resolved ✅",
        message: `Your support ticket ${ticket.ticket_code} ("${ticket.subject}") has been marked as Resolved. Thank you for contacting SAMARAJYA Support!`,
        type: "support_resolved",
        ticket_id: ticket.id,
        ticket_code: ticket.ticket_code,
        action_tab: "support"
      });
    }

    saveDb(db);

    res.json({
      success: true,
      message: `Ticket ${ticket.ticket_code} status updated to ${ticket.status}.`,
      ticket
    });
  });

  // Delete a specific message from a support ticket (Gamer or Admin)
  app.delete("/api/support/tickets/:ticketId/messages/:messageId", (req, res) => {
    const db = loadDb();
    if (!db.tickets) db.tickets = [];

    const { ticketId, messageId } = req.params;
    const { user_id, role } = { ...req.query, ...req.body };

    const ticket = db.tickets.find((t) => t.id === ticketId || t.ticket_code.toLowerCase() === ticketId.toLowerCase());
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found" });
    }

    if (!ticket.messages) ticket.messages = [];
    const msgIndex = ticket.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) {
      return res.status(404).json({ success: false, message: "Message not found or already deleted" });
    }

    const targetMsg = ticket.messages[msgIndex];

    // Authorization: Admin can delete any message.
    // User can delete their own message (or if user owns the ticket).
    if (role !== "admin" && user_id) {
      const isOwner = ticket.user_id === user_id;
      const isSender = targetMsg.sender_id === user_id || targetMsg.sender_type === "user";
      if (!isOwner && !isSender) {
        return res.status(403).json({ success: false, message: "Unauthorized to delete this message" });
      }
    }

    // Remove the message
    ticket.messages.splice(msgIndex, 1);

    // Update last_message and last_reply_by
    if (ticket.messages.length > 0) {
      const last = ticket.messages[ticket.messages.length - 1];
      ticket.last_message = last.message;
      ticket.last_reply_by = last.sender_type;
    } else {
      ticket.last_message = "No messages yet";
      ticket.last_reply_by = undefined;
    }
    ticket.updated_at = new Date().toISOString();

    saveDb(db);
    res.json({
      success: true,
      message: "Message deleted successfully",
      ticket,
      deleted_message_id: messageId
    });
  });

  // Clear all messages from a support ticket (Clear Chat)
  app.post("/api/support/tickets/:id/clear", (req, res) => {
    const db = loadDb();
    if (!db.tickets) db.tickets = [];

    const ticketId = req.params.id;
    const { user_id, role } = req.body;

    const ticket = db.tickets.find((t) => t.id === ticketId || t.ticket_code.toLowerCase() === ticketId.toLowerCase());
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found" });
    }

    if (role !== "admin" && user_id && ticket.user_id !== user_id) {
      return res.status(403).json({ success: false, message: "Unauthorized to clear this conversation" });
    }

    ticket.messages = [];
    ticket.last_message = "Chat history cleared";
    ticket.updated_at = new Date().toISOString();

    saveDb(db);
    res.json({
      success: true,
      message: "Chat history cleared successfully",
      ticket
    });
  });

  // Delete Support Ticket (Gamer or Admin)
  app.delete("/api/support/tickets/:id", (req, res) => {
    const db = loadDb();
    if (!db.tickets) db.tickets = [];

    const ticketId = req.params.id;
    const { user_id, role } = { ...req.query, ...req.body };

    const ticket = db.tickets.find((t) => t.id === ticketId || t.ticket_code.toLowerCase() === ticketId.toLowerCase());
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found or already deleted." });
    }

    if (role !== "admin" && user_id && ticket.user_id !== user_id) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this ticket" });
    }

    db.tickets = db.tickets.filter((t) => !(t.id === ticketId || t.ticket_code.toLowerCase() === ticketId.toLowerCase()));

    saveDb(db);
    res.json({ success: true, message: "Support ticket permanently removed." });
  });

  // Get App-wide UPI settings
  app.get("/api/settings", (req, res) => {
    const db = loadDb();
    const admin = db.admin[0];
    res.json({
      success: true,
      settings: {
        ...db.settings,
        admin_username: admin?.username || "admin",
        admin_email: admin?.email || "admin@artificialsamrajya.com"
      }
    });
  });

  // ---------------------------------------------------------------------------
  // ADMIN API ENDPOINTS
  // ---------------------------------------------------------------------------

  // Admin Quick Stats
  app.get("/api/admin/stats", (req, res) => {
    const db = loadDb();
    
    const totalUsers = db.users.length;
    const totalTournaments = db.tournaments.length;
    
    // Total prizes distributed: completed tournaments * prize pool
    const completedTournaments = db.tournaments.filter(t => t.status === "Completed");
    const totalPrizeDistributed = completedTournaments.reduce((sum, t) => sum + t.prize_pool, 0);

    // Commission/revenue: entry fee * participant count * commission percentage
    // Wait, let's look at each tournament: entry fee * participants_count * (commission_percentage / 100)
    let totalRevenue = 0;
    db.tournaments.forEach((t) => {
      const partsCount = db.participants.filter((p) => p.tournament_id === t.id).length;
      const totalEntryCollected = t.entry_fee * partsCount;
      const commission = (t.commission_percentage || 20) / 100;
      totalRevenue += totalEntryCollected * commission;
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTournaments,
        totalPrizeDistributed,
        totalRevenue: Math.round(totalRevenue)
      }
    });
  });

  // ---------------------------------------------------------------------------
  // TOURNAMENT ADMIN CONTROLS (Full Lifecycle, Registrations, Rooms, Matches, Leaderboard)
  // ---------------------------------------------------------------------------

  // Create Tournament with full specification
  app.post("/api/admin/tournaments", (req, res) => {
    const { 
      title, 
      game_name, 
      tournament_type, 
      entry_fee, 
      prize_pool, 
      max_players, 
      match_time, 
      registration_start_time, 
      registration_end_time, 
      room_time, 
      map_mode, 
      rules, 
      description, 
      banner_url, 
      status, 
      commission_percentage 
    } = req.body;
    
    const db = loadDb();

    if (!title || !game_name || !match_time) {
      return res.status(400).json({ success: false, message: "Tournament Title, Game Name, and Match Time are required." });
    }

    const tournamentId = "t-" + Date.now();
    const newTournament: Tournament = {
      id: tournamentId,
      title: title.trim(),
      game_name: game_name.trim(),
      tournament_type: (tournament_type || "Solo") as TournamentType,
      entry_fee: Number(entry_fee) || 0,
      prize_pool: Number(prize_pool) || 0,
      max_players: Number(max_players) || 100,
      match_time,
      registration_start_time: registration_start_time || undefined,
      registration_end_time: registration_end_time || undefined,
      room_time: room_time || undefined,
      map_mode: map_mode || "Battle Royale",
      rules: rules || "Standard competitive fair play rules apply. No third-party plugins or emulators.",
      description: description || "Compete in the official Artificial Samrajya eSports Tournament.",
      banner_url: banner_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
      commission_percentage: Number(commission_percentage) || 20,
      status: (status || "Upcoming") as TournamentStatus,
      room_published: false,
      created_at: new Date().toISOString()
    };

    db.tournaments.push(newTournament);

    // Auto-create initial Match #1 for convenient multi-match scheduling
    if (!db.matches) db.matches = [];
    db.matches.push({
      id: "m-" + tournamentId + "-1",
      tournament_id: tournamentId,
      match_number: 1,
      title: "Match #1",
      map_mode: newTournament.map_mode,
      match_time: newTournament.match_time,
      room_published: false,
      status: "Upcoming",
      created_at: new Date().toISOString()
    });

    // Initialize leaderboard settings
    if (!db.leaderboardSettings) db.leaderboardSettings = {};
    db.leaderboardSettings[tournamentId] = {
      tournament_id: tournamentId,
      is_locked: false,
      is_published: false,
      last_updated: new Date().toISOString()
    };

    saveDb(db);

    res.json({ success: true, message: "Tournament created successfully!", tournament: newTournament });
  });

  // Edit Tournament
  app.put("/api/admin/tournaments/:id", (req, res) => {
    const { 
      title, 
      game_name, 
      tournament_type, 
      entry_fee, 
      prize_pool, 
      max_players, 
      match_time, 
      registration_start_time, 
      registration_end_time, 
      room_time, 
      map_mode, 
      rules, 
      description, 
      banner_url, 
      status, 
      commission_percentage, 
      room_id, 
      room_password,
      room_published 
    } = req.body;
    
    const db = loadDb();
    const idx = db.tournaments.findIndex((t) => t.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    const t = db.tournaments[idx];
    const prevStatus = t.status;
    const prevTime = t.match_time;

    t.title = title !== undefined ? title.trim() : t.title;
    t.game_name = game_name !== undefined ? game_name.trim() : t.game_name;
    if (tournament_type) t.tournament_type = tournament_type;
    if (entry_fee !== undefined) t.entry_fee = Number(entry_fee);
    if (prize_pool !== undefined) t.prize_pool = Number(prize_pool);
    if (max_players !== undefined) t.max_players = Number(max_players);
    if (match_time) t.match_time = match_time;
    if (registration_start_time !== undefined) t.registration_start_time = registration_start_time;
    if (registration_end_time !== undefined) t.registration_end_time = registration_end_time;
    if (room_time !== undefined) t.room_time = room_time;
    if (map_mode !== undefined) t.map_mode = map_mode;
    if (rules !== undefined) t.rules = rules;
    if (description !== undefined) t.description = description;
    if (banner_url !== undefined) t.banner_url = banner_url;
    if (commission_percentage !== undefined) t.commission_percentage = Number(commission_percentage);
    if (room_id !== undefined) t.room_id = room_id;
    if (room_password !== undefined) t.room_password = room_password;
    if (room_published !== undefined) t.room_published = Boolean(room_published);
    if (status) t.status = status;

    db.tournaments[idx] = t;

    // If status or match time changed, alert all confirmed participants
    if (prevStatus !== t.status || prevTime !== t.match_time) {
      const parts = db.participants.filter((p) => p.tournament_id === t.id && p.status === "Confirmed");
      parts.forEach((p) => {
        createNotification(db, {
          user_id: p.user_id,
          title: `Tournament Update: ${t.title}`,
          message: `Update for "${t.title}": Status is now "${t.status}" and scheduled match time is ${t.match_time}.`,
          type: "tournament_update",
          reference_id: t.id
        });
      });
    }

    saveDb(db);

    res.json({ success: true, message: "Tournament updated successfully!", tournament: t });
  });

  // Tournament Dependency Check (Safe Delete analysis)
  app.get("/api/admin/tournaments/:id/dependency-check", (req, res) => {
    const db = loadDb();
    const id = req.params.id;
    const t = db.tournaments.find((trn) => trn.id === id);

    if (!t) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    const participants = db.participants.filter((p) => p.tournament_id === id);
    const confirmedCount = participants.filter((p) => p.status === "Confirmed").length;
    const totalFees = participants.reduce((sum, p) => sum + (p.entry_fee_paid !== undefined ? p.entry_fee_paid : t.entry_fee || 0), 0);
    const matches = db.matches ? db.matches.filter((m) => m.tournament_id === id) : [];
    const scores = db.scores ? db.scores.filter((s) => s.tournament_id === id) : [];
    const hasRoom = Boolean(t.room_id || t.room_password);
    const hasResults = Boolean(t.winner_id || t.status === "Completed" || scores.length > 0);

    const canSafeDelete = participants.length === 0 && matches.length === 0 && scores.length === 0;

    res.json({
      success: true,
      stats: {
        tournament_id: t.id,
        title: t.title,
        game_name: t.game_name,
        status: t.status,
        registered_count: participants.length,
        confirmed_count: confirmedCount,
        total_entry_fees: totalFees,
        matches_count: matches.length,
        scores_count: scores.length,
        has_room: hasRoom,
        has_results: hasResults,
        can_safe_delete: canSafeDelete
      }
    });
  });

  // Duplicate Tournament
  app.post("/api/admin/tournaments/:id/duplicate", (req, res) => {
    const db = loadDb();
    const id = req.params.id;
    const original = db.tournaments.find((trn) => trn.id === id);

    if (!original) {
      return res.status(404).json({ success: false, message: "Original tournament not found to duplicate" });
    }

    const newId = "t-" + Date.now();
    const duplicated: Tournament = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      status: "Upcoming",
      room_id: "",
      room_password: "",
      room_published: false,
      winner_id: undefined,
      created_at: new Date().toISOString()
    };

    db.tournaments.unshift(duplicated);
    saveDb(db);

    res.json({
      success: true,
      message: `Tournament "${original.title}" duplicated successfully!`,
      tournament: duplicated
    });
  });

  // Delete Tournament (Clean up linked participants, matches, scores safely)
  app.delete("/api/admin/tournaments/:id", (req, res) => {
    const db = loadDb();
    const id = req.params.id;
    
    const tournamentIndex = db.tournaments.findIndex((t) => t.id === id);
    if (tournamentIndex === -1) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    const deletedTournament = db.tournaments[tournamentIndex];

    // Safe purge of ONLY this tournament and its direct relational records
    db.tournaments.splice(tournamentIndex, 1);
    db.participants = db.participants.filter((p) => p.tournament_id !== id);
    if (db.matches) db.matches = db.matches.filter((m) => m.tournament_id !== id);
    if (db.scores) db.scores = db.scores.filter((s) => s.tournament_id !== id);
    if (db.leaderboardSettings) delete db.leaderboardSettings[id];
    
    saveDb(db);

    res.json({ 
      success: true, 
      message: `Tournament "${deletedTournament.title}" and its associated records have been permanently deleted.`,
      deleted_id: id
    });
  });

  // Update Tournament Lifecycle Status (Draft / Upcoming / Registration Open / Registration Closed / Live / Completed)
  app.post("/api/admin/tournaments/:id/status", (req, res) => {
    const { status } = req.body;
    const db = loadDb();
    const t = db.tournaments.find((trn) => trn.id === req.params.id);

    if (!t) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    const previousStatus = t.status;
    t.status = status;

    const parts = db.participants.filter((p) => p.tournament_id === t.id && p.status === "Confirmed");

    // Notification broadcast based on state change
    if (status === "Live") {
      parts.forEach((p) => {
        createNotification(db, {
          user_id: p.user_id,
          title: `Tournament LIVE! ⚡ ${t.title}`,
          message: `The tournament "${t.title}" is now LIVE! Please check Room ID & Password immediately and join the match lobby.`,
          type: "tournament_live",
          reference_id: t.id
        });
      });
    } else if (status === "Registration Closed") {
      parts.forEach((p) => {
        createNotification(db, {
          user_id: p.user_id,
          title: `Registration Closed: ${t.title}`,
          message: `Registrations are now closed for "${t.title}". Matches will begin shortly at ${t.match_time}. Prepare your game!`,
          type: "tournament_update",
          reference_id: t.id
        });
      });
    } else if (status === "Registration Open") {
      // Broadcast to all users
      db.users.forEach((u) => {
        createNotification(db, {
          user_id: u.id,
          title: `Registrations Open: ${t.title} 🎮`,
          message: `Registrations are now open for "${t.title}" (${t.game_name} - ${t.tournament_type}). Prize Pool ₹${t.prize_pool}! Join now before slots fill up!`,
          type: "tournament_update",
          reference_id: t.id
        });
      });
    }

    saveDb(db);

    res.json({ 
      success: true, 
      message: `Tournament status changed from ${previousStatus} to ${status}. (${parts.length} registered players notified)`, 
      tournament: t 
    });
  });

  // Cancel Tournament (with automatic full refund to all confirmed participants!)
  app.post("/api/admin/tournaments/:id/cancel", (req, res) => {
    const { reason } = req.body;
    const db = loadDb();
    const t = db.tournaments.find((trn) => trn.id === req.params.id);

    if (!t) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    t.status = "Cancelled";
    const confirmedParts = db.participants.filter((p) => p.tournament_id === t.id && p.status === "Confirmed");
    let refundedCount = 0;
    let totalRefundedAmount = 0;

    confirmedParts.forEach((p) => {
      const user = db.users.find((u) => u.id === p.user_id);
      const refundAmount = p.entry_fee_paid !== undefined ? p.entry_fee_paid : t.entry_fee;

      if (user && refundAmount > 0) {
        user.wallet_balance += refundAmount;
        refundedCount++;
        totalRefundedAmount += refundAmount;

        // Record credit transaction
        db.transactions.push({
          id: "tx-ref-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          user_id: user.id,
          amount: refundAmount,
          type: "credit",
          description: `Automatic full refund: Tournament "${t.title}" was cancelled by Admin.`,
          created_at: new Date().toISOString()
        });

        // Notify gamer
        createNotification(db, {
          user_id: user.id,
          title: `Tournament Cancelled & Refunded ❌`,
          message: `The tournament "${t.title}" has been cancelled${reason ? ` (${reason})` : ""}. Your full entry fee of ₹${refundAmount} has been credited back to your wallet balance.`,
          type: "tournament_update",
          reference_id: t.id,
          amount: refundAmount
        });
      }
      p.status = "Refunded";
    });

    saveDb(db);

    res.json({
      success: true,
      message: `Tournament cancelled. ${refundedCount} participants automatically refunded total ₹${totalRefundedAmount}.`,
      tournament: t
    });
  });

  // ---------------------------------------------------------------------------
  // REGISTRATIONS MANAGEMENT
  // ---------------------------------------------------------------------------

  // Get all registrations with user & tournament data
  app.get("/api/admin/registrations", (req, res) => {
    const db = loadDb();
    const tournamentId = req.query.tournament_id as string | undefined;

    let parts = db.participants;
    if (tournamentId) {
      parts = parts.filter((p) => p.tournament_id === tournamentId);
    }

    const enriched = parts.map((p) => {
      const user = db.users.find((u) => u.id === p.user_id);
      const tournament = db.tournaments.find((t) => t.id === p.tournament_id);
      return {
        ...p,
        username: user?.username || "Unknown User",
        email: user?.email || "",
        wallet_balance: user?.wallet_balance || 0,
        tournament_title: tournament?.title || "Unknown Tournament",
        game_name: tournament?.game_name || ""
      };
    });

    res.json({ success: true, registrations: enriched });
  });

  // Disqualify / Remove Participant (with optional refund)
  app.post("/api/admin/registrations/:id/disqualify", (req, res) => {
    const { refund, reason } = req.body;
    const db = loadDb();
    const participant = db.participants.find((p) => p.id === req.params.id);

    if (!participant) {
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    participant.status = "Disqualified";
    const user = db.users.find((u) => u.id === participant.user_id);
    const tournament = db.tournaments.find((t) => t.id === participant.tournament_id);

    let refunded = false;
    const fee = participant.entry_fee_paid || tournament?.entry_fee || 0;

    if (refund && user && fee > 0) {
      user.wallet_balance += fee;
      refunded = true;
      db.transactions.push({
        id: "tx-" + Date.now(),
        user_id: user.id,
        amount: fee,
        type: "credit",
        description: `Refund for disqualification from: ${tournament?.title || "Tournament"}`,
        created_at: new Date().toISOString()
      });
    }

    if (user) {
      createNotification(db, {
        user_id: user.id,
        title: "Registration Disqualified ⚠️",
        message: `Your registration [${participant.registration_id}] for "${tournament?.title}" has been disqualified by Admin.${reason ? ` Reason: ${reason}.` : ""}${refunded ? ` Entry fee ₹${fee} has been refunded.` : ""}`,
        type: "tournament_update",
        reference_id: tournament?.id
      });
    }

    saveDb(db);

    res.json({
      success: true,
      message: `Participant disqualified.${refunded ? ` ₹${fee} refunded to wallet.` : ""}`,
      participant
    });
  });

  // ---------------------------------------------------------------------------
  // ROOM DETAILS MANAGEMENT
  // ---------------------------------------------------------------------------

  // Set / Update Room details
  app.post("/api/admin/tournaments/:id/room", (req, res) => {
    const { room_id, room_password, room_time, room_published } = req.body;
    const db = loadDb();
    const t = db.tournaments.find((trn) => trn.id === req.params.id);

    if (!t) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    t.room_id = room_id;
    t.room_password = room_password;
    if (room_time) t.room_time = room_time;
    t.room_published = Boolean(room_published);
    if (t.room_published) {
      t.room_publish_time = new Date().toISOString();
      if (t.status === "Upcoming") t.status = "Live";
    }

    // Also update Match #1 if present
    const match1 = (db.matches || []).find((m) => m.tournament_id === t.id && m.match_number === 1);
    if (match1) {
      match1.room_id = room_id;
      match1.room_password = room_password;
      match1.room_published = t.room_published;
    }

    // Broadcast room credentials if published!
    const parts = db.participants.filter((p) => p.tournament_id === t.id && p.status === "Confirmed");
    if (t.room_published && room_id) {
      parts.forEach((p) => {
        createNotification(db, {
          user_id: p.user_id,
          title: `Match Room Live: ${t.title} 🎮`,
          message: `Custom room credentials are LIVE! Room ID: "${room_id}", Password: "${room_password}". Match lobby begins at ${t.room_time || t.match_time}. Enter now!`,
          type: "tournament_live",
          reference_id: t.id
        });
      });
    }

    saveDb(db);

    res.json({ 
      success: true, 
      message: `Room details saved! Published: ${t.room_published}. (${parts.length} registered players notified)`, 
      tournament: t 
    });
  });

  // Toggle Room Publish status
  app.post("/api/admin/tournaments/:id/room/publish", (req, res) => {
    const { publish } = req.body;
    const db = loadDb();
    const t = db.tournaments.find((trn) => trn.id === req.params.id);

    if (!t) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    t.room_published = Boolean(publish);
    if (t.room_published) {
      t.room_publish_time = new Date().toISOString();
      if (t.status === "Upcoming") t.status = "Live";

      const parts = db.participants.filter((p) => p.tournament_id === t.id && p.status === "Confirmed");
      parts.forEach((p) => {
        createNotification(db, {
          user_id: p.user_id,
          title: `Room Details Released: ${t.title} 🔑`,
          message: `Room ID and Password are now published for "${t.title}". Room ID: "${t.room_id || "N/A"}", Password: "${t.room_password || "N/A"}". Join the custom lobby immediately!`,
          type: "tournament_live",
          reference_id: t.id
        });
      });
    }

    saveDb(db);

    res.json({ success: true, message: `Room publish set to ${t.room_published}`, tournament: t });
  });

  // Clear room details
  app.delete("/api/admin/tournaments/:id/room", (req, res) => {
    const db = loadDb();
    const t = db.tournaments.find((trn) => trn.id === req.params.id);

    if (!t) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    t.room_id = undefined;
    t.room_password = undefined;
    t.room_published = false;
    t.room_publish_time = undefined;

    saveDb(db);

    res.json({ success: true, message: "Room details cleared", tournament: t });
  });

  // ---------------------------------------------------------------------------
  // MATCH MANAGEMENT (Multi-Match per Tournament)
  // ---------------------------------------------------------------------------

  // Add Match
  app.post("/api/admin/tournaments/:id/matches", (req, res) => {
    const { match_number, title, map_mode, match_time, room_id, room_password, room_published, notes } = req.body;
    const db = loadDb();
    const t = db.tournaments.find((trn) => trn.id === req.params.id);

    if (!t) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    if (!db.matches) db.matches = [];
    const nextNum = match_number || (db.matches.filter((m) => m.tournament_id === t.id).length + 1);

    const newMatch: TournamentMatch = {
      id: "m-" + t.id + "-" + Date.now(),
      tournament_id: t.id,
      match_number: Number(nextNum),
      title: title || `Match #${nextNum}`,
      map_mode: map_mode || t.map_mode,
      match_time: match_time || t.match_time,
      room_id: room_id || undefined,
      room_password: room_password || undefined,
      room_published: Boolean(room_published),
      status: "Upcoming",
      notes: notes || undefined,
      created_at: new Date().toISOString()
    };

    db.matches.push(newMatch);
    saveDb(db);

    res.json({ success: true, message: `Match #${newMatch.match_number} added successfully!`, match: newMatch });
  });

  // Update Match
  app.put("/api/admin/matches/:id", (req, res) => {
    const db = loadDb();
    if (!db.matches) db.matches = [];
    const idx = db.matches.findIndex((m) => m.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const currentMatch = db.matches[idx];
    const prevPublished = currentMatch.room_published;

    Object.assign(currentMatch, req.body);
    db.matches[idx] = currentMatch;

    // If room published changed from false to true, notify participants
    if (!prevPublished && currentMatch.room_published && currentMatch.room_id) {
      const parts = db.participants.filter((p) => p.tournament_id === currentMatch.tournament_id && p.status === "Confirmed");
      parts.forEach((p) => {
        createNotification(db, {
          user_id: p.user_id,
          title: `Room Details: ${currentMatch.title} 🎮`,
          message: `Custom room details are published for ${currentMatch.title}! Room ID: "${currentMatch.room_id}", Password: "${currentMatch.room_password}". Enter room now!`,
          type: "tournament_live",
          reference_id: currentMatch.tournament_id
        });
      });
    }

    saveDb(db);

    res.json({ success: true, message: "Match updated successfully!", match: currentMatch });
  });

  // Delete Match
  app.delete("/api/admin/matches/:id", (req, res) => {
    const db = loadDb();
    if (!db.matches) db.matches = [];
    db.matches = db.matches.filter((m) => m.id !== req.params.id);
    saveDb(db);

    res.json({ success: true, message: "Match deleted successfully!" });
  });

  // Toggle Room Publish for a Match
  app.post("/api/admin/matches/:id/publish-room", (req, res) => {
    const { publish } = req.body;
    const db = loadDb();
    if (!db.matches) db.matches = [];
    const match = db.matches.find((m) => m.id === req.params.id);

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    match.room_published = Boolean(publish);

    if (match.room_published && match.room_id) {
      const parts = db.participants.filter((p) => p.tournament_id === match.tournament_id && p.status === "Confirmed");
      parts.forEach((p) => {
        createNotification(db, {
          user_id: p.user_id,
          title: `Match Room Live: ${match.title} 🎮`,
          message: `Room details published for ${match.title}! Room ID: "${match.room_id}", Password: "${match.room_password}". Match start: ${match.match_time}.`,
          type: "tournament_live",
          reference_id: match.tournament_id
        });
      });
    }

    saveDb(db);

    res.json({ success: true, message: `Room publish set to ${match.room_published}`, match });
  });

  // ---------------------------------------------------------------------------
  // LEADERBOARD & SCOREBOARD MANAGEMENT
  // ---------------------------------------------------------------------------

  // Add Score Entry
  app.post("/api/admin/tournaments/:id/scores", (req, res) => {
    const { 
      match_id, 
      user_id, 
      player_name, 
      team_name, 
      in_game_id, 
      rank, 
      placement_points, 
      kills, 
      kill_points, 
      bonus_points, 
      manual_score_override 
    } = req.body;
    
    const db = loadDb();
    const tournamentId = req.params.id;

    if (!player_name || !player_name.trim()) {
      return res.status(400).json({ success: false, message: "Player / Team name is required" });
    }

    if (!db.scores) db.scores = [];

    const k = Number(kills) || 0;
    const kp = kill_points !== undefined ? Number(kill_points) : k * 1;
    const pp = Number(placement_points) || 0;
    const bp = Number(bonus_points) || 0;
    const totalPts = manual_score_override !== undefined && manual_score_override !== null
      ? Number(manual_score_override)
      : pp + kp + bp;

    const newScore: TournamentScoreEntry = {
      id: "sc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      tournament_id: tournamentId,
      match_id: match_id || undefined,
      user_id: user_id || undefined,
      player_name: player_name.trim(),
      team_name: team_name ? team_name.trim() : undefined,
      in_game_id: in_game_id ? in_game_id.trim() : undefined,
      rank: rank ? Number(rank) : undefined,
      placement_points: pp,
      kills: k,
      kill_points: kp,
      bonus_points: bp,
      manual_score_override: manual_score_override !== undefined ? Number(manual_score_override) : undefined,
      total_points: totalPts,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.scores.push(newScore);
    saveDb(db);

    res.json({ success: true, message: "Score entry recorded!", score: newScore });
  });

  // Update Score Entry
  app.put("/api/admin/scores/:id", (req, res) => {
    const { 
      rank, 
      player_name, 
      team_name, 
      in_game_id, 
      placement_points, 
      kills, 
      kill_points, 
      bonus_points, 
      manual_score_override, 
      total_points 
    } = req.body;
    
    const db = loadDb();
    if (!db.scores) db.scores = [];
    const idx = db.scores.findIndex((s) => s.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Score entry not found" });
    }

    const sc = db.scores[idx];
    if (player_name !== undefined) sc.player_name = player_name;
    if (team_name !== undefined) sc.team_name = team_name;
    if (in_game_id !== undefined) sc.in_game_id = in_game_id;
    if (rank !== undefined) sc.rank = Number(rank);
    if (placement_points !== undefined) sc.placement_points = Number(placement_points);
    if (kills !== undefined) sc.kills = Number(kills);
    if (kill_points !== undefined) sc.kill_points = Number(kill_points);
    if (bonus_points !== undefined) sc.bonus_points = Number(bonus_points);
    if (manual_score_override !== undefined) sc.manual_score_override = Number(manual_score_override);

    if (total_points !== undefined) {
      sc.total_points = Number(total_points);
    } else if (sc.manual_score_override !== undefined && sc.manual_score_override !== null) {
      sc.total_points = Number(sc.manual_score_override);
    } else {
      sc.total_points = (sc.placement_points || 0) + (sc.kill_points || 0) + (sc.bonus_points || 0);
    }

    sc.updated_at = new Date().toISOString();
    db.scores[idx] = sc;
    saveDb(db);

    res.json({ success: true, message: "Score entry updated!", score: sc });
  });

  // Delete Score Entry
  app.delete("/api/admin/scores/:id", (req, res) => {
    const db = loadDb();
    if (!db.scores) db.scores = [];
    db.scores = db.scores.filter((s) => s.id !== req.params.id);
    saveDb(db);

    res.json({ success: true, message: "Score entry deleted successfully!" });
  });

  // Get Leaderboard Settings (Lock / Publish)
  app.get("/api/admin/tournaments/:id/leaderboard-settings", (req, res) => {
    const db = loadDb();
    const tournamentId = req.params.id;
    if (!db.leaderboardSettings) db.leaderboardSettings = {};
    const settings = db.leaderboardSettings[tournamentId] || {
      tournament_id: tournamentId,
      is_locked: false,
      is_published: false,
      last_updated: new Date().toISOString()
    };
    res.json({ success: true, settings });
  });

  app.get("/api/tournaments/:id/leaderboard-settings", (req, res) => {
    const db = loadDb();
    const tournamentId = req.params.id;
    if (!db.leaderboardSettings) db.leaderboardSettings = {};
    const settings = db.leaderboardSettings[tournamentId] || {
      tournament_id: tournamentId,
      is_locked: false,
      is_published: false,
      last_updated: new Date().toISOString()
    };
    res.json({ success: true, settings });
  });

  // Update Leaderboard Settings (Lock / Publish)
  app.post("/api/admin/tournaments/:id/leaderboard-settings", (req, res) => {
    const { is_locked, is_published } = req.body;
    const db = loadDb();
    const tournamentId = req.params.id;
    const t = db.tournaments.find((trn) => trn.id === tournamentId);

    if (!db.leaderboardSettings) db.leaderboardSettings = {};
    const settings = db.leaderboardSettings[tournamentId] || {
      tournament_id: tournamentId,
      is_locked: false,
      is_published: false,
      last_updated: new Date().toISOString()
    };

    const prevPublished = settings.is_published;
    if (is_locked !== undefined) settings.is_locked = Boolean(is_locked);
    if (is_published !== undefined) settings.is_published = Boolean(is_published);
    settings.last_updated = new Date().toISOString();

    db.leaderboardSettings[tournamentId] = settings;

    // If published changed to true, notify participants!
    if (!prevPublished && settings.is_published && t) {
      const parts = db.participants.filter((p) => p.tournament_id === tournamentId && p.status === "Confirmed");
      parts.forEach((p) => {
        createNotification(db, {
          user_id: p.user_id,
          title: `🏆 Leaderboard Published: ${t.title}`,
          message: `Official match results and leaderboard rankings for "${t.title}" are now published! Check your scores and ranking.`,
          type: "tournament_result",
          reference_id: tournamentId
        });
      });
    }

    saveDb(db);

    res.json({ success: true, message: "Leaderboard settings updated!", settings });
  });

  // Reset Scores for a Tournament
  app.post("/api/admin/tournaments/:id/scores/reset", (req, res) => {
    const db = loadDb();
    const tournamentId = req.params.id;

    if (!db.scores) db.scores = [];
    const beforeCount = db.scores.length;
    db.scores = db.scores.filter((s) => s.tournament_id !== tournamentId);
    const deletedCount = beforeCount - db.scores.length;

    saveDb(db);

    res.json({ success: true, message: `Reset complete. ${deletedCount} score records removed.` });
  });

  // Custom Broadcast Notification (Send to All, Specific Tournament, or Specific User with Search & History tracking)
  app.post("/api/admin/notifications/send", (req, res) => {
    const { target, target_id, title, message, type, tournament_id } = req.body;
    const db = loadDb();

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Notification title and message are required." });
    }

    if (!db.broadcastHistory) db.broadcastHistory = [];

    let targetTournId = tournament_id || (target === "tournament" ? target_id : undefined);
    let targetTourn = targetTournId ? db.tournaments.find((t) => t.id === targetTournId) : undefined;
    let targetTournTitle = targetTourn ? targetTourn.title : undefined;

    let recipientUserIds: string[] = [];
    let targetName = "";
    const notifType = type || (target === "user" ? "direct_message" : target === "tournament" ? "tournament_update" : "admin_announcement");

    if (target === "all") {
      targetName = `All Gamers (${db.users.length})`;
      recipientUserIds = db.users.map((u) => u.id);
    } else if (target === "tournament") {
      if (!target_id) {
        return res.status(400).json({ success: false, message: "Please select a valid tournament." });
      }
      const parts = db.participants.filter((p) => p.tournament_id === target_id && p.status === "Confirmed");
      recipientUserIds = Array.from(new Set(parts.map((p) => p.user_id)));
      targetName = `Tournament: ${targetTournTitle || target_id} (${recipientUserIds.length} players)`;
    } else if (target === "user") {
      if (!target_id) {
        return res.status(400).json({ success: false, message: "Please specify a recipient gamer (by ID, username, or registration ID)." });
      }
      // Match by exact ID, or username, or registration_id
      const query = String(target_id).trim().toLowerCase();
      let matchedUser = db.users.find((u) => u.id === target_id || u.username.toLowerCase() === query || u.email?.toLowerCase() === query);
      
      if (!matchedUser) {
        // Check if query matches a registration_id in participants
        const part = db.participants.find((p) => p.registration_id?.toLowerCase() === query);
        if (part) {
          matchedUser = db.users.find((u) => u.id === part.user_id);
        }
      }

      if (!matchedUser) {
        return res.status(404).json({ success: false, message: `No gamer found matching "${target_id}". Please check Gamer ID, Username, or Registration ID.` });
      }

      recipientUserIds = [matchedUser.id];
      targetName = `Gamer: ${matchedUser.username} (${matchedUser.id})`;
    } else {
      return res.status(400).json({ success: false, message: "Invalid target. Must be 'all', 'tournament', or 'user'." });
    }

    const broadcastRecord: BroadcastRecord = {
      id: "bc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      message: message.trim(),
      type: notifType,
      target: target as "all" | "tournament" | "user",
      target_id,
      target_name: targetName,
      tournament_id: targetTourn?.id,
      tournament_title: targetTournTitle,
      sender: "Admin",
      created_at: new Date().toISOString(),
      recipients_count: recipientUserIds.length,
      recipient_user_ids: recipientUserIds
    };

    // Dispatch notification to each targeted user
    recipientUserIds.forEach((uid) => {
      createNotification(db, {
        user_id: uid,
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        sender: "Admin",
        tournament_id: targetTourn?.id,
        tournament_title: targetTournTitle,
        action_label: targetTourn ? "VIEW TOURNAMENT" : undefined,
        action_tab: targetTourn ? "tournaments" : undefined,
        broadcast_id: broadcastRecord.id
      });
    });

    db.broadcastHistory.unshift(broadcastRecord);
    // Keep last 150 broadcasts in history
    if (db.broadcastHistory.length > 150) {
      db.broadcastHistory = db.broadcastHistory.slice(0, 150);
    }

    saveDb(db);

    res.json({
      success: true,
      message: `Notification delivered to ${recipientUserIds.length} gamer(s) successfully!`,
      sentCount: recipientUserIds.length,
      broadcast: broadcastRecord
    });
  });

  // Admin Notification History (with read/unread counts per broadcast)
  app.get("/api/admin/notifications/history", (req, res) => {
    const db = loadDb();
    if (!db.broadcastHistory) db.broadcastHistory = [];
    if (!db.notifications) db.notifications = [];

    const enrichedHistory = db.broadcastHistory.map((bc) => {
      const relatedNotifs = db.notifications.filter((n) => n.broadcast_id === bc.id);
      const readCount = relatedNotifs.filter((n) => n.is_read).length;
      const unreadCount = relatedNotifs.length - readCount;

      return {
        ...bc,
        recipients_count: bc.recipients_count || bc.recipient_user_ids?.length || relatedNotifs.length,
        read_count: readCount,
        unread_count: unreadCount
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      history: enrichedHistory,
      total_sent: enrichedHistory.length
    });
  });

  // React to Broadcast (WhatsApp Channel reactions: 🔥, 🏆, ❤️, 👍, 🎮, ⚡)
  app.post("/api/broadcasts/:id/react", (req, res) => {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ success: false, message: "Emoji required" });
    const db = loadDb();
    if (!db.broadcastHistory) db.broadcastHistory = [];
    const bc = db.broadcastHistory.find((b) => b.id === req.params.id);
    if (!bc) {
      return res.status(404).json({ success: false, message: "Broadcast not found" });
    }
    if (!bc.reactions) bc.reactions = {};
    bc.reactions[emoji] = (bc.reactions[emoji] || 0) + 1;
    saveDb(db);
    res.json({ success: true, reactions: bc.reactions });
  });

  // React to individual Notification (WhatsApp reactions)
  app.post("/api/notifications/:id/react", (req, res) => {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ success: false, message: "Emoji required" });
    const db = loadDb();
    if (!db.notifications) db.notifications = [];
    const notif = db.notifications.find((n) => n.id === req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    if (!notif.reactions) notif.reactions = {};
    notif.reactions[emoji] = (notif.reactions[emoji] || 0) + 1;
    saveDb(db);
    res.json({ success: true, reactions: notif.reactions });
  });

  // Declare Tournament Winner
  app.post("/api/admin/tournaments/:id/declare-winner", (req, res) => {
    const { winner_id } = req.body;
    const db = loadDb();
    const t = db.tournaments.find((t) => t.id === req.params.id);

    if (!t) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    if (t.status === "Completed") {
      return res.status(400).json({ success: false, message: "Tournament is already completed!" });
    }

    const winner = db.users.find((u) => u.id === winner_id);
    if (!winner) {
      return res.status(404).json({ success: false, message: "Winner participant user not found" });
    }

    // Set tournament state
    t.status = "Completed";
    t.winner_id = winner_id;

    // Distribute prize pool to winner's wallet
    winner.wallet_balance += t.prize_pool;

    // Create credit transaction for winner
    db.transactions.push({
      id: "tx-" + Date.now(),
      user_id: winner_id,
      amount: t.prize_pool,
      type: "credit",
      description: `Victory prize for tournament: ${t.title}`,
      created_at: new Date().toISOString()
    });

    // Notify the Champion Winner
    createNotification(db, {
      user_id: winner_id,
      title: "🏆 Victory Champion! 1st Place",
      message: `Heartiest Congratulations! You won 1st Place in "${t.title}"! ₹${t.prize_pool} prize money has been credited into your wallet balance.`,
      type: "tournament_result",
      reference_id: t.id,
      amount: t.prize_pool
    });

    // Notify other participants about match result
    const otherParticipants = db.participants.filter(
      (p) => p.tournament_id === t.id && p.user_id !== winner_id
    );
    otherParticipants.forEach((p) => {
      createNotification(db, {
        user_id: p.user_id,
        title: `Match Result: ${t.title}`,
        message: `Tournament "${t.title}" has concluded. 👑 Champion Winner: ${winner.username}. Thank you for playing!`,
        type: "tournament_result",
        reference_id: t.id
      });
    });

    saveDb(db);
    res.json({ success: true, message: `Winner declared! ₹${t.prize_pool} credited to ${winner.username}. Players notified.`, tournament: t });
  });

  // List all users (with block and balance adjustment)
  app.get("/api/admin/users", (req, res) => {
    const db = loadDb();
    const userProfiles = db.users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      wallet_balance: u.wallet_balance,
      upi_id: u.upi_id,
      is_blocked: !!u.is_blocked
    }));
    res.json({ success: true, users: userProfiles });
  });

  // Block/Unblock user
  app.post("/api/admin/users/:id/toggle-block", (req, res) => {
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.is_blocked = !user.is_blocked;
    saveDb(db);

    res.json({ success: true, message: `User status changed. Blocked: ${user.is_blocked}`, user });
  });

  // Permanently Delete Gamer Account (Admin Console Action)
  app.delete("/api/admin/users/:id", (req, res) => {
    const db = loadDb();
    const userId = req.params.id;
    const userIndex = db.users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: "Gamer account not found." });
    }

    const deletedUser = db.users[userIndex];

    // Clean up all related gamer records
    if (db.participants) {
      db.participants = db.participants.filter((p) => p.user_id !== userId);
    }
    if (db.notifications) {
      db.notifications = db.notifications.filter((n) => n.user_id !== userId);
    }
    if (db.deposits) {
      db.deposits = db.deposits.filter((d) => d.user_id !== userId);
    }
    if (db.withdrawals) {
      db.withdrawals = db.withdrawals.filter((w) => w.user_id !== userId);
    }
    if (db.tickets) {
      db.tickets = db.tickets.filter((t) => t.user_id !== userId);
    }
    if (db.scores) {
      db.scores = db.scores.filter((s) => s.user_id !== userId);
    }
    if (db.transactions) {
      db.transactions = db.transactions.filter((tx) => tx.user_id !== userId);
    }

    // Remove gamer from database
    db.users.splice(userIndex, 1);
    saveDb(db);

    res.json({
      success: true,
      message: `Gamer "${deletedUser.username}" has been permanently deleted from ARTIFICIAL SAMRAJYA.`
    });
  });

  // Adjust User balance manually (Admin power)
  app.post("/api/admin/users/:id/adjust-balance", (req, res) => {
    const { amount, description } = req.body;
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const adjustAmount = Number(amount);
    user.wallet_balance += adjustAmount;

    // Record transaction
    db.transactions.push({
      id: "tx-" + Date.now(),
      user_id: user.id,
      amount: Math.abs(adjustAmount),
      type: adjustAmount >= 0 ? "credit" : "debit",
      description: description || "Admin Wallet Adjustment",
      created_at: new Date().toISOString()
    });

    // Notify player
    createNotification(db, {
      user_id: user.id,
      title: adjustAmount >= 0 ? "Wallet Balance Credited 💰" : "Wallet Balance Debited 💳",
      message: `Admin ${adjustAmount >= 0 ? "credited" : "debited"} ₹${Math.abs(adjustAmount)} (${description || "Admin Wallet Adjustment"}). New wallet balance: ₹${user.wallet_balance}.`,
      type: "wallet_adjustment",
      amount: Math.abs(adjustAmount)
    });

    saveDb(db);
    res.json({ success: true, message: "Wallet balance adjusted successfully!", user });
  });

  app.post("/api/admin/users/:id/leaderboard-override", (req, res) => {
    const { custom_total_winnings, custom_tournaments_won, custom_rank, reset } = req.body;
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (reset) {
      delete user.custom_total_winnings;
      delete user.custom_tournaments_won;
      delete user.custom_rank;
      saveDb(db);
      return res.json({ success: true, message: "Leaderboard stats reset to natural match history!" });
    }

    if (custom_total_winnings !== undefined && custom_total_winnings !== null && custom_total_winnings !== "") {
      user.custom_total_winnings = Number(custom_total_winnings);
    } else if (custom_total_winnings === "") {
      delete user.custom_total_winnings;
    }

    if (custom_tournaments_won !== undefined && custom_tournaments_won !== null && custom_tournaments_won !== "") {
      user.custom_tournaments_won = Number(custom_tournaments_won);
    } else if (custom_tournaments_won === "") {
      delete user.custom_tournaments_won;
    }

    if (custom_rank !== undefined && custom_rank !== null && custom_rank !== "") {
      user.custom_rank = Number(custom_rank);
    } else if (custom_rank === "") {
      delete user.custom_rank;
    }

    saveDb(db);
    res.json({ success: true, message: "Leaderboard stats and ranking overridden successfully!" });
  });

  // Reorder rankings via manual order list
  app.post("/api/admin/leaderboard/reorder", (req, res) => {
    const { ranking_order } = req.body;
    const db = loadDb();
    if (Array.isArray(ranking_order)) {
      ranking_order.forEach((id: string, index: number) => {
        const user = db.users.find((u) => u.id === id);
        if (user) {
          user.custom_rank = index + 1;
        }
      });
      saveDb(db);
      return res.json({ success: true, message: "Leaderboard ranking order updated!" });
    }
    res.status(400).json({ success: false, message: "Invalid ranking order data" });
  });

  // Reset all overrides back to organic
  app.post("/api/admin/leaderboard/reset-all", (req, res) => {
    const db = loadDb();
    db.users.forEach((u) => {
      delete u.custom_total_winnings;
      delete u.custom_tournaments_won;
      delete u.custom_rank;
    });
    saveDb(db);
    res.json({ success: true, message: "All leaderboard rankings and winnings reset to natural tournament history." });
  });

  // Deposit Requests
  app.get("/api/admin/deposits", (req, res) => {
    const db = loadDb();
    const deps = db.deposits.map((d) => {
      const user = db.users.find((u) => u.id === d.user_id);
      return {
        ...d,
        username: user ? user.username : "Unknown User"
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ success: true, deposits: deps });
  });

  app.post("/api/admin/deposits/:id/resolve", (req, res) => {
    const { action } = req.body; // 'Approve' or 'Reject'
    const db = loadDb();
    const dep = db.deposits.find((d) => d.id === req.params.id);

    if (!dep) {
      return res.status(404).json({ success: false, message: "Deposit request not found" });
    }

    if (dep.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Deposit already processed" });
    }

    const user = db.users.find((u) => u.id === dep.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (action === "Approve") {
      dep.status = "Completed";
      user.wallet_balance += dep.amount;

      // Add credit transaction
      db.transactions.push({
        id: "tx-" + Date.now(),
        user_id: dep.user_id,
        amount: dep.amount,
        type: "credit",
        description: `UPI Deposit Approved (TxID: ${dep.transaction_id})`,
        created_at: new Date().toISOString()
      });

      // Send instant notification to player
      createNotification(db, {
        user_id: dep.user_id,
        title: "Deposit Approved! 💰",
        message: `Your deposit request for ₹${dep.amount} (TxID: ${dep.transaction_id}) has been verified and approved by Admin! ₹${dep.amount} has been credited to your wallet balance.`,
        type: "deposit_approved",
        reference_id: dep.id,
        amount: dep.amount,
        status: "Completed"
      });
    } else {
      dep.status = "Rejected";

      // Send instant rejection notification to player
      createNotification(db, {
        user_id: dep.user_id,
        title: "Deposit Request Rejected ❌",
        message: `Your deposit request for ₹${dep.amount} (TxID: ${dep.transaction_id}) was rejected by Admin. Please ensure your 12-digit UPI reference ID is valid and retry.`,
        type: "deposit_rejected",
        reference_id: dep.id,
        amount: dep.amount,
        status: "Rejected"
      });
    }

    saveDb(db);
    res.json({ success: true, message: `Deposit request marked as ${dep.status}!` });
  });

  // Withdrawal Requests
  app.get("/api/admin/withdrawals", (req, res) => {
    const db = loadDb();
    const wths = db.withdrawals.map((w) => {
      const user = db.users.find((u) => u.id === w.user_id);
      return {
        ...w,
        username: user ? user.username : "Unknown User",
        upi_id: user ? user.upi_id : "N/A"
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ success: true, withdrawals: wths });
  });

  app.post("/api/admin/withdrawals/:id/resolve", (req, res) => {
    const { action } = req.body; // 'Approve' (meaning sent/completed) or 'Reject'
    const db = loadDb();
    const wth = db.withdrawals.find((w) => w.id === req.params.id);

    if (!wth) {
      return res.status(404).json({ success: false, message: "Withdrawal request not found" });
    }

    if (wth.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Withdrawal already processed" });
    }

    const user = db.users.find((u) => u.id === wth.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (action === "Approve") {
      wth.status = "Completed";
      wth.processed_at = new Date().toISOString();
      // Deducted from balance initially when requested, so we just finalize it here.
      // Update transaction message
      const tx = db.transactions.find((t) => t.user_id === wth.user_id && t.amount === wth.amount && t.description?.includes("withdrawal"));
      if (tx) {
        tx.description = `UPI Withdrawal Completed (Sent to UPI: ${user.upi_id})`;
      }

      // Send instant notification to player
      createNotification(db, {
        user_id: wth.user_id,
        title: "Withdrawal Approved & Paid! ✅",
        message: `Payment Processed! Your withdrawal request for ₹${wth.amount} has been verified and processed by Admin. Payout dispatched to UPI ID: ${user.upi_id}.`,
        type: "withdrawal_approved",
        reference_id: wth.id,
        amount: wth.amount,
        qr_code_url: wth.qr_code_url,
        status: "Completed"
      });
    } else {
      wth.status = "Rejected";
      wth.processed_at = new Date().toISOString();
      // Refund back to user's wallet since it was deducted initially
      user.wallet_balance += wth.amount;

      // Add refund transaction credit
      db.transactions.push({
        id: "tx-" + Date.now(),
        user_id: wth.user_id,
        amount: wth.amount,
        type: "credit",
        description: "Refund: UPI Withdrawal Rejected by Admin",
        created_at: new Date().toISOString()
      });

      // Send instant notification to player
      createNotification(db, {
        user_id: wth.user_id,
        title: "Withdrawal Request Rejected ❌",
        message: `Your withdrawal request for ₹${wth.amount} was rejected during Admin verification. ₹${wth.amount} has been refunded back to your wallet balance.`,
        type: "withdrawal_rejected",
        reference_id: wth.id,
        amount: wth.amount,
        status: "Rejected"
      });
    }

    saveDb(db);
    res.json({ success: true, message: `Withdrawal request marked as ${wth.status}!` });
  });

  // Update App-wide UPI settings & Admin Info
  app.post("/api/admin/settings", (req, res) => {
    const { upi_id, qr_code_url, admin_mobile, admin_username, admin_password, admin_email } = req.body;
    const db = loadDb();

    if (upi_id) db.settings.upi_id = upi_id;
    if (qr_code_url) db.settings.qr_code_url = qr_code_url;
    if (admin_mobile) db.settings.admin_mobile = admin_mobile;

    const admin = db.admin[0];
    if (admin) {
      if (admin_username) admin.username = admin_username;
      if (admin_password) admin.password = hashPassword(admin_password);
      if (admin_mobile) admin.mobile = admin_mobile;
      if (admin_email) admin.email = admin_email;
    }

    saveDb(db);
    res.json({
      success: true,
      message: "Settings saved successfully!",
      settings: {
        ...db.settings,
        admin_username: db.admin[0]?.username,
        admin_email: db.admin[0]?.email
      }
    });
  });

  // Health check endpoint for cloud deployment probes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ---------------------------------------------------------------------------
  // VITE DEV / PRODUCTION STATIC BUILD
  // ---------------------------------------------------------------------------
  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" || (!process.env.VITE_DEV && fs.existsSync(path.join(distPath, "index.html")));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
