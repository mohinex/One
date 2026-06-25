import React, { useState } from "react";
import { 
  ArrowLeft, 
  Network, 
  Sparkles, 
  Play, 
  Plus, 
  Zap, 
  ArrowRight, 
  Settings, 
  Mail, 
  Activity,
  CheckCircle,
  FileText,
  MessageSquare,
  HelpCircle,
  RefreshCw
} from "lucide-react";

interface Node {
  id: string;
  name: string;
  type: "trigger" | "action";
  icon: any;
  desc: string;
}

export default function AutomationsView({ onBack }: { onBack: () => void }) {
  const [activeTrigger, setActiveTrigger] = useState<string>("trig_pdf");
  const [activeAction, setActiveAction] = useState<string>("act_slack");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const triggers: Node[] = [
    { id: "trig_pdf", name: "PDF Contract Uploaded", type: "trigger", icon: FileText, desc: "Fires whenever a document is uploaded via the index analyzer." },
    { id: "trig_image", name: "AI Image Synthesized", type: "trigger", icon: Sparkles, desc: "Fires when creative graphic files compile in Eurosia shelf." },
    { id: "trig_speech", name: "Voice Trigger Issued", type: "trigger", icon: Activity, desc: "Triggers on speech-to-text voice configurations." }
  ];

  const actions: Node[] = [
    { id: "act_slack", name: "Slack Channel webhook", type: "action", icon: Network, desc: "Draft a Slack message with compiled logs and post to #engineering." },
    { id: "act_email", name: "Email Stakeholder Summaries", type: "action", icon: Mail, desc: "Dispatch a PDF analytics briefing directly to pre-configured addresses." },
    { id: "act_chat", name: "Eurosia AI follow-up", type: "action", icon: MessageSquare, desc: "Queue an automatic chat sequence analyzing potential secondary tasks." }
  ];

  const handleRunTest = () => {
    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setTesting(false);
      const triggerName = triggers.find(t => t.id === activeTrigger)?.name || "Trigger";
      const actionName = actions.find(a => a.id === activeAction)?.name || "Action";
      setTestResult(`Success! Pipeline linked seamlessly. 
      ▶ [Trigger: ${triggerName}] fires -> passes JSON metadata payloads -> executing [Action: ${actionName}] complete in 420ms.`);
    }, 2800);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-white dark:bg-[#0B0F19] transition-colors duration-200">
      
      {/* Parameters Panel Left - 320px details */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 bg-[#F9FAFB]/60 dark:border-gray-800 dark:bg-[#0D121F]/60 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
        <div className="space-y-6 text-left">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onBack}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-550 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-display font-bold text-sm text-gray-850 dark:text-white">Workflow Knots</h3>
          </div>

          <div className="space-y-3.5">
            <span className="text-[11px] font-semibold text-gray-455 dark:text-gray-400 uppercase tracking-wide block">How it works</span>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Stitch inputs to actions. In Eurosia One, outputs automatically translate across nodes so you can trigger summaries on uploads and stream them to your team.
            </p>

            <button
              onClick={handleRunTest}
              disabled={testing}
              className="w-full py-2.5 bg-red-600 hover:bg-red-750 font-semibold text-white rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {testing ? (
                <>
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>Testing Connections...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Run Pipeline Test</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-850 pt-4 text-left/50">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-normal">
            * Automation Studio triggers require server webhooks configuration hooks. Integrated with Zapier and Make API limits.
          </p>
        </div>
      </div>

      {/* Main Board - Node drag visually */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between text-left">
        
        <div className="space-y-8">
          <h3 className="font-display font-extrabold text-[#111827] dark:text-white text-[15px] leading-tight">
            Visual Node Editor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center select-none relative">
            
            {/* TRIGGERS COLUMN */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block font-mono">1. Entry Triggers</span>
              {triggers.map((node) => {
                const Icon = node.icon;
                const active = activeTrigger === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setActiveTrigger(node.id)}
                    className={`p-3.5 rounded-xl border text-left w-full transition-all cursor-pointer relative group flex gap-3 ${
                      active 
                        ? "border-red-500 bg-red-50/20 shadow-xs ring-4 ring-red-500/5 dark:bg-red-950/20 dark:border-red-900/40" 
                        : "border-gray-100 bg-white hover:border-gray-250 dark:bg-gray-900 dark:border-gray-850"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${active ? "bg-red-550 text-red-650" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${active ? "text-red-700 dark:text-red-400" : "text-gray-800 dark:text-white"}`}>{node.name}</p>
                      <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-1 leading-relaxed leading-snug line-clamp-2">{node.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CONNECTIVITY CHORD LINE */}
            <div className="hidden lg:flex flex-col items-center justify-center py-10 relative">
              <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-8 w-2/3 relative">
                {testing && (
                  <span className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-655 rounded-full shadow-md shadow-red-500/50 animate-ping left-1/3" />
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400 mt-2">
                <Zap className={`h-4 w-4 ${testing ? "animate-bounce" : ""}`} />
              </div>
            </div>

            {/* ACTIONS COLUMN */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block font-mono">2. Target Actions</span>
              {actions.map((node) => {
                const Icon = node.icon;
                const active = activeAction === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setActiveAction(node.id)}
                    className={`p-3.5 rounded-xl border text-left w-full transition-all cursor-pointer relative group flex gap-3 ${
                      active 
                        ? "border-green-500 bg-green-50/20 shadow-xs ring-4 ring-green-500/5 dark:bg-green-950/10 dark:border-green-900/40" 
                        : "border-gray-100 bg-white hover:border-gray-250 dark:bg-gray-900 dark:border-gray-850"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${active ? "bg-green-550 text-green-650" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${active ? "text-green-700 dark:text-green-450" : "text-gray-800 dark:text-white"}`}>{node.name}</p>
                      <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-1 leading-relaxed leading-snug line-clamp-2">{node.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Console outputs results panel */}
        <div className="mt-8 border-t border-gray-100 dark:border-gray-850 pt-5 min-h-[120px]">
          {testing ? (
            <div className="flex items-center gap-3 py-6 text-gray-450 dark:text-gray-500 font-mono text-xs">
              <RefreshCw className="h-4 w-4 animate-spin text-red-600" />
              <span>Transmitting test byte packages to webhook endpoints...</span>
            </div>
          ) : testResult ? (
            <div className="bg-red-50/20 border border-red-100 dark:bg-red-950/10 dark:border-red-900/30 p-4 rounded-xl flex gap-3 text-left">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-gray-900 dark:text-white">Pipeline Diagnostic Completed</h5>
                <p className="text-[11px] font-mono leading-relaxed text-gray-600 dark:text-gray-300 mt-1.5 whitespace-pre-wrap">
                  {testResult}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-gray-400 dark:text-gray-500 py-6 text-xs font-mono">
              <HelpCircle className="h-4.5 w-4.5 text-gray-400 shrink-0" />
              <span>Click "Run Pipeline Test" in the left panel to execute triggers visually.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
