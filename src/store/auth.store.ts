import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  plan?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Helper to safely access sessionStorage within iframe environments
const safeGetSessionItem = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetSessionItem = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // blocked or unavailable
  }
};

const safeRemoveSessionItem = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // blocked or unavailable
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    const raw = safeGetSessionItem("eurosia_user");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  })(),
  accessToken: null,
  isLoading: true,

  setUser: (user) => {
    set({ user });
    if (user) {
      safeSetSessionItem("eurosia_user", JSON.stringify(user));
    } else {
      safeRemoveSessionItem("eurosia_user");
    }
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // Hit backend logout endpoint to clear refresh token cookies
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("API logout call failed:", err);
    } finally {
      set({ user: null, accessToken: null, isLoading: false });
      safeRemoveSessionItem("eurosia_user");
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/v1/auth/refresh", { method: "POST" });
      if (response.ok) {
        const payload = await response.json();
        const token = payload.data?.accessToken;
        
        // Fetch current user details since session is now restored
        const profileRes = await fetch("/api/v1/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const p = profileData.data || profileData;
          set({
            accessToken: token,
            user: {
              id: p.id || "mock_id",
              email: p.email,
              name: p.name,
              role: p.role,
              plan: p.plan || "Free Tier",
              avatarUrl: p.avatarUrl
            },
            isLoading: false
          });
          safeSetSessionItem("eurosia_user", JSON.stringify({
            id: p.id || "mock_id",
            email: p.email,
            name: p.name,
            role: p.role,
            plan: p.plan || "Free Tier",
            avatarUrl: p.avatarUrl
          }));
          return;
        }
      }
    } catch (error) {
      console.error("Session restoration initialize error:", error);
    }
    set({ accessToken: null, user: null, isLoading: false });
    safeRemoveSessionItem("eurosia_user");
  }
}));
