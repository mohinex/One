import React, { useState } from "react";
import {
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Pin,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";

import { api, BACKEND_BASE_URL } from "../../../src/lib/api";

export default function ChatsIndexScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch live conversation indexes (with mock fallbacks)
  const { data: chatSessions = [], isLoading } = useQuery({
    queryKey: ["mobileChatsDirectory"],
    queryFn: async () => {
      try {
        const res = await api.get(`/chats`);
        return res.data?.data || res.data || [];
      } catch (err) {
        // Fallback to mock cluster
        const res = await api.get(`${BACKEND_BASE_URL}/api/chats`);
        return res.data || [];
      }
    },
  });

  // 2. Clear conversation instance mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/chats/${id}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["mobileChatsDirectory"] });
    },
    onError: (err: any) => {
      Alert.alert("Delete Failed", err.response?.data?.message || "Could not delete chat session.");
    },
  });

  const handleDeletePress = (id: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to permanently delete the conversation: "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Session",
          style: "destructive",
          onPress: () => deleteChatMutation.mutate(id),
        },
      ]
    );
  };

  const handleLaunchNewChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/(tabs)/chats/[id]", params: { id: "new" } });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["mobileChatsDirectory"] });
    setRefreshing(false);
  };

  const filteredSessions = chatSessions.filter((chat: any) =>
    (chat.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      {/* Top Margin Buffer */}
      <View style={{ height: 44 }} />

      {/* HEADER SECTION */}
      <View className="flex-row justify-between items-center px-6 mt-4 select-none">
        <View>
          <Text className="text-brand-textMuted text-[10px] font-bold uppercase tracking-widest">
            HISTORIES AUDIT
          </Text>
          <Text className="text-white text-lg font-black tracking-tight uppercase">
            Conversations
          </Text>
        </View>

        {/* Assemble New Session trigger */}
        <TouchableOpacity
          onPress={handleLaunchNewChat}
          className="h-10 w-10 bg-brand-primary rounded-xl justify-center items-center shadow-md shadow-brand-primary/20"
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* SEARCH SYSTEM FILTERS */}
      <View className="px-6 mt-6 select-none">
        <View className="flex-row items-center bg-brand-panel border border-brand-border rounded-xl px-4 py-3">
          <Search size={14} color="#4B5563" />
          <TextInput
            placeholder="Search active matrices..."
            placeholderTextColor="#4B5563"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white text-xs font-semibold ml-3"
          />
        </View>
      </View>

      {/* SESSIONS FLATLIST */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#EF4444" size="large" />
          <Text className="text-brand-textMuted text-xs font-semibold uppercase mt-3 font-mono">
            Scanning indexes...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 110, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />
          }
          renderItem={({ item }) => (
            <View className="bg-brand-panel border border-brand-border rounded-2xl overflow-hidden">
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push({ pathname: "/(tabs)/chats/[id]", params: { id: item.id } });
                }}
                activeOpacity={0.85}
                className="p-4.5 flex-row items-center justify-between"
              >
                <View className="flex-row items-center space-x-4 flex-1">
                  {/* Icon branding depending on pinned status */}
                  <View className="h-10 w-10 bg-brand-subpanel rounded-xl items-center justify-center border border-[#141F36]">
                    <MessageSquare size={16} color="#EF4444" />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center space-x-2">
                      {item.isPinned && <Pin size={10} color="#EF4444" />}
                      <Text className="text-white text-sm font-bold uppercase tracking-tight" numberOfLines={1}>
                        {item.title || "Untitled Session"}
                      </Text>
                    </View>

                    <Text className="text-brand-textMuted text-[10px] mt-1.5 font-bold uppercase tracking-wide font-mono flex-row items-center">
                      <Sparkles size={10} color="#DC2626" /> Model: {item.modelId || "gemini-2.5"} 
                      {item.messageCount !== undefined && ` • ${item.messageCount} messages`}
                    </Text>
                  </View>
                </View>

                {/* Right utility parameters */}
                <View className="flex-row items-center space-x-3.5">
                  <TouchableOpacity
                    onPress={() => handleDeletePress(item.id, item.title)}
                    className="p-2 bg-brand-subpanel rounded-xl border border-brand-border"
                  >
                    <Trash2 size={13} color="#9CA3AF" />
                  </TouchableOpacity>
                  <ChevronRight size={16} color="#4B5563" />
                </View>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View className="py-16 justify-center items-center px-4 select-none">
              <View className="h-12 w-12 bg-brand-panel border border-brand-border rounded-full items-center justify-center mb-4">
                <MessageSquare size={18} color="#6B7280" />
              </View>
              <Text className="text-white text-sm font-bold uppercase tracking-wide">
                No active matrices
              </Text>
              <Text className="text-brand-textMuted text-xs text-center leading-relaxed font-semibold mt-1">
                Establish your first intelligent engineering matrix to coordinate models.
              </Text>
              <TouchableOpacity
                onPress={handleLaunchNewChat}
                className="bg-brand-primary px-5 py-3 rounded-xl mt-6"
              >
                <Text className="text-white text-xs font-black uppercase tracking-widest">
                  Assemble Matrix
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
