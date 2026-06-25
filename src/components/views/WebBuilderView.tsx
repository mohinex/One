import React, { useState } from "react";
import { 
  ArrowLeft, 
  Globe, 
  Sparkles, 
  Code, 
  Eye, 
  Download, 
  RefreshCw,
  Copy,
  Check
} from "lucide-react";

export default function WebBuilderView({ onBack }: { onBack: () => void }) {
  const [prompt, setPrompt] = useState("A modern minimalist coffee shop landing page with elegant typography and custom reservation tables");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [compiledHTML, setCompiledHTML] = useState<string>(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Eurosia One Compiled Site</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-stone-50 text-stone-900 font-sans">
  <div class="max-w-4xl mx-auto px-6 py-12 text-center">
    <!-- Header visual -->
    <div class="mb-4 inline-block bg-amber-100 text-amber-800 text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-amber-200">
      Eurosia One Engine
    </div>
    <h1 class="text-4xl font-extrabold text-stone-950 tracking-tight mb-3">Live Static Compiler</h1>
    <p class="text-stone-500 font-medium max-w-lg mx-auto mb-8 text-sm leading-relaxed">
      Type standard text prompts inside the left panel and click "Build Webpage" to compile static landing pages, portfolios, or forms in real-time.
    </p>

    <!-- Mock design card -->
    <div class="bg-white rounded-3xl border border-stone-150 p-8 shadow-xl max-w-lg mx-auto text-left relative overflow-hidden">
      <!-- Accent light flare -->
      <div class="absolute -right-12 -top-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
      
      <h3 class="text-lg font-bold text-stone-900 mb-2">Build beautiful dashboards</h3>
      <p class="text-xs text-stone-500 mb-6">Describe buttons, layouts, forms or schedules. Get valid compiled markup with Tailwind CDN instantly.</p>
      
      <button class="w-full bg-stone-950 hover:bg-stone-850 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all tracking-wide">
        Get Started Today
      </button>
    </div>
  </div>
</body>
</html>`);

  const handleBuild = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const response = await fetch("/api/ai/web-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact build middleware");
      }

      const data = await response.json();
      if (data.html) {
        setCompiledHTML(data.html);
        setActiveTab("preview");
      }
    } catch (err) {
      console.error(err);
      showToast("Error compiling website layouts. Please check server logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(compiledHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHTML = () => {
    const blob = new Blob([compiledHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "eurosia_site.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-white dark:bg-[#0B0F19] transition-colors duration-200">
      
      {/* Parameters Panel - Left 320px */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 bg-[#F9FAFB]/60 dark:border-gray-800 dark:bg-[#0D121F]/60 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5 text-left">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onBack}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-display font-bold text-sm text-gray-850 dark:text-white">Workspace Builder</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-450 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Page Description</label>
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A sleek dark SaaS tech startup landing page with price calculator tables, grid profiles..."
                className="w-full text-xs p-3.5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 focus:outline-none focus:border-red-500 text-gray-700 dark:text-gray-200 leading-relaxed font-sans resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-455 dark:text-gray-400 uppercase tracking-wide block mb-1">Tailwind CDN Integration</label>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-normal block">
                Automatic v4 Tailwind inclusion handles all styling vectors natively, leaving clean export files.
              </span>
            </div>

            <button
              onClick={handleBuild}
              disabled={loading || !prompt.trim()}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-750 text-white font-bold text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-red-500/10"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Assembling Markup...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Build Webpage</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4 text-left">
          <p className="text-[11px] text-gray-450 dark:text-gray-500 leading-normal">
            * Pages are compiled into fully self-contained HTML codes with standard references. Click Export to download instant workspace folders.
          </p>
        </div>
      </div>

      {/* Compiler board Viewports */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-950/20">
        
        {/* Tab switch bar control headers */}
        <div className="border-b border-gray-100 px-6 py-2 bg-white dark:border-gray-800 dark:bg-gray-900 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                activeTab === "preview"
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Interactive Preview</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                activeTab === "code"
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>HTML Source Code</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              title="Copy code to clipboard"
              className="p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 dark:border-gray-850 dark:bg-[#111827] dark:hover:bg-gray-800 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={downloadHTML}
              title="Download index.html website file"
              className="p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 dark:border-gray-850 dark:bg-[#111827] dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1 text-xs font-semibold shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export index.html</span>
            </button>
          </div>
        </div>

        {/* Dynamic Display Panel */}
        <div className="flex-1 overflow-hidden relative">
          
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/90 dark:bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
              <RefreshCw className="h-8 w-8 text-red-600 animate-spin mb-3.5" />
              <p className="text-xs font-bold text-gray-900 dark:text-white">Analyzing markup constraints</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-normal">
                Applying modern spacing rules, shadow tokens, and writing clean HTML structure...
              </p>
            </div>
          )}

          {activeTab === "preview" ? (
            /* Sandboxed full source HTML displayer */
            <iframe
              title="Compiled Live Stage"
              srcDoc={compiledHTML}
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-none bg-white"
            />
          ) : (
            /* Raw markup renderer display box */
            <div className="w-full h-full overflow-auto bg-gray-900 p-6 text-left font-mono text-[11px] leading-relaxed text-emerald-400 dark:bg-[#060913]">
              <pre className="whitespace-pre-wrap">{compiledHTML}</pre>
            </div>
          )}

        </div>

      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-gray-150 bg-white/95 p-3.5 shadow-xl dark:border-gray-800 dark:bg-[#111827] animate-slide-up">
          <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
          <span className="text-xs font-semibold text-gray-850 dark:text-gray-100">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
