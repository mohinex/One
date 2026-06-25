import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { api } from "../../lib/api";
import { 
  Wrench, 
  Trash2, 
  Plus, 
  Save, 
  Sparkles, 
  Check, 
  Search, 
  Info, 
  Loader2, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Sliders, 
  FileCode,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Terminal,
  Play,
  Globe,
  Settings,
  Flame,
  Shield,
  Activity
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import toast from "react-hot-toast";

interface ToolItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  colorClass: string;
  category: string;
  path: string;
}

const CATEGORIES = ["Core", "Creative", "Developer", "Documentary", "System"];

// List of available Lucide Icon keys for selection
const ICON_POOL = [
  "MessageSquare", "Image", "FileText", "Terminal", "Globe", "Settings", 
  "Shield", "Activity", "Wrench", "Sparkles", "Sliders", "Play"
];

const getLucideIcon = (name: string) => {
  switch (name) {
    case "MessageSquare": return MessageSquare;
    case "Image": return ImageIcon;
    case "FileText": return FileText;
    case "Terminal": return Terminal;
    case "Globe": return Globe;
    case "Settings": return Settings;
    case "Shield": return Shield;
    case "Activity": return Activity;
    case "Wrench": return Wrench;
    case "Sparkles": return Sparkles;
    case "Sliders": return Sliders;
    case "Play": return Play;
    default: return Sparkles;
  }
};

export default function AdminTools() {
  const queryClient = useQueryClient();
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  // 1. Fetch system tools from GET /admin/tools
  const { data: tools = [], isLoading } = useQuery<ToolItem[]>({
    queryKey: ["adminToolsQuery"],
    queryFn: async () => {
      const res = await api.get("/admin/tools");
      return res.data?.data || [];
    }
  });

  // React Hook Form initialization
  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<Omit<ToolItem, "id">>({
    defaultValues: {
      name: "",
      description: "",
      iconName: "Sparkles",
      colorClass: "#EF4444",
      category: "Core",
      path: ""
    }
  });

  // Watch name and auto-slugify into path
  const nameValue = watch("name");
  useEffect(() => {
    if (nameValue && !selectedTool) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("path", slug);
    }
  }, [nameValue, setValue, selectedTool]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Omit<ToolItem, "id">) => {
      const res = await api.post("/admin/tools", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminToolsQuery"] });
      toast.success("New Integration tool successfully created!");
      handleResetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to finalize tool template.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<ToolItem, "id"> }) => {
      const res = await api.patch(`/admin/tools/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminToolsQuery"] });
      toast.success("Tool parameters synchronized on platform ✓");
      handleResetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Modification failed.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/tools/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminToolsQuery"] });
      toast.success("Integration tool removed from list indices.");
    }
  });

  const handleSelectTool = (tool: ToolItem) => {
    setSelectedTool(tool);
    reset({
      name: tool.name,
      description: tool.description,
      iconName: tool.iconName,
      colorClass: tool.colorClass,
      category: tool.category,
      path: tool.path
    });
  };

  const handleResetForm = () => {
    setSelectedTool(null);
    reset({
      name: "",
      description: "",
      iconName: "Sparkles",
      colorClass: "#EF4444",
      category: "Core",
      path: ""
    });
  };

  const onSubmit = (data: Omit<ToolItem, "id">) => {
    if (selectedTool) {
      updateMutation.mutate({ id: selectedTool.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Up-Down reordering handlers
  const handleReorder = async (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= tools.length) return;

    // Mutate internal state order arrays
    const newOrder = [...tools];
    const temp = newOrder[currentIndex];
    newOrder[currentIndex] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    // Direct frontend-only order preservation toast or dispatch
    queryClient.setQueryData(["adminToolsQuery"], newOrder);
    toast.success("Platform layout indexing rearranged locally.");
  };

  const selectedIcon = watch("iconName");
  const watchColor = watch("colorClass");

  const filteredIcons = ICON_POOL.filter(i => i.toLowerCase().includes(iconSearch.toLowerCase()));

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
          <span className="text-xs font-semibold text-gray-400 font-mono tracking-widest uppercase">Initializing modules grid...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="font-display font-black text-2xl tracking-tight text-white uppercase">WORKSPACE ENGINES</h1>
        <p className="text-gray-450 text-xs font-semibold uppercase font-mono mt-1">Configure live conversational widgets & module handshakes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* LEFT PANEL: 60% Width Tools lists */}
        <div className="lg:col-span-3 bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl p-5 space-y-4">
          <div className="flex justify-between items-center select-none">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Active Core Services ({tools.length})</h3>
            <button
              onClick={handleResetForm}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-650 hover:bg-red-750 text-[10px] font-bold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Provision Tool</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {tools.map((tool, idx) => {
              const IconComp = getLucideIcon(tool.iconName);
              const isSelected = selectedTool?.id === tool.id;
              
              return (
                <div
                  key={tool.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 select-none ${
                    isSelected 
                      ? "bg-slate-900 border-red-500/50" 
                      : "bg-[#060914] border-[#131B2F] hover:border-slate-800"
                  }`}
                >
                  <div 
                    onClick={() => handleSelectTool(tool)}
                    className="flex-1 flex items-center gap-4 cursor-pointer min-w-0"
                  >
                    {/* Glowing colored icon frame */}
                    <div 
                      className="p-3 rounded-xl border border-opacity-30 shrink-0 text-white"
                      style={{ 
                        backgroundColor: `${tool.colorClass}1A`, 
                        borderColor: tool.colorClass,
                        color: tool.colorClass 
                      }}
                    >
                      <IconComp className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1 leading-tight space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-[#F8FAFC] text-xs">{tool.name}</h4>
                        <span className="px-2 py-0.5 border border-[#1A263D] bg-[#0A0F1D] text-[9px] font-black font-mono tracking-widest text-slate-400 rounded uppercase">
                          {tool.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-semibold truncate pr-3">{tool.description}</p>
                    </div>
                  </div>

                  {/* Actions buttons and layout reordering handles */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReorder(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 bg-[#0C1224] hover:bg-[#1C2542] disabled:opacity-20 text-gray-450 hover:text-white rounded border border-[#131D33] transition-all cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleReorder(idx, "down")}
                      disabled={idx === tools.length - 1}
                      className="p-1.5 bg-[#0C1224] hover:bg-[#1C2542] disabled:opacity-20 text-gray-450 hover:text-white rounded border border-[#131D33] transition-all cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you positive you wish to dismantle this module?")) {
                          deleteMutation.mutate(tool.id);
                        }
                      }}
                      className="p-1.5 bg-red-950/20 text-red-500 hover:bg-red-650 hover:text-white border border-red-500/20 rounded transition-all cursor-pointer ml-1"
                      title="Dismantle Engine"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {tools.length === 0 && (
              <div className="py-12 border border-dashed border-[#16213B] rounded-2xl text-center text-xs font-semibold text-gray-500 font-mono uppercase tracking-widest">
                No active operational workspace matrices loaded.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: 40% Width Form management values */}
        <div className="lg:col-span-2 bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl p-5 space-y-4">
          <div className="border-b border-[#111A30] pb-3 select-none flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">
                {selectedTool ? "Dismantle or Edit parameters" : "Provision New Matrix"}
              </h3>
              <p className="text-[10px] text-gray-450 font-semibold font-mono uppercase mt-0.5">Parameters validations required</p>
            </div>
            {selectedTool && (
              <button
                onClick={handleResetForm}
                className="text-gray-450 hover:text-white text-xs font-bold font-mono uppercase flex items-center gap-1 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-semibold">
            {/* Tool Name */}
            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                System Name (2-50 chars)
              </label>
              <input
                type="text"
                {...register("name", { required: "Name is a required matrix identity", minLength: 2, maxLength: 50 })}
                placeholder="AI Synthesis Kernel"
                className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-mono"
              />
              {errors.name && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors.name.message}</p>}
            </div>

            {/* Path / Slug */}
            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                Launch Path (slug, kebab-case)
              </label>
              <input
                type="text"
                {...register("path", { required: true })}
                placeholder="ai-synthesis-kernel"
                className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-mono"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                Platform description [10-200 Words]
              </label>
              <textarea
                rows={3}
                {...register("description", { required: true, minLength: 10, maxLength: 200 })}
                placeholder="Generative cinematic prompts engine mapped across distributed deep diffusion meshes..."
                className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all line-clamp-3 leading-relaxed"
              />
              {errors.description && <p className="text-red-400 text-[10px] mt-1 font-mono">Length requirement not achieved (10 to 200 characters).</p>}
            </div>

            {/* Predefined Categories */}
            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                Index Category
              </label>
              <select
                {...register("category", { required: true })}
                className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all uppercase font-semibold"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Row with Color & Icon triggers */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Icon Picker display */}
              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                  Engine Visual Icon
                </label>
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white hover:border-slate-800 transition-all font-semibold uppercase cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {React.createElement(getLucideIcon(selectedIcon), { className: "h-4 w-4 text-red-500" })}
                    <span>{selectedIcon}</span>
                  </span>
                  <span>Picker</span>
                </button>
              </div>

              {/* Color Picker clicker */}
              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                  Accent Color
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white hover:border-slate-800 transition-all cursor-pointer font-mono"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border border-slate-700 inline-block" style={{ backgroundColor: watchColor }} />
                      <span>{watchColor}</span>
                    </span>
                    <span>Picker</span>
                  </button>

                  {showColorPicker && (
                    <div className="absolute top-12 left-0 right-0 z-50 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col items-center">
                      <Controller
                        name="colorClass"
                        control={control}
                        render={({ field }) => (
                          <HexColorPicker color={field.value} onChange={field.onChange} />
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(false)}
                        className="mt-3 w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold uppercase rounded-lg cursor-pointer text-white"
                      >
                        Preserve Choice
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Actions Submit / Sync */}
            <div className="pt-4 flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-650 hover:bg-red-750 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-650/10"
              >
                <Save className="h-4 w-4" />
                <span>{selectedTool ? "Apply code changes" : "Provision live module"}</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* SEARCHABLE ICON SELECTOR MODAL DRAWER */}
      {isIconPickerOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#090D1A] border border-[#162138] rounded-2xl shadow-2xl p-5 space-y-4 animate-scale-in">
            <div className="flex justify-between items-center select-none">
              <h4 className="font-display font-black text-xs text-white uppercase tracking-widest font-mono">Select Lucide Matrix Icon</h4>
              <button
                onClick={() => setIsIconPickerOpen(false)}
                className="h-7 w-7 rounded-md bg-[#000]/10 flex items-center justify-center text-gray-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search standard Lucide vector keys..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none text-left"
              />
            </div>

            <div className="grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1.5 bg-[#060914] rounded-xl border border-[#131B2F] scrollbar-none">
              {filteredIcons.map(iconKey => {
                const IconOption = getLucideIcon(iconKey);
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => {
                      setValue("iconName", iconKey);
                      setIsIconPickerOpen(false);
                    }}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer select-none ${
                      selectedIcon === iconKey 
                        ? "border-red-500 bg-red-950/20 text-red-400" 
                        : "border-[#1A263F] hover:border-slate-700 hover:bg-slate-900 text-slate-400"
                    }`}
                  >
                    <IconOption className="h-5 w-5" />
                    <span className="text-[9px] font-mono font-bold truncate max-w-full">{iconKey}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
