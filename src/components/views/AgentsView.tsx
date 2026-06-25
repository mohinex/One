import React, { useState } from "react";
import { 
  ArrowLeft, 
  Bot, 
  Play, 
  Square, 
  Terminal, 
  Plus, 
  Cpu, 
  Trash2, 
  TrendingUp, 
  Activity, 
  ListTodo, 
  ArrowRight, 
  Clock 
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  task: string;
  status: "idle" | "running" | "paused";
  model: string;
  totalRuns: number;
  lastRun: string;
}

export default function AgentsView({ onBack }: { onBack: () => void }) {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "ag_1",
      name: "SEO Writer Agent",
      role: "SEO Content Planner",
      task: "Generate high-ranking draft concepts and search keyword maps monthly.",
      status: "running",
      model: "Sonnet 4.6",
      totalRuns: 184,
      lastRun: "3m ago"
    },
    {
      id: "ag_2",
      name: "Schema Auditor Node",
      role: "Database Quality Warden",
      task: "Monitor postgres logs to locate broken transaction calls or database crashes.",
      status: "idle",
      model: "Gemini 3.5 Core",
      totalRuns: 42,
      lastRun: "2h ago"
    },
    {
      id: "ag_3",
      name: "LinkedIn Social Drone",
      role: "Brand Growth Evangelist",
      task: "Gather tech product changes to outline summaries of system releases.",
      status: "paused",
      model: "Gemini 3.5 Flash",
      totalRuns: 95,
      lastRun: "1d ago"
    }
  ]);

  const [agentLogs, setAgentLogs] = useState<string[]>([
    "[SYSTEM] Initiated Eurosia Agent Task loop at host cluster node active.",
    "[SEO Writer Agent] [RUNNING] Scan target search-words completed. Found 12 high-priority keywords.",
    "[Schema Auditor Node] [IDLE] Checked active ports connection: 3000 online.",
    "[LinkedIn Social Drone] [PAUSED] Paused active scheduler. Awaiting manual trigger override."
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [agName, setAgName] = useState("");
  const [agRole, setAgRole] = useState("");
  const [agTask, setAgTask] = useState("");
  const [agModel, setAgModel] = useState("Sonnet 4.6");

  const [activeLogAgent, setActiveLogAgent] = useState<string | null>(null);

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agName.trim() || !agRole.trim() || !agTask.trim()) return;

    const newAgent: Agent = {
      id: `ag_${Date.now()}`,
      name: agName,
      role: agRole,
      task: agTask,
      status: "idle",
      model: agModel,
      totalRuns: 0,
      lastRun: "Never"
    };

    setAgents(prev => [...prev, newAgent]);
    setAgentLogs(prev => [
      `[SYSTEM] New agent "${newAgent.name}" registered successfully.`,
      ...prev
    ]);

    // reset inputs
    setAgName("");
    setAgRole("");
    setAgTask("");
    setShowCreateForm(false);
  };

  const handleToggleState = (id: string) => {
    setAgents(curr => curr.map(agent => {
      if (agent.id === id) {
        const nextStatus = agent.status === "running" ? "idle" : "running";
        const totalInc = nextStatus === "running" ? agent.totalRuns + 1 : agent.totalRuns;
        
        // Append to logs
        const logMsg = nextStatus === "running"
          ? `[${agent.name}] [RUNNING] Neural agent loop activated. Mapping triggers...`
          : `[${agent.name}] [IDLE] Worker stopped. Thread allocated back to cluster pool.`;
        setAgentLogs(prev => [logMsg, ...prev]);

        return {
          ...agent,
          status: nextStatus as any,
          totalRuns: totalInc,
          lastRun: nextStatus === "running" ? "Just now" : agent.lastRun
        };
      }
      return agent;
    }));
  };

  const handleDeleteAgent = (id: string) => {
    const target = agents.find(a => a.id === id);
    if (!target) return;
    setAgents(curr => curr.filter(a => a.id !== id));
    setAgentLogs(prev => [`[SYSTEM] Deregistered agent "${target.name}". Resources cleared.`, ...prev]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/35 dark:bg-[#0c101b] fade-in pr-0 select-none">
      {/* Title Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-150 bg-white dark:border-gray-800 dark:bg-zinc-900/40 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 dark:border-gray-800 dark:bg-zinc-900 dark:text-gray-300 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bot className="h-4.5 w-4.5 text-red-600" />
              <span>AI Agents Orchestrator</span>
            </h1>
            <p className="text-[10px] text-gray-450 dark:text-gray-500 font-medium font-sans">Establish and coordinate stateful, autonomous worker threads across local APIs</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Agent</span>
        </button>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Agents List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showCreateForm && (
            <form 
              onSubmit={handleCreateAgent}
              className="p-5 border border-red-100 bg-red-50/10 rounded-2xl dark:border-red-950/40 dark:bg-[#0d0912]/30 space-y-4 max-w-xl text-left"
            >
              <h3 className="text-xs font-bold text-red-600 dark:text-red-400">Initialize Custom Agent Thread</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Agent Identifier</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Code Reviewer Bot"
                    value={agName}
                    onChange={(e) => setAgName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Functional Role / Accent</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Senior Software Architect"
                    value={agRole}
                    onChange={(e) => setAgRole(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Instructional Target / Task Objective</label>
                  <textarea 
                    rows={2}
                    required
                    placeholder="Describe what background logic this bot should periodically run..."
                    value={agTask}
                    onChange={(e) => setAgTask(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Underlying Model Target</label>
                  <select
                    value={agModel}
                    onChange={(e) => setAgModel(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="Sonnet 4.6">Sonnet 4.6 (Recommended)</option>
                    <option value="Gemini 3.5 Core">Gemini 3.5 Core</option>
                    <option value="Gemini 3.5 Flash">Gemini 3.5 Flash</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold dark:border-gray-850 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Initialize Agent
                </button>
              </div>
            </form>
          )}

          {/* Core active agents card queue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const isRunning = agent.status === "running";
              return (
                <div 
                  key={agent.id}
                  className="bg-white border border-gray-200 dark:bg-zinc-900 dark:border-gray-850 rounded-2xl p-5 hover:border-red-650 transition-all text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isRunning ? "bg-emerald-500 animate-pulse" : agent.status === "paused" ? "bg-amber-500" : "bg-gray-400"
                        }`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                          {agent.status}
                        </span>
                      </div>

                      <span className="text-[10px] text-gray-450 dark:text-gray-500 bg-gray-50 dark:bg-zinc-950 font-semibold font-mono border border-gray-150 dark:border-gray-850 px-2.5 py-0.5 rounded-md">
                        {agent.model}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-gray-950 dark:text-white text-sm">
                      {agent.name}
                    </h3>
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400">
                      {agent.role}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-2 p-3 bg-gray-50 dark:bg-zinc-950/20 border border-gray-150 dark:border-gray-850 rounded-xl">
                      {agent.task}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-[10.5px] font-mono border-t border-gray-100 dark:border-gray-800 pt-3 text-gray-500">
                      <div>
                        <span className="text-gray-400">Total Runs:</span> <strong className="text-gray-700 dark:text-gray-300 font-bold">{agent.totalRuns}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400">Last Active:</span> <strong className="text-gray-700 dark:text-gray-300 font-bold">{agent.lastRun}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 mt-4 pt-3 border-t border-gray-100 dark:border-gray-850">
                    <button
                      onClick={() => handleToggleState(agent.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isRunning
                          ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400"
                          : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100/60 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400"
                      }`}
                    >
                      {isRunning ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                      <span>{isRunning ? "Stop Agent" : "Run Worker"}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      title="Decommission Agent Node"
                      className="p-1 px-2 border border-gray-200 hover:border-red-500 text-gray-400 hover:text-red-650 hover:bg-red-50 dark:border-gray-800 dark:bg-zinc-900 dark:hover:bg-red-950/25 rounded-md cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Agent Console Terminal Outputs */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-150 bg-white dark:bg-zinc-950/10 dark:border-gray-850 flex flex-col shrink-0 text-left h-80 lg:h-auto select-all">
          <div className="p-4 border-b border-gray-150 bg-gray-50/50 dark:border-gray-850 dark:bg-zinc-900/10 flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-red-600" />
            <span className="text-xs font-bold text-gray-900 dark:text-white">Live Agents Terminal Log</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2 bg-slate-900 text-slate-350 dark:bg-[#080b13] dark:text-slate-400">
            {agentLogs.map((log, i) => {
              const isEvent = log.includes("[SYSTEM]");
              const isError = log.includes("[ERROR]");
              const isRunning = log.includes("[RUNNING]");
              let color = isEvent ? "text-red-400" : isError ? "text-rose-400" : isRunning ? "text-emerald-400" : "text-gray-300";
              return (
                <div key={i} className={`p-1.5 rounded leading-relaxed border-l-2 bg-black/25 border-slate-800 select-text ${color}`}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
