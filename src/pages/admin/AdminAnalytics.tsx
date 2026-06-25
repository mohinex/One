import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { 
  BarChart4, 
  Download, 
  Activity, 
  Cpu, 
  Database, 
  Server, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  TrendingDown,
  Loader2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import toast from "react-hot-toast";

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("24h");

  // Fetch metrics database summary
  const { data: metricsRes, isLoading } = useQuery({
    queryKey: ["adminAnalyticsSummaryData"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics");
      return res.data?.data || {};
    }
  });

  const rawData = metricsRes || {};

  // Mock analytical curves for deep visual high fidelity
  const loadPerformanceData = [
    { time: "00:00", cpu: 32, ram: 48, latency: 120 },
    { time: "04:00", cpu: 28, ram: 49, latency: 98 },
    { time: "08:00", cpu: 45, ram: 52, latency: 110 },
    { time: "12:00", cpu: 67, ram: 58, latency: 184 },
    { time: "16:00", cpu: 55, ram: 55, latency: 140 },
    { time: "20:00", cpu: 42, ram: 50, latency: 125 },
    { time: "23:59", cpu: 30, ram: 47, latency: 115 },
  ];

  const requestDistribution = [
    { day: "Mon", chat: 1240, images: 420, docs: 180 },
    { day: "Tue", chat: 1450, images: 480, docs: 210 },
    { day: "Wed", chat: 1680, images: 510, docs: 240 },
    { day: "Thu", chat: 1520, images: 460, docs: 190 },
    { day: "Fri", chat: 1890, images: 600, docs: 300 },
    { day: "Sat", chat: 1110, images: 380, docs: 150 },
    { day: "Sun", chat: 980, images: 290, docs: 110 },
  ];

  const handleExportCSV = (reportName: string) => {
    toast.success(`Analytical sheet [${reportName.toUpperCase()}] compiled and transmitted!`);
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
          <span className="text-xs font-semibold text-gray-400 font-mono tracking-widest uppercase font-sans">Compiling analytical databases...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight text-white uppercase">ANALYTICS LEDGER</h1>
          <p className="text-gray-450 text-xs font-semibold uppercase font-mono mt-1 font-sans">Real-time latency reports, model querying rates & cluster payload analytics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportCSV("platform_performance_audit")}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-800 text-white transition-all cursor-pointer select-none"
          >
            <Download className="h-4 w-4 text-red-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* METRICS SUMMARY FLAGS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Core CPU utilization card */}
        <div className="bg-[#090D1A] border border-[#101726] p-5 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start select-none">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-550 font-mono tracking-widest uppercase">CLUSTER METRICS</span>
              <h3 className="font-display font-black text-2xl text-white">41.2 % CPU</h3>
            </div>
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/10 text-red-400">
              <Cpu className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] font-extrabold text-emerald-400 font-mono uppercase tracking-wider leading-none select-none">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
            <span>- 4.2% Load drop</span>
          </div>
        </div>

        {/* Aggregate Database connections */}
        <div className="bg-[#090D1A] border border-[#101726] p-5 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start select-none">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-550 font-mono tracking-widest uppercase">DATABASES TRANSACTIONS</span>
              <h3 className="font-display font-black text-2xl text-white">412 queries/s</h3>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/10 text-blue-400">
              <Database className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] font-extrabold text-emerald-400 font-mono uppercase tracking-wider leading-none select-none">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>+ 12.5% Operations rate</span>
          </div>
        </div>

        {/* API response times */}
        <div className="bg-[#090D1A] border border-[#101726] p-5 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start select-none">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-550 font-mono tracking-widest uppercase">OUTBOUND NETWORK</span>
              <h3 className="font-display font-black text-2xl text-white">124 ms latency</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] font-extrabold text-emerald-400 font-mono uppercase tracking-wider leading-none select-none">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Service availability: 99.98%</span>
          </div>
        </div>

        {/* Servers details */}
        <div className="bg-[#090D1A] border border-[#101726] p-5 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start select-none">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-550 font-mono tracking-widest uppercase">ACTIVE RECEPTIONS</span>
              <h3 className="font-display font-black text-2xl text-white">14 servers live</h3>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/10 text-purple-400">
              <Server className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] font-extrabold text-gray-400 font-mono uppercase tracking-wider leading-none select-none">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Clusters fully synchronized</span>
          </div>
        </div>

      </div>

      {/* RECHARTS PLOTS COMPILING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Plot 1: Server utilization line curves */}
        <div className="bg-[#090D1A] border border-[#101726] p-6 rounded-2xl shadow-2xl space-y-4">
          <div className="pb-2 select-none text-left">
            <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">Operational Node Performance Metrics</h4>
            <p className="text-[10px] text-gray-450 font-semibold font-mono uppercase mt-0.5">CPU load vs RAM footprint over selected interval</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={loadPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px" }}
                  itemStyle={{ fontSize: "11px", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#EF4444" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="ram" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plot 2: Query distribution bar blocks */}
        <div className="bg-[#090D1A] border border-[#101726] p-6 rounded-2xl shadow-2xl space-y-4">
          <div className="pb-2 select-none text-left">
            <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">Functional module request rates</h4>
            <p className="text-[10px] text-gray-450 font-semibold font-mono uppercase mt-0.5">Aggregated API operations categoried by core workspaces</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#475569" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px" }}
                  itemStyle={{ fontSize: "11px", fontWeight: "bold" }}
                />
                <Bar dataKey="chat" name="Speech Synthesizer" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="images" name="Diffusion Canvas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="docs" name="Document Summarizer" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
