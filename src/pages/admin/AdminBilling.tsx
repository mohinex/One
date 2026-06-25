import React, { useState } from "react";
import { 
  CreditCard, 
  RefreshCw, 
  Download, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  ExternalLink,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";

interface TransactionItem {
  id: string;
  user: string;
  email: string;
  plan: string;
  amount: string;
  status: "succeeded" | "failed" | "refunded";
  date: string;
}

export default function AdminBilling() {
  const [stripeSyncing, setStripeSyncing] = useState(false);
  const [search, setSearch] = useState("");

  const transactions: TransactionItem[] = [
    { id: "TX-1092842", user: "John Doe", email: "john@doe.com", plan: "Pro Plan", amount: "$19.99", status: "succeeded", date: "2026-06-22 14:32" },
    { id: "TX-1092843", user: "Alice Smith", email: "alice@smith.org", plan: "Premium Plan", amount: "$39.99", status: "succeeded", date: "2026-06-22 11:20" },
    { id: "TX-1092844", user: "Bob Johnson", email: "bob@johnson.net", plan: "Pro Plan", amount: "$19.99", status: "failed", date: "2026-06-21 09:12" },
    { id: "TX-1092845", user: "Clara Oswald", email: "clara@tardis.com", plan: "Pro Plan", amount: "$19.99", status: "succeeded", date: "2026-06-20 18:41" },
    { id: "TX-1092846", user: "David Tennant", email: "david@doctor.co.uk", plan: "Pro Plan", amount: "$19.99", status: "refunded", date: "2026-06-19 15:02" },
  ];

  const handleStripeSync = () => {
    setStripeSyncing(true);
    toast.loading("Synchronizing Stripe webhook metrics on system caches...");
    setTimeout(() => {
      setStripeSyncing(false);
      toast.dismiss();
      toast.success("Stripe databases successfully synchronized ✓");
    }, 1500);
  };

  const handleExportCSV = () => {
    toast.success("Billing spreadsheet compile completed. Downloading...");
  };

  const filteredTx = transactions.filter(tx => 
    tx.user.toLowerCase().includes(search.toLowerCase()) ||
    tx.email.toLowerCase().includes(search.toLowerCase()) ||
    tx.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight text-white uppercase">BILLING CONTROLS</h1>
          <p className="text-gray-450 text-xs font-semibold uppercase font-mono mt-1 font-sans">Sync Stripe subscription metrics, transaction history ledger & manage SaaS membership tiers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleStripeSync}
            disabled={stripeSyncing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-45 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-880 text-white transition-all cursor-pointer select-none"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-500 ${stripeSyncing ? "animate-spin" : ""}`} />
            <span>Sync Stripe Webhooks</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-red-650 hover:bg-red-750 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10 select-none"
          >
            <Download className="h-4 w-4" />
            <span>Financials CSV</span>
          </button>
        </div>
      </div>

      {/* THREE MEMBERSHIP FLAT PLANS DISPLAY GRID */}
      <span className="block text-[10px] font-bold text-gray-500 font-mono uppercase tracking-widest leading-none select-none">MEMBERSHIP PLAN METRIC SETTINGS</span>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* FREE TIER CARD */}
        <div className="bg-[#090D1A] border border-[#101726]/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="px-2.5 py-0.5 border border-[#1B2544] bg-[#0E1528] text-[9px] font-black tracking-widest uppercase font-mono text-blue-400 rounded">FREE LEVEL</span>
              <span className="text-[10px] text-gray-500 font-bold font-mono">Tier 0</span>
            </div>
            <div className="text-left space-y-1">
              <h3 className="font-display font-black text-2xl text-white font-sans">$0<sub className="text-xs text-gray-450 font-normal"> / month</sub></h3>
              <p className="text-gray-400 text-xs leading-relaxed font-semibold">Standard core speed synthesizers limits. Default latencies.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => toast.success("Free Tier limits successfully calibrated.")}
            className="mt-6 w-full py-2 bg-slate-950 hover:bg-slate-900 rounded-xl border border-[#15203D] hover:border-slate-700 text-xs text-gray-300 font-bold font-mono uppercase transition-all cursor-pointer"
          >
            Calibrate Limits
          </button>
        </div>

        {/* PRO PLAN TIER CARD */}
        <div className="bg-[#090D1A] border border-[#101726]/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-red-650 to-red-500" />
          <div className="space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="px-2.5 py-0.5 border border-[#430A0A] bg-[#2E0505] text-[9px] font-black tracking-widest uppercase font-mono text-red-400 rounded">PRO TIER</span>
              <span className="text-[10px] text-red-500 font-bold font-mono">Tier 1</span>
            </div>
            <div className="text-left space-y-1">
              <h3 className="font-display font-black text-2xl text-white font-sans">$19.99<sub className="text-xs text-gray-450 font-normal"> / month</sub></h3>
              <p className="text-gray-400 text-xs leading-relaxed font-semibold">Priority pipeline queues speeds, full diffusion canvas integrations unlocked.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => toast.success("Pro Tier parameters updated in Stripe context.")}
            className="mt-6 w-full py-2 bg-red-650 hover:bg-red-750 rounded-xl text-xs text-white font-bold font-mono uppercase transition-all cursor-pointer shadow-lg shadow-red-500/10"
          >
            Configure Stripe Product
          </button>
        </div>

        {/* PREMIUM DEEP NETWORKS TIER CARD */}
        <div className="bg-[#090D1A] border border-[#101726]/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="px-2.5 py-0.5 border border-purple-500/30 bg-purple-950/15 text-[9px] font-black tracking-widest uppercase font-mono text-purple-400 rounded">PREMIUM TIER</span>
              <span className="text-[10px] text-purple-500 font-bold font-mono">Tier 2</span>
            </div>
            <div className="text-left space-y-1">
              <h3 className="font-display font-black text-2xl text-white font-sans">$39.99<sub className="text-xs text-gray-450 font-normal"> / month</sub></h3>
              <p className="text-gray-400 text-xs leading-relaxed font-semibold">Absolute unlimited cryptographic synthesized runs. Priority premium model links.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => toast.success("Premium Tier configurations verified.")}
            className="mt-6 w-full py-2 bg-slate-950 hover:bg-slate-900 rounded-xl border border-[#15203D] hover:border-slate-700 text-xs text-gray-300 font-bold font-mono uppercase transition-all cursor-pointer"
          >
            Calibrate Limits
          </button>
        </div>

      </div>

      {/* CORE HISTORIC TRANSACTIONAL LEDGER */}
      <div className="bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl overflow-hidden mt-6">
        <div className="p-4.5 border-b border-[#111A30] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest select-none">Historic Subscriptions Receipts</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by transaction ID or mail ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#121B30] text-[10px] font-bold uppercase tracking-widest text-gray-450 font-mono bg-[#070B15]">
                <th className="py-4 px-5">Invoice Reference</th>
                <th className="py-4 px-3">Identity mapping</th>
                <th className="py-4 px-3">Pricing Plan</th>
                <th className="py-4 px-3">Amount</th>
                <th className="py-4 px-3">Transaction Link</th>
                <th className="py-4 px-3">Pushed date</th>
                <th className="py-4 px-3 text-right pr-6">Receipt action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101726]/40">
              {filteredTx.map(tx => (
                <tr key={tx.id} className="text-xs hover:bg-[#111626]/25 transition-all">
                  <td className="py-4 px-5 font-mono text-[10px] font-bold text-gray-400">{tx.id}</td>
                  <td className="py-4 px-3">
                    <div className="leading-tight">
                      <p className="font-bold text-white">{tx.user}</p>
                      <p className="text-[10px] text-gray-400 font-bold font-mono mt-0.5">{tx.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <span className="px-2 py-0.5 border border-[#1B2544] bg-[#0E1528] text-[10px] font-bold font-mono tracking-wider rounded uppercase text-blue-400">
                      {tx.plan}
                    </span>
                  </td>
                  <td className="py-4 px-3 font-mono font-black text-white">{tx.amount}</td>
                  <td className="py-4 px-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase ${
                      tx.status === "succeeded" ? "text-emerald-400" :
                      tx.status === "failed" ? "text-red-400" :
                      "text-amber-500"
                    }`}>
                      {tx.status === "succeeded" ? <CheckCircle className="h-4 w-4 shrink-0" /> :
                       tx.status === "failed" ? <XCircle className="h-4 w-4 shrink-0" /> :
                       <AlertCircle className="h-4 w-4 shrink-0" />}
                      <span>{tx.status}</span>
                    </span>
                  </td>
                  <td className="py-4 px-3 font-mono font-bold text-gray-400">{tx.date}</td>
                  <td className="py-4 px-3 text-right pr-6">
                    <button
                      onClick={() => toast.success(`Receipt compiled for invoice ${tx.id}. PDF download started.`)}
                      className="p-1 px-3 hover:bg-[#1C2542] text-gray-450 hover:text-white rounded border border-[#131E34] text-[10px] font-bold uppercase transition-all cursor-pointer"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
