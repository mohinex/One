import React, { useState } from "react";
import { 
  Database, 
  Search, 
  Eye, 
  X, 
  Terminal, 
  ShieldAlert, 
  FileCode, 
  ChevronRight, 
  Clock, 
  Globe, 
  UserSquare2 
} from "lucide-react";
import toast from "react-hot-toast";

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  email: string;
  ip: string;
  timestamp: string;
  payloadBefore: any;
  payloadAfter: any;
}

export default function AdminAudit() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const auditLogs: AuditLog[] = [
    { 
      id: "AUD-901842", 
      action: "USER_REVOKED", 
      actor: "Architect Eurosia", 
      email: "architect@eurosia.one", 
      ip: "185.190.140.23", 
      timestamp: "2026-06-22 15:44:12",
      payloadBefore: { id: "USR-09281", name: "Spammer Jack", isActive: true },
      payloadAfter: { id: "USR-09281", name: "Spammer Jack", isActive: false, restrictedReason: "Unusual pipeline load" }
    },
    { 
      id: "AUD-901843", 
      action: "SETTINGS_UPDATED", 
      actor: "Operator Mark", 
      email: "mark@eurosia.one", 
      ip: "93.184.216.34", 
      timestamp: "2026-06-22 14:15:02",
      payloadBefore: { geminiModelDefault: "gemini-1.5-pro", aiTemperature: "0.5" },
      payloadAfter: { geminiModelDefault: "gemini-2.5-pro", aiTemperature: "0.7" }
    },
    { 
      id: "AUD-901844", 
      action: "TOOL_CREATED", 
      actor: "Architect Eurosia", 
      email: "architect@eurosia.one", 
      ip: "185.190.140.23", 
      timestamp: "2026-06-21 18:22:35",
      payloadBefore: {},
      payloadAfter: { name: "Speech Synthesizer", path: "speech-synthesis", category: "Core", requiredPlan: "free" }
    },
    { 
      id: "AUD-901845", 
      action: "AUTHENTICATOR_VERIFY", 
      actor: "SysAdmin Julia", 
      email: "julia@eurosia.one", 
      ip: "172.56.21.89", 
      timestamp: "2026-06-21 11:02:18",
      payloadBefore: { mfaEnabled: false },
      payloadAfter: { mfaEnabled: true, verifiedStatus: "ESTABLISHED" }
    }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left relative min-h-full">
      <div>
        <h1 className="font-display font-black text-2xl tracking-tight text-white uppercase">SECURITY AUDITS</h1>
        <p className="text-gray-450 text-xs font-semibold uppercase font-mono mt-1 font-sans">Terminal access records, actions tracking logs & cryptographic state modifications</p>
      </div>

      {/* FILTER SEARCH TOOL BAR */}
      <div className="bg-[#090D1A] border border-[#101726]/80 p-4 rounded-xl flex flex-col sm:flex-row gap-4.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search action matrices by key or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none"
          />
        </div>
        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#060914] border border-[#161F33] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-bold uppercase tracking-wider font-mono cursor-pointer"
          >
            <option value="ALL">All Operations logs</option>
            <option value="USER_REVOKED">Clearances Revocations</option>
            <option value="SETTINGS_UPDATED">Registries changes</option>
            <option value="TOOL_CREATED">Workspace Provisions</option>
            <option value="AUTHENTICATOR_VERIFY">Security (Totp Verify)</option>
          </select>
        </div>
      </div>

      {/* MAIN AUDIT LEDGER TABLE */}
      <div className="bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#121B30] text-[10px] font-bold uppercase tracking-widest text-gray-450 font-mono bg-[#070B15]">
                <th className="py-4 px-5">Hash ID</th>
                <th className="py-4 px-3">Operational Signal</th>
                <th className="py-4 px-3">Security Actor</th>
                <th className="py-4 px-3">Operator IP Address</th>
                <th className="py-4 px-3">Handshake Timestamp</th>
                <th className="py-4 px-3 text-right pr-6">Audits Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101726]/40">
              {filteredLogs.map(log => (
                <tr key={log.id} className="text-xs hover:bg-[#111626]/20 transition-all">
                  <td className="py-4 px-5 font-mono text-[10px] font-bold text-gray-450">{log.id}</td>
                  <td className="py-4 px-3">
                    <span className={`px-2 py-0.5 border text-[10px] font-bold font-mono tracking-wider rounded uppercase ${
                      log.action === "USER_REVOKED" ? "border-red-500/30 bg-red-950/15 text-red-400" :
                      log.action === "AUTHENTICATOR_VERIFY" ? "border-emerald-500/30 bg-emerald-950/15 text-emerald-400" :
                      "border-slate-800 bg-slate-900 text-slate-300"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <div className="leading-tight">
                      <p className="font-bold text-white">{log.actor}</p>
                      <p className="text-[10px] text-gray-400 font-bold font-mono mt-0.5">{log.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-3 font-mono font-bold text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-slate-500" />
                      <span>{log.ip}</span>
                    </span>
                  </td>
                  <td className="py-4 px-3 font-mono font-bold text-gray-450">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{log.timestamp}</span>
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right pr-6">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 bg-[#0C1224] hover:bg-[#1C2542] text-gray-400 hover:text-white rounded-lg border border-[#131D33] transition-colors cursor-pointer"
                      title="Inspect ledger JSON"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON DIFF DRAWER COMPONENT */}
      {selectedLog && (
        <div className="fixed inset-0 z-55 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#090D1A] h-full border-l border-[#101726] shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden animate-slide-left">
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#121B30] pb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-red-500" />
                  <h4 className="font-display font-black text-sm tracking-widest text-white uppercase font-mono">INSULATION REGISTER ANALYZER</h4>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="h-8 w-8 rounded-lg bg-[#0C1224] flex items-center justify-center text-gray-500 hover:text-white border border-[#131E34]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* General Metadata Info block */}
              <div className="p-4 bg-[#060914] border border-[#131E30] rounded-xl flex justify-between items-center text-xs font-mono select-none">
                <span className="text-gray-450 font-bold uppercase">LEDGER: {selectedLog.id}</span>
                <span className="text-red-500 font-extrabold">{selectedLog.action}</span>
              </div>

              {/* JSON before & after view stage */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 scrollbar-none">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono select-none">Registry state before [Payload]</span>
                  <pre className="p-3.5 bg-black rounded-xl border border-slate-900 text-[10px] font-mono text-amber-500 overflow-x-auto text-left leading-relaxed">
                    {JSON.stringify(selectedLog.payloadBefore, null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono select-none">Registry state altered [Payload]</span>
                  <pre className="p-3.5 bg-black rounded-xl border border-slate-900 text-[10px] font-mono text-emerald-400 overflow-x-auto text-left leading-relaxed">
                    {JSON.stringify(selectedLog.payloadAfter, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-center text-gray-550 font-mono font-bold uppercase tracking-widest mt-6 border-t border-slate-900 pt-4 select-none">
              Secures audits logs are immutable in decentralized environment.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
