import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { 
  Settings, 
  Cpu, 
  Mail, 
  Lock, 
  Sliders, 
  Check, 
  Loader2, 
  Save, 
  Eye, 
  EyeOff, 
  Terminal,
  FileCode,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

interface SettingItem {
  key: string;
  value: string;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"general" | "ai" | "email" | "security" | "appearance">("general");

  // Show secrets toggles
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // Settings values local state (mapped as dictionary)
  const [settingsDict, setSettingsDict] = useState<Record<string, string>>({
    siteName: "Eurosia One",
    siteUrl: "https://eurosia.one",
    supportEmail: "support@eurosia.one",
    isMaintenance: "false",
    geminiApiKey: "••••••••••••••••••••••••",
    geminiModelDefault: "gemini-2.5-pro",
    aiTemperature: "0.7",
    smtpHost: "smtp.eurosia.one",
    smtpPort: "587",
    smtpSecure: "true",
    smtpUser: "notification@eurosia.one",
    smtpPass: "••••••••••••••••",
    sessionTimeoutMin: "60",
    force2FA: "false",
    accentColor: "#EF4444",
    defaultTheme: "dark"
  });

  // 1. Fetch live settings records
  const { data: rawSettings = [], isLoading } = useQuery<SettingItem[]>({
    queryKey: ["adminSettingsQuery"],
    queryFn: async () => {
      const res = await api.get("/settings");
      // Mapped settings will come as list [{key, value}]
      return res.data?.data || [];
    }
  });

  // Populate local state dictionary from fetched array
  useEffect(() => {
    if (rawSettings && rawSettings.length > 0) {
      const dict: Record<string, string> = { ...settingsDict };
      rawSettings.forEach((item) => {
        dict[item.key] = item.value;
      });
      setSettingsDict(dict);
    }
  }, [rawSettings]);

  // 2. Put settings mutation
  const putSettingsMutation = useMutation({
    mutationFn: async (payload: SettingItem[]) => {
      const res = await api.put("/settings", { settings: payload });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSettingsQuery"] });
      toast.success("System configurations successfully serialized on platform !");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update system registry.");
    }
  });

  const handleFieldChange = (key: string, value: string) => {
    setSettingsDict(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Re-format dictionary to list payload array [{key, value}]
    const payload: SettingItem[] = Object.entries(settingsDict).map(([key, value]) => ({
      key,
      value: String(value)
    }));
    putSettingsMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
          <span className="text-xs font-semibold text-gray-400 font-mono tracking-widest uppercase">Unzipping secure credentials keys...</span>
        </div>
      </div>
    );
  }

  const tabsMeta = [
    { id: "general", label: "General Workspace", icon: Settings },
    { id: "ai", label: "AI Engines (Gemini)", icon: Cpu },
    { id: "email", label: "SMTP Email Server", icon: Mail },
    { id: "security", label: "Control Security", icon: Lock },
    { id: "appearance", label: "Interface Layout", icon: Sliders },
  ];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="font-display font-black text-2xl tracking-tight text-white uppercase">REGISTRY CONTROL</h1>
        <p className="text-gray-450 text-xs font-semibold uppercase font-mono mt-1 font-sans">System wide properties, API keys management & SMTP gates configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: Highly Styled Vertical Tabs navigation */}
        <div className="bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl p-4 flex flex-col gap-1.5 select-none">
          {tabsMeta.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isTabActive 
                    ? "bg-slate-900 border border-slate-800 text-red-500 shadow-xl" 
                    : "text-gray-400 hover:text-white hover:bg-[#111626]/40 border border-transparent"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isTabActive ? "text-red-500" : "text-gray-450"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Tab Panel Forms */}
        <div className="lg:col-span-3 bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-semibold">
            
            {/* GENERAL TAB PANEL */}
            {activeTab === "general" && (
              <div className="space-y-5 animate-slide-up">
                <div className="border-b border-[#121B30] pb-2.5 mb-2 select-none">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">General platform details</h3>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono uppercase mt-0.5">Parameters relating to site naming and operational state</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Platform Title
                  </label>
                  <input
                    type="text"
                    value={settingsDict.siteName}
                    onChange={(e) => handleFieldChange("siteName", e.target.value)}
                    placeholder="Eurosia One"
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    System URL Host
                  </label>
                  <input
                    type="text"
                    value={settingsDict.siteUrl}
                    onChange={(e) => handleFieldChange("siteUrl", e.target.value)}
                    placeholder="https://eurosia.one"
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Support operations Mail Address
                  </label>
                  <input
                    type="email"
                    value={settingsDict.supportEmail}
                    onChange={(e) => handleFieldChange("supportEmail", e.target.value)}
                    placeholder="support@eurosia.one"
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-mono"
                  />
                </div>

                {/* Maintenance Toggle */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Emergency Maintenance state
                  </label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("isMaintenance", settingsDict.isMaintenance === "true" ? "false" : "true")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settingsDict.isMaintenance === "true" ? "bg-red-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settingsDict.isMaintenance === "true" ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-gray-400 font-mono text-[11px] leading-none uppercase">
                      Status: {settingsDict.isMaintenance === "true" ? "EMERGENCY SHUTDOWN ACTIVE" : "ONLINE STAGED"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* AI ENGINES TAB PANEL */}
            {activeTab === "ai" && (
              <div className="space-y-5 animate-slide-up">
                <div className="border-b border-[#121B30] pb-2.5 mb-2 select-none">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Distributed AI Parameters</h3>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono uppercase mt-0.5">Parameters relating to LLM engines and Gemini API Credentials</p>
                </div>

                {/* Gemini API Key */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Googlegenai API security secret (Gemini Key)
                  </label>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? "text" : "password"}
                      value={settingsDict.geminiApiKey}
                      onChange={(e) => handleFieldChange("geminiApiKey", e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Default model select */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Target default system model (Llm Model)
                  </label>
                  <select
                    value={settingsDict.geminiModelDefault}
                    onChange={(e) => handleFieldChange("geminiModelDefault", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all uppercase font-sans font-extrabold"
                  >
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Precision flagship)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Latency efficient)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (High-context stable)</option>
                  </select>
                </div>

                {/* Temperature slider */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    <span>Creative temperature parameters</span>
                    <span className="text-red-500 font-extrabold">{settingsDict.aiTemperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settingsDict.aiTemperature}
                    onChange={(e) => handleFieldChange("aiTemperature", e.target.value)}
                    className="w-full accent-red-550 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-550 font-semibold font-mono mt-1">
                    <span>PRECISE (0.0)</span>
                    <span>CREATIVE (1.0)</span>
                  </div>
                </div>
              </div>
            )}

            {/* SMTP EMAIL SERVER TAB */}
            {activeTab === "email" && (
              <div className="space-y-5 animate-slide-up">
                <div className="border-b border-[#121B30] pb-2.5 mb-2 select-none">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">SMTP Host parameters</h3>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono uppercase mt-0.5">Parameters relating to transaction notifications, emails and logs delivery</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                      SMTP outbound Host
                    </label>
                    <input
                      type="text"
                      value={settingsDict.smtpHost}
                      onChange={(e) => handleFieldChange("smtpHost", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono font-sans">
                      SMTP Port Code
                    </label>
                    <input
                      type="text"
                      value={settingsDict.smtpPort}
                      onChange={(e) => handleFieldChange("smtpPort", e.target.value)}
                      placeholder="587"
                      className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    SMTP Username ID
                  </label>
                  <input
                    type="text"
                    value={settingsDict.smtpUser}
                    onChange={(e) => handleFieldChange("smtpUser", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    SMTP User Authenticating Secret (Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showSmtpPass ? "text" : "password"}
                      value={settingsDict.smtpPass}
                      onChange={(e) => handleFieldChange("smtpPass", e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB PANEL */}
            {activeTab === "security" && (
              <div className="space-y-5 animate-slide-up">
                <div className="border-b border-[#121B30] pb-2.5 mb-2 select-none">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Access parameters & TOTP security</h3>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono uppercase mt-0.5">Defines timeouts, session restrictions and Multi-factor authorization</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Force Multi-Factor Authenticator (Totp Security)
                  </label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("force2FA", settingsDict.force2FA === "true" ? "false" : "true")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settingsDict.force2FA === "true" ? "bg-[#EF4444]" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settingsDict.force2FA === "true" ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-gray-400 font-mono text-[11px] leading-none uppercase">
                      Status: {settingsDict.force2FA === "true" ? "MANDATORY ON ALL REGISTRIES" : "OPTIONAL OPERATORS KEY"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Token session timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settingsDict.sessionTimeoutMin}
                    onChange={(e) => handleFieldChange("sessionTimeoutMin", e.target.value)}
                    placeholder="60"
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {/* APPEARANCE TAB PANEL */}
            {activeTab === "appearance" && (
              <div className="space-y-5 animate-slide-up">
                <div className="border-b border-[#121B30] pb-2.5 mb-2 select-none">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Interface visuals branding</h3>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono uppercase mt-0.5">Parameters relating to system layout styles, themes & accents</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Accents brand color (Hex)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={settingsDict.accentColor}
                      onChange={(e) => handleFieldChange("accentColor", e.target.value)}
                      placeholder="#EF4444"
                      className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none font-mono"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-slate-700" style={{ backgroundColor: settingsDict.accentColor }} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Default UI Client Theme
                  </label>
                  <select
                    value={settingsDict.defaultTheme}
                    onChange={(e) => handleFieldChange("defaultTheme", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="dark">Cosmic Slate (Dark theme only)</option>
                    <option value="light">High-Contrast Light Theme</option>
                  </select>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON FOOTER BAR */}
            <div className="border-t border-[#121B31] pt-5 mt-6 flex justify-end">
              <button
                type="submit"
                disabled={putSettingsMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-red-650 hover:bg-red-750 disabled:opacity-40 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10"
              >
                {putSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Synchronizing registry indices...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4.5 w-4.5" />
                    <span>Save All Parameters</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
