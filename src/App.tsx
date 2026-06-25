import React, { useState, useEffect } from "react";
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useParams,
  useLocation
} from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Globe, 
  FileText, 
  UserSquare2, 
  Terminal, 
  Network, 
  ChevronRight, 
  Sliders, 
  Sparkles, 
  Command, 
  Settings, 
  ArrowRight,
  Plus,
  Paperclip,
  Mic,
  Activity,
  CheckCircle2,
  ListRestart
} from "lucide-react";

import { Tool, ChatHistoryItem, ActivityLogItem, NotificationItem, UserProfile } from "./types";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import RightPanel from "./components/layout/RightPanel";

// Sub-workspace Views Pre-built imports
import ChatView from "./components/views/ChatView";
import ImageView from "./components/views/ImageView";
import VideoView from "./components/views/VideoView";
import WebBuilderView from "./components/views/WebBuilderView";
import DocsAnalysisView from "./components/views/DocsAnalysisView";
import CharactersView from "./components/views/CharactersView";
import CodeAssistantView from "./components/views/CodeAssistantView";
import AutomationsView from "./components/views/AutomationsView";
import ProjectsView from "./components/views/ProjectsView";
import ArtifactsView from "./components/views/ArtifactsView";
import AgentsView from "./components/views/AgentsView";
import SettingsView from "./components/views/SettingsView";

// Auth Views
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Admin Panel Views
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTools from "./pages/admin/AdminTools";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminAudit from "./pages/admin/AdminAudit";

import { useAuthStore } from "./store/auth.store";
import { useSocket } from "./lib/socket";
import { api } from "./lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const safeGetStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn("Storage access blocked:", err);
    return null;
  }
};

const safeSetStorageItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn("Storage write blocked:", err);
  }
};

// Authenticated Layout Wrapper that frames everything with Sidebar + Header
function DashboardLayout({ children, recentChats, setRecentChats, theme, toggleTheme }: {
  children: React.ReactNode;
  recentChats: ChatHistoryItem[];
  setRecentChats: React.Dispatch<React.SetStateAction<ChatHistoryItem[]>>;
  theme: "light" | "dark";
  toggleTheme: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const socket = useSocket();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([
    { id: "act_1", iconName: "MessageSquare", title: "Core Handshake Complete", description: "Successfully established operational link with central node gateway", timestamp: "Just now", badgeColor: "text-emerald-600 bg-emerald-50 border-emerald-100" }
  ]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "not_welcome", title: "Node Provisioned", description: "Your virtual operating workspace is online and secure.", timestamp: "Just now", unread: true, type: "success" }
  ]);

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Profile data mapping
  const profileModel: UserProfile = {
    name: user?.name || "Sovereign Operator",
    email: user?.email || "architect@eurosia.one",
    role: user?.role || "USER",
    plan: user?.plan || "Free Plan",
    avatarInitials: user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "SO"
  };

  // Convert pathname to view id
  const getActiveView = () => {
    const path = location.pathname;
    if (path.startsWith("/chat")) return "chat";
    if (path === "/" || path === "/dashboard") return "workspace";
    return path.replace("/", "");
  };

  const handleNavigate = (view: string) => {
    if (view === "workspace") {
      navigate("/dashboard");
    } else {
      navigate(`/${view}`);
    }
  };

  // Live Socket.io syncing
  useEffect(() => {
    if (!socket) return;

    socket.on("notification:new", (notif: any) => {
      showToast(notif.title || "New operating system bulletin", "info");
      setNotifications(prev => [
        {
          id: notif.id || `not_${Date.now()}`,
          title: notif.title,
          description: notif.description,
          timestamp: "Just now",
          unread: true,
          type: "info"
        },
        ...prev
      ]);
    });

    socket.on("tool:updated", (data: any) => {
      showToast(`Workspace modules reordered globally.`, "success");
    });

    return () => {
      socket.off("notification:new");
      socket.off("tool:updated");
    };
  }, [socket]);

  // Load backend chats on mount and updates
  useEffect(() => {
    const syncChats = async () => {
      try {
        const cRes = await api.get("/chats?limit=8");
        if (cRes.data?.success && cRes.data?.data?.chats) {
          const chatsList = cRes.data.data.chats.map((c: any) => ({
            id: c.id,
            title: c.title,
            timestamp: new Date(c.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })
          }));
          setRecentChats(chatsList);
        }
      } catch (err) {
        // Fallback or ignore
      }
    };

    if (user) {
      syncChats();
    }
  }, [user, location.pathname]);

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast("Notifications cleared successfully.", "success");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans transition-colors duration-200 dark:bg-[#0B0F19] dark:text-gray-100">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={getActiveView()}
        onNavigate={(view) => {
          if (view.startsWith("chat_")) {
            const cleanId = view.replace("chat_", "");
            navigate(`/chat/${cleanId}`);
          } else {
            handleNavigate(view);
          }
        }}
        recentChats={recentChats}
        setRecentChats={setRecentChats}
        user={profileModel}
        onNewChat={() => navigate("/chat/new")}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <Header 
          theme={theme} 
          onToggleTheme={toggleTheme} 
          user={profileModel}
          notifications={notifications}
          onMarkAllNotificationsRead={markAllNotificationsAsRead}
          onNavigate={(view) => {
            if (view === "profile" || view === "settings") {
              navigate("/settings");
            } else {
              navigate("/dashboard");
            }
          }}
          onTriggerUpgrade={() => navigate("/settings")}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>

          {getActiveView() === "workspace" && (
            <RightPanel 
              activityLogs={activityLogs} 
              onNavigate={(view) => navigate("/chat/new")} 
            />
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-55 flex items-center gap-2.5 rounded-xl border border-gray-150 bg-white/95 p-3.5 shadow-xl dark:border-gray-800 dark:bg-[#111827] animate-slide-up">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-850 dark:text-gray-100 leading-none">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// Actual workspace/dashboard widgets grid board
function WorkspaceGrid() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [workspaceTools, setWorkspaceTools] = useState<Tool[]>([]);

  useEffect(() => {
    // Sync configured tool presets on database or default Fallback sets
    setWorkspaceTools([
      { id: "ai_chat", name: "AI Conversational Core", description: "Smart high-fidelity conversations with model parameters on streaming lines", iconName: "MessageSquare", colorClass: "text-red-655 bg-red-50 border-red-100", category: "Core", path: "chat/new" },
      { id: "image_gen", name: "Visual Studio Node", description: "Synthesize beautiful vector art, digital illustrations, or cinematic 3D images", iconName: "Image", colorClass: "text-emerald-650 bg-emerald-50 border-emerald-100", category: "Creative", path: "images" },
      { id: "pdf_analysis", name: "Docs Extraction Layer", description: "Cross-examine multi-page PDFs, contracts, specifications, or whitepapers with context", iconName: "FileText", colorClass: "text-rose-650 bg-rose-50 border-rose-100", category: "Documentary", path: "documents" },
      { id: "code_assist", name: "Syntax Translation Hub", description: "Deploy, analyze, and optimize programs across modern programming languages", iconName: "Terminal", colorClass: "text-cyan-650 bg-cyan-50 border-cyan-100", category: "Developer", path: "code" }
    ]);
  }, []);

  const handleQuickAction = (text: string) => {
    setQuery(text);
    navigate(`/chat/new?q=${encodeURIComponent(text)}`);
  };

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "MessageSquare": return MessageSquare;
      case "Image": return ImageIcon;
      case "FileText": return FileText;
      case "Terminal": return Terminal;
      default: return Sparkles;
    }
  };

  const quickActions = [
    { label: "Refine TypeScript", text: "Help me design TypeScript types for a secure state machine" },
    { label: "Analyze PDF Format", text: "Scan Q3 goals inside performance specs" },
    { label: "Cyberpunk Art concept", text: "Make a dark minimal neon futuristic city art prompt specs" },
    { label: "Review Security term", text: "Explain standard JWT rotation best practices with diagrams" }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 flex flex-col justify-start">
      {/* Brand Presentation */}
      <div className="flex flex-col items-center justify-center text-center py-4 select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-650 to-red-500 text-white font-extrabold font-display text-3xl shadow-xl shadow-red-500/15 mb-4 animate-scale-in">
          E
        </div>
        <h1 className="font-display font-extrabold text-[32px] tracking-tight leading-none text-gray-950 dark:text-white">
          Architect Workspace Node
        </h1>
        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold tracking-widest uppercase mt-2">
          Your Sovereign Control Interface
        </p>
      </div>

      {/* Main Search prompt */}
      <div className="mx-auto w-full max-w-2xl">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) navigate(`/chat/new?q=${encodeURIComponent(query)}`);
          }}
          className="rounded-2xl border border-gray-200 bg-white shadow-lg p-1.5 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all text-left dark:border-gray-800 dark:bg-[#111827]"
        >
          <textarea
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Instruct Eurosia One or prompt workspace matrices..."
            className="w-full resize-none bg-transparent px-4 py-3 text-xs focus:outline-none dark:text-white leading-relaxed placeholder-gray-400"
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 rounded-b-2xl">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5 font-mono">
              <Command className="h-3 w-3" />
              Ctrl + Enter to prompt
            </span>
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-4.5 py-2 rounded-xl bg-red-600 hover:bg-red-750 disabled:opacity-40 text-xs font-bold text-white tracking-wider uppercase transition-all cursor-pointer"
            >
              Ask AI
            </button>
          </div>
        </form>
      </div>

      {/* Actions Pills */}
      <div className="mx-auto w-full max-w-2xl overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 items-center justify-start sm:justify-center scrollbar-none">
          {quickActions.map(p => (
            <button
              key={p.label}
              onClick={() => handleQuickAction(p.text)}
              className="whitespace-nowrap shrink-0 px-3 py-1.5 border border-gray-250 hover:border-red-500 rounded-lg bg-white text-[11px] font-bold text-gray-600 hover:bg-red-50/10 dark:bg-[#111827] dark:border-gray-800 dark:text-gray-300 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid container */}
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-2 text-left">
          <h3 className="font-display font-extrabold text-gray-950 dark:text-white text-sm uppercase tracking-wider">
            AI Operations Nodes
          </h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active sandboxes: 4</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workspaceTools.map(tool => {
            const Icon = getToolIcon(tool.iconName);
            return (
              <div
                key={tool.id}
                onClick={() => navigate(`/${tool.path}`)}
                className="group bg-white border border-gray-250 dark:border-gray-850 dark:bg-zinc-900/40 p-5 rounded-2xl text-left flex items-center gap-4.5 hover:-translate-y-0.5 hover:shadow-md hover:border-red-500 dark:hover:border-red-900/60 transition-all cursor-pointer select-none"
              >
                <div className={`p-3.5 rounded-xl border shrink-0 ${tool.colorClass} transition-transform group-hover:scale-105`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-extrabold text-gray-900 dark:text-white text-xs group-hover:text-red-650 transition-colors">
                    {tool.name}
                  </h4>
                  <p className="text-[11px] text-gray-450 dark:text-gray-400 mt-1 pb-0.5 font-medium leading-relaxed truncate">
                    {tool.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-350 dark:text-gray-650 shrink-0 group-hover:translate-x-1 group-hover:text-red-500 transition-all" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Router Chat Wrapper that feeds state-derived chatId to active panels
function ChatRouteWrapper({ onChatCreated }: { onChatCreated: (id: string) => void }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Pick up optional pre-filled query q=...
  const queryPrompt = new URLSearchParams(location.search).get("q") || "";

  return (
    <ChatView 
      chatId={id || "new"} 
      onBack={() => navigate("/dashboard")}
      onChatCreated={onChatCreated}
    />
  );
}

// Protected route middleware representation inside React router
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading } = useAuthStore();
  const isAuthenticated = !!accessToken;
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#060913] transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest font-mono">Restoring Eurosia Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save previous route location inside hash parameter
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}

export function AppContent() {
  const { initialize, accessToken, isLoading } = useAuthStore();
  const isAuthenticated = !!accessToken;
  const [recentChats, setRecentChats] = useState<ChatHistoryItem[]>([]);
  const navigate = useNavigate();

  // Dark light theme parameters
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (safeGetStorageItem("eurosia_theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    // Trigger initialize on mount of the app!
    initialize();
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    safeSetStorageItem("eurosia_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#060913] transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest font-mono">Loading Operating System...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Guest Auth routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin Panel Gateway */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="tools" element={<AdminTools />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="media" element={<AdminMedia />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="billing" element={<AdminBilling />} />
        <Route path="audit" element={<AdminAudit />} />
      </Route>

      {/* Protected Layout workspace blocks */}
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <WorkspaceGrid />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/chat/:id" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <ChatRouteWrapper onChatCreated={(newId) => {
              // Update state lists, route instantly to updated uuid path
              navigate(`/chat/${newId}`, { replace: true });
            }} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/images" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <ImageView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/videos" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <VideoView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/web" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <WebBuilderView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/documents" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <DocsAnalysisView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/characters" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <CharactersView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/code" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <CodeAssistantView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/automations" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <AutomationsView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <ProjectsView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/artifacts" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <ArtifactsView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/agents" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <AgentsView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout 
            recentChats={recentChats} 
            setRecentChats={setRecentChats} 
            theme={theme} 
            toggleTheme={toggleTheme}
          >
            <SettingsView onBack={() => navigate("/dashboard")} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}
