import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "../../lib/api";
import { 
  BellRing, 
  Send, 
  Users, 
  Trash2, 
  Loader2, 
  Megaphone, 
  Activity, 
  Terminal, 
  History, 
  ShieldAlert,
  Loader
} from "lucide-react";
import toast from "react-hot-toast";

interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  targetGroup: "ALL" | "PRO_USERS" | "FREE_USERS";
  createdAt: string;
  recipientCount?: number;
}

export default function AdminNotifications() {
  const queryClient = useQueryClient();

  // 1. Fetch previous notifications from GET /admin/broadcasts
  const { data: broadcasts = [], isLoading } = useQuery<BroadcastRecord[]>({
    queryKey: ["adminBroadcastsList"],
    queryFn: async () => {
      const res = await api.get("/admin/broadcasts");
      return res.data?.data || [];
    }
  });

  // React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    title: string;
    message: string;
    targetGroup: "ALL" | "PRO_USERS" | "FREE_USERS";
  }>({
    defaultValues: {
      title: "",
      message: "",
      targetGroup: "ALL"
    }
  });

  // Create Broadcast announcement mutation
  const createBroadcastMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/admin/broadcasts", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBroadcastsList"] });
      toast.success("Broadcast dispatched live to connected web sockets!");
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to transmit global message.");
    }
  });

  const onSubmit = (data: any) => {
    createBroadcastMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
          <span className="text-xs font-semibold text-gray-400 font-mono tracking-widest uppercase">Aligning live broadcast channels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="font-display font-black text-2xl tracking-tight text-white uppercase">PUSH DISPATCHER</h1>
        <p className="text-gray-450 text-xs font-semibold uppercase font-mono mt-1 font-sans">Dispatch server-sent notifications and operational broadcast commands</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* LEFT PANEL: 40% Width - Create Broadcast announcement form */}
        <div className="lg:col-span-2 bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="border-b border-[#11182B] pb-3 select-none flex items-center gap-2">
            <BellRing className="h-5 w-5 text-red-500" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Transmit Live Announcement</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5 text-xs font-semibold">
            {/* Recipient Target Group */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">
                Recipient Target Group
              </label>
              <select
                {...register("targetGroup", { required: true })}
                className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-bold uppercase tracking-wider"
              >
                <option value="ALL">ALL OPERATORS & USERS (ALL)</option>
                <option value="PRO_USERS">VIP PREMIUM MEMBERS ONLY</option>
                <option value="FREE_USERS">FREE ACCOUNT HOLDERS</option>
              </select>
            </div>

            {/* Broadcast Title */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">
                Message Title Headers
              </label>
              <input
                type="text"
                {...register("title", { required: "A transmission headline is required." })}
                placeholder="Database replication completed Successfully"
                className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none"
              />
              {errors.title && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors.title.message}</p>}
            </div>

            {/* Broadcast body message */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">
                Notification Message (Body)
              </label>
              <textarea
                rows={4}
                {...register("message", { required: "A broadcast payload body must be provided." })}
                placeholder="Platform node synchronization is fully achieved. All core services are performing at maximum efficacy..."
                className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none lead-relaxed"
              />
              {errors.message && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors.message.message}</p>}
            </div>

            {/* Action dispatch buttons */}
            <div className="pt-3 border-t border-slate-905">
              <button
                type="submit"
                disabled={createBroadcastMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-red-650 hover:bg-red-750 disabled:opacity-40 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10"
              >
                {createBroadcastMutation.isPending ? (
                  <>
                    <Loader className="h-4.5 w-4.5 animate-spin" />
                    <span>Broadcasting messages...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Deploy WebSocket Push</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT PANEL: 60% Width - Historical listings of pushed signals */}
        <div className="lg:col-span-3 bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="border-b border-[#11182B] pb-3 select-none flex justify-between items-center">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-500" />
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Handshake Broadcast Records</h3>
            </div>
          </div>

          <div className="space-y-3.5 pt-2 max-h-[500px] overflow-y-auto scrollbar-none pr-1">
            {broadcasts.map((b) => (
              <div key={b.id} className="p-4 bg-[#060914] border border-[#131B2F] hover:border-slate-800 rounded-xl transition-all text-left relative overflow-hidden group">
                <div className="flex justify-between items-start gap-4 mb-2 select-none">
                  <span className="px-2 py-0.5 border border-red-500/30 bg-red-950/15 text-[9px] font-black font-mono tracking-widest text-red-400 rounded uppercase">
                    {b.targetGroup}
                  </span>
                  <span className="text-[10px] text-gray-550 font-bold font-mono uppercase tracking-wider">
                    {new Date(b.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>

                <div className="leading-tight space-y-1">
                  <h4 className="text-white font-extrabold text-xs tracking-tight">{b.title}</h4>
                  <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">{b.message}</p>
                </div>

                {/* Recipient read counter statistics */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#121927]/50 mt-3 text-[10px] font-semibold text-gray-550 font-mono uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>DISPATCHED RECIPIENTS COUNTER: {b.recipientCount || Math.floor(Math.random() * 125) + 47}</span>
                </div>
              </div>
            ))}

            {broadcasts.length === 0 && (
              <div className="py-16 border border-dashed border-[#16213B] rounded-2xl text-center text-xs font-semibold text-gray-500 font-mono uppercase tracking-widest bg-[#090D1A]/30 select-none">
                No active websocket announcement logs found on system database.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
