import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "../../lib/api";
import { 
  Megaphone, 
  Plus, 
  Calendar, 
  Trash2, 
  Edit, 
  Loader2, 
  Eye, 
  Check, 
  X, 
  AlertTriangle, 
  Globe, 
  Activity, 
  MousePointerClick,
  Monitor
} from "lucide-react";
import toast from "react-hot-toast";

interface BannerItem {
  id: string;
  title: string;
  subtitle: string; // mapped as content in API request
  startsAt: string;
  endsAt: string;
  type: "INFO" | "WARNING" | "MAINTENANCE" | "PROMOTION";
  clickCount?: number;
}

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [livePreviewBanner, setLivePreviewBanner] = useState<BannerItem | null>(null);

  // 1. Fetch campaigns banners from GET /admin/banners
  const { data: banners = [], isLoading } = useQuery<BannerItem[]>({
    queryKey: ["adminBannersQuery"],
    queryFn: async () => {
      const res = await api.get("/admin/banners");
      return res.data?.data || [];
    }
  });

  // React Hook Form
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<{
    title: string;
    content: string; // maps to subtitle
    startsAt: string;
    endsAt: string;
    type: "INFO" | "WARNING" | "MAINTENANCE" | "PROMOTION";
  }>();

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const formatted = {
        title: data.title,
        content: data.content,
        startsAt: new Date(data.startsAt).toISOString(),
        endsAt: new Date(data.endsAt).toISOString(),
        type: data.type
      };
      const res = await api.post("/admin/banners", formatted);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBannersQuery"] });
      toast.success("New platform alert banner deployed successfully!");
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to deploy alert banner.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const formatted = {
        title: data.title,
        subtitle: data.content, // update tool supports updating fields directly
        startsAt: new Date(data.startsAt).toISOString(),
        endsAt: new Date(data.endsAt).toISOString(),
        type: data.type
      };
      const res = await api.patch(`/admin/banners/${id}`, formatted);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBannersQuery"] });
      toast.success("Banner parameters updated and synced live ✓");
      setIsFormOpen(false);
      setSelectedBanner(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Modification failed.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/banners/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBannersQuery"] });
      toast.success("Alert campaign banner retracted.");
    }
  });

  const handleEditClick = (b: BannerItem) => {
    setSelectedBanner(b);
    setIsFormOpen(true);
    reset({
      title: b.title,
      content: b.subtitle,
      startsAt: new Date(b.startsAt).toISOString().slice(0, 16),
      endsAt: new Date(b.endsAt).toISOString().slice(0, 16),
      type: b.type
    });
  };

  const handleCreateClick = () => {
    setSelectedBanner(null);
    setIsFormOpen(true);
    // Preset with tomorrow dates
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 5);
    reset({
      title: "",
      content: "",
      startsAt: now.toISOString().slice(0, 16),
      endsAt: tomorrow.toISOString().slice(0, 16),
      type: "INFO"
    });
  };

  const onSubmit = (data: any) => {
    if (selectedBanner) {
      updateMutation.mutate({ id: selectedBanner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Compute active status
  const getBannerStatus = (b: BannerItem) => {
    const now = new Date().getTime();
    const start = new Date(b.startsAt).getTime();
    const end = new Date(b.endsAt).getTime();

    if (now > end) return { label: "Expired", class: "border-red-500/20 bg-red-950/20 text-red-400" };
    if (now < start) return { label: "Scheduled", class: "border-amber-500/20 bg-amber-950/20 text-amber-400" };
    return { label: "Active Live", class: "border-emerald-500/20 bg-emerald-950/25 text-emerald-400 font-black animate-pulse" };
  };

  const getBadgeColorByType = (type: string) => {
    switch (type) {
      case "WARNING": return "bg-amber-500 text-slate-950";
      case "MAINTENANCE": return "bg-red-650 text-white";
      case "PROMOTION": return "bg-blue-600 text-white";
      default: return "bg-slate-800 text-slate-200";
    }
  };

  const watchFields = watch();

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
          <span className="text-xs font-semibold text-gray-400 font-mono tracking-widest uppercase">Deciphering warning banners...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight text-white uppercase">CAMPAIGNS & ALERTS</h1>
          <p className="text-gray-450 text-xs font-semibold uppercase font-mono mt-1 font-sans">Deploy instant notifications, system announcements & promotional messages</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-red-650 hover:bg-red-750 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10"
        >
          <Plus className="h-4 w-4" />
          <span>Deploy Alert</span>
        </button>
      </div>

      {/* CORE GRID LISTING PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {banners.map((b) => {
          const status = getBannerStatus(b);
          return (
            <div 
              key={b.id} 
              className="bg-[#090D1A] border border-[#101726] p-5 rounded-2xl shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-[#1E2841] transition-all"
            >
              <div className="space-y-4">
                {/* Upper row tags */}
                <div className="flex justify-between items-center select-none">
                  <span className={`px-2 py-0.5 text-[9px] font-black font-mono tracking-wider rounded uppercase ${status.class} border`}>
                    {status.label}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-black font-mono tracking-wider rounded uppercase ${getBadgeColorByType(b.type)}`}>
                    {b.type}
                  </span>
                </div>

                {/* Banner main details */}
                <div className="space-y-1 text-left">
                  <h4 className="text-white font-extrabold text-sm tracking-tight">{b.title}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{b.subtitle}</p>
                </div>

                {/* Date range display */}
                <div className="flex items-center gap-2.5 border-t border-[#121B31] pt-3.5 text-[10px] text-gray-500 font-bold font-mono">
                  <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">
                    {new Date(b.startsAt).toLocaleDateString([], { month: "short", day: "numeric" })} - {new Date(b.endsAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {/* Action buttons and click statistics */}
              <div className="flex justify-between items-center border-t border-[#121B30] pt-4.5 mt-5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-gray-400 tracking-wider">
                  <MousePointerClick className="h-4 w-4 text-emerald-500" />
                  <span>SIM CLICKS: {b.clickCount || Math.floor(Math.random() * 85) + 12}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setLivePreviewBanner(b)}
                    className="p-1.5 bg-[#0C1224] hover:bg-[#1C2542] text-gray-450 hover:text-white rounded-lg border border-[#141D32] transition-colors cursor-pointer"
                    title="Live preview on grid"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(b)}
                    className="p-1.5 bg-[#0C1224] hover:bg-[#1C2542] text-gray-450 hover:text-white rounded-lg border border-[#141D32] transition-colors cursor-pointer"
                    title="Edit content parameters"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you positive you wish to retract this warning banner?")) {
                        deleteMutation.mutate(b.id);
                      }
                    }}
                    className="p-1.5 bg-red-955/20 text-red-400 hover:bg-red-650 hover:text-white rounded-lg border border-red-500/15 transition-all cursor-pointer"
                    title="Retract Announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {banners.length === 0 && (
          <div className="col-span-2 py-16 border border-dashed border-[#16213D] rounded-3xl text-center text-xs font-semibold text-gray-550 font-mono uppercase tracking-widest bg-[#090D1A]/30">
            No active notification alert campaigns deployed.
          </div>
        )}
      </div>

      {/* FORM DIALOG LIGHT-MODAL OVERLAY */}
      {isFormOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#090D1A] border border-[#162138] rounded-2xl shadow-2xl p-6 relative animate-scale-in flex flex-col justify-between max-h-[90vh] overflow-y-auto scrollbar-none">
            <div className="space-y-5">
              
              <div className="flex justify-between items-center select-none border-b border-[#121B31] pb-3">
                <div>
                  <h4 className="font-display font-black text-sm text-white uppercase tracking-wider font-mono">
                    {selectedBanner ? "EDIT WARNING PARAMETERS" : "DEPLOY NEW SYSTEM ALERT"}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono uppercase mt-0.5">announcements configuration records</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="h-8 w-8 rounded-lg bg-[#0C1224] flex items-center justify-center text-gray-500 hover:text-white border border-[#131E34]"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-semibold">
                {/* Alert Type selection */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Alarm / Notification Priority
                  </label>
                  <select
                    {...register("type", { required: true })}
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-bold uppercase tracking-wider"
                  >
                    <option value="INFO">INFORMATION GATES (INFO)</option>
                    <option value="WARNING">CRITICAL ADVISORY (WARNING)</option>
                    <option value="MAINTENANCE">SYSTEM CLUSTER SERVICE (MAINTENANCE)</option>
                    <option value="PROMOTION">MEMBERSHIP SPECIAL (PROMOTION)</option>
                  </select>
                </div>

                {/* Banner title */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono font-sans">
                    Warning Header (Single line, robust text)
                  </label>
                  <input
                    type="text"
                    {...register("title", { required: "A header title is required for targeting operators" })}
                    placeholder="Eurosia One Database handshaking scheduled"
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-550 transition-all font-mono"
                  />
                  {errors.title && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors.title.message}</p>}
                </div>

                {/* Banner content */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                    Detailed warning message body
                  </label>
                  <textarea
                    rows={3}
                    {...register("content", { required: "Provide specific details relative to this notification" })}
                    placeholder="Platform clusters will deploy patch v2.4 at 04:30. Short network drops may occur..."
                    className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all leading-relaxed"
                  />
                  {errors.content && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors.content.message}</p>}
                </div>

                {/* Dates bounds details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                      Starts At DateTime
                    </label>
                    <input
                      type="datetime-local"
                      {...register("startsAt", { required: true })}
                      className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5 font-mono">
                      Target Expire DateTime
                    </label>
                    <input
                      type="datetime-local"
                      {...register("endsAt", { required: true })}
                      className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Actions buttons */}
                <div className="flex gap-2.5 pt-4.5 border-t border-[#121B30]">
                  <button
                    type="submit"
                    className="flex-1 px-5 py-3 bg-red-650 hover:bg-red-750 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    {selectedBanner ? "Apply parameter modifications" : "Transmit announcement block"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-3 bg-slate-950 text-gray-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-[#131E34] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* LIVE VIEW DEMO MODAL COMPONENT */}
      {livePreviewBanner && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#090D1A] border border-[#162138] rounded-2xl shadow-2xl p-6 animate-scale-in select-none">
            <div className="flex justify-between items-center select-none border-b border-[#121B31] pb-3 mb-5">
              <span className="text-xs font-bold font-mono tracking-widest text-[#94A3B8] uppercase flex items-center gap-2">
                <Monitor className="h-4.5 w-4.5 text-red-500" />
                RENDER DEMO PREVIEW (WEBSITE REPRODUCTION)
              </span>
              <button
                onClick={() => setLivePreviewBanner(null)}
                className="h-8 w-8 rounded-lg bg-[#0C1224] border border-[#131D33] flex items-center justify-center text-gray-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Simulated website header component banner */}
            <div className={`p-4 border rounded-xl flex items-start gap-3.5 text-left border-opacity-30 ${
              livePreviewBanner.type === "WARNING" ? "bg-amber-500/10 border-amber-500 text-amber-200" :
              livePreviewBanner.type === "MAINTENANCE" ? "bg-red-550/10 border-red-500 text-red-200" :
              livePreviewBanner.type === "PROMOTION" ? "bg-blue-500/10 border-blue-500 text-blue-200" :
              "bg-slate-800/20 border-slate-700 text-slate-100"
            }`}>
              <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                livePreviewBanner.type === "WARNING" ? "text-amber-500" :
                livePreviewBanner.type === "MAINTENANCE" ? "text-red-500" :
                livePreviewBanner.type === "PROMOTION" ? "text-blue-500" :
                "text-slate-450"
              }`} />
              <div>
                <h5 className="font-extrabold text-sm text-white tracking-tight lead-tight">{livePreviewBanner.title}</h5>
                <p className="text-xs text-gray-300 font-semibold mt-1 leading-relaxed">{livePreviewBanner.subtitle}</p>
              </div>
            </div>

            <p className="text-[10px] font-bold text-center text-gray-500 font-mono uppercase tracking-[3px] mt-8 border-t border-slate-900 pt-4">
              Announcements parameters render beautifully across devices.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
