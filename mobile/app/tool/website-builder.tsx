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
import { ArrowLeft, Globe, Play, Sparkles } from "lucide-react-native";

export default function WebsiteBuilderScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [theme, setTheme] = useState("Dark Neo");
  const [compiling, setCompiling] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState("");

  const handleBuildWebsite = () => {
    if (!prompt.trim()) {
      Alert.alert("Input Required", "Please specify the type of website layout you wish to construct.");
      return;
    }

    setCompiling(true);
    setCreatedTemplate("");
    Haptics.selectionAsync();

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreatedTemplate(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { background-color: #030712; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background-color: #090D1A; border: 1px solid #101726; padding: 40px; border-radius: 20px; text-align: center; }
    h1 { color: #DC2626; margin: 0 0 10px 0; }
    p { color: #9CA3AF; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Eurosia Generated</h1>
    <p>Constructed Layout successfully loaded utilizing theme [${theme.toUpperCase()}]</p>
  </div>
</body>
</html>`);
      setCompiling(false);
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
            Web Builder Portal
          </Text>
          <Text className="text-brand-textMuted text-[8.5px] font-bold uppercase tracking-wider font-mono">
            Eurosia Page Generation
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* VIEW INPUT AND INTERFACE */}
        <View className="space-y-4">
          <View>
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono select-none">
              Design and layout parameters
            </Text>
            <View className="bg-brand-panel border border-brand-border p-4 rounded-xl">
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="E.g., Generate a landing page for an premium organic coffee brand..."
                placeholderTextColor="#4B5563"
                className="text-white text-xs font-semibold"
              />
            </View>
          </View>

          {/* THEME SELECTOR */}
          <View className="mt-4 select-none">
            <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
              Visual Preset
            </Text>
            <View className="flex-row space-x-2">
              {["Dark Neo", "Elegant Ivory", "Emerald Minimalist"].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTheme(t);
                  }}
                  className={`flex-1 py-2.5 border rounded-xl items-center ${
                    theme === t ? "border-brand-primary bg-brand-primary/10" : "border-brand-border bg-brand-panel"
                  }`}
                >
                  <Text className="text-white text-[9px] font-black uppercase tracking-widest">{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            onPress={handleBuildWebsite}
            disabled={compiling}
            className="w-full bg-brand-primary h-12 rounded-xl flex-row items-center justify-center mt-6 select-none"
          >
            <Globe size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-black uppercase tracking-widest ml-3">
              Generate Responsive Site Markup
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOADING FLOW */}
        {compiling && (
          <View className="py-12 items-center select-none">
            <ActivityIndicator color="#EF4444" size="large" />
            <Text className="text-brand-textMuted text-[10px] font-mono mt-4 uppercase tracking-widest animate-pulse">
              Generating HTML/CSS matrices...
            </Text>
          </View>
        )}

        {/* COMPILING PREVIEW VIEW BOX */}
        {createdTemplate && !compiling && (
          <View className="bg-brand-panel border border-brand-border rounded-2xl p-6 mt-6">
            <Text className="text-white text-xs font-black uppercase tracking-wider mb-3.5 pb-2.5 border-b border-brand-border select-none">
              Template Stream Output
            </Text>
            <ScrollView style={{ maxHeight: 200 }} className="bg-[#0C1322] p-4.5 rounded-xl">
              <Text className="text-emerald-400 text-[10px] font-mono">{createdTemplate}</Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
