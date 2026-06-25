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
import { ArrowLeft, Play, Film, Sparkles } from "lucide-react-native";

export default function VideoGeneratorScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("4s");
  const [loading, setLoading] = useState(false);
  const [resultVideoUrl, setResultVideoUrl] = useState("");

  const handleAssembleVideo = () => {
    if (!prompt.trim()) {
      Alert.alert("Prompt Required", "Please describe the cinematic animation you wish to synthesize.");
      return;
    }

    setLoading(true);
    setResultVideoUrl("");
    Haptics.selectionAsync();

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResultVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-blue-neon-lights-42286-large.mp4");
      setLoading(false);
    }, 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      <View style={{ height: 44 }} />

      {/* HEADER */}
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
            Cinematic Generator
          </Text>
          <Text className="text-brand-textMuted text-[8.5px] font-bold uppercase tracking-wider font-mono">
            Eurosia Video Synthesis
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* VIEW PREVIEW AREA */}
        <View className="w-full bg-brand-panel border border-brand-border rounded-2xl h-64 justify-center items-center overflow-hidden mb-6 select-none">
          {loading ? (
            <View className="items-center">
              <ActivityIndicator color="#EF4444" size="large" />
              <Text className="text-brand-textMuted text-[10px] font-mono mt-4 uppercase tracking-widest animate-pulse">
                Synthesizing cinematic frames...
              </Text>
            </View>
          ) : resultVideoUrl ? (
            <View className="items-center px-6">
              <Film size={28} color="#10B981" />
              <Text className="text-white text-xs font-bold uppercase mt-3 text-center">
                Cinematic Clip compiled successfully
              </Text>
              <Text className="text-brand-textMuted text-[9px] font-mono mt-1 text-center" numberOfLines={1}>
                {resultVideoUrl}
              </Text>
            </View>
          ) : (
            <View className="items-center px-6">
              <Film size={28} color="#6B7280" />
              <Text className="text-gray-400 text-xs font-bold uppercase mt-3">
                Cinematic chamber ready
              </Text>
              <Text className="text-brand-textMuted text-[10px] uppercase font-semibold text-center mt-1">
                Design prompts to compile cinematic loops.
              </Text>
            </View>
          )}
        </View>

        {/* INPUT PARAMETERS */}
        <View className="space-y-4">
          <View>
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono select-none">
              Motion design details
            </Text>
            <View className="bg-brand-panel border border-brand-border p-4 rounded-xl">
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="E.g., Drone sweep over a neon skyscrapers skyline, raining, futuristic cyberpunk mood..."
                placeholderTextColor="#4B5563"
                multiline
                className="text-white text-xs font-semibold max-h-20"
              />
            </View>
          </View>

          {/* DURATION PRESET ROW */}
          <View className="mt-4 select-none">
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
              Temporal Duration Preset
            </Text>
            <View className="flex-row space-x-2">
              {["4s", "8s", "12s"].map((dur) => (
                <TouchableOpacity
                  key={dur}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDuration(dur);
                  }}
                  className={`flex-1 py-2.5 border rounded-xl items-center ${
                    duration === dur ? "border-brand-primary bg-brand-primary/10" : "border-brand-border bg-brand-panel"
                  }`}
                >
                  <Text className="text-white text-[10px] font-black">{dur}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* TRIGGER ACTION */}
          <TouchableOpacity
            onPress={handleAssembleVideo}
            disabled={loading}
            className="w-full bg-brand-primary h-12 rounded-xl flex-row items-center justify-center mt-6 select-none"
          >
            <Sparkles size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-black uppercase tracking-widest ml-3">
              Synthesize Cinematic Video
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
