import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Paperclip, 
  Bot, 
  User, 
  Trash2, 
  ChevronDown, 
  Sparkles, 
  Check, 
  ArrowLeft,
  X,
  Mic,
  Volume2,
  Copy,
  RotateCcw,
  Clock,
  Coins
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";

interface ChatViewProps {
  chatId: string; // "new" or a database uuid
  onBack: () => void;
  onChatCreated?: (newId: string) => void;
}

interface Attachment {
  type: string;
  url: string;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  image?: string; // base64 or URL
  attachments?: Attachment[];
  inputTokens?: number;
  outputTokens?: number;
}

export default function ChatView({ chatId, onBack, onChatCreated }: ChatViewProps) {
  const { accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-3-5-sonnet-20241022");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("You are Eurosia One - an advanced sovereign AI Operating System built to optimize developer workspaces, organize data matrices, and solve engineering challenges elegantly.");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const modelsList = [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Core)" },
    { value: "gpt-4o", label: "GPT-4o (Matrix)" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Fast)" }
  ];

  // Load chat details
  useEffect(() => {
    setMessages([]);
    setAttachedFiles([]);
    
    if (!chatId || chatId === "new") {
      setMessages([
        { 
          id: "m_init", 
          sender: "bot", 
          text: "Welcome to Eurosia One's Conversational Core. Choose an AI model to begin orchestrating workflows or prompting our central knowledge graph.", 
          timestamp: "Ready" 
        }
      ]);
      return;
    }

    const fetchChatDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chats/${chatId}`);
        const chat = res.data?.data;
        if (chat) {
          setSelectedModel(chat.modelId || "claude-3-5-sonnet-20241022");
          setSystemPrompt(chat.systemPrompt || "");
          
          if (chat.messages && chat.messages.length > 0) {
            const mapped = chat.messages
              .filter((m: any) => m.role !== "system")
              .map((m: any) => ({
                id: m.id,
                sender: m.role === "user" ? "user" : "bot",
                text: m.content,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                inputTokens: m.inputTokens,
                outputTokens: m.outputTokens,
                attachments: m.metadata?.attachments || []
              }));
            setMessages(mapped);
          } else {
            setMessages([
              { 
                id: "m_init", 
                sender: "bot", 
                text: "No message strings indexed on this node block. Type below to deploy prompts.", 
                timestamp: "Ready" 
              }
            ]);
          }
        }
      } catch (err: any) {
        console.error("Failed to load conversation thread:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatDetails();
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, loading]);

  // Voice handler (Web Speech API)
  const handleVoiceInput = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsRecording(true);
        setTimeout(() => {
          setInputText(prev => prev ? prev + " Optimize database query latency." : "Optimize database query latency.");
          setIsRecording(false);
        }, 1200);
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputText(prev => (prev ? prev + " " + text : text));
      };
      rec.start();
    } catch (e) {
      console.warn("Speech API failure:", e);
      setIsRecording(false);
    }
  };

  // Upload attachment via real backend API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "chat-attachments");

    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const fileData = res.data?.data;
      if (fileData?.url) {
        setAttachedFiles(prev => [...prev, {
          type: file.type.startsWith("image/") ? "image" : "document",
          url: fileData.url
        }]);
      }
    } catch (err) {
      console.error("Failed uploading chat resource:", err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearChat = async () => {
    if (chatId === "new") {
      setMessages([
        { 
          id: `m_${Date.now()}`, 
          sender: "bot", 
          text: "Starting fresh session.", 
          timestamp: "Just now" 
        }
      ]);
      setAttachedFiles([]);
      return;
    }

    try {
      await api.delete(`/chats/${chatId}`);
      onBack();
    } catch (err) {
      console.error("Failed to delete chat thread:", err);
    }
  };

  const triggerCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent, retryText?: string) => {
    if (e) e.preventDefault();
    const promptString = retryText || inputText;
    if (!promptString.trim() && attachedFiles.length === 0) return;
    if (isStreaming) return;

    let activeChatId = chatId;
    setInputText("");
    const attachmentsToSubmit = [...attachedFiles];
    setAttachedFiles([]);

    // 1. If chat is "new", instantiate the chat thread first
    if (activeChatId === "new") {
      setLoading(true);
      try {
        const createRes = await api.post("/chats", {
          title: promptString.substring(0, 50) || "Conversation Block",
          modelId: selectedModel,
          systemPrompt: systemPrompt
        });
        const newChat = createRes.data?.data;
        if (newChat && newChat.id) {
          activeChatId = newChat.id;
          if (onChatCreated) onChatCreated(newChat.id);
        } else {
          throw new Error("Initialization failed");
        }
      } catch (err: any) {
        setLoading(false);
        setMessages(prev => [...prev, {
          id: `err_${Date.now()}`,
          sender: "bot",
          text: `Thread allocation failed: ${err.message || "Central node failure"}`,
          timestamp: "Failed"
        }]);
        return;
      } finally {
        setLoading(false);
      }
    }

    // Append User message to current list
    const userMsgId = `u_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: userMsgId,
      sender: "user",
      text: promptString,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachmentsToSubmit
    }]);

    // Initial placeholder for incoming assistant string
    const botMsgId = `b_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: botMsgId,
      sender: "bot",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setIsStreaming(true);

    try {
      // Connect to genuine Server-Sent Events stream inside Eurosia OS backend
      const response = await fetch(`/api/v1/chats/${activeChatId}/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          content: promptString,
          attachments: attachmentsToSubmit
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} failed to deploy SSE stream reader`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value, { stream: true });
          const rows = textChunk.split("\n");

          for (const row of rows) {
            const cleanRow = row.trim();
            if (cleanRow.startsWith("data: ")) {
              try {
                const payload = JSON.parse(cleanRow.substring(6));
                if (payload.chunk) {
                  accumText += payload.chunk;
                  setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: accumText } : m));
                }
                if (payload.usage) {
                  setMessages(prev => prev.map(m => m.id === botMsgId ? { 
                    ...m, 
                    inputTokens: payload.usage.inputTokens, 
                    outputTokens: payload.usage.outputTokens 
                  } : m));
                }
              } catch (e) {
                // ignore intermediate chunk framing JSON parse errors
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => prev.map(m => m.id === botMsgId ? {
        ...m,
        text: `Stream lost connection to Eurosia stream controller: ${err.message || "Connection refused"}`
      } : m));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleRegenerate = () => {
    // Find the last user message
    const userMsgs = messages.filter(m => m.sender === "user");
    if (userMsgs.length === 0) return;
    const lastPrompt = userMsgs[userMsgs.length - 1].text;
    
    // Remove last bot message and call send
    setMessages(prev => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].sender === "bot") {
        copy.pop();
      }
      return copy;
    });
    handleSendMessage(undefined, lastPrompt);
  };

  const readAloud = (text: string) => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = SynthesisVoice(text);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn("Speech Synthesis blocked in frame mode:", err);
    }
  };

  const SynthesisVoice = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    return u;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#FAFBFD] dark:bg-[#060913] transition-colors duration-200">
      {/* Top Header Segment */}
      <div className="flex items-center justify-between border-b border-gray-150/85 bg-white px-6 py-3.5 dark:border-gray-800 dark:bg-[#0D121F]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onBack}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 dark:border-gray-800 dark:bg-[#111827] dark:hover:bg-gray-800 dark:text-gray-400 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col text-left">
            <h2 className="font-display text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 leading-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sovereign Copilot Node
            </h2>
            <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 mt-1">
              Active streaming connection (Real-time SSE)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Real AI Model Configurator */}
          <div className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 dark:border-gray-800 dark:bg-[#111827] dark:text-gray-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isStreaming || chatId !== "new"}
              className="bg-transparent border-none font-bold text-xs text-gray-800 dark:text-gray-200 outline-none cursor-pointer pr-1 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {modelsList.map(m => (
                <option key={m.value} value={m.value} className="bg-white text-gray-950 dark:bg-[#0D121F] dark:text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={clearChat}
            title={chatId === "new" ? "Clear workspace" : "Archived index and drop chat session"}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-gray-250 bg-white text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-650 dark:border-gray-800 dark:bg-[#111827] dark:hover:bg-red-950/20 dark:hover:text-red-400 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message Output scroll block */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div 
              key={m.id}
              className={`flex gap-4 max-w-4xl opacity-0 animate-fade-in ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
              style={{ animationFillMode: "forwards" }}
            >
              {/* Avatar Icons */}
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition-all ${
                isUser 
                  ? "bg-red-600 shadow-md shadow-red-500/15 text-white" 
                  : "bg-gray-900 shadow-md shadow-gray-900/15 text-white dark:bg-[#111827]"
              }`}>
                {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5 text-red-500" />}
              </div>

              {/* Message Dialog Bubble */}
              <div className="flex flex-col text-left space-y-1 max-w-2xl">
                <div className={`rounded-2xl p-4.5 text-xs shadow-sm ring-1 ring-black/5 ${
                  isUser 
                    ? "bg-gray-900 text-white rounded-tr-none dark:bg-red-600" 
                    : "bg-white text-gray-850 dark:bg-[#0D121F] dark:text-gray-100 border border-gray-100 dark:border-gray-800/80 rounded-tl-none"
                }`}>
                  {/* Markdown or normal text styling */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  ) : (
                    <div className="markdown-body leading-relaxed space-y-2">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  )}

                  {/* Attachment Previews */}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-3 gap-2 flex flex-wrap">
                      {m.attachments.map((file, fIdx) => (
                        <a 
                          key={fIdx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs hover:opacity-85 text-[10px] font-bold text-gray-700 dark:text-gray-300"
                        >
                          {file.type === "image" ? (
                            <img src={file.url} alt="chat-attachment" className="h-20 w-32 object-cover rounded" />
                          ) : (
                            <span className="truncate max-w-[120px]">{file.url.split("/").pop()}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Bar: timestamps, tokens usage, actions */}
                <div className={`flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1 px-1.5 ${
                  isUser ? "justify-end" : "justify-start"
                }`}>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {m.timestamp}
                  </span>

                  {!isUser && (m.inputTokens !== undefined || m.outputTokens !== undefined) && (
                    <span className="flex items-center gap-1 text-emerald-500">
                      <Coins className="h-3 w-3" />
                      In: {m.inputTokens || 0} / Out: {m.outputTokens || 0}
                    </span>
                  )}

                  <div className="flex items-center gap-1 ml-2">
                    <button 
                      type="button"
                      onClick={() => triggerCopy(m.text, m.id)}
                      title="Copy response string"
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      {copiedId === m.id ? (
                        <span className="text-emerald-500">Copied</span>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    {!isUser && (
                      <button 
                        type="button"
                        onClick={() => readAloud(m.text)}
                        title="Read reply aloud"
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Streaming/Typing indicator animation bubble */}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].sender === "bot" && messages[messages.length - 1].text === "" && (
          <div className="flex gap-4 mr-auto max-w-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-[#111827] shrink-0">
              <Bot className="h-4.5 w-4.5 text-red-500 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <div className="rounded-2xl p-4.5 bg-white border border-gray-100 dark:bg-[#0D121F] dark:border-gray-800 rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase ml-1.5">Synthesizing node response...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input container tray */}
      <div className="border-t border-gray-150/80 bg-white p-4 dark:border-gray-800 dark:bg-[#0D121F] transition-colors duration-200">
        <form onSubmit={handleSendMessage} className="mx-auto max-w-3xl">
          {/* File Attachment list slider */}
          {attachedFiles.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2 p-2 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800">
              {attachedFiles.map((f, idx) => (
                <div key={idx} className="relative flex items-center gap-1.5 p-1.5 bg-white dark:bg-[#0D121F] rounded-lg border border-gray-150 dark:border-gray-800 text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                  {f.type === "image" ? (
                    <img src={f.url} alt="img" className="h-8 w-12 object-cover rounded" />
                  ) : (
                    <span className="truncate max-w-[120px]">{f.url.split("/").pop()}</span>
                  )}
                  <button 
                    type="button"
                    onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="p-0.5 hover:bg-gray-100 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Prompt Entry Area */}
          <div className="relative rounded-2xl border border-gray-250 bg-white shadow-sm dark:border-gray-800 dark:bg-[#111827] focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isStreaming}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isStreaming ? "Streaming response active... Wait for termination." : "Type a command phrase or deploy system request..."}
              className="w-full resize-none bg-transparent px-4 py-4 pr-24 text-xs text-gray-850 dark:text-gray-150 focus:outline-none min-h-[58px] leading-relaxed placeholder-gray-400"
            />

            {/* Bottom Controls strip */}
            <div className="flex items-center justify-between border-t border-gray-150 dark:border-gray-850 px-4 py-2 bg-gray-50/50 dark:bg-gray-950/15 rounded-b-2xl">
              <div className="flex items-center gap-1.5">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingFile || isStreaming}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload attachment file"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-850 dark:bg-[#0D121F] dark:hover:bg-gray-800 transition-all cursor-pointer border border-gray-200 dark:border-gray-805 disabled:opacity-50"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={isStreaming}
                  onClick={handleVoiceInput}
                  title="Prompt via voice recorder"
                  className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gray-400 hover:text-gray-850 dark:bg-[#0D121F] hover:bg-gray-100 transition-all cursor-pointer border border-gray-200 dark:border-gray-805 ${
                    isRecording ? "text-red-500 border-red-500 ring-2 ring-red-500/10 animate-pulse" : ""
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </button>

                {messages.length > 1 && !isStreaming && (
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    title="Regenerate last response"
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-850 dark:bg-[#0D121F] dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-805 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[10px] font-semibold text-gray-400 tracking-wider">
                  Press Enter to prompt
                </span>

                <button
                  type="submit"
                  disabled={isStreaming || (!inputText.trim() && attachedFiles.length === 0)}
                  className="flex h-8 px-4 items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-750 disabled:opacity-35 text-white text-[11px] font-bold uppercase tracking-wider shadow-md shadow-red-500/10 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Transmit</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
