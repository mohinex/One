import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isEmailVerified: boolean;
  plan?: string;
}

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  biometricsEnabled: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  loadStoredSettings: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  biometricsEnabled: false,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),

  setBiometricsEnabled: async (enabled) => {
    try {
      await SecureStore.setItemAsync("biometrics_enabled", enabled ? "true" : "false");
      set({ biometricsEnabled: enabled });
    } catch (e) {
      console.warn("Failed to save biometric preference to SecureStore", e);
    }
  },

  loadStoredSettings: async () => {
    try {
      const bio = await SecureStore.getItemAsync("biometrics_enabled");
      set({ biometricsEnabled: bio === "true" });
    } catch (e) {
      console.warn("Could not load secure store configurations", e);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync("refreshToken");
    } catch (e) {
      console.warn("Secured storage cleaning error", e);
    }
    set({ accessToken: null, user: null });
  },
}));
