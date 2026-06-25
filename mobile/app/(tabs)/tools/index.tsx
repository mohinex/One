import React, { useState } from "react";
import {
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import {
  Search,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Globe,
  FileText,
  User,
  Terminal,
  Grid,
  ChevronRight,
  Shield,
} from "lucide-react-native";

import { api, BACKEND_BASE_URL } from "../../../src/lib/api";

const IconMap: Record<string, any> = {
  MessageSquare: MessageSquare,
  Image: ImageIcon,
  Video: Video,
  Globe: Globe,
  FileText: FileText,
  UserSquare2: User,
  Terminal: Terminal,
};

export default function ToolsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch live workspace tools list (with mock backup parameters)
  const { data: toolsList = [], isLoading } = useQuery({
    queryKey: ["mobileAllToolsCatalog"],
    queryFn: async () => {
      try {
        const res = await api.get(`${BACKEND_BASE_URL}/api/workspace/tools`);
        return res.data || [];
      } catch (err) {
        const res = await api.get("/admin/tools");
        return res.data?.data || [];
      }
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["mobileAllToolsCatalog"] });
    setRefreshing(false);
  };

  // Extract absolute unique operational categories
  const categoriesList = ["ALL", ...new Set<string>(toolsList.map((t: any) => t.category || "GENERAL"))];

  const filteredTools = toolsList.filter((tool: any) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToolPress = (toolPath: string) => {
    Haptics.selectionAsync();
    router.push(`/tool/${toolPath}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      {/* Top spacing */}
      <View style={{ height: 44 }} />

      {/* HEADER BAR */}
      <View className="px-6 mt-4 select-none">
        <Text className="text-brand-textMuted text-[10px] font-bold uppercase tracking-widest">
          COGNITIVE MODULES
        </Text>
        <Text className="text-white text-lg font-black tracking-tight uppercase">
          AI Workspace Suite
        </Text>
      </View>

      {/* FILTER SEARCH BAR */}
      <View className="px-6 mt-5 select-none">
        <View className="flex-row items-center bg-brand-panel border border-brand-border rounded-xl px-4 py-3">
          <Search size={14} color="#4B5563" />
          <TextInput
            placeholder="Search cognitive modules..."
            placeholderTextColor="#4B5563"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white text-xs font-semibold ml-3"
          />
        </View>
      </View>

      {/* CATEGORY CHIPS HORIZONTAL FLATLIST */}
      <View className="mt-4 select-none">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoriesList}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(item);
                }}
                className={`px-4.5 py-2 rounded-xl border ${
                  isSelected ? "bg-brand-primary border-brand-primary" : "bg-brand-panel border-brand-border"
                }`}
              >
                <Text className="text-[9px] font-black uppercase tracking-widest text-white">
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* TOOLS PORTFOLIO LIST */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#EF4444" size="large" />
          <Text className="text-brand-textMuted text-xs font-semibold uppercase mt-3 font-mono">
            Loading modules index...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTools}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 110, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />
          }
          renderItem={({ item }) => {
            const ToolIcon = IconMap[item.iconName] || Grid;
            const requiredPlan = item.requiredPlan || "free";
            return (
              <View className="bg-brand-panel border border-brand-border rounded-2xl overflow-hidden">
                <TouchableOpacity
                  onPress={() => handleToolPress(item.path)}
                  activeOpacity={0.85}
                  className="p-4 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center space-x-4 flex-1">
                    <View className="h-10 w-10 bg-brand-subpanel rounded-xl items-center justify-center border border-[#141E34]">
                      <ToolIcon size={18} color="#EF4444" />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center space-x-2.5">
                        <Text className="text-white text-xs font-extrabold uppercase tracking-tight">
                          {item.name}
                        </Text>
                        {requiredPlan !== "free" && (
                          <View className="bg-[#121F2D] border border-brand-secondary/25 px-2 py-0.5 rounded-md flex-row items-center space-x-1">
                            <Shield size={7} color="#EF4444" />
                            <Text className="text-brand-secondary text-[6.5px] font-bold uppercase">
                              {requiredPlan}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-brand-textMuted text-[10px] uppercase font-semibold leading-relaxed mt-1" numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={14} color="#4B5563" />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="py-16 justify-center items-center px-4 select-none">
              <View className="h-12 w-12 bg-brand-panel border border-brand-border rounded-full items-center justify-center mb-4">
                <Grid size={18} color="#6B7280" />
              </View>
              <Text className="text-white text-sm font-bold uppercase tracking-wide">
                No matching tools
              </Text>
              <Text className="text-brand-textMuted text-xs text-center leading-relaxed font-semibold mt-1">
                No active neural module is registered matching your category or search parameters.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
