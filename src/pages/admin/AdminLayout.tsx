import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useSocket } from "../../lib/socket";
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Settings, 
  FolderLock, 
  BellRing, 
  BarChart4, 
  Wrench, 
  Megaphone, 
  Layers, 
  Image as ImageIcon, 
  LogOut, 
  Eye, 
  UserSquare2, 
  Database, 
  CreditCard, 
  Menu, 
  X, 
  Terminal,
  Clock,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, logout } = useAuthStore();
  const socket = useSocket();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onlineCounter, setOnlineCounter] = useState(47); // fallback start state as specified
  const [currentTime, setCurrentTime] = useState("");

  // Live handshake metrics clock
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Socket.io events
  useEffect(() => {
    if (!socket) return;

    socket.on("users:online", (count: number) => {
      if (typeof count === "number") {
        setOnlineCounter(count);
      }
    });

    socket.on("admin:new-user", (data: { email: string }) => {
      toast.success(`👤 New user registered: ${data.email || "anonymous"}`, {
        duration: 5000,
        position: "top-right",
        style: {
          background: "#1E293B",
          color: "#fff",
          border: "1px solid #334155"
        }
      });
    });

    socket.on("admin:new-subscription", (data: { planId: string; amount: string; email?: string }) => {
      toast.success(`💳 New subscription: ${data.planId || "Pro Plan"} - ${data.amount || "$19"}`, {
        duration: 6000,
        position: "top-right",
        style: {
          background: "#0F172A",
          color: "#10B981",
          border: "1px solid #064E3B"
        }
      });
    });

    // Test emitter mock for websocket updates
    return () => {
      socket.off("users:online");
      socket.off("admin:new-user");
      socket.off("admin:new-subscription");
    };
  }, [socket]);

  // Auth gate check
  const isAuthenticated = !!accessToken;
  const isAdmin = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="h-14 w-14 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-500 flex items-center justify-center font-mono font-extrabold text-2xl shadow-lg mb-4 animate-bounce">
          !
        </div>
        <h3 className="font-display font-extrabold text-lg text-white uppercase tracking-wider">Authentication Required</h3>
        <p className="text-gray-400 text-xs font-semibold max-w-sm mt-1.5 leading-relaxed">
          The requested system node requires valid operations keys. Please log in first.
        </p>
        <button
          onClick={() => navigate("/admin/login")}
          className="mt-6 px-5 py-2.5 bg-red-655 hover:bg-red-750 text-xs font-bold font-mono tracking-wider text-white uppercase rounded-xl transition-all cursor-pointer shadow-md"
        >
          Verify Operator Credentials
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 text-red-500 flex items-center justify-center shadow-2xl mb-6">
          <Shield className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">Access Strictly Denied</h2>
        <p className="text-gray-400 text-xs font-medium max-w-md mt-2.5 leading-relaxed">
          Your credentials do not meet the authorized cryptographic parameters. This terminal session is locked.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-750 text-xs font-bold font-mono tracking-wider text-white uppercase rounded-xl transition-all cursor-pointer shadow-md"
          >
            Switch Operator Key
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold font-mono tracking-wider text-gray-300 uppercase rounded-xl border border-slate-800 transition-all cursor-pointer"
          >
            Exit to User Console
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Grid Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Platform Users", path: "/admin/users", icon: Users },
    { name: "Workspace Modules", path: "/admin/tools", icon: Wrench },
    { name: "Campaign Alerts", path: "/admin/banners", icon: Megaphone },
    { name: "Media Assets", path: "/admin/media", icon: ImageIcon },
    { name: "Push Dispatcher", path: "/admin/notifications", icon: BellRing },
    { name: "System Metrics", path: "/admin/analytics", icon: BarChart4 },
    { name: "SaaS Plans", path: "/admin/billing", icon: CreditCard },
    { name: "Terminal Audits", path: "/admin/audit", icon: Database },
    { name: "Control Registry", path: "/admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success("Operational session terminated.");
    navigate("/admin/login");
  };

  return (
    <div className="flex h-screen w-screen bg-[#070B14] text-[#E2E8F0] font-sans overflow-hidden">
      
      {/* SIDEBAR - DESKTOP */}
      <aside className={`hidden md:flex flex-col border-r border-[#101726] bg-[#090D1A] shrink-0 transition-all duration-300 relative z-30 ${collapsed ? "w-20" : "w-64"}`}>
        {/* Upper Brand panel */}
        <div className="p-5 border-b border-[#101726] flex items-center justify-between min-h-[70px]">
          <div className="flex items-center gap-3 overflow-hidden select-none">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-red-650 to-red-500 text-white flex items-center justify-center font-display font-semibold text-lg shrink-0 shadow-lg">
              E
            </div>
            {!collapsed && (
              <span className="font-display font-black tracking-tight text-white text-sm">
                EURO<span className="text-red-500">SIA</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all select-none group ${
                  isActive 
                    ? "bg-red-650 text-white shadow-xl shadow-red-500/10" 
                    : "text-gray-450 hover:bg-[#111626] hover:text-white"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-gray-450 group-hover:text-red-400 transition-colors"}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer info lock */}
        <div className="p-4 border-t border-[#101726]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 text-xs font-semibold tracking-wide text-red-400 hover:text-red-300 hover:bg-red-950/15 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span className="font-bold">DE-AUTHORIZE</span>}
          </button>
        </div>
      </aside>

      {/* VIEW WRAPPER CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* HEADER BAR */}
        <header className="h-[70px] border-b border-[#101726] bg-[#090D1A] flex items-center justify-between px-6 shrink-0 z-20">
          
          {/* Mobile controls & toggle collapses */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center h-8 w-8 text-gray-400 hover:text-white rounded-lg hover:bg-slate-900 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden items-center justify-center h-8 w-8 text-gray-400 hover:text-white rounded-lg hover:bg-slate-900 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* UTCHandshaking indicator */}
            <div className="flex items-center gap-2 border border-[#161F33] bg-[#0C1224] px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider select-none text-gray-400">
              <Clock className="h-3.5 w-3.5 text-red-500" />
              <span>TERMINAL: {currentTime || "00:00:00"}</span>
            </div>
          </div>

          {/* Quick Metrics, Alerts & operators profiles */}
          <div className="flex items-center gap-4">
            
            {/* Live Socket online users status indicator badge */}
            <div className="flex items-center gap-2 border border-[#064E3B]/40 bg-[#064E3B]/10 px-3.5 py-1.5 rounded-full select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono font-black tracking-widest text-[#10B981] uppercase">
                {onlineCounter} Online
              </span>
            </div>

            {/* View user app portal link */}
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 border border-[#1E293B] hover:border-slate-700 hover:bg-slate-900 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider text-gray-300 transition-all uppercase"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>App Port</span>
            </Link>

            {/* Operator identity presentation block */}
            <div className="flex items-center gap-2.5 border-l border-[#121A2D] pl-4">
              <div className="h-9 w-9 rounded-xl bg-[#111827] border border-[#212E4A] flex items-center justify-center font-mono text-xs font-black text-red-400 tracking-wider">
                {user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase() : "OP"}
              </div>
              <div className="hidden lg:flex flex-col text-left select-none leading-tight">
                <span className="text-white text-xs font-extrabold">{user?.name || "System Operator"}</span>
                <span className="text-red-550 text-[10px] font-bold font-mono tracking-wider uppercase mt-0.5">{user?.role || "ADMIN"}</span>
              </div>
            </div>

          </div>
        </header>

        {/* MOBILE SIDE NAV */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-black/80 backdrop-blur-sm">
            <div className="relative w-72 bg-[#090D1A] h-full p-6 border-r border-[#101726] flex flex-col justify-between animate-slide-right">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-5 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg bg-slate-900/50"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex-1 py-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-red-650 to-red-500 text-white flex items-center justify-center font-display font-semibold text-lg shrink-0 shadow-lg">
                    E
                  </div>
                  <span className="font-display font-black tracking-tight text-white text-sm">
                    EURO<span className="text-red-500">SIA</span>
                  </span>
                </div>

                <nav className="space-y-1.5">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          isActive 
                            ? "bg-red-650 text-white" 
                            : "text-gray-400 hover:bg-[#111626] hover:text-white"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3.5 px-3.5 py-3 text-xs font-semibold text-red-400 hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span className="font-bold">DE-AUTHORIZE SESSION</span>
              </button>
            </div>
          </div>
        )}

        {/* OUTLET VIEW STAGES */}
        <main className="flex-1 overflow-y-auto px-6 py-8 relative">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
