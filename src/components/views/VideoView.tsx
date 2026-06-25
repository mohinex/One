import React, { useState } from "react";
import { 
  ArrowLeft, 
  Video, 
  Sparkles, 
  Play, 
  Download, 
  RefreshCw, 
  AlertCircle,
  Clock,
  Film
} from "lucide-react";

export default function VideoView({ onBack }: { onBack: () => void }) {
  const [prompt, setPrompt] = useState("A neon hologram of a cybernetic cat driving at top speed across a digital speedway");
  const [resolution, setResolution] = useState("1080p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [currentVideo, setCurrentVideo] = useState<string | null>(
    "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-neon-cityscape-with-traffic-at-night-42468-large.mp4"
  );

  const steps = [
    "Compiling storyboard prompts...",
    "Rendering lighting vectors...",
    "Stitching spatial frame matrices...",
    "Finalizing raw MP4 streaming buffer..."
  ];

  const handleCompile = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setActiveStep(0);

    // Loop steps
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setLoading(false);
          // Set a new public looping MP4 file based on keywords if we want, or default
          setCurrentVideo("https://assets.mixkit.co/videos/preview/mixkit-retro-futurism-car-driving-through-a-futuristic-city-43183-large.mp4");
          return prev;
        }
      });
    }, 1200);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-white dark:bg-[#0B0F19] transition-colors duration-200">
      
      {/* Parameters Panel Left - 320px */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 bg-[#F9FAFB]/60 dark:border-gray-800 dark:bg-[#0D121F]/60 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5 text-left">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onBack}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-450 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-display font-bold text-sm text-gray-850 dark:text-white">Motion Compiler</h3>
          </div>

          <div className="space-y-4">
            
            {/* Storyboard Prompts Entry */}
            <div>
              <label className="text-[11px] font-semibold text-gray-455 dark:text-gray-455 uppercase tracking-wide block mb-1.5">Motion Storyboard</label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe motion cues: lighting camera pan right..."
                className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 focus:outline-none focus:border-red-500 text-gray-700 dark:text-gray-200 resize-none leading-relaxed"
              />
            </div>

            {/* Model Target Select */}
            <div>
              <label className="text-[11px] font-semibold text-gray-455 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Motion Engine</label>
              <select className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 outline-none cursor-pointer">
                <option>Veo 3.1 Lite (Optimal)</option>
                <option>Veo 3.1 Pro (Heavy High Res)</option>
                <option>MotionFlow Turbo v4</option>
              </select>
            </div>

            {/* Aspect Selector */}
            <div>
              <label className="text-[11px] font-semibold text-gray-455 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Canvas Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "16:9", label: "Landscape (16:9)" },
                  { id: "9:16", label: "Portrait (9:16)" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAspectRatio(item.id)}
                    className={`p-2.5 text-xs font-semibold rounded-xl border text-center cursor-pointer transition-all ${
                      aspectRatio === item.id
                        ? "bg-red-600 border-transparent text-white"
                        : "bg-white text-gray-650 border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="flex bg-amber-50/40 border border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30 rounded-xl p-3 text-left gap-1.5">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-normal">
            Video compile parameters can take up to 60 seconds on cloud clusters. Standard free limits support 4s segments.
          </p>
        </div>
      </div>

      {/* Main Board - Compile Actions + Looping players */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
        
        {/* Render Stage Container */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-150 dark:bg-gray-950 dark:border-gray-850 overflow-hidden relative min-h-[320px]">
          
          {loading ? (
            /* Running Compiling Animation Stack */
            <div className="text-center p-6 space-y-5 z-10 max-w-sm">
              <RefreshCw className="h-10 w-10 text-red-600 animate-spin mx-auto pb-1" />
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-gray-800 dark:text-white">Compiling Cinematic Assets</p>
                <p className="text-[11px] text-gray-400 font-mono tracking-tight bg-gray-100/50 dark:bg-gray-900 px-3 py-1 rounded inline-block">
                  {steps[activeStep]}
                </p>
              </div>

              {/* Progress Line */}
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-1000 ease-in-out"
                  style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          ) : currentVideo ? (
            /* MP4 HTML5 Frame Player */
            <div className="w-full h-full relative aspect-video flex items-center justify-center">
              <video 
                key={currentVideo}
                src={currentVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 flex gap-1.5">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-xs rounded text-[9px] font-bold text-white uppercase tracking-wider font-mono">
                  Veo 3.1 Loop
                </span>
                <span className="px-2 py-1 bg-black/60 backdrop-blur-xs rounded text-[9px] font-bold text-white uppercase tracking-wider font-mono">
                  1080p HD
                </span>
              </div>
            </div>
          ) : (
            /* Empty stage default placeholder */
            <div className="text-center p-8 text-gray-450 dark:text-gray-500">
              <Film className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-xs font-bold">No asset compiled yet</p>
              <p className="text-[10px] mt-1">Configure your motion cues in the left panel and click Compile</p>
            </div>
          )}

        </div>

        {/* Action Button Segment */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-4 text-left">
          <div className="space-y-0.5">
            <h5 className="text-xs font-bold text-gray-850 dark:text-gray-200 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-red-500" />
              Target Cue
            </h5>
            <p className="text-[11px] text-gray-450 dark:text-gray-500 italic max-w-lg truncate">
              "{prompt}"
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentVideo && !loading && (
              <button 
                onClick={() => showToast("Exporting MP4 film package...", "success")}
                className="px-4 py-2 rounded-xl border border-gray-250 bg-white hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export MP4</span>
              </button>
            )}

            <button
              onClick={handleCompile}
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-750 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Compile Video</span>
            </button>
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
