import React, { useState, useEffect } from "react";
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
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { Fingerprint, KeyRound, Mail, ShieldAlert, Eye, EyeOff } from "lucide-react-native";

import { useAuthStore } from "../../src/store/auth.store";
import { api } from "../../src/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { setAccessToken, setUser, biometricsEnabled, setBiometricsEnabled } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading status flags
  const [loading, setLoading] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(false);

  // Multi-factor authentication layers
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [temp2FAToken, setTemp2FAToken] = useState("");

  // 1. Auto-check biometric authentication eligibility on screen mount
  useEffect(() => {
    async function checkBiometrics() {
      const storedEnabled = await SecureStore.getItemAsync("biometrics_enabled");
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (storedEnabled === "true" && hasHardware && isEnrolled) {
        triggerBiometricLogin();
      }
    }
    checkBiometrics();
  }, []);

  // Biometric login action runner
  const triggerBiometricLogin = async () => {
    try {
      setBiometricChecking(true);
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Eurosia One Workspace",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const storedRefreshToken = await SecureStore.getItemAsync("refreshToken");
        if (storedRefreshToken) {
          setLoading(true);
          const refreshRes = await api.post("/auth/refresh", {
            refreshToken: storedRefreshToken,
          });

          const newAccessToken = refreshRes.data?.data?.accessToken;
          if (newAccessToken) {
            setAccessToken(newAccessToken);
            const profileRes = await api.get("/user/profile");
            setUser(profileRes.data?.data);
            router.replace("/(tabs)/home");
          } else {
            Alert.alert("Authentication Restrict", "Could not restore previous token session.");
          }
        } else {
          Alert.alert("Unlock Failed", "No stored keys available on local hardware. Please login manually.");
        }
      }
    } catch (e) {
      console.warn("Local authentication transaction error", e);
    } finally {
      setBiometricChecking(false);
      setLoading(false);
    }
  };

  // 2. Standard login submission
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Inputs Required", "Please fill in email and password entries.");
      return;
    }

    setLoading(true);
    try {
      Haptics.selectionAsync();
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      // Handle MFA setup requirements
      if (response.data?.data?.requiresTwoFactor) {
        setRequires2FA(true);
        setTemp2FAToken(response.data.data.tempToken);
        setLoading(false);
        return;
      }

      await completeUserLoginSuccess(response.data?.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Invalid email or verification credentials.";
      Alert.alert("Clearance Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 3. Multi-factor verification submission
  const handleVerify2FA = async () => {
    if (twoFactorToken.length < 6) {
      Alert.alert("Verification Token Required", "Please enter your full 6-digit TOTP code.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/2fa/validate", {
        token: twoFactorToken,
        tempToken: temp2FAToken,
      });

      await completeUserLoginSuccess(response.data?.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "TOTP Code authentication rejected.";
      Alert.alert("Validator Reject", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Post Login setup flow (token storage, enroll prompts)
  const completeUserLoginSuccess = async (data: any) => {
    const { accessToken, refreshToken, user } = data;
    
    // Save tokens in appropriate memory
    await SecureStore.setItemAsync("refreshToken", refreshToken);
    setAccessToken(accessToken);
    setUser(user);

    // Ask if interested to bind FaceId/Biometrics if it's not pre-enabled
    const isBioActive = await SecureStore.getItemAsync("biometrics_enabled");
    if (isBioActive !== "true") {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        Alert.alert(
          "Secure Biometrics Unlock",
          "Would you like to register FaceID / Fingerprint unlock for subsequent logins?",
          [
            {
              text: "Skip",
              style: "cancel",
              onPress: () => router.replace("/(tabs)/home"),
            },
            {
              text: "Enable",
              onPress: async () => {
                await setBiometricsEnabled(true);
                router.replace("/(tabs)/home");
              },
            },
          ]
        );
        return;
      }
    }
    router.replace("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-brand-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-8 py-12">
          {/* Logo Headers */}
          <View className="items-center mb-10 select-none">
            <View className="h-14 w-14 bg-brand-primary/10 rounded-2xl border border-brand-primary/30 items-center justify-center mb-4">
              <KeyRound size={28} color="#EF4444" />
            </View>
            <Text className="text-white text-2xl font-black tracking-tight uppercase">
              Eurosia One
            </Text>
            <Text className="text-brand-textMuted text-xs font-semibold tracking-wider text-center max-w-xs mt-1 uppercase">
              Secure Multi-Model Engineering Portal
            </Text>
          </View>

          {/* Form Content Toggle */}
          {!requires2FA ? (
            <View className="space-y-4">
              {/* Email Address */}
              <View>
                <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase">
                  Operator Email
                </Text>
                <View className="flex-row items-center bg-brand-subpanel border border-brand-border rounded-xl px-4.5 py-3 focus:border-brand-primary">
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
                <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase">
                  Access Keyword
                </Text>
                <View className="flex-row items-center bg-brand-subpanel border border-brand-border rounded-xl px-4.5 py-3 focus:border-brand-primary">
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
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={16} color="#9CA3AF" />
                    ) : (
                      <Eye size={16} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgotten Password link */}
              <View className="items-end mt-2">
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="text-[10px] text-brand-secondary font-bold uppercase tracking-widest">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Login triggers */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="w-full bg-brand-primary h-12 rounded-xl items-center justify-center mt-6 shadow-lg shadow-brand-primary/20"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-xs font-black uppercase tracking-widest">
                    Request Clearance
                  </Text>
                )}
              </TouchableOpacity>

              {/* Biometrics Quick Link */}
              {biometricsEnabled && (
                <TouchableOpacity
                  onPress={triggerBiometricLogin}
                  disabled={biometricChecking}
                  className="w-full bg-brand-panel border border-brand-border h-12 rounded-xl flex-row items-center justify-center mt-3"
                >
                  <Fingerprint size={16} color="#EF4444" />
                  <Text className="text-white text-xs font-black uppercase tracking-widest ml-3.5">
                    Unlock with Biometrics
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Multi factor verification view */
            <View className="space-y-4">
              <View className="bg-brand-panel border border-brand-border p-4 rounded-xl flex-row items-center gap-3.5 mb-2">
                <ShieldAlert size={20} color="#DC2626" />
                <View className="flex-1">
                  <Text className="text-white text-xs font-bold uppercase">Multi-Factor Lockout</Text>
                  <Text className="text-gray-400 text-[10px] uppercase mt-0.5 font-semibold">Your account restricts plain keywords. Enter your TOTP code.</Text>
                </View>
              </View>

              <View>
                <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase">
                  6-Digit Auth Code
                </Text>
                <View className="flex-row items-center bg-brand-subpanel border border-[#1E293B] rounded-xl px-4.5 py-3">
                  <TextInput
                    value={twoFactorToken}
                    onChangeText={(val) => setTwoFactorToken(val.replace(/[^0-9]/g, "").substring(0, 6))}
                    keyboardType="number-pad"
                    placeholder="000 000"
                    placeholderTextColor="#4B5563"
                    className="flex-1 text-white text-center text-lg font-black tracking-widest"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleVerify2FA}
                disabled={loading}
                className="w-full bg-brand-primary h-12 rounded-xl items-center justify-center mt-4"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-xs font-bold uppercase tracking-widest">
                    Verify MFA Credentials
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRequires2FA(false)}
                className="w-full bg-transparent border border-brand-border h-12 rounded-xl items-center justify-center mt-2"
              >
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                  Back to Credentials
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Navigation */}
          <View className="flex-row justify-center mt-8 space-x-1 select-none">
            <Text className="text-brand-textMuted text-xs font-semibold uppercase">
              New system member?
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-brand-secondary text-xs font-bold uppercase">
                  Request Account
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
