import React, { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Play, Settings, RefreshCw } from "lucide-react-native";

export default function AutomationStudioScreen() {
  const router = useRouter();
  const [triggerName, setTriggerName] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handleSaveWorkflow = () => {
    if (!triggerName.trim() || !actionUrl.trim()) {
      Alert.alert("Inputs Required", "Please specify trigger names and webhook URLs.");
      return;
    }

    setLoading(true);
    setStatusText("");
    Haptics.selectionAsync();

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatusText(`[Automation Complete] Successfully compiled task trigger "${triggerName.toUpperCase()}" against proxy: ${actionUrl}. Synchronizing with Redis clusters.`);
      setLoading(false);
    }, 1500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      <View style={{ height: 44 }} />

      {/* HEADER COGNITIVE */}
      <View className="flex-row items-center space-x-3.5 px-4 py-3 bg-brand-panel border-b border-brand-border select-none">
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          className="p-2 bg-brand-subpanel rounded-xl border border-brand-border"
        >
          <ArrowLeft size={16} color="#FFFFFF" />
        </TouchableOpacity>

        <View>
          <Text className="text-white text-xs font-black uppercase tracking-tight">
            Automation Studio
          </Text>
          <Text className="text-brand-textMuted text-[8.5px] font-bold uppercase tracking-wider font-mono">
            Eurosia Event Pipelines
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View className="space-y-4">
          {/* TRIGGER FIELDS */}
          <View>
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono select-none">
              Trigger Operational Identity
            </Text>
            <View className="bg-brand-panel border border-brand-border p-4 rounded-xl">
              <TextInput
                value={triggerName}
                onChangeText={setTriggerName}
                placeholder="E.g., On User Registered"
                placeholderTextColor="#4B5563"
                className="text-white text-xs font-semibold"
              />
            </View>
          </View>

          {/* WEBHOOK DESTINATIONS */}
          <View className="mt-4">
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono select-none">
              Forward Webhook Destination
            </Text>
            <View className="bg-brand-panel border border-brand-border p-4 rounded-xl">
              <TextInput
                value={actionUrl}
                onChangeText={setActionUrl}
                placeholder="https://api.eurosia.one/v1/sync"
                placeholderTextColor="#4B5563"
                autoCapitalize="none"
                keyboardType="url"
                className="text-white text-xs font-semibold"
              />
            </View>
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity
            onPress={handleSaveWorkflow}
            disabled={loading}
            className="w-full bg-brand-primary h-12 rounded-xl flex-row items-center justify-center mt-6 select-none"
          >
            <Settings size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-black uppercase tracking-widest ml-3">
              Deploy serverless webhook trigger
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View className="py-12 items-center select-none">
            <ActivityIndicator color="#EF4444" size="large" />
            <Text className="text-brand-textMuted text-[10px] font-mono mt-4 uppercase tracking-widest animate-pulse">
              Compiling routing tasks...
            </Text>
          </View>
        )}

        {statusText && !loading && (
          <View className="bg-brand-panel border border-brand-border rounded-2xl p-6 mt-6 select-none">
            <Text className="text-white text-xs font-bold uppercase tracking-wider mb-2">
              Compiler Output
            </Text>
            <Text className="text-gray-300 text-[10px] font-mono leading-relaxed">{statusText}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
