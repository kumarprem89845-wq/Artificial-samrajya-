import React, { useState, useEffect, useCallback } from "react";
import { User, Admin, AppNotification } from "./types";
import { api } from "./lib/api";
import LoginView from "./components/LoginView";
import HomeView from "./components/HomeView";
import MyTournamentsView from "./components/MyTournamentsView";
import WalletView from "./components/WalletView";
import ProfileView from "./components/ProfileView";
import AdminView from "./components/AdminView";
import { NotificationModal } from "./components/NotificationModal";
import { WithdrawalQrModal } from "./components/WithdrawalQrModal";
import { GamerSupportModal } from "./components/GamerSupportModal";

import { 
  Home, Gamepad2, Wallet, User as UserIcon, Shield, Swords, Gamepad, Bell, MessageSquare
} from "lucide-react";

export default function App() {
  // Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);
  const [currentTab, setCurrentTab] = useState<"home" | "tournaments" | "wallet" | "profile">("home");

  // Notifications State for Gamer
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ qrUrl: string; amount?: number; status?: string } | null>(null);

  // Support / Helpdesk State for Gamer
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportTicketId, setSupportTicketId] = useState<string | undefined>(undefined);

  const handleOpenSupport = (ticketId?: string) => {
    setSupportTicketId(ticketId);
    setIsSupportOpen(true);
  };

  // Fetch gamer notifications
  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      const res = await api.getNotifications(userId);
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    // -------------------------------------------------------------------------
    // 1. MOBILE NATIVE EMULATION: Disable Right-click, Text Selection, Zoom
    // -------------------------------------------------------------------------
    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    const preventSelection = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }
      e.preventDefault();
    };

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Attach listeners
    document.addEventListener("contextmenu", preventRightClick);
    document.addEventListener("selectstart", preventSelection);
    document.addEventListener("touchstart", preventZoom, { passive: false });

    // -------------------------------------------------------------------------
    // 2. Hydrate session from localStorage
    // -------------------------------------------------------------------------
    const storedUser = localStorage.getItem("samrajya_user");
    const storedAdmin = localStorage.getItem("samrajya_admin");
    const storedRole = localStorage.getItem("samrajya_role");

    if (storedRole === "admin" && storedAdmin) {
      setCurrentAdmin(JSON.parse(storedAdmin));
      setUserRole("admin");
    } else if (storedRole === "user" && storedUser) {
      const usr = JSON.parse(storedUser);
      setCurrentUser(usr);
      setUserRole("user");
      // Fetch initial notifications and wallet balance
      fetchNotifications(usr.id);
      api.getWallet(usr.id).then((res) => {
        if (res.success) {
          const updatedUser = { ...usr, wallet_balance: res.balance };
          setCurrentUser(updatedUser);
          localStorage.setItem("samrajya_user", JSON.stringify(updatedUser));
        }
      }).catch(console.error);
    }

    return () => {
      document.removeEventListener("contextmenu", preventRightClick);
      document.removeEventListener("selectstart", preventSelection);
      document.removeEventListener("touchstart", preventZoom);
    };
  }, [fetchNotifications]);

  // Real-time polling for notifications and wallet when user is logged in
  useEffect(() => {
    if (userRole !== "user" || !currentUser?.id) return;

    fetchNotifications(currentUser.id);

    const interval = setInterval(() => {
      fetchNotifications(currentUser.id);
    }, 6000);

    const handleFocus = () => {
      fetchNotifications(currentUser.id);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [userRole, currentUser?.id, fetchNotifications]);

  const handleLoginSuccess = (userObj: any, role: "user" | "admin") => {
    setUserRole(role);
    if (role === "admin") {
      setCurrentAdmin(userObj);
      localStorage.setItem("samrajya_admin", JSON.stringify(userObj));
    } else {
      setCurrentUser(userObj);
      localStorage.setItem("samrajya_user", JSON.stringify(userObj));
      fetchNotifications(userObj.id);
    }
    localStorage.setItem("samrajya_role", role);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentAdmin(null);
    setUserRole(null);
    setCurrentTab("home");
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem("samrajya_user");
    localStorage.removeItem("samrajya_admin");
    localStorage.removeItem("samrajya_role");
  };

  const handleBalanceUpdate = (newBalance: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, wallet_balance: newBalance };
      setCurrentUser(updatedUser);
      localStorage.setItem("samrajya_user", JSON.stringify(updatedUser));
      fetchNotifications(currentUser.id);
    }
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("samrajya_user", JSON.stringify(updatedUser));
  };

  // Notification Operations
  const handleMarkRead = async (notificationId?: string) => {
    if (!currentUser?.id) return;
    try {
      await api.markNotificationRead(currentUser.id, notificationId);
      if (notificationId) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      await api.clearNotifications(currentUser.id);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!currentUser?.id) return;
    try {
      await api.deleteNotification(currentUser.id, notificationId);
      const target = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleOpenQrModal = (qrUrl: string, amount?: number, status?: string) => {
    setQrModalData({ qrUrl, amount, status });
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center selection:bg-transparent selection:text-white select-none">
      
      {/* 
        Sleek Device Container to resemble a high-end native mobile app.
        On mobile screens, it takes up full width/height.
        On desktop, it restricts size with shadow details.
      */}
      <div className="w-full max-w-md md:max-w-[380px] min-h-screen md:min-h-[720px] md:my-6 md:rounded-[40px] md:border-[8px] md:border-[#1A1D24] bg-[#0F1115] border-x border-white/5 shadow-2xl flex flex-col relative pb-20 overflow-hidden">
        
        {/* =====================================================================
            TOP HEADER NAVIGATION (HEADER.PHP EQUIVALENT)
            ===================================================================== */}
        {userRole && (
          <header className="sticky top-0 z-40 bg-[#1A1D24]/80 backdrop-blur-md border-b border-white/5 px-5 py-3.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-lg text-[#FF6B00]">
                <Swords className="w-4 h-4 fill-[#FF6B00]/20" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-[#FF6B00] font-bold leading-none">
                  ARTIFICIAL SAMARAJYA
                </span>
                <h1 className="text-base font-black text-white tracking-tighter leading-none mt-0.5">
                  eSPORTS
                </h1>
              </div>
            </div>

            {/* Header Right: Admin badge OR Gamer Notifications & Wallet */}
            {userRole === "admin" ? (
              <div className="flex items-center gap-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-3 py-1 rounded-full text-[#FF6B00]">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                  Admin Active
                </span>
              </div>
            ) : (
              currentUser && (
                <div className="flex items-center gap-2">
                  {/* Gamer WhatsApp Support Button */}
                  <button
                    id="gamer-contact-admin-btn"
                    onClick={() => handleOpenSupport()}
                    className="p-2 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 active:scale-95 border border-[#25D366]/30 transition-all text-[#25D366] flex items-center justify-center gap-1.5 px-2.5"
                    title="WhatsApp Chat with Admin"
                    aria-label="WhatsApp Support"
                  >
                    <span className="text-xs">💬</span>
                    <span className="text-[10px] font-bold text-gray-200">WhatsApp Chat</span>
                  </button>

                  {/* Gamer Notification 🔔 Icon Button with Dynamic Badge */}
                  <button
                    id="gamer-notification-bell-btn"
                    onClick={() => setIsNotificationOpen(true)}
                    className="relative p-2 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 transition-all text-gray-300 hover:text-white flex items-center justify-center"
                    title="Gamer Notifications & Alerts"
                    aria-label="Notifications"
                  >
                    <Bell className={`w-4 h-4 ${unreadCount > 0 ? "text-[#FF6B00] animate-bounce" : "text-gray-400"}`} />
                    
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#FF6B00] text-black text-[10px] font-black font-mono rounded-full flex items-center justify-center shadow-lg shadow-[#FF6B00]/40 border-2 border-[#1A1D24] animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Wallet Quick Balance */}
                  <div 
                    onClick={() => setCurrentTab("wallet")}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10 px-3 py-1.5 rounded-2xl transition-all active:scale-95"
                    title="View Wallet & Transactions"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></div>
                    <span className="text-xs font-mono font-bold text-white">
                      ₹{currentUser.wallet_balance}
                    </span>
                  </div>
                </div>
              )
            )}
          </header>
        )}

        {/* =====================================================================
            CORE INTERACTIVE PAGE VIEWS
            ===================================================================== */}
        <main className="flex-1 p-4 overflow-y-auto no-scrollbar select-none">
          {!userRole ? (
            <LoginView onLoginSuccess={handleLoginSuccess} />
          ) : userRole === "admin" && currentAdmin ? (
            <AdminView currentAdmin={currentAdmin} onLogout={handleLogout} />
          ) : (
            currentUser && (
              <>
                {currentTab === "home" && (
                  <HomeView 
                    currentUser={currentUser} 
                    onJoined={handleBalanceUpdate}
                    onNavigateToWallet={() => setCurrentTab("wallet")}
                    onOpenNotifications={() => setIsNotificationOpen(true)}
                    onOpenSupport={handleOpenSupport}
                    unreadNotificationsCount={unreadCount}
                    notifications={notifications}
                  />
                )}
                {currentTab === "tournaments" && (
                  <MyTournamentsView 
                    currentUser={currentUser} 
                    onOpenSupport={handleOpenSupport}
                    onNavigateTab={(tab) => setCurrentTab(tab as any)}
                  />
                )}
                {currentTab === "wallet" && (
                  <WalletView currentUser={currentUser} onBalanceUpdated={handleBalanceUpdate} />
                )}
                {currentTab === "profile" && (
                  <ProfileView 
                    currentUser={currentUser} 
                    onProfileUpdated={handleProfileUpdated} 
                    onLogout={handleLogout} 
                    onOpenSupport={() => handleOpenSupport()}
                  />
                )}
              </>
            )
          )}
        </main>

        {/* =====================================================================
            FIXED BOTTOM NAVIGATION WITH ICONS (BOTTOM.PHP EQUIVALENT)
            ===================================================================== */}
        {userRole === "user" && currentUser && (
          <nav className="absolute bottom-0 left-0 right-0 bg-[#1A1D24] border-t border-white/5 p-2 grid grid-cols-4 z-40 select-none">
            <button
              onClick={() => setCurrentTab("home")}
              className={`flex flex-col items-center justify-center py-1.5 transition-all ${
                currentTab === "home" ? "text-[#FF6B00] font-bold" : "text-gray-500 hover:text-white"
              }`}
            >
              <Home className={`w-5 h-5 mb-1 ${currentTab === "home" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[9px] tracking-wide uppercase font-bold">Home</span>
            </button>
            <button
              onClick={() => setCurrentTab("tournaments")}
              className={`flex flex-col items-center justify-center py-1.5 transition-all ${
                currentTab === "tournaments" ? "text-[#FF6B00] font-bold" : "text-gray-500 hover:text-white"
              }`}
            >
              <Gamepad className={`w-5 h-5 mb-1 ${currentTab === "tournaments" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[9px] tracking-wide uppercase font-bold">Matches</span>
            </button>
            <button
              onClick={() => setCurrentTab("wallet")}
              className={`flex flex-col items-center justify-center py-1.5 transition-all ${
                currentTab === "wallet" ? "text-[#FF6B00] font-bold" : "text-gray-500 hover:text-white"
              }`}
            >
              <Wallet className={`w-5 h-5 mb-1 ${currentTab === "wallet" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[9px] tracking-wide uppercase font-bold">Wallet</span>
            </button>
            <button
              onClick={() => setCurrentTab("profile")}
              className={`flex flex-col items-center justify-center py-1.5 transition-all ${
                currentTab === "profile" ? "text-[#FF6B00] font-bold" : "text-gray-500 hover:text-white"
              }`}
            >
              <UserIcon className={`w-5 h-5 mb-1 ${currentTab === "profile" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[9px] tracking-wide uppercase font-bold">Account</span>
            </button>
          </nav>
        )}

        {/* =====================================================================
            GAMER NOTIFICATION MODAL
            ===================================================================== */}
        {userRole === "user" && currentUser && (
          <NotificationModal
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            notifications={notifications}
            unreadCount={unreadCount}
            userId={currentUser.id}
            onMarkRead={handleMarkRead}
            onClearAll={handleClearAllNotifications}
            onDeleteNotification={handleDeleteNotification}
            onOpenQr={handleOpenQrModal}
            onNavigateTab={(tab) => {
              setCurrentTab(tab as any);
              setIsNotificationOpen(false);
            }}
            onOpenSupport={handleOpenSupport}
          />
        )}

        {/* =====================================================================
            GAMER SUPPORT & CONTACT ADMIN MODAL (HELPDESK + LIVE CHAT)
            ===================================================================== */}
        {userRole === "user" && currentUser && (
          <GamerSupportModal
            isOpen={isSupportOpen}
            onClose={() => {
              setIsSupportOpen(false);
              setSupportTicketId(undefined);
            }}
            currentUser={currentUser}
            initialTicketId={supportTicketId}
            onTicketCreated={() => {
              fetchNotifications(currentUser.id);
            }}
          />
        )}

        {/* Optional Withdrawal QR Modal */}
        {qrModalData && (
          <WithdrawalQrModal
            isOpen={Boolean(qrModalData)}
            onClose={() => setQrModalData(null)}
            qrUrl={qrModalData.qrUrl}
            amount={qrModalData.amount}
            status={qrModalData.status}
          />
        )}

      </div>
    </div>
  );
}

