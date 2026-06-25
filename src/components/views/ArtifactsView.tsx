import React, { useState } from "react";
import { 
  ArrowLeft, 
  Box, 
  FileCode, 
  Image as ImageIcon, 
  FileText, 
  Video as VideoIcon, 
  Search, 
  Eye, 
  Download, 
  Trash2, 
  X, 
  Check, 
  Maximize2 
} from "lucide-react";

interface Artifact {
  id: string;
  name: string;
  type: "website" | "image" | "document" | "video";
  format: string;
  size: string;
  createdTime: string;
  content: string; // HTML snippet or prompt metadata
}

export default function ArtifactsView({ onBack }: { onBack: () => void }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([
    {
      id: "art_1",
      name: "cyberpunk_cityscape.png",
      type: "image",
      format: "PNG Image Spec",
      size: "2.4 MB",
      createdTime: "2m ago",
      content: "A futuristic cyberpunk cityscape with ambient crimson neon glow, flying taxi vectors, high-tech skyscrapers under rainy night, reflections, high detail."
    },
    {
      id: "art_2",
      name: "retro_booking_form.html",
      type: "website",
      format: "Tailwind HTML Live",
      size: "42 KB",
      createdTime: "15m ago",
      content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-gray-950 text-white flex items-center justify-center min-h-screen font-serif">\n  <div class="border border-red-500/30 p-8 rounded-3xl bg-neutral-900 shadow-2xl max-w-md w-full">\n    <h2 class="text-2xl font-bold tracking-tight mb-2 text-red-500">Retro Room Booking</h2>\n    <p class="text-xs text-neutral-450 mb-6 font-mono">ESTABLISHED NEURAL ROUTING 1989</p>\n    <button class="w-full bg-red-650 hover:bg-red-700 py-3 rounded-xl font-bold text-sm tracking-wide">CONFIRM FLIGHT</button>\n  </div>\n</body>\n</html>`
    },
    {
      id: "art_3",
      name: "SaaS_Growth_Proposal.pdf",
      type: "document",
      format: "Analyzed Text Summary",
      size: "185 KB",
      createdTime: "1h ago",
      content: "# Strategic Growth Proposal Summary\n\n1. **Core Terminations:** Terminating SaaS sub-tiers results in 30-day penalty limits.\n2. **Database Clustering:** Region `asia-east1` scale-to-zero postgres operations approved.\n3. **Network Ingress:** Single ports proxying routed safely."
    },
    {
      id: "art_4",
      name: "product_teaser_cinematic.mp4",
      type: "video",
      format: "MP4 Video Render",
      size: "8.1 MB",
      createdTime: "3h ago",
      content: "Panoramic cinematic sweeping landscape shot of cloud computing modular server farm racks flashing blue and crimson neon status indicators."
    },
    {
      id: "art_5",
      name: "portfolio_minimal.html",
      type: "website",
      format: "Tailwind HTML Live",
      size: "31 KB",
      createdTime: "1d ago",
      content: `<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-[#0f1115] text-zinc-300 p-12">\n  <div class="max-w-xl mx-auto">\n    <h1 class="text-3xl font-extrabold text-white tracking-tighter">Arif Hossain</h1>\n    <p class="text-sm mt-2 text-zinc-500">Lead Platform Architect at Eurosia One</p>\n  </div>\n</body>\n</html>`
    }
  ]);

  const [activeFilter, setActiveFilter] = useState<"All" | "website" | "image" | "document" | "video">("All");
  const [searchWord, setSearchWord] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete handle
  const handleDeleteArtifact = (id: string) => {
    setArtifacts(prev => prev.filter(a => a.id !== id));
    if (selectedArtifact?.id === id) {
      setSelectedArtifact(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = artifacts.filter(art => {
    const matchesFilter = activeFilter === "All" || art.type === activeFilter;
    const matchesSearch = art.name.toLowerCase().includes(searchWord.toLowerCase()) || 
                          art.content.toLowerCase().includes(searchWord.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50/35 dark:bg-[#0c101b] fade-in relative">
      {/* Title Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-150 bg-white dark:border-gray-800 dark:bg-zinc-900/40 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 dark:border-gray-800 dark:bg-zinc-900 dark:text-gray-300 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Box className="h-4 w-4 text-red-600" />
              <span>Artifacts Registry</span>
            </h1>
            <p className="text-[10px] text-gray-450 dark:text-gray-500 font-medium font-sans">Inspect, copy, and expand compiled static pages, visual renders, and prompt logs</p>
          </div>
        </div>

        {/* Search tool block */}
        <div className="relative max-w-xs w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search resources..."
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="w-full text-xs rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-1.5 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Main filter list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex gap-1.5 border-b border-gray-200 pb-3 dark:border-gray-850 justify-start select-none">
          {(["All", "website", "image", "document", "video"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                activeFilter === filter
                  ? "bg-red-650 text-white"
                  : "bg-white text-gray-550 border border-gray-150 hover:border-red-500 dark:bg-zinc-900 dark:border-gray-800 dark:text-gray-300"
              }`}
            >
              {filter === "All" ? "All Artifacts" : filter + "s"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((art) => {
            const isWeb = art.type === "website";
            const isImg = art.type === "image";
            const isDoc = art.type === "document";
            const isVid = art.type === "video";

            return (
              <div 
                key={art.id}
                onClick={() => setSelectedArtifact(art)}
                className="bg-white border border-gray-200 dark:bg-zinc-900 dark:border-gray-850 rounded-2xl p-4 text-left hover:border-red-600 dark:hover:border-red-950 transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg border shrink-0 ${
                      isWeb ? "text-blue-600 bg-blue-50 border-blue-100" :
                      isImg ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                      isDoc ? "text-amber-600 bg-amber-50 border-amber-100" :
                      "text-purple-600 bg-purple-50 border-purple-100"
                    }`}>
                      {isWeb && <FileCode className="h-4 w-4" />}
                      {isImg && <ImageIcon className="h-4 w-4" />}
                      {isDoc && <FileText className="h-4 w-4" />}
                      {isVid && <VideoIcon className="h-4 w-4" />}
                    </div>

                    <span className="text-[10px] text-gray-400 font-semibold font-mono uppercase">
                      {art.size}
                    </span>
                  </div>

                  <h3 className="font-display font-extrabold text-gray-900 dark:text-white text-xs truncate">
                    {art.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-450 mt-1 lines-2 font-medium line-clamp-2">
                    {art.content}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-850">
                  <span className="text-[10px] font-medium text-gray-400 font-mono">
                    {art.createdTime}
                  </span>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArtifact(art);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArtifact(art.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-md cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Expansion Drawer Overlay */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-850 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-left shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-zinc-950/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-600">
                  <Box className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-gray-900 dark:text-white">{selectedArtifact.name}</h3>
                  <p className="text-[10px] font-bold text-gray-450 uppercase font-mono">{selectedArtifact.format} · {selectedArtifact.size}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedArtifact.content)}
                  className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-red-600 animate-bounce" /> : <Download className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy Value"}</span>
                </button>
                <button 
                  onClick={() => setSelectedArtifact(null)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:text-gray-800 hover:bg-gray-50 dark:bg-zinc-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Expander Code display */}
            <div className="flex-1 overflow-auto p-6 font-mono text-xs text-gray-800 dark:text-gray-200 bg-gray-50/30 dark:bg-zinc-950/50">
              {selectedArtifact.type === "website" ? (
                <div className="space-y-4">
                  <div className="border border-gray-250 rounded-xl overflow-hidden shadow-xs dark:border-gray-800 bg-white">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:bg-zinc-900 dark:border-gray-800">
                      Live Sandbox Iframe Render Output
                    </div>
                    <iframe 
                      title="Shed-preview"
                      srcDoc={selectedArtifact.content} 
                      className="w-full h-80 bg-white border-0"
                    />
                  </div>

                  <div className="border border-gray-250 rounded-xl overflow-hidden dark:border-gray-800">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:bg-zinc-900 dark:border-gray-800">
                      Raw Source Template
                    </div>
                    <pre className="p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                      {selectedArtifact.content}
                    </pre>
                  </div>
                </div>
              ) : selectedArtifact.type === "image" ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative w-full max-w-md h-64 bg-slate-900/10 dark:bg-black/40 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 rounded-full bg-red-100 text-red-650 flex items-center justify-center text-xl font-serif">P</div>
                    {/* fallback mock */}
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/60 text-white flex-col font-sans">
                      <ImageIcon className="h-8 w-8 mb-2 text-red-400" />
                      <p className="text-xs font-semibold">Simulated graphic successfully rendered in filesystem store</p>
                      <p className="text-[10px] text-gray-300 mt-1 max-w-xs leading-relaxed italic">"{selectedArtifact.content}"</p>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-[11px] text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400 leading-relaxed max-w-lg text-left">
                    <strong>Asset Prompt Properties:</strong> {selectedArtifact.content}
                  </div>
                </div>
              ) : (
                <pre className="p-4 whitespace-pre-wrap leading-relaxed select-all text-left bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                  {selectedArtifact.content}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
