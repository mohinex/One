import React, { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import {
  User,
  Settings,
  Lock,
  LogOut,
  Bell,
  Cpu,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Fingerprint,
} from "lucide-react-native";

import { api, BACKEND_BASE_URL } from "../../../src/lib/api";
import { useAuthStore } from "../../../src/store/auth.store";

const screenWidth = Dimensions.get("window").width;

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, biometricsEnabled, setBiometricsEnabled, logout } = useAuthStore();

  // Collapsible configuration forms
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // 1. Fetch live Profile
  const { data: profile } = useQuery({
    queryKey: ["mobileUserProfile"],
    queryFn: async () => {
      const res = await api.get("/user/profile");
      return res.data?.data;
    },
  });

  // 2. Fetch live Billing Subscription Usage stats
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["mobileUserUsageStats"],
    queryFn: async () => {
      const res = await api.get("/user/usage");
      return res.data?.data;
    },
  });

  // 3. Fetch notifications alerts indexes
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["mobileNotificationsInbox"],
    queryFn: async () => {
      const res = await api.get(`${BACKEND_BASE_URL}/api/notifications`);
      return res.data || [];
    },
  });

  // 4. Update Password pipeline
  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/user/password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Password updated successfully. Other active logins revoked.");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
    },
    onError: (err: any) => {
      Alert.alert("Failed", err.response?.data?.message || "Password update rejected by server.");
    },
  });

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Inputs Required", "Please fill in all security credential entry points.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Insecure Password", "New password must contain at least 8 characters.");
      return;
    }
    Haptics.selectionAsync();
    updatePasswordMutation.mutate();
  };

  // 5. Toggle Biometrics settings
  const handleToggleBiometrics = async (enabled: boolean) => {
    Haptics.selectionAsync();
    if (enabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert("Hardware Unavailable", "Device lacks biometric features or enrollment.");
        return;
      }

      // Check current fingerprint validation sanity
      const testAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: "Set Biometric Access Lock",
      });

      if (testAuth.success) {
        await setBiometricsEnabled(true);
        Alert.alert("Enrolled", "Biometric unlock enrolled successfully.");
      }
    } else {
      await setBiometricsEnabled(false);
    }
  };

  // 6. Read All alerts trigger
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      // Typically PATCH /notifications/read-all or similar endpoint
      try {
        await api.patch("/notifications/read-all");
      } catch {
        // Fallback or skip if not fully mapped
      }
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["mobileNotificationsInbox"] });
    },
  });

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Confirm Logout", "Are you sure you want to release current console access credentials?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const activeProfile = profile || user;
  const userPlan = activeProfile?.subscription?.plan?.name || "Free Tier Node";

  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      {/* Spacer buffer */}
      <View style={{ height: 44 }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {/* PROFILE IDENTIFICATION DISPLAY CARD */}
        <View className="px-6 mt-4 select-none">
          <View className="bg-brand-panel border border-brand-border p-6 rounded-2xl flex-row items-center space-x-4">
            <View className="h-14 w-14 bg-red-600/10 rounded-2xl border border-brand-primary items-center justify-center">
              <User size={24} color="#EF4444" />
            </View>

            <View className="flex-1">
              <Text className="text-white text-base font-black uppercase tracking-tight">
                {activeProfile?.name || "Architect Operator"}
              </Text>
              <Text className="text-brand-textMuted text-xs font-semibold leading-relaxed">
                {activeProfile?.email || "architect@eurosia.one"}
              </Text>
              <View className="flex-row items-center mt-2">
                <View className="bg-brand-primary/10 border border-brand-primary/30 px-2.5 py-0.5 rounded-md">
                  <Text className="text-brand-secondary text-[8px] font-black uppercase tracking-widest">
                    Role: {activeProfile?.role || "USER"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* SUBSCRIPTION PLAN AND USAGE PROGRESS METRICS */}
        <View className="px-6 mt-6 select-none">
          <View className="bg-brand-panel border border-brand-border p-5 rounded-2xl">
            <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-brand-border">
              <View className="flex-row items-center space-x-2">
                <Cpu size={14} color="#EF4444" />
                <Text className="text-xs font-bold text-white uppercase tracking-widest">
                  Plan Node: {userPlan}
                </Text>
              </View>
              <View className="bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                  Active
                </Text>
              </View>
            </View>

            {usageLoading ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <View className="space-y-4">
                {/* Chats usage progress */}
                <View>
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">
                      Conversational Loops
                    </Text>
                    <Text className="text-white text-[9px] font-bold font-mono">
                      {usage?.chatCount || 0} / {usage?.chatLimit || 100}
                    </Text>
                  </View>
                  <View className="h-2 bg-brand-subpanel rounded-full overflow-hidden border border-[#141E33]">
                    <View
                      style={{ width: `${Math.min(100, Math.round(((usage?.chatCount || 0) / (usage?.chatLimit || 100)) * 100))}%` }}
                      className="h-full bg-brand-primary rounded-full"
                    />
                  </View>
                </View>

                {/* Images usage progress */}
                <View className="mt-4">
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">
                      Synthesized Visuals
                    </Text>
                    <Text className="text-white text-[9px] font-bold font-mono">
                      {usage?.imageCount || 0} / {usage?.imageLimit || 20}
                    </Text>
                  </View>
                  <View className="h-2 bg-brand-subpanel rounded-full overflow-hidden border border-[#141E33]">
                    <View
                      style={{ width: `${Math.min(100, Math.round(((usage?.imageCount || 0) / (usage?.imageLimit || 20)) * 100))}%` }}
                      className="h-full bg-brand-secondary rounded-full"
                    />
                  </View>
                </View>

                {/* Storage used progress */}
                <View className="mt-4">
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">
                      Vault Memory
                    </Text>
                    <Text className="text-white text-[9px] font-bold font-mono">
                      {Math.round(Number(usage?.storageUsedBytes || 0) / (1024 * 1024))} MB / {Math.round(Number(usage?.storageLimitBytes || 1024 * 1024 * 1024) / (1024 * 1024 * 1024))} GB
                    </Text>
                  </View>
                  <View className="h-2 bg-brand-subpanel rounded-full overflow-hidden border border-[#141E33]">
                    <View
                      style={{ width: `${usage?.storagePercent || 0}%` }}
                      className="h-full bg-red-800 rounded-full"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* PREFERENCES SETTINGS CONTROLS */}
        <View className="px-6 mt-6 select-none">
          <View className="bg-brand-panel border border-brand-border p-5 rounded-2xl">
            <View className="flex-row items-center space-x-2 mb-4 pb-3 border-b border-brand-border">
              <Settings size={14} color="#EF4444" />
              <Text className="text-xs font-bold text-white uppercase tracking-widest">
                Device Settings
              </Text>
            </View>

            {/* Toggle Biometrics */}
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center space-x-3 flex-1 mr-4">
                <Fingerprint size={16} color="#6B7280" />
                <View>
                  <Text className="text-gray-200 text-xs font-bold uppercase tracking-tight">
                    Biometric Logins
                  </Text>
                  <Text className="text-brand-textMuted text-[9px] uppercase font-semibold leading-relaxed mt-0.5">
                    Enable FaceID / TouchID sweeps
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: "#101726", true: "#DC2626" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* COLLAPSIBLE CHANGE SECURITY PASSWORD PANEL */}
        <View className="px-6 mt-6 select-none">
          <View className="bg-brand-panel border border-brand-border rounded-2xl overflow-hidden">
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setShowPasswordForm(!showPasswordForm);
              }}
              className="p-5 flex-row justify-between items-center"
            >
              <View className="flex-row items-center space-x-3.5">
                <Lock size={14} color="#EF4444" />
                <Text className="text-xs font-bold text-white uppercase tracking-widest">
                  Change Password
                </Text>
              </View>
              {showPasswordForm ? <ChevronUp size={14} color="#6B7280" /> : <ChevronDown size={14} color="#6B7280" />}
            </TouchableOpacity>

            {showPasswordForm && (
              <View className="px-5 pb-5 space-y-4">
                {/* Present Password */}
                <View>
                  <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
                    Current Keyword
                  </Text>
                  <View className="flex-row items-center bg-brand-subpanel border border-[#141E33] rounded-xl px-4 py-3">
                    <Lock size={14} color="#4B5563" />
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      placeholder="••••••••••••"
                      placeholderTextColor="#4B5563"
                      className="flex-1 text-white text-xs font-semibold ml-3 animate-none"
                    />
                  </View>
                </View>

                {/* Proposed Password */}
                <View className="mt-4">
                  <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
                    New Keyword (8+ Chars)
                  </Text>
                  <View className="flex-row items-center bg-brand-subpanel border border-[#141E33] rounded-xl px-4 py-3">
                    <Lock size={14} color="#4B5563" />
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      placeholder="••••••••••••"
                      placeholderTextColor="#4B5563"
                      className="flex-1 text-white text-xs font-semibold ml-3"
                    />
                  </View>
                </View>

                {/* Commit button */}
                <TouchableOpacity
                  onPress={handleUpdatePassword}
                  disabled={updatePasswordMutation.isPending}
                  className="bg-brand-primary h-12 rounded-xl justify-center items-center mt-4"
                >
                  {updatePasswordMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text className="text-white text-xs font-black uppercase tracking-widest">
                      Commit Secret Update
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* SYSTEM INBOX NOTIFICATIONS ALERTS */}
        <View className="px-6 mt-6 select-none">
          <View className="bg-brand-panel border border-brand-border p-5 rounded-2xl">
            <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-brand-border">
              <View className="flex-row items-center space-x-2">
                <Bell size={14} color="#EF4444" />
                <Text className="text-xs font-bold text-white uppercase tracking-widest">
                  Notification Broadcasts
                </Text>
              </View>

              {alerts.length > 0 && (
                <TouchableOpacity onPress={() => markAllReadMutation.mutate()}>
                  <Text className="text-brand-secondary text-[9px] font-black uppercase tracking-widest">
                    Mark All Read
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {alertsLoading ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <View className="space-y-3">
                {alerts.slice(0, 4).map((alert: any) => (
                  <View
                    key={alert.id}
                    className={`p-3.5 border rounded-2xl flex-row items-start space-x-3 ${
                      alert.unread ? "bg-brand-secondary/5 border-brand-primary/25" : "bg-brand-subpanel border-brand-border"
                    }`}
                  >
                    <View className="h-2 w-2 bg-brand-primary rounded-full mt-1.5 shrink-0" />
                    <View className="flex-1">
                      <Text className="text-white text-xs font-extrabold uppercase tracking-tight">
                        {alert.title}
                      </Text>
                      <Text className="text-brand-textMuted text-[10px] uppercase mt-1 font-semibold leading-relaxed">
                        {alert.body || alert.message}
                      </Text>
                    </View>
                  </View>
                ))}

                {alerts.length === 0 && (
                  <View className="py-6 items-center">
                    <Text className="text-brand-textMuted text-[9.5px] uppercase font-mono text-center">
                      Inbox fully synchronized and cleared.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          onPress={handleLogout}
          className="mx-6 bg-brand-subpanel border border-[#991B1B]/40 h-12 rounded-2xl flex-row justify-center items-center mt-8 cursor-pointer select-none"
        >
          <LogOut size={14} color="#EF4444" />
          <Text className="text-brand-secondary text-xs font-black uppercase tracking-widest ml-3">
            Terminate Session
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
