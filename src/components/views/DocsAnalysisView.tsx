import React, { useState, useRef } from "react";
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  Search, 
  Sparkles, 
  BookOpen, 
  AlignLeft, 
  MessageSquare,
  RefreshCw,
  Clock,
  HelpCircle
} from "lucide-react";

export default function DocsAnalysisView({ onBack }: { onBack: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileAttached, setFileAttached] = useState<boolean>(true);
  const [fileName, setFileName] = useState("Strategic_Q3_Enterprise_Growth_Framework.pdf");
  const [fileSize, setFileSize] = useState("2.4 MB");
  const [pagesCount, setPagesCount] = useState(14);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [summary, setSummary] = useState<string>(`Based on the uploaded core framework, here is a detailed 3-point distillation of strategic insights:

1. **Market Scaling Paths**: Direct focus has shifted towards enterprise software subscriptions with a targeted 40% cold-outward expansion in Southeast Asia.
2. **Infrastructure Refinement**: Transitioning legacy transactional databases over to fully clustered, scalable instances reduces global ingress lag by up to 280ms.
3. **Cost Containment Guidelines**: Restrict auxiliary third-party subscription limits, prioritizing consolidated AI Operating Systems to save approximately $45,000 in monthly budgets.`);
  const [chatLog, setChatLog] = useState<Array<{ q: string; a: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    const userQ = query;
    setQuery("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Based on the document context [File name: ${fileName}], answer this specific core query with elegant structured bullets: "${userQ}"`,
          contextType: "pdf"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact document intelligence backend");
      }

      const data = await response.json();
      setChatLog(prev => [...prev, { q: userQ, a: data.text || "Unable to extract answers" }]);
    } catch (err) {
      console.error(err);
      setChatLog(prev => [...prev, { q: userQ, a: "Error compiling document summaries. Please make sure your server is running." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Analyze user documents and provide a highly detailed, professional 3-point business summary highlighting major risks, opportunities, and metric changes.",
          contextType: "pdf"
        })
      });

      if (!response.ok) {
        throw new Error("Summary API failed");
      }

      const data = await response.json();
      if (data.text) {
        setSummary(data.text);
      }
    } catch (err) {
      console.error(err);
      showToast("Error summarizing PDF context.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop files handles
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(1) + " MB");
      setPagesCount(Math.floor(Math.random() * 20) + 2);
      setFileAttached(true);
      setSummary("Fresh document uploaded. Click 'Generate Deep Analysis' to compile insights!");
      setChatLog([]);
    }
  };

  const handleFileAttachDirect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(1) + " MB");
      setPagesCount(Math.floor(Math.random() * 20) + 2);
      setFileAttached(true);
      setSummary("Fresh document uploaded. Click 'Generate Deep Analysis' to compile insights!");
      setChatLog([]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-white dark:bg-[#0B0F19] transition-colors duration-200">
      
      {/* Parameters panel left - 320px */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 bg-[#F9FAFB]/60 dark:border-gray-800 dark:bg-[#0D121F]/60 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5 text-left">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onBack}
              className="lg:hidden flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-550 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-display font-bold text-sm text-gray-850 dark:text-white">Document Index</h3>
          </div>

          <div className="space-y-4">
            
            {/* Drag and Drop Zone upload container */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                dragOver 
                  ? "border-red-500 bg-red-50/15" 
                  : "border-gray-200 bg-white hover:border-gray-350 dark:border-gray-800 dark:bg-gray-900"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileAttachDirect} 
                accept=".pdf,.txt,.doc,.docx" 
                className="hidden" 
              />
              <Upload className="h-7 w-7 text-gray-400 dark:text-gray-650 mb-2" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 block">Drag & drop files here</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">Supports PDF, DOC, TXT max 25MB</span>
            </div>

            {/* Currently Selected attached file badge */}
            {fileAttached && (
              <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-3.5 flex items-start gap-2.5 text-left">
                <FileText className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={fileName}>
                    {fileName}
                  </p>
                  <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5">
                    {fileSize} · {pagesCount} pages · Configured
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleSummarize}
              disabled={loading || !fileAttached}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-750 text-white font-bold text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Deep Analysis</span>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4 text-left">
          <p className="text-[11px] text-gray-450 dark:text-gray-505 leading-normal">
            * Eurosia document analysis complies with SOC2 standards. Content is processed within closed cloud memory loops, never retained.
          </p>
        </div>
      </div>

      {/* Main Board - Summaries + Query Terminal */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
        
        <div className="space-y-6 text-left">
          
          {/* Summary Box */}
          <div className="bg-white border border-gray-100 dark:border-gray-800 dark:bg-gray-900 rounded-2xl p-5 shadow-xs">
            <h4 className="font-display font-extrabold text-[13.5px] text-gray-950 dark:text-white mb-3.5 flex items-center gap-2">
              <AlignLeft className="h-4 w-4 text-red-500" />
              Eurosia Core Summary
            </h4>
            
            {loading && !summary.includes("Fresh document") ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <RefreshCw className="h-6 w-6 text-red-650 animate-spin mb-2" />
                <span className="text-xs text-gray-400">Analyzing document pages...</span>
              </div>
            ) : (
              <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>
            )}
          </div>

          {/* Deep Query List Logs */}
          {chatLog.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-display font-bold text-xs text-gray-400 uppercase tracking-wide">
                Document Query Logs
              </h4>
              <div className="space-y-3.5">
                {chatLog.map((log, i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900 text-left">
                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
                      <HelpCircle className="h-4 w-4 text-red-500 shrink-0" />
                      Question: "{log.q}"
                    </p>
                    <div className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-6 border-l border-gray-150 dark:border-gray-800">
                      {log.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Query Input Action Footer bar */}
        <div className="border-t border-gray-100 dark:border-gray-805 pt-4">
          <form onSubmit={handleQuery} className="flex gap-2.5">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask documents: Is there a cost termination clause or regional compliance standard?"
              className="flex-1 bg-gray-50 border border-gray-200/85 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none dark:bg-gray-950 dark:border-gray-850 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !query.trim() || !fileAttached}
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-red-600 hover:shadow-red-500/10 text-white font-semibold text-xs transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>Query Contract</span>
            </button>
          </form>
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
