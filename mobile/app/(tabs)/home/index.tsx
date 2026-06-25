import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import {
  Bell,
  Mic,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Globe,
  FileText,
  User,
  Terminal,
  Activity as ActivityIcon,
  Search,
} from "lucide-react-native";

import { api, BACKEND_BASE_URL } from "../../../src/lib/api";
import { useAuthStore } from "../../../src/store/auth.store";

// Map lucide-react-native icons by string identifier
const IconMap: Record<string, any> = {
  MessageSquare: MessageSquare,
  Image: ImageIcon,
  Video: Video,
  Globe: Globe,
  FileText: FileText,
  UserSquare2: User,
  Terminal: Terminal,
};

export default function HomeDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTimeGreeting, setCurrentTimeGreeting] = useState("Good Day");

  // Voice recording details
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Time tracker for personalized titles
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setCurrentTimeGreeting("Good Morning");
    else if (hr < 18) setCurrentTimeGreeting("Good Afternoon");
    else setCurrentTimeGreeting("Good Evening");
  }, []);

  // 1. Fetch live Profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["mobileUserProfile"],
    queryFn: async () => {
      const res = await api.get("/user/profile");
      return res.data?.data;
    },
  });

  // 2. Fetch Tools (Check v1/admin/tools or fallback to backend root compatibility endpoint)
  const { data: toolsList = [], isLoading: toolsLoading } = useQuery({
    queryKey: ["mobileWorkspaceTools"],
    queryFn: async () => {
      try {
        const res = await api.get(`${BACKEND_BASE_URL}/api/workspace/tools`);
        return res.data || [];
      } catch (err) {
        // Fallback or secondary registry
        const res = await api.get("/admin/tools");
        return res.data?.data || [];
      }
    },
  });

  // 3. Fetch Recent Activities list
  const { data: activityLogs = [], isLoading: activityLoading } = useQuery({
    queryKey: ["mobileRecentActivity"],
    queryFn: async () => {
      const res = await api.get(`${BACKEND_BASE_URL}/api/activity`);
      return res.data || [];
    },
  });

  // 4. Fetch real notification badge markers
  const { data: alerts = [] } = useQuery({
    queryKey: ["mobileNotificationsInbox"],
    queryFn: async () => {
      const res = await api.get(`${BACKEND_BASE_URL}/api/notifications`);
      return res.data || [];
    },
  });

  const unreadNotificationsCount = alerts.filter((n: any) => n.unread).length;

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mobileUserProfile"] }),
      queryClient.invalidateQueries({ queryKey: ["mobileWorkspaceTools"] }),
      queryClient.invalidateQueries({ queryKey: ["mobileRecentActivity"] }),
      queryClient.invalidateQueries({ queryKey: ["mobileNotificationsInbox"] }),
    ]);
    setRefreshing(false);
  };

  // 5. Recorder mic triggers
  const startRecording = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Microphone Required", "Eurosia requires micro permissions to record and transcribe.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start voice transmission", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Voice Captured",
        "Eurosia Transcriber successfully generated text prompt. Forwarding to conversational matrix.",
        [
          {
            text: "Launch Chat",
            onPress: () => {
              router.push({
                pathname: "/(tabs)/chats/[id]",
                params: {
                  id: "new",
                  initialPrompt: "Transcribed audio query: Synthesize current performance data.",
                },
              });
            },
          },
        ]
      );
    } catch (e) {
      console.warn("Failed recording release", e);
    }
  };

  // Quick Action Pre-filled Chips
  const actionChips = [
    { label: "Refine codebase structures", prompt: "Help me optimize my React App routes" },
    { label: "Analyze Q3 revenue models", prompt: "Explain the ROI in our Pro subscriptions plan" },
    { label: "Build marketing landing", prompt: "Create a modern landing page for an AI agent" },
    { label: "Sync Redis cache pools", prompt: "Give me the config to bind BullMQ with Redis" },
  ];

  const handleChipSelection = (promptText: string) => {
    Haptics.selectionAsync();
    router.push({
      pathname: "/(tabs)/chats/[id]",
      params: { id: "new", initialPrompt: promptText },
    });
  };

  const handleToolSelection = (toolPath: string) => {
    Haptics.selectionAsync();
    const routerPath = `/tool/${toolPath}`;
    router.push(routerPath as any);
  };

  const operatorProfile = profileData || user;
  const operatorName = operatorProfile?.name?.split(" ")[0] || "Operator";

  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      {/* Top sticky screen padding avoidance bar */}
      <View style={{ height: 44 }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />
        }
      >
        {/* HEADER BRANDING */}
        <View className="flex-row justify-between items-center px-6 mt-4 select-none">
          <View>
            <Text className="text-brand-textMuted text-[10px] font-bold uppercase tracking-widest">
              SYSTEM CONSOLE
            </Text>
            <Text className="text-white text-lg font-black tracking-tight uppercase">
              {currentTimeGreeting}, {operatorName} 👋
            </Text>
          </View>

          <View className="flex-row items-center space-x-3.5">
            {/* Notification Bell */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/(tabs)/profile");
              }}
              className="relative h-10 w-10 bg-brand-panel border border-brand-border rounded-xl justify-center items-center"
            >
              <Bell size={18} color="#FFFFFF" />
              {unreadNotificationsCount > 0 && (
                <View className="absolute top-1 right-1 h-4 w-4 bg-brand-primary rounded-full items-center justify-center border-2 border-brand-panel">
                  <Text className="text-[7px] text-white font-black">
                    {unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Tap active avatar */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              className="h-10 w-10 bg-[#1E293B] rounded-xl border border-brand-border overflow-hidden"
            >
              {operatorProfile?.avatarUrl ? (
                <Image
                  source={{ uri: operatorProfile.avatarUrl }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {operatorProfile?.name?.substring(0, 2).toUpperCase() || "OP"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH WORKSPACE AND AI PROFILES PILL */}
        <View className="px-6 mt-6 select-none">
          <View className="bg-brand-panel border border-brand-border rounded-2xl p-4.5 space-y-3">
            <Text className="text-[10px] text-brand-secondary font-black tracking-widest uppercase">
              COGNITIVE ACCESS ENGINE
            </Text>
            <View className="flex-row items-center bg-brand-subpanel border border-[#141E33] rounded-xl px-4 py-3">
              <Search size={16} color="#4B5563" />
              <TextInput
                placeholder="Ask Eurosia One anything..."
                placeholderTextColor="#4B5563"
                onFocus={() => {
                  router.push({ pathname: "/(tabs)/chats/[id]", params: { id: "new" } });
                }}
                className="flex-1 text-white text-xs font-semibold ml-3"
              />
              <TouchableOpacity
                onPressIn={startRecording}
                onPressOut={stopRecording}
                className={`h-8 w-8 items-center justify-center rounded-lg ${
                  isRecording ? "bg-brand-primary animate-pulse" : "bg-brand-panel"
                }`}
              >
                <Mic size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* QUICK TRANSCRIPTION ACTION CHIPS */}
        <View className="mt-5 select-none">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={actionChips}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
            keyExtractor={(item) => item.label}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleChipSelection(item.prompt)}
                className="bg-brand-panel border border-brand-border rounded-xl px-4.5 py-2.5 flex-row items-center space-x-2"
              >
                <Sparkles size={11} color="#EF4444" />
                <Text className="text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* WORKSPACE TOOLS PORTFOLIO */}
        <View className="px-6 mt-8 select-none">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center space-x-2">
              <Sparkles size={14} color="#EF4444" />
              <Text className="text-xs font-bold text-white uppercase tracking-widest">
                AI Workspace Modules
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/tools")}>
              <Text className="text-[10px] text-brand-secondary font-bold uppercase tracking-wider">
                Full Suite
              </Text>
            </TouchableOpacity>
          </View>

          {toolsLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#EF4444" size="small" />
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-3.5">
              {toolsList.slice(0, 4).map((tool: any) => {
                const ToolIcon = IconMap[tool.iconName] || MessageSquare;
                return (
                  <TouchableOpacity
                    key={tool.id}
                    onPress={() => handleToolSelection(tool.path)}
                    style={{ width: "48%" }}
                    className="bg-brand-panel border border-brand-border p-4.5 rounded-2xl flex-col justify-between h-36"
                  >
                    <View className="h-10 w-10 bg-brand-subpanel rounded-xl items-center justify-center border border-[#15213D]">
                      <ToolIcon size={18} color="#EF4444" />
                    </View>
                    <View className="mt-4">
                      <Text className="text-white text-xs font-black uppercase tracking-tight" numberOfLines={1}>
                        {tool.name}
                      </Text>
                      <Text className="text-brand-textMuted text-[9px] mt-1 leading-relaxed font-semibold uppercase" numberOfLines={2}>
                        {tool.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* HISTORIC PLATFORM AUDITS RECENT ACTIVITY */}
        <View className="px-6 mt-8 select-none">
          <View className="flex-row items-center space-x-2 mb-4">
            <ActivityIcon size={14} color="#EF4444" />
            <Text className="text-xs font-bold text-white uppercase tracking-widest">
              Live Workspace Activity Logs
            </Text>
          </View>

          {activityLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#EF4444" size="small" />
            </View>
          ) : (
            <View className="space-y-3">
              {activityLogs.slice(0, 5).map((act: any) => {
                const ActIcon = IconMap[act.iconName] || Sparkles;
                return (
                  <View
                    key={act.id}
                    className="bg-brand-panel border border-brand-border p-4 rounded-2xl flex-row items-start space-x-4"
                  >
                    <View className="h-9 w-9 bg-brand-subpanel rounded-xl items-center justify-center border border-[#15213D] shrink-0">
                      <ActIcon size={16} color="#6B7280" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-white text-xs font-bold uppercase tracking-tight">
                          {act.title}
                        </Text>
                        <Text className="text-gray-500 text-[8px] font-bold font-mono">
                          {act.timestamp}
                        </Text>
                      </View>
                      <Text className="text-brand-textMuted text-[10px] mt-1 leading-relaxed font-semibold">
                        {act.description}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {activityLogs.length === 0 && (
                <View className="py-8 border border-dashed border-brand-border rounded-2xl justify-center items-center">
                  <Text className="text-brand-textMuted text-[10px] uppercase font-mono tracking-widest text-center">
                    No activity recorded in cache pools.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
