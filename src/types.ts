export interface Tool {
  id: string;
  name: string;
  description: string;
  iconName: string;
  colorClass: string;
  category: string;
  path: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  unread?: boolean;
}

export interface ActivityLogItem {
  id: string;
  iconName: string;
  title: string;
  description: string;
  timestamp: string;
  badgeColor: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  type: 'info' | 'success' | 'alert';
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  plan: string;
  avatarInitials: string;
}
