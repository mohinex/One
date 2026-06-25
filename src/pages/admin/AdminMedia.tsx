import React, { useState } from "react";
import { 
  FolderLock, 
  Image as ImageIcon, 
  FileText, 
  Music, 
  Video, 
  Search, 
  Upload, 
  Copy, 
  ExternalLink, 
  Trash2, 
  X, 
  FolderPlus, 
  Check,
  Grid,
  List,
  Eye,
  Loader2,
  HardDrive
} from "lucide-react";
import toast from "react-hot-toast";

interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: "image" | "document" | "audio" | "video";
  size: string;
  dimensions?: string;
  createdAt: string;
}

const CATEGORIES_TREE = [
  { id: "all", label: "Root Directory", count: 12, icon: HardDrive },
  { id: "image", label: "Image Assets", count: 6, icon: ImageIcon },
  { id: "document", label: "Documents", count: 3, icon: FileText },
  { id: "audio", label: "Audio Syntheses", count: 2, icon: Music },
  { id: "video", label: "Video Outputs", count: 1, icon: Video },
];

export default function AdminMedia() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [viewStyle, setViewStyle] = useState<"grid" | "list">("grid");
  const [lightboxAsset, setLightboxAsset] = useState<MediaAsset | null>(null);

  // Initial media index mockup values
  const [assets, setAssets] = useState<MediaAsset[]>([
    { id: "1", name: "eurosia_one_logo_neon.png", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80", type: "image", size: "142 KB", dimensions: "512 x 512 px", createdAt: "2026-06-20" },
    { id: "2", name: "hero_mindfulness_bg.jpg", url: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80", type: "image", size: "1.2 MB", dimensions: "1920 x 1080 px", createdAt: "2026-06-18" },
    { id: "3", name: "terms_of_service_eurosia.pdf", url: "#", type: "document", size: "48 KB", createdAt: "2026-06-15" },
    { id: "4", name: "calm_diaphragmatic_loop.mp3", url: "#", type: "audio", size: "4.8 MB", createdAt: "2026-06-12" },
    { id: "5", name: "system_architecture_whiteboard.svg", url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80", type: "image", size: "28 KB", dimensions: "120 x 120 px", createdAt: "2026-06-10" },
    { id: "6", name: "onboarding_operator_guide.mp4", url: "#", type: "video", size: "24.5 MB", createdAt: "2026-06-08" },
  ]);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Clipboard copy handler
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Resource CDN link copied to secure keystore!");
  };

  // Drag and drop event handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadProgress(10);
    toast.loading("Analyzing asset hashes & executing upload...");

    // Simulate upload timer
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 10;
        if (prev >= 100) {
          clearInterval(interval);
          toast.dismiss();

          // Append new mock asset
          const isImg = file.type.startsWith("image/");
          const isAudio = file.type.startsWith("audio/");
          const isVideo = file.type.startsWith("video/");
          const assetType = isImg ? "image" : isAudio ? "audio" : isVideo ? "video" : "document";

          const newAsset: MediaAsset = {
            id: String(Date.now()),
            name: file.name,
            url: isImg ? URL.createObjectURL(file) : "#",
            type: assetType as any,
            size: `${(file.size / 1024).toFixed(0)} KB`,
            dimensions: isImg ? "Custom upload" : undefined,
            createdAt: new Date().toISOString().slice(0, 10),
          };

          setAssets((prevAssets) => [newAsset, ...prevAssets]);
          setUploadProgress(null);
          toast.success("Asset verified & synchronized on platform storage!");
          return null;
        }
        return prev + 30;
      });
    }, 450);
  };

  // Filter & Search computation
  const filteredAssets = assets.filter((asset) => {
    const matchesCategory = activeCategory === "all" || asset.type === activeCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight text-white uppercase">MEDIA REPOSITORIES</h1>
          <p className="text-gray-450 text-xs font-semibold uppercase font-mono mt-1 font-sans">Distributed storage ledger, CDN asset manager & logs attachment caches</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4.5 py-2.5 bg-red-650 hover:bg-red-750 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10">
            <Upload className="h-4 w-4" />
            <span>Transmit File</span>
            <input type="file" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: Folders & category directories navigation */}
        <div className="bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl p-4 flex flex-col gap-1.5 select-none">
          <span className="text-[10px] font-bold text-gray-500 font-mono uppercase tracking-widest px-3 mb-2">DIRECTORY NODES</span>
          {CATEGORIES_TREE.map((cat) => {
            const Icon = cat.icon;
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isTabActive(activeCategory, cat.id)
                    ? "bg-slate-900 border border-slate-800 text-red-500" 
                    : "text-gray-400 hover:text-white hover:bg-[#111626]/40 border border-transparent"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isTabActive(activeCategory, cat.id) ? "text-red-500" : "text-gray-450"}`} />
                  <span>{cat.label}</span>
                </span>
                <span className="text-[10px] font-mono opacity-60">[{assets.filter(a => cat.id === "all" || a.type === cat.id).length}]</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT AREA: Drags upload area & items lists */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* DRAG ZONE AREA */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              dragActive 
                ? "border-red-500 bg-red-950/15" 
                : "border-[#1A263F] bg-[#090D1A] hover:border-slate-800"
            }`}
          >
            {uploadProgress !== null ? (
              <div className="flex flex-col items-center gap-3 select-none">
                <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                <span className="text-xs font-bold font-mono tracking-widest text-white">HASH TRANSMISSION: {uploadProgress}%</span>
                <div className="w-48 bg-slate-900 rounded-full h-1 mt-1 overflow-hidden">
                  <div className="bg-red-550 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 select-none pointer-events-none">
                <Upload className="h-8 w-8 text-gray-500 mb-2" />
                <p className="text-xs font-extrabold text-white">Drag and Drop media assets here</p>
                <p className="text-[10px] text-gray-450 font-mono uppercase tracking-wider mt-0.5">supports PNG, JPG, PDF, MP3 up to 50MB</p>
              </div>
            )}
          </div>

          {/* SEARCH & LAYOUT TOGGLES HEADER */}
          <div className="bg-[#090D1A] border border-[#101726] p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search resources by namespace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex gap-1 border border-[#141F32] p-1 rounded-lg select-none">
              <button 
                onClick={() => setViewStyle("grid")}
                className={`p-1.5 rounded cursor-pointer ${viewStyle === "grid" ? "bg-slate-900 text-white" : "text-gray-400"}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewStyle("list")}
                className={`p-1.5 rounded cursor-pointer ${viewStyle === "list" ? "bg-slate-900 text-white" : "text-gray-400"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* GRID ITEMS GRAPHICS LIST */}
          {filteredAssets.length > 0 ? (
            viewStyle === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
                {filteredAssets.map((asset) => (
                  <div key={asset.id} className="bg-[#090D1A] border border-[#101726] rounded-xl overflow-hidden group flex flex-col justify-between">
                    {/* Upper Preview Pane */}
                    <div className="relative h-32 bg-[#060914] border-b border-[#11182A] flex items-center justify-center overflow-hidden">
                      {asset.type === "image" ? (
                        <img src={asset.url} alt={asset.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <FileText className="h-10 w-10 text-gray-500 stroke-[1.2]" />
                      )}
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setLightboxAsset(asset)}
                          className="p-1.5 bg-slate-900 rounded-lg text-white hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(asset.url)}
                          className="p-1.5 bg-slate-900 rounded-lg text-white hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Lower Description Pane */}
                    <div className="p-3 text-left leading-tight space-y-1">
                      <h4 className="text-white text-xs font-bold truncate">{asset.name}</h4>
                      <div className="flex justify-between text-[9px] text-gray-450 font-mono uppercase tracking-wider">
                        <span>{asset.size}</span>
                        <span>{asset.dimensions || asset.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#090D1A] border border-[#101726] rounded-xl overflow-hidden divide-y divide-[#101726]/40">
                {filteredAssets.map((asset) => (
                  <div key={asset.id} className="p-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-900/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-white font-extrabold truncate max-w-sm">{asset.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-450 font-mono uppercase tracking-wider text-[10px]">
                      <span>{asset.size}</span>
                      <button
                        onClick={() => copyToClipboard(asset.url)}
                        className="p-1 hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="py-16 border border-dashed border-[#16213D] rounded-3xl text-center text-xs font-semibold text-gray-550 font-mono uppercase tracking-widest bg-[#090D1A]/30 select-none">
              No attachments found inside folder.
            </div>
          )}

        </div>

      </div>

      {/* LIGHTBOX POPUP COMPONENT */}
      {lightboxAsset && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative max-w-3xl max-h-[85vh] animate-scale-in flex flex-col items-center">
            <button
              onClick={() => setLightboxAsset(null)}
              className="absolute -top-12 right-0 h-10 w-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-850 text-white hover:scale-105 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            {lightboxAsset.type === "image" ? (
              <img src={lightboxAsset.url} alt={lightboxAsset.name} className="max-w-full max-h-[70vh] rounded-xl object-contain border border-slate-800" />
            ) : (
              <div className="h-48 w-48 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4">
                <FileText className="h-16 w-16 text-gray-500" />
              </div>
            )}
            <div className="text-center mt-4">
              <h4 className="text-white font-black text-sm tracking-tight">{lightboxAsset.name}</h4>
              <p className="text-[10px] text-gray-400 font-mono font-bold mt-1 uppercase tracking-widest">
                DIMENSIONS: {lightboxAsset.dimensions || "Vector file"} | SIZE: {lightboxAsset.size}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function isTabActive(activeCat: string, catId: string) {
  return activeCat === catId;
}
