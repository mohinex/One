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
import { ArrowLeft, UserCheck, Bot, Sparkles } from "lucide-react-native";

export default function CharacterGeneratorScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [voiceType, setVoiceType] = useState("Pro-Male");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleAssembleCharacter = () => {
    if (!name.trim() || !personality.trim()) {
      Alert.alert("Inputs Required", "Please specify names and dialogue personalities.");
      return;
    }

    setLoading(true);
    setStatus("");
    Haptics.selectionAsync();

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus(`[Character Activated] Successfully spawned dialogue node agent: "${name.toUpperCase()}" with personality traits: "${personality}". Attaching voice synthesis: [${voiceType.toUpperCase()}].`);
      setLoading(false);
    }, 1500);
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
            Character Generator
          </Text>
          <Text className="text-brand-textMuted text-[8.5px] font-bold uppercase tracking-wider font-mono">
            Eurosia Agent Dialogue Customization
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View className="space-y-4">
          {/* NAME */}
          <View>
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono select-none">
              Node Character Name
            </Text>
            <View className="bg-brand-panel border border-brand-border p-4 rounded-xl">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="E.g., Senior Systems Architect Eli"
                placeholderTextColor="#4B5563"
                className="text-white text-xs font-semibold"
              />
            </View>
          </View>

          {/* PERSONALITY */}
          <View className="mt-4">
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono select-none">
              Dialect and traits instructions
            </Text>
            <View className="bg-brand-panel border border-brand-border p-4 rounded-xl">
              <TextInput
                value={personality}
                onChangeText={setPersonality}
                placeholder="E.g., Highly analytical, direct, slightly sarcastic but extremely structured technical leader..."
                placeholderTextColor="#4B5563"
                multiline
                className="text-white text-xs font-semibold max-h-20"
              />
            </View>
          </View>

          {/* VOICE TYPES SELECTOR ROW */}
          <View className="mt-4 select-none">
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
              Synthetic Voice Target
            </Text>
            <View className="flex-row space-x-2">
              {["Pro-Male", "Neutral Soft", "Cybernetic Echo"].map((vt) => (
                <TouchableOpacity
                  key={vt}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setVoiceType(vt);
                  }}
                  className={`flex-1 py-2.5 border rounded-xl items-center ${
                    voiceType === vt ? "border-brand-primary bg-brand-primary/10" : "border-brand-border bg-brand-panel"
                  }`}
                >
                  <Text className="text-white text-[9px] font-black uppercase tracking-widest">{vt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ASSEMBLE TRIGGER BUTTON */}
          <TouchableOpacity
            onPress={handleAssembleCharacter}
            disabled={loading}
            className="w-full bg-brand-primary h-12 rounded-xl flex-row items-center justify-center mt-6 select-none"
          >
            <UserCheck size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-black uppercase tracking-widest ml-3">
              Deploy Customized dialogue Agent
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View className="py-12 items-center select-none">
            <ActivityIndicator color="#EF4444" size="large" />
            <Text className="text-brand-textMuted text-[10px] font-mono mt-4 uppercase tracking-widest animate-pulse">
              Generating neural voice models...
            </Text>
          </View>
        )}

        {status && !loading && (
          <View className="bg-brand-panel border border-brand-border rounded-2xl p-6 mt-6 select-none">
            <Text className="text-white text-xs font-extrabold uppercase tracking-wider mb-2.5">
              Spawn Output
            </Text>
            <Text className="text-gray-300 text-[10px] font-mono leading-relaxed">{status}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
