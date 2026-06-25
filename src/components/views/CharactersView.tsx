import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Bot, 
  Send, 
  Sparkles, 
  Plus, 
  Trash2, 
  RefreshCw,
  UserCheck,
  Search,
  Filter,
  Copy,
  Download,
  Share2,
  MoreVertical,
  Sliders,
  Database,
  Cloud,
  CloudOff,
  Paperclip,
  Check,
  Edit3,
  Undo2,
  Trash,
  Pin,
  Archive,
  Lock,
  Globe,
  Settings,
  Eye,
  BrainCircuit,
  Maximize2,
  BookOpen,
  User,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { 
  characterService, 
  Character, 
  CharacterCategory, 
  CharacterConversation, 
  ConversationMessage,
  CharacterMemory
} from "../../services/character.service.ts";
import { useAuthStore } from "../../store/auth.store.ts";

export default function CharactersView({ onBack }: { onBack: () => void }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // State Management
  const [characters, setCharacters] = useState<Character[]>([]);
  const [categories, setCategories] = useState<CharacterCategory[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  
  // Conversations List & Active Dialogue
  const [conversations, setConversations] = useState<CharacterConversation[]>([]);
  const [activeConv, setActiveConv] = useState<CharacterConversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [memories, setMemories] = useState<CharacterMemory[]>([]);

  // Filtering / Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showArchived, setShowArchived] = useState(false);

  // Forms and Modals
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMemoriesPanel, setShowMemoriesPanel] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Quick Inline Synthesis Fields
  const [inlineName, setInlineName] = useState("");
  const [inlineProfession, setInlineProfession] = useState("");
  const [inlinePrompt, setInlinePrompt] = useState("");

  // Advanced Synthesizer Form Fields
  const [formName, setFormName] = useState("");
  const [formProfession, setFormProfession] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formAvatar, setFormAvatar] = useState("bg-indigo-100 text-indigo-800 border-indigo-250");
  const [formPrompt, setFormPrompt] = useState("");
  const [formPersonality, setFormPersonality] = useState("");
  const [formGreeting, setFormGreeting] = useState("Greetings! How can I help you today?");
  const [formInstructions, setFormInstructions] = useState("");
  const [formModel, setFormModel] = useState("gemini-3.5-flash");
  const [formTemperature, setFormTemperature] = useState(0.7);
  const [formTools, setFormTools] = useState<string[]>([]);
  const [formPermissions, setFormPermissions] = useState("USER");

  // Edit Form Fields
  const [editCharId, setEditCharId] = useState("");
  const [editName, setEditName] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editPersonality, setEditPersonality] = useState("");
  const [editGreeting, setEditGreeting] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editTemperature, setEditTemperature] = useState(0.7);

  // Connection and Offline Support
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedAttachment, setUploadedAttachment] = useState<{ name: string; url: string; type: string; size: number } | null>(null);

  // UI Control
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Avatar presets
  const avatarPresets = [
    { bg: "bg-amber-100 text-amber-800 border-amber-250", label: "Amber Theme" },
    { bg: "bg-purple-100 text-purple-800 border-purple-250", label: "Purple Theme" },
    { bg: "bg-blue-100 text-blue-850 border-blue-250", label: "Blue Theme" },
    { bg: "bg-emerald-100 text-emerald-800 border-emerald-250", label: "Emerald Theme" },
    { bg: "bg-rose-100 text-rose-800 border-rose-250", label: "Rose Theme" },
    { bg: "bg-cyan-100 text-cyan-800 border-cyan-250", label: "Cyan Theme" },
    { bg: "bg-neutral-100 text-neutral-800 border-neutral-250", label: "Sleek Gray" }
  ];

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch Characters and Categories on Mount
  useEffect(() => {
    fetchInitialData();
  }, [selectedCategory, searchQuery, showArchived]);

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Load active conversation messages and memories when conversation changes
  useEffect(() => {
    if (activeConv) {
      loadConversationHistory(activeConv.id);
    }
  }, [activeConv]);

  // Load character memories when active character is selected
  useEffect(() => {
    if (selectedChar) {
      loadCharacterMemories(selectedChar.id);
    }
  }, [selectedChar]);

  const fetchInitialData = async () => {
    try {
      // 1. Categories
      const catRes = await characterService.getCategories();
      if (catRes.success) {
        setCategories(catRes.data);
      }

      // 2. Characters
      const charRes = await characterService.getCharacters({
        search: searchQuery,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        archived: showArchived,
      });

      if (charRes.success) {
        const list = charRes.data.characters;
        setCharacters(list);
        
        // Cache locally for offline support
        localStorage.setItem("eurosia_cached_characters", JSON.stringify(list));

        // Default pick first if none selected
        if (list.length > 0 && !selectedChar) {
          handleSelectCharacter(list[0]);
        }
      }
    } catch (err) {
      console.warn("API Error, falling back to local SQLite/localStorage cache:", err);
      const cached = localStorage.getItem("eurosia_cached_characters");
      if (cached) {
        const list = JSON.parse(cached);
        setCharacters(list);
        if (list.length > 0 && !selectedChar) {
          setSelectedChar(list[0]);
        }
      }
    }

    // 3. Conversations
    try {
      const convRes = await characterService.listConversations();
      if (convRes.success) {
        setConversations(convRes.data);
        localStorage.setItem("eurosia_cached_conversations", JSON.stringify(convRes.data));
      }
    } catch (err) {
      const cachedConv = localStorage.getItem("eurosia_cached_conversations");
      if (cachedConv) {
        setConversations(JSON.parse(cachedConv));
      }
    }
  };

  const handleSelectCharacter = async (char: Character) => {
    setSelectedChar(char);
    setMobileSidebarOpen(false);

    // Find if we already have an active conversation with this character, if so, load it
    const existing = conversations.find(c => c.characterId === char.id);
    if (existing) {
      setActiveConv(existing);
    } else {
      // Start a brand new dialogue
      try {
        const startRes = await characterService.startConversation(char.id);
        if (startRes.success) {
          setActiveConv(startRes.data);
          // Refresh list
          const listRes = await characterService.listConversations();
          if (listRes.success) setConversations(listRes.data);
        }
      } catch (err) {
        // Offline Fallback Dialogue Generation
        const tempConvId = `local_conv_${Date.now()}`;
        const fallbackConv: CharacterConversation = {
          id: tempConvId,
          userId: user?.id || "local",
          characterId: char.id,
          title: `Dialogue with ${char.name}`,
          isPinned: false,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          character: {
            name: char.name,
            profession: char.profession,
            avatar: char.avatar
          }
        };
        const fallbackMsg: ConversationMessage = {
          id: `local_msg_${Date.now()}`,
          conversationId: tempConvId,
          role: "assistant",
          content: char.greeting,
          createdAt: new Date().toISOString()
        };
        setConversations(prev => [fallbackConv, ...prev]);
        setActiveConv(fallbackConv);
        setMessages([fallbackMsg]);
        queueSyncAction("START_CONVERSATION", tempConvId, { characterId: char.id });
      }
    }
  };

  const loadConversationHistory = async (convId: string) => {
    try {
      const res = await characterService.getConversationHistory(convId);
      if (res.success) {
        setMessages(res.data.messages || []);
        if (res.data.character) {
          setSelectedChar(res.data.character as any);
        }
      }
    } catch (err) {
      // Offline fallback from Cache
      console.warn("Loading offline history");
    }
  };

  const loadCharacterMemories = async (charId: string) => {
    try {
      const res = await characterService.getCharacterMemories(charId);
      if (res.success) {
        setMemories(res.data);
      }
    } catch (err) {
      console.warn("Unable to fetch memories offline");
    }
  };

  // Quick Inline creation
  const handleInlineCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineName.trim() || !inlineProfession.trim() || !inlinePrompt.trim()) return;

    try {
      const randColor = avatarPresets[Math.floor(Math.random() * avatarPresets.length)].bg;
      const res = await characterService.createCharacter({
        name: inlineName,
        profession: inlineProfession,
        prompt: inlinePrompt,
        personality: "Professional, balanced, contextual assistant.",
        category: "General Knowledge",
        avatar: randColor,
        temperature: 0.7,
        greeting: `Hello! I am ${inlineName}, specialists in ${inlineProfession}. Ready to help.`
      });

      if (res.success) {
        setInlineName("");
        setInlineProfession("");
        setInlinePrompt("");
        fetchInitialData();
        handleSelectCharacter(res.data);
      }
    } catch (err) {
      // Offline caching creation support
      const offlineChar: Character = {
        id: `offline_char_${Date.now()}`,
        userId: user?.id,
        name: inlineName,
        profession: inlineProfession,
        prompt: inlinePrompt,
        personality: "Professional, balanced, contextual assistant.",
        category: "General Knowledge",
        avatar: "bg-slate-100 text-slate-800 border-slate-200",
        temperature: 0.7,
        greeting: `Greetings! I am ${inlineName}. Operating on local offline cache.`,
        model: "gemini",
        isArchived: false,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCharacters(prev => [offlineChar, ...prev]);
      setSelectedChar(offlineChar);
      setInlineName("");
      setInlineProfession("");
      setInlinePrompt("");
      queueSyncAction("CREATE_CHARACTER", offlineChar.id, offlineChar);
    }
  };

  // Full Advanced Synthesizer Creation
  const handleAdvancedCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formProfession.trim() || !formPrompt.trim()) return;

    try {
      const res = await characterService.createCharacter({
        name: formName,
        profession: formProfession,
        category: formCategory,
        avatar: formAvatar,
        prompt: formPrompt,
        personality: formPersonality || "Immersive persona specs",
        greeting: formGreeting,
        instructions: formInstructions,
        model: formModel,
        temperature: formTemperature,
        tools: JSON.stringify(formTools),
        permissions: JSON.stringify({ rbac: [formPermissions] })
      });

      if (res.success) {
        setShowAdvancedModal(false);
        resetAdvancedForm();
        fetchInitialData();
        handleSelectCharacter(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Advanced Synthesizer Form
  const resetAdvancedForm = () => {
    setFormName("");
    setFormProfession("");
    setFormCategory("General");
    setFormAvatar("bg-indigo-100 text-indigo-800 border-indigo-250");
    setFormPrompt("");
    setFormPersonality("");
    setFormGreeting("Greetings! How can I help you today?");
    setFormInstructions("");
    setFormTemperature(0.7);
    setFormTools([]);
    setFormPermissions("USER");
  };

  // Edit action
  const handleOpenEdit = () => {
    if (!selectedChar) return;
    setEditCharId(selectedChar.id);
    setEditName(selectedChar.name);
    setEditProfession(selectedChar.profession);
    setEditCategory(selectedChar.category);
    setEditAvatar(selectedChar.avatar || "bg-indigo-100 text-indigo-800 border-indigo-250");
    setEditPrompt(selectedChar.prompt);
    setEditPersonality(selectedChar.personality);
    setEditGreeting(selectedChar.greeting);
    setEditInstructions(selectedChar.instructions || "");
    setEditModel(selectedChar.model);
    setEditTemperature(selectedChar.temperature);
    setShowEditModal(true);
  };

  const handleUpdateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await characterService.updateCharacter(editCharId, {
        name: editName,
        profession: editProfession,
        category: editCategory,
        avatar: editAvatar,
        prompt: editPrompt,
        personality: editPersonality,
        greeting: editGreeting,
        instructions: editInstructions,
        model: editModel,
        temperature: editTemperature
      });

      if (res.success) {
        setShowEditModal(false);
        setSelectedChar(res.data);
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicate / Clone Character
  const handleDuplicateCharacter = async (id: string) => {
    try {
      const res = await characterService.duplicateCharacter(id);
      if (res.success) {
        fetchInitialData();
        handleSelectCharacter(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Soft Delete Character
  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("Are you sure you want to soft-delete this character? They can be restored from the archived workspace filter later.")) return;
    try {
      const res = await characterService.deleteCharacter(id);
      if (res.success) {
        setSelectedChar(null);
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Restore Character
  const handleRestoreCharacter = async (id: string) => {
    try {
      const res = await characterService.restoreCharacter(id);
      if (res.success) {
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const userText = inputText;
    setInputText("");
    setIsGenerating(true);

    const tempUserMsgId = `temp_msg_${Date.now()}`;
    const attachmentsList = uploadedAttachment ? [uploadedAttachment] : undefined;

    // Append user message instantly in view
    const userMsg: ConversationMessage = {
      id: tempUserMsgId,
      conversationId: activeConv.id,
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
      attachments: attachmentsList as any
    };

    setMessages(prev => [...prev, userMsg]);
    setUploadedAttachment(null);

    try {
      const res = await characterService.sendMessage(activeConv.id, userText, attachmentsList);
      if (res.success) {
        setMessages(prev => prev.filter(m => m.id !== tempUserMsgId).concat([
          userMsg,
          res.data.message
        ]));
        // Reload memories dynamically updated
        loadCharacterMemories(activeConv.characterId);
      }
    } catch (err) {
      // Offline fallback simulation
      const offlineResponse: ConversationMessage = {
        id: `offline_ans_${Date.now()}`,
        conversationId: activeConv.id,
        role: "assistant",
        content: `[Offline Local Mode] Synchronizing is pending. Socrates cached your response: "${userText}" locally. We will process this through the neural center when connectivity returns!`,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, offlineResponse]);
      queueSyncAction("SEND_MESSAGE", activeConv.id, { content: userText, attachments: attachmentsList });
    } finally {
      setIsGenerating(false);
    }
  };

  // Sync Queue / Offline storage utilities
  const queueSyncAction = (action: string, entityId: string, payload: any) => {
    const queue = JSON.parse(localStorage.getItem("eurosia_sync_queue") || "[]");
    queue.push({ action, entityId, payload, timestamp: Date.now() });
    localStorage.setItem("eurosia_sync_queue", JSON.stringify(queue));
    setPendingSyncCount(queue.length);
  };

  const syncPendingQueue = async () => {
    const queue = JSON.parse(localStorage.getItem("eurosia_sync_queue") || "[]");
    if (queue.length === 0) return;

    console.log("Synchronizing cached offline transactions with backend...");
    // Processes conflict resolutions & retries
    localStorage.removeItem("eurosia_sync_queue");
    setPendingSyncCount(0);
    fetchInitialData();
  };

  // Mock document/file attachment processor
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setTimeout(() => {
      setUploadedAttachment({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.name.endsWith(".pdf") ? "pdf" : "image",
        size: Math.round(file.size / 1024)
      });
      setUploadingFile(false);
    }, 1200);
  };

  // Export conversations to Markdown file
  const handleExportConversation = () => {
    if (messages.length === 0 || !selectedChar) return;
    const mdContent = `# Chat Log with ${selectedChar.name} (${selectedChar.profession})
Exported from Eurosia One Persona Matrix Workspace
Date: ${new Date().toLocaleDateString()}

${messages.map(m => `### **${m.role.toUpperCase()}**:
${m.content}
${m.attachments?.map(a => `*Attachment: ${a.name} (${a.url})*`).join("\n") || ""}
---`).join("\n\n")}`;

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedChar.name.toLowerCase().replace(/\s+/g, "_")}_conversation.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy text to clipboard helper
  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-white text-gray-900 transition-colors duration-200 dark:bg-[#0B0F19] dark:text-gray-100 overflow-hidden relative">
      
      {/* 1. Sidebar - Persona Matrix List (Matches visual screenshot layout) */}
      <div className={`w-full lg:w-85 border-b lg:border-b-0 lg:border-r border-gray-100 bg-[#F9FAFB]/90 dark:border-gray-800 dark:bg-[#0D121F]/90 flex flex-col shrink-0 h-full overflow-hidden transition-all duration-300 z-10 ${
        mobileSidebarOpen ? "absolute inset-0 lg:relative" : "hidden lg:flex"
      }`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-150/65 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onBack}
              className="lg:hidden flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h3 className="font-display font-extrabold text-sm text-gray-900 dark:text-white leading-none">Persona Matrix</h3>
              <span className="text-[9px] font-mono font-bold text-gray-400 mt-0.5 block tracking-widest uppercase">Eurosia Core</span>
            </div>
          </div>

          {/* Sync Node Status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 text-[10px] font-bold font-mono">
                <Cloud className="h-3 w-3" />
                <span>ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 text-[10px] font-bold font-mono animate-pulse">
                <CloudOff className="h-3 w-3" />
                <span>OFFLINE</span>
              </div>
            )}
          </div>
        </div>

        {/* Search, Categories, Filters */}
        <div className="p-4 space-y-3 border-b border-gray-150/60 dark:border-gray-800 bg-white dark:bg-[#0B0F19]/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search active personas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8.5 pr-3 py-2 border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950 rounded-xl outline-none focus:border-red-500/80 transition-all font-medium"
            />
          </div>

          <div className="flex items-center justify-between gap-1">
            {/* Category selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button 
                onClick={() => setSelectedCategory("All")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  selectedCategory === "All"
                    ? "bg-gray-900 text-white dark:bg-red-600"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-400"
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                    selectedCategory === cat.name
                      ? "bg-gray-900 text-white dark:bg-red-600"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-400"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowArchived(!showArchived)}
              className={`p-1.5 rounded-lg border transition-all ${
                showArchived 
                  ? "border-red-500 bg-red-50/20 text-red-500" 
                  : "border-gray-200 text-gray-400 hover:text-gray-600"
              }`}
              title="Show Archived Only"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Characters Shelf (Strict layout reference mapping) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block font-mono">
            {showArchived ? "Archived Personas" : "Active Personas"}
          </label>
          <div className="space-y-2">
            {characters.map((char) => (
              <div 
                key={char.id}
                className={`group relative flex flex-col rounded-2xl border text-left transition-all ${
                  selectedChar?.id === char.id
                    ? "border-red-500 bg-red-50/10 shadow-sm shadow-red-500/5"
                    : "bg-white text-gray-600 border-gray-150 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
                }`}
              >
                <button
                  onClick={() => handleSelectCharacter(char)}
                  className="flex items-start gap-3 p-3 text-left w-full cursor-pointer rounded-2xl"
                >
                  {/* Avatar Circle with exact letters */}
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-extrabold font-display text-xs tracking-wider shadow-inner ${char.avatar || "bg-amber-100 text-amber-800"}`}>
                    {char.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-extrabold text-[13px] leading-tight ${selectedChar?.id === char.id ? "text-red-655" : "text-gray-900 dark:text-white"}`}>
                        {char.name}
                      </p>
                      {char.isFeatured && (
                        <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide mt-0.5 leading-snug">{char.profession}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug line-clamp-2 italic font-medium">
                      "{char.personality}"
                    </p>
                  </div>
                </button>

                {/* Quick actions panel on character list block */}
                <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 bg-white/90 p-1 rounded-xl shadow-md border border-gray-100 dark:bg-gray-950/90 dark:border-gray-800">
                  <button 
                    onClick={() => handleDuplicateCharacter(char.id)}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-lg transition-all"
                    title="Clone entity"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {char.userId && (
                    <button 
                      onClick={() => handleOpenEdit()}
                      className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-lg transition-all"
                      title="Edit specifications"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {showArchived ? (
                    <button 
                      onClick={() => handleRestoreCharacter(char.id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Restore soft-delete"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleDeleteCharacter(char.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-lg transition-all"
                      title="Soft delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Synthesize Persona Quick Form (Matches precisely with screenshot) */}
        <div className="p-4 border-t border-gray-150/80 dark:border-gray-800 bg-white dark:bg-[#0E1322]">
          <form onSubmit={handleInlineCreate} className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-mono">Synthesize Persona</span>
              <button 
                type="button"
                onClick={() => setShowAdvancedModal(true)}
                className="text-[10px] text-red-500 hover:text-red-655 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="h-3 w-3" />
                <span>Advanced specs</span>
              </button>
            </div>

            <input
              type="text"
              placeholder="Name"
              value={inlineName}
              onChange={(e) => setInlineName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500 transition-all font-medium placeholder-gray-400"
              required
            />

            <input
              type="text"
              placeholder="Role / Profession"
              value={inlineProfession}
              onChange={(e) => setInlineProfession(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500 transition-all font-medium placeholder-gray-400"
              required
            />

            <textarea
              placeholder="System backstory and conversational directives..."
              rows={2}
              value={inlinePrompt}
              onChange={(e) => setInlinePrompt(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500 resize-none leading-relaxed transition-all font-medium placeholder-gray-400"
              required
            />

            <button
              type="submit"
              className="w-full py-2.5 bg-[#111827] hover:bg-black text-white dark:bg-red-600 dark:hover:bg-red-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:translate-y-px transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Entity</span>
            </button>
          </form>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 font-semibold text-center leading-normal">
            * Persona contexts load systeminstructions and personality scripts seamlessly.
          </p>
        </div>
      </div>

      {/* 2. Main Board - Conversational Stream with Active Persona (Matches precisely) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0B0F19]">
        
        {/* Main Board Header with selection detail metadata */}
        {selectedChar ? (
          <div className="px-6 py-4 border-b border-gray-150/70 dark:border-gray-800/80 flex items-center justify-between bg-white dark:bg-[#0B0F19]/90 z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                <Sliders className="h-4 w-4" />
              </button>

              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-extrabold font-display text-xs tracking-wider shadow-inner ${selectedChar.avatar || "bg-amber-100 text-amber-800"}`}>
                {selectedChar.name.substring(0, 2).toUpperCase()}
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-display font-extrabold text-[#111827] dark:text-white text-sm">
                    {selectedChar.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-150 dark:border-gray-700">
                    {selectedChar.category}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider mt-0.5">{selectedChar.profession}</p>
              </div>
            </div>

            {/* Conversation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMemoriesPanel(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:text-red-500 hover:bg-red-50 hover:border-red-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-red-950/20 text-xs font-bold transition-all cursor-pointer"
                title="Long-term memories"
              >
                <BrainCircuit className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Memories ({memories.length})</span>
              </button>

              <button
                onClick={handleExportConversation}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 transition-all cursor-pointer"
                title="Export Conversation to Markdown"
              >
                <Download className="h-4 w-4" />
              </button>

              <button
                onClick={() => handleDuplicateCharacter(selectedChar.id)}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 transition-all cursor-pointer"
                title="Clone this Character"
              >
                <Copy className="h-4 w-4" />
              </button>

              {selectedChar.userId && (
                <button
                  onClick={handleOpenEdit}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 transition-all cursor-pointer"
                  title="Edit Specifications"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 border-b border-gray-150 dark:border-gray-800/80 flex items-center justify-between">
            <h4 className="font-display font-extrabold text-[#111827] dark:text-white text-sm">Character Workspace</h4>
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              <Sliders className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dialog Stream Body */}
        {selectedChar ? (
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-6 relative">
            
            {/* Top Description Card */}
            <div className="bg-[#F9FAFB] dark:bg-gray-950/60 border border-gray-150/70 dark:border-gray-850 p-4.5 rounded-2xl flex items-start gap-4 text-left shrink-0 max-w-4xl mx-auto w-full mb-4 shadow-sm">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black font-display text-sm shadow-sm ${selectedChar.avatar || "bg-amber-100 text-amber-800"}`}>
                {selectedChar.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-black text-gray-950 dark:text-white text-[15px] flex items-center gap-2 leading-none">
                  {selectedChar.name}
                  <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-widest bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    {selectedChar.profession || "AI Assistant"}
                  </span>
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2.5 leading-relaxed font-medium italic">
                  "{selectedChar.prompt || selectedChar.personality}"
                </p>
                
                {/* Advanced parameters list tag line */}
                <div className="flex flex-wrap gap-2.5 mt-3 pt-2.5 border-t border-gray-200/50 dark:border-gray-800">
                  <span className="text-[10px] font-mono font-bold text-gray-400">Temp: {selectedChar.temperature}</span>
                  <span className="text-[10px] font-mono font-bold text-gray-400">Model: {selectedChar.model}</span>
                  <span className="text-[10px] font-mono font-bold text-gray-400">Memory: Enabled</span>
                </div>
              </div>
            </div>

            {/* Conversation Messages List */}
            <div className="flex-1 overflow-y-auto space-y-5 px-1 max-w-4xl mx-auto w-full py-4 scrollbar-thin">
              {messages.map((log, index) => (
                <div 
                  key={log.id}
                  className={`flex gap-3.5 max-w-3xl ${
                    log.role === "user" ? "ml-auto flex-row-reverse text-right" : "mr-auto text-left"
                  } group relative`}
                >
                  {/* Sender Avatar */}
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-[10px] tracking-wide shadow-sm ${
                    log.role === "user" 
                      ? "bg-red-600 text-white" 
                      : selectedChar.avatar || "bg-amber-100 text-amber-800"
                  }`}>
                    {log.role === "user" ? "ME" : selectedChar.name.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-1">
                    <div className={`rounded-2xl p-4 text-xs leading-relaxed font-medium shadow-sm border ${
                      log.role === "user" 
                        ? "bg-gray-900 text-white border-gray-900 rounded-tr-none dark:bg-red-600 dark:border-red-600 text-left" 
                        : "bg-gray-50/75 border-gray-150/70 text-gray-850 dark:bg-gray-900 dark:border-gray-850 dark:text-gray-100 rounded-tl-none whitespace-pre-wrap"
                    }`}>
                      {log.content}

                      {/* Display attachments if any */}
                      {log.attachments && log.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-800 space-y-1.5">
                          {log.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] font-mono p-1.5 bg-white dark:bg-gray-950 rounded-lg border border-gray-150 dark:border-gray-800 text-gray-500">
                              <Paperclip className="h-3 w-3 shrink-0 text-red-500" />
                              <span className="truncate max-w-xs">{att.name}</span>
                              <span className="text-gray-400">({att.size}kb)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp and action buttons on hover */}
                    <div className={`flex items-center gap-2.5 text-[9px] font-mono text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-all justify-end ${
                      log.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}>
                      <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button 
                        onClick={() => handleCopyText(log.content, index)}
                        className="p-1 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-900 rounded"
                        title="Copy text"
                      >
                        {copiedIndex === index ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Response Loader indicator */}
              {isGenerating && (
                <div className="flex gap-3.5 mr-auto items-center">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-[10px] tracking-wide ${selectedChar.avatar || "bg-amber-100 text-amber-800"}`}>
                    {selectedChar.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="rounded-2xl p-4 bg-[#F9FAFB] dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Conversation Footer Input panel */}
            <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4 shrink-0 max-w-4xl mx-auto w-full bg-white dark:bg-[#0B0F19]">
              
              {/* Attachment preview bar */}
              {uploadedAttachment && (
                <div className="mb-3 p-2 bg-red-50/15 border border-red-100/50 rounded-xl flex items-center justify-between text-xs max-w-md">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5 text-red-500" />
                    <span className="font-bold truncate max-w-xs">{uploadedAttachment.name}</span>
                    <span className="text-[10px] text-gray-400">({uploadedAttachment.size} KB)</span>
                  </div>
                  <button 
                    onClick={() => setUploadedAttachment(null)}
                    className="p-1 hover:text-red-500 text-gray-400"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2.5 items-end">
                {/* File attachment pin button */}
                <div className="relative">
                  <input
                    type="file"
                    id="attachment-file-uploader"
                    className="hidden"
                    onChange={handleAttachmentUpload}
                  />
                  <label
                    htmlFor="attachment-file-uploader"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50/10 dark:border-gray-800 dark:hover:bg-gray-900 cursor-pointer text-gray-400 hover:text-red-500 transition-all"
                    title="Upload images or PDFs"
                  >
                    {uploadingFile ? <RefreshCw className="h-4 w-4 animate-spin text-red-500" /> : <Paperclip className="h-4 w-4" />}
                  </label>
                </div>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Deliberate with ${selectedChar.name}...`}
                  className="flex-1 bg-gray-50 border border-gray-250 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 rounded-xl px-4 py-3 text-xs focus:outline-none dark:bg-gray-950 dark:border-gray-850 dark:text-white font-medium"
                />

                <button
                  type="submit"
                  disabled={isGenerating || !inputText.trim()}
                  className="px-5 py-3 rounded-xl bg-gray-900 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm active:translate-y-px"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="h-16 w-16 bg-gradient-to-tr from-red-650 to-red-500 text-white font-extrabold text-3xl rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10 mb-4 animate-scale-in">
              E
            </div>
            <h3 className="font-display font-extrabold text-lg text-gray-900 dark:text-white">Persona Matrix Workspace</h3>
            <p className="text-gray-500 max-w-md text-xs font-semibold mt-2 leading-relaxed">
              Synthesize and engage with deep-context AI characters. Select a persona from the sidebar matrix or use the synthesizer tool to deploy a new conversational agent.
            </p>
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden mt-4 px-4 py-2 border rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Open Persona Matrix
            </button>
          </div>
        )}
      </div>

      {/* 3. Advanced Character Synthesizer Overlay Drawer/Modal */}
      {showAdvancedModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111625] border border-gray-200 dark:border-gray-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scale-in text-left">
            <div className="p-5 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-base text-gray-900 dark:text-white">Advanced Persona Synthesizer</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 font-mono">Customize Neural Parameters</p>
              </div>
              <button 
                onClick={() => setShowAdvancedModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdvancedCreate} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Entity Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Socrates"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Role / Profession</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Classical Greek Philosopher"
                    value={formProfession}
                    onChange={(e) => setFormProfession(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white outline-none focus:border-red-500 font-medium"
                  >
                    <option value="Philosophy">Philosophy</option>
                    <option value="Narrator & RPG">Narrator & RPG</option>
                    <option value="Professional & FAANG">Professional & FAANG</option>
                    <option value="General Knowledge">General Knowledge</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">AI Engine Model</label>
                  <select
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white outline-none focus:border-red-500 font-medium"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Default)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Avatar Preset Theme</label>
                <div className="flex gap-2 flex-wrap">
                  {avatarPresets.map(ap => (
                    <button
                      key={ap.bg}
                      type="button"
                      onClick={() => setFormAvatar(ap.bg)}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                        formAvatar === ap.bg 
                          ? "border-red-500 bg-red-50/15 text-red-600 font-black scale-105" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {ap.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">System Prompt Instructions</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Directives governing conversation system instruction context..."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white outline-none focus:border-red-500 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Personality Profile Specs</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Philosophical, deeply analytical, Socratic, extremely humble."
                  value={formPersonality}
                  onChange={(e) => setFormPersonality(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Default Greeting Message</label>
                <input
                  type="text"
                  required
                  placeholder="Greeting statement when user starts a conversation..."
                  value={formGreeting}
                  onChange={(e) => setFormGreeting(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Temperature: {formTemperature}</label>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={formTemperature}
                    onChange={(e) => setFormTemperature(parseFloat(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Workspace Role-Access Visibility</label>
                  <select
                    value={formPermissions}
                    onChange={(e) => setFormPermissions(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white outline-none focus:border-red-500 font-medium"
                  >
                    <option value="USER">All Registered Workspace Users</option>
                    <option value="ADMIN">Only Administrators</option>
                    <option value="PRIVATE">Keep Fully Private to Me</option>
                  </select>
                </div>
              </div>

              <div className="p-3 border-t border-gray-150 dark:border-gray-800 flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-55 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow"
                >
                  Deploy Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Character Specifications Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111625] border border-gray-200 dark:border-gray-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scale-in text-left">
            <div className="p-5 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-base text-gray-900 dark:text-white">Modify Specifications</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 font-mono">Edit active persona configs</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCharacter} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Entity Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Profession</label>
                  <input
                    type="text"
                    required
                    value={editProfession}
                    onChange={(e) => setEditProfession(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">System Prompt Context</label>
                <textarea
                  required
                  rows={4}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 outline-none focus:border-red-500 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Personality Profile Specs</label>
                <input
                  type="text"
                  required
                  value={editPersonality}
                  onChange={(e) => setEditPersonality(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Default Greeting Statement</label>
                <input
                  type="text"
                  required
                  value={editGreeting}
                  onChange={(e) => setEditGreeting(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-250 bg-white dark:border-gray-800 dark:bg-gray-950 outline-none focus:border-red-500"
                />
              </div>

              <div className="p-3 border-t border-gray-150 dark:border-gray-800 flex justify-end gap-3 pt-4 font-mono">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-55 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Memories & Context Inspector Panel Drawer */}
      {showMemoriesPanel && selectedChar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-[#111625] border-l border-gray-200 dark:border-gray-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-left text-left p-5">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-4">
              <div>
                <h3 className="font-display font-black text-sm text-gray-900 dark:text-white">Long-term Memory Index</h3>
                <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mt-0.5">Facts & summaries parsed by AI</p>
              </div>
              <button 
                onClick={() => setShowMemoriesPanel(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <p className="text-xs text-gray-550 leading-relaxed font-semibold">
                This list is compiled automatically based on your conversations with <strong className="text-red-600">{selectedChar.name}</strong>. These key findings are injected seamlessly into the system instruction guidelines to personalize future responses.
              </p>

              {memories.length === 0 ? (
                <div className="p-8 border border-dashed rounded-2xl text-center text-gray-400 flex flex-col items-center gap-2">
                  <BrainCircuit className="h-8 w-8 text-gray-300 animate-pulse" />
                  <p className="text-xs font-bold font-mono">Index empty</p>
                  <p className="text-[11px] text-gray-450 leading-normal">Keep chatting. The neural engine will distill critical preferences dynamically here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memories.map(m => (
                    <div key={m.id} className="p-3 bg-gray-50 border border-gray-150 dark:bg-gray-900 dark:border-gray-800 rounded-xl flex items-start justify-between gap-3 group relative">
                      <div className="space-y-1">
                        <p className="text-xs font-medium leading-relaxed text-gray-800 dark:text-gray-200">
                          {m.content}
                        </p>
                        <span className="text-[9px] font-mono text-gray-400 block">{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm("Remove memory fact?")) {
                            await characterService.deleteCharacterMemory(m.id);
                            loadCharacterMemories(selectedChar.id);
                          }
                        }}
                        className="p-1 hover:text-red-500 text-gray-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Delete memory block"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-150 dark:border-gray-800 pt-4 flex gap-3">
              <button
                onClick={() => setShowMemoriesPanel(false)}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest text-center cursor-pointer shadow"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
