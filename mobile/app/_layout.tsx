import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import NetInfo from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, View, Animated, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Bell, WifiOff } from "lucide-react-native";

// Import global styles
import "../global.css";

// Import stores and utilities
import { useAuthStore } from "../src/store/auth.store";
import { api, BACKEND_BASE_URL } from "../src/lib/api";
import { getSocket, disconnectSocket } from "../src/lib/socket";

// Configure local notification handlers
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      networkMode: "offlineFirst",
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const router = useRouter();
  const segments = useSegments();
  const { accessToken, user, setAccessToken, setUser, logout, loadStoredSettings } = useAuthStore();
  const [initComplete, setInitComplete] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // In-app Socket Notification banners state
  const [socketNotification, setSocketNotification] = useState<{ title: string; message: string } | null>(null);
  const notificationAnim = useEffectStateAnim();

  // 1. Initial State Auto-Auth handshake
  useEffect(() => {
    async function performHandshake() {
      await loadStoredSettings();
      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (refreshToken) {
          // POST /auth/refresh to retrieve a fresh memory token
          const refreshRes = await api.post("/auth/refresh", { refreshToken });
          const newAccessToken = refreshRes.data?.data?.accessToken;
          
          if (newAccessToken) {
            setAccessToken(newAccessToken);
            
            // GET /user/profile to fetch verified roles
            const profileRes = await api.get("/user/profile", {
              headers: { Authorization: `Bearer ${newAccessToken}` }
            });
            setUser(profileRes.data?.data);
          } else {
            await logout();
          }
        }
      } catch (e) {
        console.warn("Bootstrap credentials validation skipped or failed", e);
        await logout();
      } finally {
        setInitComplete(true);
      }
    }
    performHandshake();
  }, []);

  // 2. NetInfo and Offline tracker
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // 3. Routing Guard locks
  useEffect(() => {
    if (!initComplete) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isLoggedIn = !!accessToken;

    if (!isLoggedIn && !inAuthGroup) {
      // Direct unauthorized devices to login gateway
      router.replace("/(auth)/login");
    } else if (isLoggedIn && (inAuthGroup || segments.length === 0)) {
      // Redirect validated operators back into dashboard workspace
      router.replace("/(tabs)/home");
    }
  }, [accessToken, segments, initComplete]);

  // 4. WebSocket setup & Notifications Listener mapping
  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    const socket = getSocket(accessToken);
    socket.connect();

    // Listen to real-time micro push events
    socket.on("notification:new", (data: any) => {
      displayWebSocketNotification(data.title || "Core Alert Dispatch", data.body || data.message || "Eurosia operational message.");
    });

    socket.on("connect_error", () => {
      console.warn("Real-time socket network error. Recovering automatically.");
    });

    return () => {
      socket.off("notification:new");
      socket.disconnect();
    };
  }, [accessToken]);

  // 5. Config push tokens with Expo registry
  useEffect(() => {
    if (!accessToken || !user) return;

    async function registerDevicePushNotifications() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          console.warn("Push permissions denied on equipment. Bypassing token register.");
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: "4f21ed98-523c-4858-ac1c-0c8984fb39c2" // Built using our applet ID
        });
        
        const cleanToken = tokenData.data;

        // POST /user/push-token
        await api.post("/user/push-token", {
          token: cleanToken,
          platform: "expo"
        });

        console.log(`[Push Setup] Successfully bound device payload: ${cleanToken}`);
      } catch (err) {
        console.warn("Internal failure binding device push notification vectors", err);
      }
    }

    registerDevicePushNotifications();
  }, [accessToken, user]);

  // Notification action response parser
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.chatId) {
        router.push({ pathname: `/(tabs)/chats/[id]`, params: { id: data.chatId } });
      } else if (data?.screen === "billing") {
        router.push("/(tabs)/profile");
      }
    });
    return () => subscription.remove();
  }, []);

  function displayWebSocketNotification(title: string, message: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSocketNotification({ title, message });
    
    // Trigger animation slide-down
    Animated.timing(notificationAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Fade out automatically in 4000ms
    setTimeout(() => {
      Animated.timing(notificationAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setSocketNotification(null));
    }, 4500);
  }

  if (!initComplete) {
    return (
      <View style={{ flex: 1, backgroundColor: "#030712", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#DC2626", fontSize: 16, fontWeight: "900", letterSpacing: 4, fontFamily: "sans-serif" }}>
          EUROSIA ONE
        </Text>
        <Text style={{ color: "#6B7280", fontSize: 10, marginTop: 8, letterSpacing: 2, textTransform: "uppercase" }}>
          Initializing Node Channels...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      <StatusBar style="light" />

      {/* STACK NAVIGATION TRANSITIONS */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade_from_bottom" }} />
        <Stack.Screen name="tool" options={{ animation: "slide_from_right" }} />
      </Stack>

      {/* OFFLINE NETWORK STATUS DRAWER */}
      {isOffline && (
        <SafeAreaView style={styles.offlineBanner}>
          <WifiOff size={14} color="#FFF" />
          <Text style={styles.offlineText}>OPERATING OFFLINE - OFFLINE CACHE ENFORCED</Text>
        </SafeAreaView>
      )}

      {/* SOCKET REAL-TIME micro notification banners */}
      {socketNotification && (
        <Animated.View
          style={[
            styles.notificationBanner,
            {
              transform: [
                {
                  translateY: notificationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-120, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => router.push("/(tabs)/chats")}
            style={styles.notificationInner}
          >
            <View style={styles.bellWrapper}>
              <Bell size={16} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {socketNotification.title}
              </Text>
              <Text style={styles.bannerMessage} numberOfLines={2}>
                {socketNotification.message}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

function useEffectStateAnim() {
  const [animValue] = useState(new Animated.Value(0));
  return animValue;
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: "#B91C1C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  offlineText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1.5,
    fontFamily: "monospace",
  },
  notificationBanner: {
    position: "absolute",
    top: 48,
    left: 16,
    right: 16,
    backgroundColor: "#090D1A",
    borderRadius: 16,
    borderColor: "#101726",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 99999,
  },
  notificationInner: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    gap: 12,
  },
  bellWrapper: {
    padding: 8,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 12,
    borderColor: "rgba(220, 38, 38, 0.2)",
    borderWidth: 1,
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "extrabold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bannerMessage: {
    color: "#D1D5DB",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
});
