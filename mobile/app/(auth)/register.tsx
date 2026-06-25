import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { User, Mail, KeyRound, ArrowLeft } from "lucide-react-native";

import { api } from "../../src/lib/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Required Inputs", "Please fill out all input headers.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Insecure Password", "The password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      Haptics.selectionAsync();
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Verification Required",
        "Your account proposal has been recorded. Please check your inbox for an email validation code.",
        [
          {
            text: "Proceed to Verify",
            onPress: () => router.push({ pathname: "/(auth)/verify-email", params: { email } }),
          },
        ]
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Verification request rejected by server. Ensure a valid corporate format.";
      Alert.alert("Registration Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-brand-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-8 py-12">
          {/* Header Return button */}
          <View className="absolute top-12 left-6">
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="h-10 w-10 bg-brand-panel border border-brand-border items-center justify-center rounded-xl">
                <ArrowLeft size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </Link>
          </View>

          {/* Titles */}
          <View className="items-center mb-8 select-none">
            <Text className="text-white text-2xl font-black uppercase tracking-widest">
              Join Eurosia
            </Text>
            <Text className="text-brand-textMuted text-xs font-semibold tracking-wider text-center mt-1 uppercase">
              Establish multi-model node clearances
            </Text>
          </View>

          <View className="space-y-4">
            {/* Name */}
            <View>
              <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
                Operator Identity
              </Text>
              <View className="flex-row items-center bg-brand-subpanel border border-brand-border rounded-xl px-4.5 py-3">
                <User size={16} color="#4B5563" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Architect Eurosia"
                  placeholderTextColor="#4B5563"
                  className="flex-1 text-white text-xs font-semibold ml-3"
                />
              </View>
            </View>

            {/* Email Address */}
            <View className="mt-4">
              <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
                Corporate Mail ID
              </Text>
              <View className="flex-row items-center bg-brand-subpanel border border-brand-border rounded-xl px-4.5 py-3">
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

            {/* Password */}
            <View className="mt-4">
              <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
                System Password (8+ Chars)
              </Text>
              <View className="flex-row items-center bg-brand-subpanel border border-brand-border rounded-xl px-4.5 py-3">
                <KeyRound size={16} color="#4B5563" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholder="••••••••••••"
                  placeholderTextColor="#4B5563"
                  className="flex-1 text-white text-xs font-semibold ml-3"
                />
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className="w-full bg-brand-primary h-12 rounded-xl items-center justify-center mt-6 shadow-lg shadow-brand-primary/20"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white text-xs font-black uppercase tracking-widest">
                  Deploy Operator Instance
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Back */}
          <View className="flex-row justify-center mt-8 space-x-1 select-none">
            <Text className="text-brand-textMuted text-xs font-semibold uppercase">
              Already have credentials?
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-brand-secondary text-xs font-bold uppercase">
                  Login Here
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
