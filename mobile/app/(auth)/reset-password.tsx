import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, Mail, Lock, ShieldAlert, ArrowLeft } from "lucide-react-native";

import { api } from "../../src/lib/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!token || !newPassword) {
      Alert.alert("Inputs Required", "Please specify your reset token and new password registry.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Insecure Password", "Minimum password size should be 8 characters or more.");
      return;
    }

    setLoading(true);
    try {
      Haptics.selectionAsync();
      await api.post("/auth/reset-password", {
        token: token.trim(),
        newPassword,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Password Rebuilt",
        "Your new passkey and credentials have been updated. Log in to resume.",
        [
          {
            text: "Login Page",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Invalid or expired key verification token.";
      Alert.alert("Reset Rejected", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-brand-background justify-center"
    >
      <View className="px-8 py-12">
        {/* Back navigation button */}
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          className="absolute top-12 left-6 h-10 w-10 bg-brand-panel border border-brand-border items-center justify-center rounded-xl"
        >
          <ArrowLeft size={16} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Brand headers */}
        <View className="items-center mb-8 select-none">
          <View className="h-14 w-14 bg-red-500/10 rounded-2xl border border-red-500/20 items-center justify-center mb-4">
            <Lock size={28} color="#EF4444" />
          </View>
          <Text className="text-white text-xl font-black uppercase tracking-tight">
            Commit Password
          </Text>
          <Text className="text-brand-textMuted text-xs font-semibold tracking-wider text-center mt-1 uppercase">
            Assemble and sign new access protocols
          </Text>
        </View>

        <View className="space-y-4">
          {/* Reset Token Input */}
          <View>
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
              Reset Security Code
            </Text>
            <View className="flex-row items-center bg-brand-subpanel border border-[#101726] rounded-xl px-4.5 py-3">
              <TextInput
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                placeholder="RECOVERY_TOKEN"
                placeholderTextColor="#4B5563"
                className="flex-1 text-white text-center text-xs font-bold tracking-widest uppercase font-mono"
              />
            </View>
          </View>

          {/* New Passkey */}
          <View className="mt-4">
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
              New Password (8+ Chars)
            </Text>
            <View className="flex-row items-center bg-brand-subpanel border border-[#101726] rounded-xl px-4.5 py-3">
              <Lock size={16} color="#4B5563" />
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

          {/* Apply button */}
          <TouchableOpacity
            onPress={handleReset}
            disabled={loading}
            className="w-full bg-brand-primary h-12 rounded-xl items-center justify-center mt-6 shadow-lg shadow-brand-primary/15"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white text-xs font-black uppercase tracking-widest">
                Reconstruct Access Key
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
