import React, { useState } from "react";
import { 
  Sun, 
  Moon, 
  Bell, 
  ChevronDown, 
  Crown, 
  Sparkles, 
  Check, 
  LogOut, 
  User, 
  Settings,
  X,
  Plus,
  Menu
} from "lucide-react";
import { UserProfile, NotificationItem } from "../../types";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  user: UserProfile;
  notifications: NotificationItem[];
  onMarkAllNotificationsRead: () => void;
  onNavigate: (view: string) => void;
  onTriggerUpgrade: () => void;
  onToggleMobileSidebar: () => void;
}

export default function Header({
  theme,
  onToggleTheme,
  user,
  notifications,
  onMarkAllNotificationsRead,
  onNavigate,
  onTriggerUpgrade,
  onToggleMobileSidebar,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-6 dark:border-gray-800 dark:bg-[#0B0F19] transition-colors duration-200">
      
      {/* Left section: Hamburger button for mobile & search placeholder */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Menu"
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="hidden text-xs font-medium text-gray-400 sm:inline-block dark:text-gray-500">
          Press <kbd className="mx-1 rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] font-mono text-gray-400 dark:border-gray-700 dark:bg-gray-800">⌘K</kbd> to prompt anywhere
        </span>
      </div>

      {/* Control Nodes */}
      <div className="flex items-center gap-4">
        
        {/* Clickable Plan Badge Pill */}
        <button 
          onClick={onTriggerUpgrade}
          className="group flex items-center gap-1.5 rounded-full bg-red-50 hover:bg-red-100 border border-red-100 dark:bg-red-950/30 dark:border-red-900/40 px-3.5 py-1 text-xs font-semibold text-red-600 transition-all duration-200"
        >
          <Crown className="h-3 w-3 fill-red-500/10 text-red-500 group-hover:scale-110 transition-transform" />
          <span>{user.plan === "Premium Plan" ? "Premium Active" : "Free Plan · Upgrade"}</span>
        </button>

        {/* Sun / Moon Light/Dark mode toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-all cursor-pointer"
        >
          {theme === "light" ? (
            <Moon className="h-4.5 w-4.5" />
          ) : (
            <Sun className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Notifications Panel */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-all cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0B0F19]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-100 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-[#111827] ring-1 ring-black/5 fade-in">
              <div className="flex items-center justify-between border-b border-gray-50 px-3 py-2 pb-2.5 dark:border-gray-800/80">
                <span className="font-display text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      onMarkAllNotificationsRead();
                      setShowNotifications(false);
                    }}
                    className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-sans cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="mt-1.5 max-h-64 overflow-y-auto space-y-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex flex-col rounded-lg p-2.5 text-left transition-colors ${
                        item.unread 
                          ? "bg-red-50/20 hover:bg-red-50/45 dark:bg-red-950/10 dark:hover:bg-red-950/20" 
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-xs font-semibold ${item.unread ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                          {item.timestamp}
                        </span>
                      </div>
                      <span className="mt-0.5 text-xs text-xs text-gray-500 dark:text-gray-400 leading-normal">
                        {item.description}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 p-1.5 pr-2.5 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-800 transition-all cursor-pointer"
          >
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white uppercase tracking-wider">
              {user.avatarInitials}
            </div>
            <div className="hidden flex-col items-start text-left sm:flex">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                {user.name}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {user.plan}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {/* Profile Contextual Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-[#111827] ring-1 ring-black/5 fade-in">
              <div className="border-b border-gray-50 px-2.5 py-2.5 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-[10px] text-gray-400 truncate dark:text-gray-500 mt-0.5">{user.email}</p>
              </div>
              <div className="mt-1 space-y-0.5">
                <button
                  onClick={() => {
                    onNavigate("profile");
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate("settings");
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  <span>System Preferences</span>
                </button>
                <button
                  onClick={() => {
                    onTriggerUpgrade();
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-red-500" />
                  <span>Upgrade to Premium</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
