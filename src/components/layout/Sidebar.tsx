import React, { useState } from "react";
import { 
  MessageSquare, 
  Briefcase, 
  Box, 
  Bot, 
  UserSquare2, 
  Image, 
  Video, 
  FileText, 
  Network, 
  LayoutDashboard, 
  Settings, 
  ChevronsLeft,
  ChevronsRight,
  Plus,
  ArrowRight,
  MoreVertical,
  SlidersHorizontal,
  ChevronDown,
  Trash2
} from "lucide-react";
import { ChatHistoryItem, UserProfile } from "../../types";
import { api } from "../../lib/api";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  recentChats: ChatHistoryItem[];
  setRecentChats: React.Dispatch<React.SetStateAction<ChatHistoryItem[]>>;
  user: UserProfile;
  onNewChat: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  activeView,
  onNavigate,
  recentChats,
  setRecentChats,
  user,
  onNewChat,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedChatIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete the ${selectedChatIds.length} selected chat(s)?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await api.post("/chats/bulk-delete", { ids: selectedChatIds });
      if (response.data?.success) {
        // Filter out deleted chats from our local state list
        setRecentChats(prev => prev.filter(c => !selectedChatIds.includes(c.id)));
        setSelectedChatIds([]);
      }
    } catch (err: any) {
      console.error("Failed to perform bulk chat deletion:", err);
      alert(err.response?.data?.message || "Failed to delete selected chats.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleNavClick = (view: string) => {
    onNavigate(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    { id: "workspace", label: "Workspace", icon: LayoutDashboard },
    { id: "chat", label: "Chats", icon: MessageSquare },
    { id: "projects", label: "Projects", icon: Briefcase },
    { id: "artifacts", label: "Artifacts", icon: Box },
    { id: "agents", label: "AI Agents", icon: Bot },
    { id: "characters", label: "Characters", icon: UserSquare2 },
    { id: "images", label: "Images", icon: Image },
    { id: "videos", label: "Videos", icon: Video },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "automations", label: "Automations", icon: Network },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-45 md:hidden transition-opacity duration-300"
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-gray-100 bg-[#F9FAFB] transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-[#0D121F]
          md:relative md:translate-y-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }
        `}
        style={{ 
          width: typeof window !== "undefined" && window.innerWidth < 768 ? "260px" : (collapsed ? "68px" : "260px") 
        }}
      >
        {/* Sidebar Header with Brand Red Geometric logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100/50 dark:border-gray-800/50">
          <div 
            onClick={() => handleNavClick("workspace")}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer active:scale-95 transition-transform"
          >
            {/* Geometric Red "E" icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white font-extrabold font-display shadow-md shadow-red-500/20">
              E
            </div>
            {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && (
              <span className="font-display font-extrabold text-gray-900 dark:text-white tracking-tight text-[17px]">
                Eurosia<span className="text-red-600 font-extrabold ml-0.5">One</span>
              </span>
            )}
          </div>

          {/* Collapse Button */}
          {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) ? (
            <button 
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button 
              onClick={onToggleCollapse}
              title="Expand Sidebar"
              className="absolute left-1/2 -translate-x-1/2 top-4.5 flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer z-50 shadow-sm"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Full "+ New Chat" Action Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`flex items-center justify-center gap-2 rounded-xl bg-gray-900 hover:bg-red-600 text-white text-xs font-semibold py-2.5 px-3 w-full transition-all duration-200 shadow-sm shadow-gray-950/5 hover:shadow-red-500/20 active:scale-[0.98] outline-none group cursor-pointer ${
              (collapsed && !(typeof window !== "undefined" && window.innerWidth < 768)) ? "aspect-square p-0" : ""
            }`}
          >
            <Plus className="h-4.5 w-4.5 shrink-0 text-white group-hover:rotate-95 transition-transform" />
            {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && (
              <div className="flex w-full items-center justify-between">
                <span>New Chat</span>
                <span className="rounded bg-white/20 px-1 py-0.5 text-[9px] font-mono font-medium text-white/90">
                  ⌘K
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Main navigation elements */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-150 cursor-pointer group relative ${
                  isActive 
                    ? "bg-white text-red-600 shadow-xs dark:bg-gray-800/80 dark:text-red-400 border border-gray-100 dark:border-gray-800" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/30 border border-transparent"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-550 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                }`} />
                
                {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && (
                  <span className="truncate">{item.label}</span>
                )}

                {/* Collapsed view hover active indicator dot */}
                {collapsed && isActive && !(typeof window !== "undefined" && window.innerWidth < 768) && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 rounded-full" />
                )}
              </button>
            );
          })}

          {/* Separator Line */}
          {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && recentChats.length > 0 && (
            <div className="my-4.5 border-t border-gray-100 dark:border-gray-800 mx-2" />
          )}

          {/* Recent Chats Header Segment */}
          {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && recentChats.length > 0 && (
            <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <span>Recent Chats</span>
              <SlidersHorizontal className="h-3 w-3 hover:text-gray-600 cursor-pointer" />
            </div>
          )}

          {/* Delete Selected Button */}
          {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && selectedChatIds.length > 0 && (
            <div className="px-3 pb-2.5 animate-fade-in">
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[11px] font-bold py-1.5 transition-all cursor-pointer shadow-sm shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98]"
              >
                <Trash2 className="h-3 w-3" />
                <span>{isDeleting ? "Deleting..." : `Delete Selected (${selectedChatIds.length})`}</span>
              </button>
            </div>
          )}

          {/* Recent Chats Items list */}
          {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && recentChats.slice(0, 5).map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleNavClick(`chat_${chat.id}`)}
              className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-1.5 text-left text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/30 transition-all font-sans group cursor-pointer ${
                selectedChatIds.includes(chat.id) ? "bg-red-50/30 dark:bg-red-950/10 text-red-600 dark:text-red-400" : ""
              }`}
            >
              <input
                id={`check-${chat.id}`}
                type="checkbox"
                checked={selectedChatIds.includes(chat.id)}
                onChange={() => {}} // Controlled via onClick
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedChatIds(prev => 
                    prev.includes(chat.id) 
                      ? prev.filter(id => id !== chat.id) 
                      : [...prev, chat.id]
                  );
                }}
                className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-700 text-red-600 focus:ring-red-500/20 dark:bg-gray-900 cursor-pointer shrink-0 accent-red-600"
              />
              <MessageSquare className="h-3 w-3 text-gray-450 dark:text-gray-500 shrink-0 group-hover:text-gray-700" />
              <span className="truncate flex-1 font-medium">{chat.title}</span>
              <span className="text-[9px] text-gray-400 font-mono scale-[0.9] origin-right shrink-0">{chat.timestamp}</span>
            </button>
          ))}

          {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && recentChats.length > 5 && (
            <button 
              onClick={() => handleNavClick("chat")}
              className="flex items-center gap-1.5 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 w-full transition-all cursor-pointer"
            >
              <span>View all chats</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </nav>

        {/* Profiler module block at base */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-950/10">
          <div className={`flex items-center gap-3 ${(collapsed && !(typeof window !== "undefined" && window.innerWidth < 768)) ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {/* AH Initials avatar sphere */}
              <div className="h-8.5 w-8.5 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center shrink-0 tracking-wide text-xs">
                {user.avatarInitials}
              </div>
              {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-gray-450 dark:text-gray-500 font-semibold uppercase tracking-wider truncate">
                    {user.plan}
                  </span>
                </div>
              )}
            </div>
            {(!collapsed || (typeof window !== "undefined" && window.innerWidth < 768)) && (
              <button className="text-gray-450 hover:text-gray-900 dark:hover:text-white p-1 cursor-pointer">
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
