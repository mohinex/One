import React, { useState } from "react";
import { 
  ArrowLeft, 
  Folder, 
  Plus, 
  Github, 
  Cpu, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Layers, 
  Terminal, 
  Play, 
  GitBranch, 
  Compass, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  branch: string;
  environment: "Production" | "Staging" | "Development";
  status: "active" | "building" | "failed";
  platform: "Cloud Run" | "Vercel" | "AWS Amplify";
  updatedAt: string;
}

export default function ProjectsView({ onBack }: { onBack: () => void }) {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "p_1",
      name: "Eurosia AI Suite",
      description: "Centralized workspace orchestrator mapping multi-modal triggers to serverless inference nodes.",
      branch: "main",
      environment: "Production",
      status: "active",
      platform: "Cloud Run",
      updatedAt: "2m ago"
    },
    {
      id: "p_2",
      name: "Autonomous Agent Core",
      description: "Background worker loops scanning PostgreSQL nodes to formulate scheduled newsletter workflows.",
      branch: "dev-v2",
      environment: "Staging",
      status: "building",
      platform: "Vercel",
      updatedAt: "Just now"
    },
    {
      id: "p_3",
      name: "Tailwind Sandbox Builder",
      description: "Client compiler and iframe renderer serving high-contrast static webpage layouts.",
      branch: "release-v1.2",
      environment: "Production",
      status: "active",
      platform: "Vercel",
      updatedAt: "1d ago"
    },
    {
      id: "p_4",
      name: "Multilingual Synthesizer",
      description: "Speech-to-text modeling server running audio spectrum analyses on active voice input streams.",
      branch: "test/dns-v6",
      environment: "Development",
      status: "failed",
      platform: "AWS Amplify",
      updatedAt: "3d ago"
    }
  ]);

  const [filterEnv, setFilterEnv] = useState<"All" | "Production" | "Staging" | "Development">("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projBranch, setProjBranch] = useState("main");
  const [projEnv, setProjEnv] = useState<"Production" | "Staging" | "Development">("Production");
  const [projPlatform, setProjPlatform] = useState<"Cloud Run" | "Vercel" | "AWS Amplify">("Cloud Run");
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    const newProj: Project = {
      id: `p_${Date.now()}`,
      name: projName,
      description: projDesc || "A modern Eurosia workspace project.",
      branch: projBranch || "main",
      environment: projEnv,
      status: "building",
      platform: projPlatform,
      updatedAt: "Just now"
    };

    setProjects(prev => [newProj, ...prev]);
    setProjName("");
    setProjDesc("");
    setProjBranch("main");
    setProjEnv("Production");
    setProjPlatform("Cloud Run");
    setShowCreateForm(false);

    // Simulate builder trigger
    setTimeout(() => {
      setProjects(curr => curr.map(p => p.id === newProj.id ? { ...p, status: "active" } : p));
    }, 4500);
  };

  const handleTriggerBuild = (id: string) => {
    setLoadingProjectId(id);
    setProjects(curr => curr.map(p => p.id === id ? { ...p, status: "building" } : p));
    
    setTimeout(() => {
      setLoadingProjectId(null);
      setProjects(curr => curr.map(p => p.id === id ? { ...p, status: "active", updatedAt: "Just now" } : p));
    }, 2000);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(curr => curr.filter(p => p.id !== id));
  };

  const filtered = filterEnv === "All" ? projects : projects.filter(p => p.environment === filterEnv);

  return (
    <div className="h-full flex flex-col bg-gray-50/35 dark:bg-[#0c101b] fade-in">
      {/* Upper Title Panel */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-150 bg-white dark:border-gray-800 dark:bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 dark:border-gray-800 dark:bg-zinc-900 dark:text-gray-300 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Folder className="h-4 w-4 text-red-600" />
              <span>Projects Workspace</span>
            </h1>
            <p className="text-[10px] text-gray-450 dark:text-gray-500 font-medium">Coordinate dynamic cloud deployments and synced repositories</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Main projects grid area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {showCreateForm && (
          <form 
            onSubmit={handleCreateProject}
            className="p-5 border border-red-100 bg-red-50/10 rounded-2xl dark:border-red-950/40 dark:bg-[#0d0912]/30 space-y-4 max-w-2xl mx-auto"
          >
            <h3 className="text-xs font-bold text-red-600 dark:text-red-400">Assemble New Workspace Project</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Chat Orchestrator"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Branch Sync</label>
                <input 
                  type="text" 
                  placeholder="main"
                  value={projBranch}
                  onChange={(e) => setProjBranch(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target Environment</label>
                <select
                  value={projEnv}
                  onChange={(e) => setProjEnv(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Infrastructure</label>
                <select
                  value={projPlatform}
                  onChange={(e) => setProjPlatform(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="Cloud Run">Cloud Run (Containerised)</option>
                  <option value="Vercel">Vercel (Static / Serverless)</option>
                  <option value="AWS Amplify">AWS Amplify</option>
                </select>
              </div>

              <div className="space-y-1 text-left md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Scope / Description</label>
                <textarea 
                  rows={2}
                  placeholder="Outline the operational targets and modular requirements of this project..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-semibold dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Compile Project
              </button>
            </div>
          </form>
        )}

        {/* Filter Controls Bar */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 pb-3 dark:border-gray-850 justify-start select-none">
          {(["All", "Production", "Staging", "Development"] as const).map((env) => (
            <button
              key={env}
              onClick={() => setFilterEnv(env)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filterEnv === env
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-550 border border-gray-150 hover:border-red-500 dark:bg-zinc-900 dark:border-gray-800 dark:text-gray-300"
              }`}
            >
              {env}
            </button>
          ))}
        </div>

        {/* Sync projects list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((proj) => {
            const isTargetBuilding = proj.status === "building";
            const isTargetFailed = proj.status === "failed";
            return (
              <div 
                key={proj.id} 
                className="bg-white border border-gray-200 dark:bg-zinc-900 dark:border-gray-850 rounded-2xl p-5 text-left flex flex-col justify-between hover:border-red-600 dark:hover:border-red-950 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                      proj.environment === "Production"
                        ? "text-red-600 bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/40"
                        : proj.environment === "Staging"
                        ? "text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/40"
                        : "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40"
                    }`}>
                      {proj.environment}
                    </span>

                    <div className="flex items-center gap-1">
                      {isTargetBuilding ? (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-semibold font-mono animate-pulse">
                          <RefreshCw className="h-3 w-3 animate-spin text-red-600" />
                          <span>SYNCHRONIZING</span>
                        </div>
                      ) : isTargetFailed ? (
                        <div className="flex items-center gap-1 text-[10px] text-rose-600 font-semibold font-mono">
                          <AlertCircle className="h-3 w-3" />
                          <span>BUILD FAILED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold font-mono">
                          <CheckCircle className="h-3 w-3" />
                          <span>DEPLOYED</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display font-extrabold text-gray-900 dark:text-white text-sm">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-gray-450 dark:text-gray-450 mt-1 lines-2 font-medium leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="flex items-center gap-3.5 mt-4 text-[10.5px] text-gray-500 font-mono">
                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                      <Github className="h-3.5 w-3.5" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-0.5">
                        <GitBranch className="h-2.5 w-2.5" />
                        {proj.branch}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                      <Cpu className="h-3.5 w-3.5" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{proj.platform}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 mt-4 pt-3.5 dark:border-gray-800">
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    Synced: {proj.updatedAt}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTriggerBuild(proj.id)}
                      disabled={isTargetBuilding}
                      title="Trigger workflow run"
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingProjectId === proj.id ? "animate-spin text-red-500" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      title="Delete Project Node"
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-red-50 text-gray-400 hover:text-red-650 dark:border-gray-800 dark:bg-zinc-900 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
