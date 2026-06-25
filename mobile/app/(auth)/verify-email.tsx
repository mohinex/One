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
import { ShieldCheck, Mail, ArrowLeft } from "lucide-react-native";

import { api } from "../../src/lib/api";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [email, setEmail] = useState((params.email as string) || "");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!email || !token) {
      Alert.alert("Inputs Required", "Please specify your registered email and verification token.");
      return;
    }

    setLoading(true);
    try {
      Haptics.selectionAsync();
      
      // Call GET /auth/verify-email?token=X&email=Y
      await api.get(`/auth/verify-email`, {
        params: {
          token: token.trim(),
          email: email.trim().toLowerCase(),
        },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Verification Confirmed",
        "Your email clearance has been locked in of server registries. You can now login.",
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Invalid or expired verification token.";
      Alert.alert("Clearing Failed", errorMsg);
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
        {/* Header Exit */}
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          className="absolute top-12 left-6 h-10 w-10 bg-brand-panel border border-brand-border items-center justify-center rounded-xl"
        >
          <ArrowLeft size={16} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Header Branding */}
        <View className="items-center mb-8 select-none">
          <View className="h-14 w-14 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 items-center justify-center mb-4">
            <ShieldCheck size={28} color="#10B981" />
          </View>
          <Text className="text-white text-xl font-black uppercase tracking-tight">
            Verify Handshake
          </Text>
          <Text className="text-brand-textMuted text-xs font-semibold tracking-wider text-center mt-1 uppercase">
            Clear email vectors with Eurosia Security
          </Text>
        </View>

        <View className="space-y-4">
          {/* Email verification input */}
          <View>
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
              Email ID
            </Text>
            <View className="flex-row items-center bg-brand-subpanel border border-[#101726] rounded-xl px-4.5 py-3">
              <Mail size={16} color="#4B5563" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="architect@eurosia.one"
                placeholderTextColor="#4B5563"
                className="flex-1 text-white text-xs font-semibold ml-3"
              />
            </View>
          </View>

          {/* Verification Code/Token */}
          <View className="mt-4">
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
              Verification Token
            </Text>
            <View className="flex-row items-center bg-brand-subpanel border border-[#101726] rounded-xl px-4.5 py-3">
              <TextInput
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                placeholder="TOKEN_HEX_STRING"
                placeholderTextColor="#4B5563"
                className="flex-1 text-white text-center text-xs font-black tracking-widest uppercase font-mono"
              />
            </View>
          </View>

          {/* Verification triggers */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            className="w-full bg-emerald-500 h-12 rounded-xl items-center justify-center mt-6 shadow-lg shadow-emerald-500/10"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white text-xs font-black uppercase tracking-widest">
                Perform Audit Handshake
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
