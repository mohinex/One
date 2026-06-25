import React, { useState } from "react";
import { 
  ArrowLeft, 
  Terminal, 
  Play, 
  Sparkles, 
  Copy, 
  Check, 
  HelpCircle,
  RefreshCw,
  Cpu,
  FileCode2
} from "lucide-react";

export default function CodeAssistantView({ onBack }: { onBack: () => void }) {
  const [inputCode, setInputCode] = useState(`// Bubble sort implementation in JS
function bubbleSort(arr) {
  let len = arr.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}`);
  const [lang, setLang] = useState("JavaScript");
  const [operation, setOperation] = useState("Debug & Refactor");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outputCode, setOutputCode] = useState(`// Refactored Bubble Sort with ES6 swaps and custom early exits for optimal speed:

export function bubbleSort<T>(arr: T[]): T[] {
  const len = arr.length;
  let swapped: boolean;
  
  for (let i = 0; i < len; i++) {
    swapped = false;
    for (let j = 0; j < len - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // ES6 Destructuring swap
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    // If no values were swapped, the array is already sorted.
    if (!swapped) break;
  }
  return arr;
}`);

  const handleRun = async (actionType: string) => {
    setLoading(true);
    setOperation(actionType);

    try {
      // Direct call to general api gateway
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Action to perform: ${actionType}. Language stack: ${lang}. Here is the target code block:
\`\`\`${lang.toLowerCase()}
${inputCode}
\`\`\`
Perform this action cleanly and write ONLY the revised code and a 3-line concise comment explanation. No generic intro text.`,
          contextType: "code"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact code assistant service");
      }

      const data = await response.json();
      if (data.text) {
        setOutputCode(data.text);
      }
    } catch (err) {
      console.error(err);
      setOutputCode(`// Error compiling refactored syntax. Please ensure server is running.
// Mock backup:
// Clicked action: ${actionType}
// Code context: ${inputCode.substring(0, 100)}...`);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-white dark:bg-[#0B0F19] transition-colors duration-200">
      
      {/* Scope parameter controls panel left - 320px */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 bg-[#F9FAFB]/60 dark:border-gray-800 dark:bg-[#0D121F]/60 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
        <div className="space-y-6 text-left">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onBack}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-display font-bold text-sm text-gray-850 dark:text-white">Syntax Assistant</h3>
          </div>

          <div className="space-y-4">
            
            {/* Target Language Select */}
            <div>
              <label className="text-[11px] font-semibold text-gray-450 dark:text-gray-400 uppercase tracking-wide block mb-1.5 font-sans">Target Stack</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-850 dark:border-gray-850 dark:bg-gray-950 dark:text-gray-100 outline-none cursor-pointer"
              >
                {["TypeScript", "JavaScript", "Python", "Go Language", "Rust Cargo", "SQL Postgres", "HTML / CSS"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Quick action operations list */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-455 dark:text-gray-400 uppercase tracking-wide block font-sans">Refactor Action</label>
              <div className="space-y-1.5">
                {[
                  { label: "Debug & Optimize", desc: "Scan memory leaks, early break options" },
                  { label: "Add TS Annotations", desc: "Transpile JS to strict typed interfaces" },
                  { label: "Explain Code Logic", desc: "Breakdown complex algorithmic sequences" },
                  { label: "Translate Language", desc: "Translate codes to Python/Rust equivalents" }
                ].map((act) => (
                  <button
                    key={act.label}
                    onClick={() => handleRun(act.label)}
                    disabled={loading || !inputCode.trim()}
                    className="w-full rounded-xl border border-gray-200 bg-white hover:border-red-400 hover:bg-red-50/15 p-2.5 text-left text-xs transition-all disabled:opacity-40 cursor-pointer group flex items-start gap-2.5 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-red-900"
                  >
                    <Cpu className="h-4 w-4 text-gray-450 shrink-0 mt-0.5 group-hover:text-red-500 transition-colors" />
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white leading-normal">{act.label}</p>
                      <p className="text-[9.5px] text-gray-450 dark:text-gray-500 mt-0.5 leading-normal">{act.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4 text-left">
          <p className="text-[11px] text-gray-400 dark:text-gray-505 leading-normal">
            * Eurosia Code Assistant supports up to 500 lines parameter limits. Powered by Gemini 3.1 Pro code reasoning engines.
          </p>
        </div>
      </div>

      {/* Compiler Panels Splitting row */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/90 dark:bg-[#0B0F19]/90 flex flex-col items-center justify-center p-6 text-center">
            <RefreshCw className="h-7 w-7 text-red-600 animate-spin mb-3" />
            <p className="text-xs font-bold text-gray-800 dark:text-white">Evaluating Syntax Tree</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Running deep code compiler logic using Gemini backend models...</p>
          </div>
        )}

        {/* Input box - Left splitting */}
        <div className="flex-1 border-r border-gray-100 dark:border-gray-800 flex flex-col h-full overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 bg-[#F9FAFB] dark:border-gray-800 dark:bg-gray-900 shrink-0 text-left flex items-center gap-1.5 font-display font-semibold text-xs text-gray-450 uppercase tracking-widest">
            <Terminal className="h-3.5 w-3.5" />
            <span>Developer Editor Input</span>
          </div>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="flex-1 w-full bg-gray-50 text-gray-800 p-4 font-mono text-[11px] focus:outline-none leading-relaxed resize-none overflow-auto dark:bg-black dark:text-slate-200"
          />
        </div>

        {/* Output box - Right splitting */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 bg-[#F9FAFB] dark:border-gray-800 dark:bg-gray-900 shrink-0 text-left flex justify-between items-center text-xs text-gray-450 uppercase tracking-widest font-display font-semibold">
            <div className="flex items-center gap-1.5">
              <FileCode2 className="h-3.5 w-3.5" />
              <span>Refactored Output ({operation})</span>
            </div>
            <button 
              onClick={copyCode}
              className="p-1 rounded text-gray-450 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-850 cursor-pointer"
              title="Copy Output"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex-1 w-full bg-[#0E121F] text-emerald-450 p-4 font-mono text-[11px] leading-relaxed overflow-auto text-left whitespace-pre-wrap">
            {outputCode}
          </div>
        </div>

      </div>

    </div>
  );
}
