import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Markdown from "react-native-markdown-display";
import { Audio } from "expo-av";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Mic,
  Sparkles,
  Bot,
  User,
  Settings,
  HelpCircle,
  File,
  X,
  Volume2,
} from "lucide-react-native";

import { api, API_BASE_URL } from "../../../src/lib/api";
import { useAuthStore } from "../../../src/store/auth.store";

const screenWidth = Dimensions.get("window").width;

interface MessagePayload {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  attachments?: Array<{ type: string; url: string; name?: string }>;
}

export default function ActiveConversationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useLocalSearchParams();
  const chatId = searchParams.id as string;
  const initialPrompt = searchParams.initialPrompt as string | undefined;

  const { accessToken } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  // Messages log trace
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [inputText, setInputText] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Model setup (applicable for new threads)
  const isNewChat = chatId === "new";
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-pro");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Attachments loading state
  const [attachments, setAttachments] = useState<any[]>([]);

  // Voice captures
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // 1. Fetch historical thread messages if not "new"
  const { data: chatDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["activeChatDetails", chatId],
    queryFn: async () => {
      if (isNewChat) return null;
      const res = await api.get(`/chats/${chatId}`);
      return res.data?.data;
    },
    enabled: !isNewChat,
  });

  // Load backend history to local state
  useEffect(() => {
    if (chatDetails?.messages) {
      setMessages(
        chatDetails.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          attachments: m.metadata?.attachments,
        }))
      );
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [chatDetails]);

  // Support pre-filled user prompts from Home Search
  useEffect(() => {
    if (isNewChat && initialPrompt) {
      setInputText(initialPrompt);
    }
  }, [initialPrompt, isNewChat]);

  // 2. Select image attachment
  const handleSelectImageAttachment = async () => {
    try {
      Haptics.selectionAsync();
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permissions Required", "We need access to select photos.");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets) {
        const asset = pickerResult.assets[0];
        setAttachments((prev) => [
          ...prev,
          {
            type: "image",
            url: asset.uri,
            name: asset.fileName || "photo_capture.jpg",
          },
        ]);
      }
    } catch (e) {
      console.warn("Failed selecting photo asset", e);
    }
  };

  // Select document attachments
  const handleSelectDocAttachment = async () => {
    try {
      Haptics.selectionAsync();
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!pickerResult.canceled && pickerResult.assets) {
        const asset = pickerResult.assets[0];
        setAttachments((prev) => [
          ...prev,
          {
            type: "pdf",
            url: asset.uri,
            name: asset.name || "document.pdf",
          },
        ]);
      }
    } catch (e) {
      console.warn("Doc selection failed", e);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // 3. Audio Prompters
  const startRecordingPrompt = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Microphone Needed", "Permissions required to record audio.");
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
    } catch (e) {
      console.warn("Audio voice error", e);
    }
  };

  const stopRecordingPrompt = async () => {
    if (!recording) return;

    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInputText("Dynamic voice transcript: Summarize neural cluster indices.");
    } catch (err) {
      console.warn("Stop recording release failure", err);
    }
  };

  // 4. Push message with true Server-Sent Events (SSE) streaming
  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend && attachments.length === 0) return;

    setInputText("");
    setAttachments([]);
    Haptics.selectionAsync();

    // Setup working active chatId index
    let currentChatId = chatId;

    // A. Intercept and create new thread if starting from scratch
    if (isNewChat) {
      setIsStreaming(true);
      try {
        const newChatRes = await api.post("/chats", {
          title: textToSend.substring(0, 30) || "Dynamic Chat",
          modelId: selectedModel,
          systemPrompt: systemPrompt || "You are an assistant expert operator of Eurosia One.",
        });

        const createdId = newChatRes.data?.data?.id;
        if (!createdId) {
          throw new Error("Chat creation returned void index.");
        }

        // Direct Route to newly allocated thread ID
        currentChatId = createdId;
        router.setParams({ id: createdId });
        queryClient.invalidateQueries({ queryKey: ["mobileChatsDirectory"] });
      } catch (err: any) {
        Alert.alert("Failed Session", "Could not assemble new thread matrix.");
        setIsStreaming(false);
        return;
      }
    }

    // B. Build User Message payload
    const userMsg: MessagePayload = {
      id: Math.random().toString(),
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
      attachments: attachments.map((a) => ({ type: a.type, url: a.url, name: a.name })),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingResponse("");

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // C. Fire advanced HTTP Chunk Stream listener via XMLHttpRequest
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/chats/${currentChatId}/messages/stream`);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

      let seenBytes = 0;

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          const raw = xhr.responseText;
          const chunkString = raw.substring(seenBytes);
          seenBytes = raw.length;

          // Parse and extract SSE events
          const lines = chunkString.split("\n");
          let accumulatedChunk = "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("data: ")) {
              try {
                const dataJson = JSON.parse(cleanLine.substring(6));
                if (dataJson.chunk) {
                  accumulatedChunk += dataJson.chunk;
                }
              } catch (e) {
                // Skips parsing errors on split chunks
              }
            }
          }

          if (accumulatedChunk) {
            setStreamingResponse((prev) => prev + accumulatedChunk);
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }

        if (xhr.readyState === 4) {
          setIsStreaming(false);
          // Auto-invalidate directory caches to synchronize message metrics count
          queryClient.invalidateQueries({ queryKey: ["activeChatDetails", currentChatId] });
          queryClient.invalidateQueries({ queryKey: ["mobileChatsDirectory"] });
        }
      };

      xhr.onerror = () => {
        Alert.alert("Network Failure", "Standard stream disconnected unexpectedly.");
        setIsStreaming(false);
      };

      xhr.send(
        JSON.stringify({
          content: textToSend,
          attachments: attachments.length > 0 ? attachments : undefined,
        })
      );
    } catch (e) {
      console.warn("Failed firing xhr request", e);
      setIsStreaming(false);
    }
  };

  const getActiveModelLabel = (id: string) => {
    switch (id) {
      case "gemini-1.5-pro":
        return "Gemini 1.5 Pro (Multimodal)";
      case "gemini-1.5-flash":
        return "Gemini 1.5 Flash (Direct)";
      case "claude-3-5-sonnet":
        return "Claude 3.5 Sonnet";
      case "gpt-4o":
        return "GPT-4o Omniverse";
      default:
        return id;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-brand-background"
    >
      {/* Top offset wrapper */}
      <View style={{ height: 44 }} />

      {/* STICKY HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-brand-panel border-b border-brand-border select-none">
        <View className="flex-row items-center space-x-3 flex-1">
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.replace("/(tabs)/chats");
            }}
            className="p-2 bg-brand-subpanel rounded-xl border border-brand-border"
          >
            <ArrowLeft size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-white text-xs font-black uppercase tracking-tight" numberOfLines={1}>
              {isNewChat ? "Assemble Matrix" : (chatDetails?.title || "Core Thread")}
            </Text>
            <Text className="text-brand-textMuted text-[8.5px] font-bold uppercase tracking-wider font-mono">
              Model: {getActiveModelLabel(isNewChat ? selectedModel : chatDetails?.modelId || "gemini-2.5")}
            </Text>
          </View>
        </View>

        {isNewChat && (
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setShowConfigModal(true);
            }}
            className="p-2 bg-brand-subpanel rounded-xl border border-brand-border"
          >
            <Settings size={14} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* MESSAGES THREAD FEED */}
      {detailsLoading ? (
        <View className="flex-grow justify-center items-center">
          <ActivityIndicator color="#EF4444" size="large" />
          <Text className="text-brand-textMuted text-xs font-semibold uppercase mt-3 font-mono">
            Reading thread matrix...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <View
                key={m.id}
                className={`flex-row items-start space-x-3.5 mb-5 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <View className="h-8 w-8 bg-brand-subpanel border border-[#141F36] rounded-xl justify-center items-center shrink-0">
                    <Bot size={14} color="#EF4444" />
                  </View>
                )}

                <View
                  style={{ maxWidth: screenWidth * 0.76 }}
                  className={`p-4 rounded-2xl ${
                    isUser
                      ? "bg-brand-primary border border-brand-primary rounded-tr-none"
                      : "bg-brand-panel border border-brand-border rounded-tl-none"
                  }`}
                >
                  {/* Message body text */}
                  <View className="markdown-body">
                    <Markdown
                      style={{
                        body: { color: "#FFFFFF", fontSize: 11, lineHeight: 15, fontWeight: "500" },
                        paragraph: { color: "#FFFFFF" },
                        strong: { fontWeight: "bold" },
                        code_inline: { fontFamily: "monospace", backgroundColor: "#0C1322", color: "#EF4444", fontSize: 10, padding: 2, borderRadius: 4 },
                      }}
                    >
                      {m.content}
                    </Markdown>
                  </View>

                  {/* Render inline attachment indicators */}
                  {m.attachments && m.attachments.length > 0 && (
                    <View className="mt-3.5 pt-2.5 border-t border-white/10 space-y-1.5">
                      {m.attachments.map((att, index) => (
                        <View key={index} className="flex-row items-center space-x-2">
                          <Paperclip size={10} color="#9CA3AF" />
                          <Text className="text-gray-300 text-[9px] font-mono" numberOfLines={1}>
                            {att.name || `attachment.${att.type}`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {isUser && (
                  <View className="h-8 w-8 bg-brand-subpanel border border-[#141F36] rounded-xl justify-center items-center shrink-0">
                    <User size={14} color="#FFFFFF" />
                  </View>
                )}
              </View>
            );
          })}

          {/* Dynamic incoming stream bubble */}
          {(isStreaming || streamingResponse) && (
            <View className="flex-row items-start space-x-3.5 mb-5 justify-start">
              <View className="h-8 w-8 bg-brand-subpanel border border-[#141F36] rounded-xl justify-center items-center shrink-0">
                <Bot size={14} color="#EF4444" />
              </View>

              <View
                style={{ maxWidth: screenWidth * 0.76 }}
                className="p-4 bg-brand-panel border border-brand-border rounded-2xl rounded-tl-none"
              >
                {streamingResponse ? (
                  <Markdown
                    style={{
                      body: { color: "#FFFFFF", fontSize: 11, lineHeight: 15, fontWeight: "500" },
                    }}
                  >
                    {streamingResponse}
                  </Markdown>
                ) : (
                  <View className="flex-row items-center space-x-1.5 py-1 select-none">
                    <Text className="text-brand-textMuted text-[10px] font-bold uppercase font-mono animate-pulse">
                      Synthesizing responses
                    </Text>
                    <ActivityIndicator color="#EF4444" size="small" />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Welcome message when chat starts */}
          {messages.length === 0 && !isStreaming && (
            <View className="py-16 justify-center items-center px-4 select-none">
              <View className="h-12 w-12 bg-brand-panel border border-brand-border rounded-full items-center justify-center mb-4">
                <Sparkles size={18} color="#EF4444" />
              </View>
              <Text className="text-white text-sm font-black uppercase tracking-wider text-center">
                Thread Matrix Assembled
              </Text>
              <Text className="text-brand-textMuted text-xs text-center leading-relaxed font-semibold mt-1 max-w-xs uppercase">
                Choose parameters inside the configurator to command multiple cloud models in series.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* SELECT ATTACHMENTS VIEW CHANNELS ABOVE INPUT */}
      {attachments.length > 0 && (
        <View className="px-5 py-2.5 bg-brand-panel border-t border-brand-border flex-row flex-wrap gap-2 text-white">
          {attachments.map((att, i) => (
            <View
              key={i}
              className="bg-brand-subpanel border border-[#101726] rounded-xl flex-row items-center px-3 py-1.5 gap-2"
            >
              <File size={12} color="#EF4444" />
              <Text className="text-white text-[9px] font-mono max-w-[120px]" numberOfLines={1}>
                {att.name}
              </Text>
              <TouchableOpacity onPress={() => removeAttachment(i)}>
                <X size={10} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* INPUT PANEL AT BOTTOM */}
      <View className="p-4 bg-brand-panel border-t border-brand-border select-none">
        <View className="flex-row items-center bg-brand-subpanel border border-[#141E33] rounded-xl px-4 py-2.5">
          {/* Quick attach menu selectors */}
          <TouchableOpacity onPress={handleSelectDocAttachment} className="mr-3 p-1.5 bg-brand-panel rounded-lg">
            <Paperclip size={14} color="#9CA3AF" />
          </TouchableOpacity>

          <TextInput
            placeholder="Instruct Eurosia One..."
            placeholderTextColor="#4B5563"
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={1}
            className="flex-1 text-white text-xs font-semibold max-h-20"
          />

          {inputText.trim() ? (
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isStreaming}
              className="h-8 w-8 bg-brand-primary rounded-lg items-center justify-center"
            >
              <Send size={12} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPressIn={startRecordingPrompt}
              onPressOut={stopRecordingPrompt}
              className={`h-8 w-8 items-center justify-center rounded-lg ${
                isRecording ? "bg-brand-primary" : "bg-brand-panel"
              }`}
            >
              <Mic size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* INITIAL THREAD PARAMETERS SELECTION MODAL */}
      {showConfigModal && (
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <View style={{ width: screenWidth * 0.88 }} className="bg-brand-panel border border-brand-border p-6 rounded-2xl">
            <Text className="text-white text-sm font-black uppercase tracking-wider mb-4">
              Matrix Parameters Setup
            </Text>

            {/* Model Target selection */}
            <Text className="text-gray-400 text-[10px] font-bold tracking-wider mb-2 uppercase font-mono">
              Intelligence Profile Selector
            </Text>
            {["gemini-1.5-pro", "gemini-1.5-flash", "claude-3-5-sonnet", "gpt-4o"].map((mId) => (
              <TouchableOpacity
                key={mId}
                onPress={() => setSelectedModel(mId)}
                className={`p-3 border rounded-xl mb-2 flex-row justify-between items-center ${
                  selectedModel === mId ? "border-brand-primary bg-brand-primary/10" : "border-brand-border bg-brand-subpanel"
                }`}
              >
                <Text className="text-white text-xs font-bold uppercase font-mono">{mId}</Text>
                {selectedModel === mId && <Sparkles size={12} color="#EF4444" />}
              </TouchableOpacity>
            ))}

            {/* System Directives input */}
            <Text className="text-gray-400 text-[10px] font-bold tracking-wider mt-4 mb-2 uppercase font-mono">
              System Directives Prompt
            </Text>
            <TextInput
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              placeholder="E.g., You act as an expert technical node auditor..."
              placeholderTextColor="#4B5563"
              multiline
              className="bg-brand-subpanel border border-[#141F36] p-3 text-white text-xs font-semibold rounded-xl max-h-24 mb-6"
            />

            {/* Config Confirm Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setShowConfigModal(false);
              }}
              className="bg-brand-primary h-12 rounded-xl items-center justify-center"
            >
              <Text className="text-white text-xs font-black uppercase tracking-widest">
                Save Matrix Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
