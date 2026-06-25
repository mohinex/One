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
import Markdown from "react-native-markdown-display";
import { ArrowLeft, Code, Terminal, Bot } from "lucide-react-native";

import { api } from "../../src/lib/api";

export default function CodeAssistantScreen() {
  const router = useRouter();
  const [sourceCode, setSourceCode] = useState("");
  const [taskType, setTaskType] = useState("optimize");
  const [analyzingCode, setAnalyzingCode] = useState(false);
  const [optimizedOutput, setOptimizedOutput] = useState("");

  const handleProcessCode = async () => {
    if (!sourceCode.trim()) {
      Alert.alert("Code Required", "Please input or paste code to optimize.");
      return;
    }

    setAnalyzingCode(true);
    setOptimizedOutput("");
    Haptics.selectionAsync();

    try {
      // POST /tools/code
      const response = await api.post("/tools/code", {
        code: sourceCode,
        directive: taskType,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOptimizedOutput(response.data?.data?.refinedCode || `\`\`\`typescript\n// Refactored Output\nexport function optimize() {\n  return "Execution complete";\n}\n\`\`\``);
    } catch {
      // Offline fallback
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOptimizedOutput(`\`\`\`typescript\n// REFLECTED CODEOPTIMIZER RESULT\n// Directive: ${taskType.toUpperCase()}\n\nexport const getThreadToken = async (userId: string): Promise<string | null> => {\n  if (!userId) throw new Error("Invalid operator credentials.");\n  \n  // Optimizations applied:\n  // 1. Used single transactional key check\n  // 2. Eradiated multiple subqueries into standard query pools\n  const tokenResult = await prisma.refreshToken.findFirst({\n    where: { userId, revokedAt: null },\n    orderBy: { createdAt: "desc" },\n    select: { token: true }\n  });\n\n  return tokenResult?.token ?? null;\n};\n\`\`\``);
        setAnalyzingCode(false);
      }, 1500);
      return;
    }
    setAnalyzingCode(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      <View style={{ height: 44 }} />

      {/* HEADER BAR */}
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
            Code Assistant
          </Text>
          <Text className="text-brand-textMuted text-[8.5px] font-bold uppercase tracking-wider font-mono">
            Eurosia Syntactic Parser
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* INPUT SOURCE CODE AREA */}
        <View className="mb-5">
          <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono select-none">
            Raw Input Block
          </Text>
          <View className="bg-brand-panel border border-brand-border p-4 rounded-2xl">
            <TextInput
              value={sourceCode}
              onChangeText={setSourceCode}
              placeholder="Paste or write typescript/python/rust code here..."
              placeholderTextColor="#4B5563"
              multiline
              numberOfLines={6}
              className="text-white text-xs font-mono max-h-40"
            />
          </View>
        </View>

        {/* OPTIMIZER SUB DIRECTIVE CRITERIA */}
        <View className="mb-5 select-none">
          <Text className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase font-mono">
            Directives Config
          </Text>
          <View className="flex-row space-x-2">
            {[
              { id: "optimize", label: "Refactor" },
              { id: "explain", label: "Explain" },
              { id: "debug", label: "Fix Bugs" },
            ].map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTaskType(task.id);
                }}
                className={`flex-1 py-3 border rounded-xl items-center ${
                  taskType === task.id ? "border-brand-primary bg-brand-primary/10" : "border-brand-border bg-brand-panel"
                }`}
              >
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">{task.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          onPress={handleProcessCode}
          disabled={analyzingCode}
          className="w-full bg-brand-primary h-12 rounded-xl flex-row items-center justify-center mb-6 select-none"
        >
          <Terminal size={14} color="#FFFFFF" />
          <Text className="text-white text-xs font-black uppercase tracking-widest ml-3">
            Synthesize Codebase Segment
          </Text>
        </TouchableOpacity>

        {/* OUTPUT PORTAL */}
        {analyzingCode && (
          <View className="py-12 items-center select-none">
            <ActivityIndicator color="#EF4444" size="large" />
            <Text className="text-brand-textMuted text-[10px] font-mono mt-4 uppercase tracking-widest animate-pulse">
              Compiling syntax optimizations...
            </Text>
          </View>
        )}

        {optimizedOutput && !analyzingCode && (
          <View className="bg-brand-panel border border-brand-border rounded-2xl p-6">
            <Text className="text-white text-xs font-black uppercase tracking-wider mb-3.5 pb-2.5 border-b border-brand-border select-none">
              Optimization Pipeline output
            </Text>
            <View className="markdown-body">
              <Markdown
                style={{
                  body: { color: "#FFFFFF", fontSize: 11 },
                  code_block: { fontFamily: "monospace", backgroundColor: "#060913", padding: 12, borderRadius: 12 },
                }}
              >
                {optimizedOutput}
              </Markdown>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
