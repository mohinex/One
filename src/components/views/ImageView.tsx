import React, { useState } from "react";
import { 
  ArrowLeft, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Sliders, 
  Maximize2,
  Check,
  Eye,
  Trash2
} from "lucide-react";

export default function ImageView({ onBack }: { onBack: () => void }) {
  const [prompt, setPrompt] = useState("A futuristic neon cyberpunk cityscape with ambient towering skyscrapers");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [quality, setQuality] = useState("2K");
  const [styleMode, setStyleMode] = useState("Cinematic 3D");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [generatedImages, setGeneratedImages] = useState<Array<{
    id: string;
    url: string;
    prompt: string;
    aspect: string;
    style: string;
    time: string;
  }>>([
    {
      id: "img_1",
      url: "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?q=80&w=600&auto=format&fit=crop",
      prompt: "A neon cyberpunk cityscape with ambient crimson glow",
      aspect: "16:9",
      style: "Cinematic 3D",
      time: "2m ago"
    },
    {
      id: "img_2",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
      prompt: "An elegant minimal abstract design with vibrant fluid gradients, vector paths",
      aspect: "1:1",
      style: "Abstract Vector",
      time: "1h ago"
    }
  ]);

  const stylesList = [
    "Cinematic 3D",
    "Digital Anime",
    "Photo Realistic",
    "Abstract Vector",
    "Pencil Sketch",
    "Vaporwave Synth"
  ];

  const aspectRatios = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "4:3", label: "Standard (4:3)" }
  ];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setLoading(true);

    // Map prompts to beautiful sample keywords
    const lower = prompt.toLowerCase();
    let keyword = "cyberpunk";
    if (lower.includes("car") || lower.includes("vehicle")) keyword = "supercar";
    else if (lower.includes("nature") || lower.includes("forest") || lower.includes("mountain")) keyword = "nature";
    else if (lower.includes("space") || lower.includes("star") || lower.includes("planet")) keyword = "galaxy";
    else if (lower.includes("abstract") || lower.includes("art")) keyword = "fluid-art";
    else if (lower.includes("character") || lower.includes("girl") || lower.includes("portrait") || lower.includes("man")) keyword = "portrait";
    else if (lower.includes("house") || lower.includes("architecture") || lower.includes("modern")) keyword = "modern-architecture";

    // Standard Unsplash matching URLs
    const keywordPhotoMap: Record<string, string> = {
      cyberpunk: "https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=600&auto=format&fit=crop",
      supercar: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=600&auto=format&fit=crop",
      nature: "https://images.unsplash.com/photo-1472214222541-d510753a4707?q=80&w=600&auto=format&fit=crop",
      galaxy: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
      "fluid-art": "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop",
      portrait: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
      "modern-architecture": "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop"
    };

    const finalUrl = keywordPhotoMap[keyword] || keywordPhotoMap.cyberpunk;

    setTimeout(() => {
      const newImg = {
        id: `img_${Date.now()}`,
        url: finalUrl,
        prompt: prompt,
        aspect: aspectRatio,
        style: styleMode,
        time: "Just now"
      };
      setGeneratedImages(prev => [newImg, ...prev]);
      setLoading(false);
    }, 2500);
  };

  const deleteImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-white dark:bg-[#0B0F19] transition-colors duration-200">
      
      {/* Parameters Controls Left Panel - 320px */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 bg-[#F9FAFB]/60 dark:border-gray-800 dark:bg-[#0D121F]/60 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onBack}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-550 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-display font-bold text-sm text-gray-850 dark:text-white">Image Parameters</h3>
          </div>

          <div className="space-y-4 text-left">
            {/* Style Selector */}
            <div>
              <label className="text-[11px] font-semibold text-gray-450 dark:text-gray-455 uppercase tracking-wide block mb-1.5">Artistic Stylist</label>
              <div className="grid grid-cols-2 gap-2">
                {stylesList.map((st) => (
                  <button
                    key={st}
                    onClick={() => setStyleMode(st)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      styleMode === st
                        ? "bg-red-600 text-white border-transparent"
                        : "bg-white hover:bg-gray-50 text-gray-600 border-gray-150 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="text-[11px] font-semibold text-gray-450 dark:text-gray-455 uppercase tracking-wide block mb-1.5">Aspect Matrix</label>
              <div className="space-y-1.5">
                {aspectRatios.map((asp) => (
                  <button
                    key={asp.value}
                    onClick={() => setAspectRatio(asp.value)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                      aspectRatio === asp.value
                        ? "border-red-500 bg-red-50/25 text-red-600 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400"
                        : "bg-white text-gray-600 border-gray-150 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
                    }`}
                  >
                    <span>{asp.label}</span>
                    {aspectRatio === asp.value && <Check className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Selector */}
            <div>
              <label className="text-[11px] font-semibold text-gray-450 dark:text-gray-455 uppercase tracking-wide block mb-1.5">Target Resolution</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["512px", "1K", "2K", "4K"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      quality === q
                        ? "border-red-600 text-red-600 dark:text-red-400 font-bold bg-white"
                        : "border-gray-100 bg-white text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-500"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 dark:border-gray-800/80 pt-4 text-left">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-normal">
            * Generated assets are saved to Eurosia Cloud storage automatically. High resolution renders require a premium license subscription.
          </p>
        </div>
      </div>

      {/* Main Board - prompt entry + rendering grids */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* Prompts Drawer Card */}
        <div className="bg-white border border-gray-100 dark:border-gray-800 dark:bg-gray-900 rounded-2xl p-4.5 shadow-xs text-left">
          <h4 className="font-display font-bold text-xs text-gray-850 dark:text-gray-200 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-red-500" />
            Enter Creative Prompt
          </h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cybernetic tiger stalking neon paths..."
              className="flex-1 bg-gray-50 border border-gray-200/85 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none dark:bg-gray-950 dark:border-gray-850 dark:text-white"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Asset</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated output displays */}
        <div className="text-left select-none">
          <h3 className="font-display font-extrabold text-[#111827] dark:text-white text-[15px] leading-tight mb-4">
            Eurosia Gallery Shelf
          </h3>

          {loading && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center dark:border-gray-800 mb-6 bg-gray-50/20">
              <RefreshCw className="h-8 w-8 text-red-600 animate-spin mb-3" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Generating HD Visual Node</p>
              <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-1">Stitching noise matrices based on "{prompt}"</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
            {generatedImages.map((img) => (
              <div 
                key={img.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-150 bg-gray-50 dark:border-gray-850 dark:bg-gray-950 flex flex-col shadow-xs"
              >
                {/* Visual Image container with aspect ratio overrides */}
                <div 
                  className={`relative w-full overflow-hidden self-center bg-zinc-900 ${
                    img.aspect === "1:1" ? "aspect-square" : img.aspect === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"
                  }`}
                >
                  <img 
                    src={img.url} 
                    alt={img.prompt} 
                    className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-103" 
                  />
                  
                  {/* Floating asset controls label on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a 
                      href={img.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-2.5 rounded-full bg-white text-zinc-900 hover:scale-105 active:scale-95 transition-all text-xs"
                      title="View Full Resolution"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </a>
                    <button 
                      onClick={() => showToast("Downloading HD compilation asset package...", "success")}
                      className="p-2.5 rounded-full bg-white text-zinc-900 hover:scale-105 active:scale-95 transition-all text-xs"
                      title="Download image ZIP"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => deleteImage(img.id)}
                      className="p-2.5 rounded-full bg-red-600 text-white hover:scale-105 active:scale-95 transition-all text-xs"
                      title="Remove from Shelf"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details Footer segment description */}
                <div className="p-3.5 bg-white dark:bg-[#111827] flex flex-col text-left flex-1 justify-between">
                  <div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 mb-1.5">
                      {img.style} · Aspect {img.aspect}
                    </span>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
                      "{img.prompt}"
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-gray-800/80 pt-2.5">
                    <span>Compiled Successfully</span>
                    <span className="font-mono">{img.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-gray-150 bg-white/95 p-3.5 shadow-xl dark:border-gray-800 dark:bg-[#111827] animate-slide-up">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-850 dark:text-gray-100">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
