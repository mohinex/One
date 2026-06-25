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
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { KeyRound, Mail, ArrowLeft } from "lucide-react-native";

import { api } from "../../src/lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetchResetToken = async () => {
    if (!email) {
      Alert.alert("Input Required", "Please specify your registered email address.");
      return;
    }

    setLoading(true);
    try {
      Haptics.selectionAsync();
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Transmission Dispatched",
        "If the address exists, a token has been launched. Retrieve the token from your email.",
        [
          {
            text: "Go Reset Password",
            onPress: () => router.push({ pathname: "/(auth)/reset-password", params: { email } }),
          },
        ]
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to trigger recovery sequence.";
      Alert.alert("Sequence Denied", errorMsg);
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

        {/* Brand visual tags */}
        <View className="items-center mb-8 select-none">
          <View className="h-14 w-14 bg-red-500/10 rounded-2xl border border-red-500/20 items-center justify-center mb-4">
            <KeyRound size={28} color="#EF4444" />
          </View>
          <Text className="text-white text-xl font-black uppercase tracking-tight">
            Recover Node
          </Text>
          <Text className="text-brand-textMuted text-xs font-semibold tracking-wider text-center mt-1 uppercase">
            Initiate cryptographic key resets
          </Text>
        </View>

        <View className="space-y-4">
          {/* Recovery Email Entry */}
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

          {/* Action triggers */}
          <TouchableOpacity
            onPress={handleFetchResetToken}
            disabled={loading}
            className="w-full bg-brand-primary h-12 rounded-xl items-center justify-center mt-6 shadow-lg shadow-brand-primary/10"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white text-xs font-black uppercase tracking-widest">
                Deploy Reset Message
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
