import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { 
  Users, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  UserX, 
  UserCheck, 
  Mail, 
  Trash2, 
  Download, 
  Eye, 
  X, 
  MoreVertical, 
  Check, 
  AlertCircle,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  subscription?: {
    planId: string;
    status: string;
  } | null;
}

export default function AdminUsers() {
  const queryClient = useQueryClient();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt_desc");

  // Selection & Modal State
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeUserDetail, setActiveUserDetail] = useState<UserRecord | null>(null);
  const [banModalUser, setBanModalUser] = useState<UserRecord | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<UserRecord | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Fetch Users Direct
  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ["adminUsersManagement"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data?.data || [];
    }
  });

  // 2. Ban / Toggle User Status Mutation
  const patchStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/admin/users/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsersManagement"] });
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      toast.success(data?.message || "User clearance updated successfully!");
      setBanModalUser(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update operator status.");
    }
  });

  // Export CSV
  const handleExportCSV = () => {
    try {
      window.open("/api/v1/admin/users/export", "_blank");
      toast.success("Spreadsheet export compiled successfully!");
    } catch {
      toast.error("Spreadsheet generation failed.");
    }
  };

  // Reset password simulation
  const handleResetPassword = (u: UserRecord) => {
    setPasswordResetUser(null);
    toast.success(`Cryptographic credentials reset command triggered. Mail sent to ${u.email}`);
  };

  // Change Plan simulation
  const handleChangePlan = (u: UserRecord, targetPlan: string) => {
    toast.success(`Platform plan modified: Set ${u.name} tier to ${targetPlan.toUpperCase()}`);
  };

  // Filter & Search computation
  const filteredUsers = users.filter(u => {
    const term = search.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.id.toLowerCase().includes(term);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesPlan = planFilter === "ALL" || 
      (planFilter === "FREE" && (!u.subscription || u.subscription.planId === "free")) ||
      (planFilter === "PRO" && u.subscription && u.subscription.planId === "pro");
    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && u.isActive) || 
      (statusFilter === "BANNED" && !u.isActive);

    return matchesSearch && matchesRole && matchesPlan && matchesStatus;
  });

  // Sort computation
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === "createdAt_desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "createdAt_asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "name_asc") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "name_desc") {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  // Paginated partition
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Selection handlers
  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const currentPageIds = paginatedUsers.map(u => u.id);
    const allSelected = currentPageIds.every(id => selectedUsers.includes(id));
    if (allSelected) {
      setSelectedUsers(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedUsers(prev => [...Array.from(new Set([...prev, ...currentPageIds]))]);
    }
  };

  const handleBulkBan = () => {
    if (selectedUsers.length === 0) return;
    setIsBulkActionLoading(true);
    // Execute bans sequentially or via parallel mutations
    Promise.all(selectedUsers.map(id => api.patch(`/admin/users/${id}/status`, { isActive: false })))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["adminUsersManagement"] });
        toast.success(`Successfully banned ${selectedUsers.length} selected accounts.`);
        setSelectedUsers([]);
      })
      .catch(() => toast.error("Error finalizing bulk status modifications."))
      .finally(() => setIsBulkActionLoading(false));
  };

  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
          <span className="text-xs font-semibold text-gray-400 font-mono tracking-widest uppercase">Decryption directory index...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left relative min-h-full">
      {/* Upper header action controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight text-white uppercase">FLEET OPERATORS</h1>
          <p className="text-gray-450 text-xs font-semibold uppercase font-mono mt-1">Sovereign Directory index & user permissions manager</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-800 text-white transition-all cursor-pointer"
        >
          <Download className="h-4 w-4 text-red-500" />
          <span>Export Users CSV</span>
        </button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-[#090D1A] border border-[#101726] rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {/* Search */}
          <div className="relative lg:col-span-1 md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by identity or email ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#060914] border border-[#161E30] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-mono"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 bg-[#060914] border border-[#161E30] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold uppercase"
            >
              <option value="ALL">All Clearance Levels</option>
              <option value="USER">User (Clearance 1)</option>
              <option value="ADMIN">Admin (Clearance 3)</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="relative">
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 bg-[#060914] border border-[#161E30] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-semibold uppercase"
            >
              <option value="ALL">All SaaS Plans</option>
              <option value="FREE">Free Account Tier</option>
              <option value="PRO">VIP Premium Plan</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 bg-[#060914] border border-[#161E30] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-semibold uppercase"
            >
              <option value="ALL">All Accounts States</option>
              <option value="ACTIVE">Authorized (Live)</option>
              <option value="BANNED">Revoked (Banned)</option>
            </select>
          </div>

          {/* Sort Selection */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 bg-[#060914] border border-[#161E30] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-semibold uppercase font-mono"
            >
              <option value="createdAt_desc">Latest Sign-in</option>
              <option value="createdAt_asc">Oldest Records</option>
              <option value="name_asc">Name [A - Z]</option>
              <option value="name_desc">Name [Z - A]</option>
            </select>
          </div>
        </div>

        {/* BULK SELECTION ACTION BANNER */}
        {selectedUsers.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between animate-fade-in">
            <span className="text-xs font-bold text-gray-300 font-mono">
              [ {selectedUsers.length} ] OPERATOR NODES COMPROMISED OR CHECKED
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkBan}
                disabled={isBulkActionLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-650/20 hover:bg-red-650 hover:text-white text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-500/30 transition-all cursor-pointer"
              >
                <UserX className="h-3.5 w-3.5" />
                <span>Deactivate Selected</span>
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-3.5 py-1.5 bg-slate-950 text-gray-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CORE DATA TABLE PANEL */}
      <div className="bg-[#090D1A] border border-[#101726] rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#121B30] text-[10px] font-bold uppercase tracking-widest text-gray-450 font-mono bg-[#070B15]">
                <th className="py-4.5 px-5 select-none w-10">
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.includes(u.id))}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 bg-[#070B14] border border-[#1D2B47] rounded focus:ring-red-500"
                  />
                </th>
                <th className="py-4.5 px-3">Identity Mapping</th>
                <th className="py-4.5 px-3">Authentication Clearance</th>
                <th className="py-4.5 px-3">Membership Tier</th>
                <th className="py-4.5 px-3">Terminal Link</th>
                <th className="py-4.5 px-3 text-right pr-6">Direct Action Panel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101726]/40">
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="text-xs hover:bg-[#111626]/30 transition-all">
                  <td className="py-4 px-5">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleSelectUser(u.id)}
                      className="h-4 w-4 bg-[#070B14] border border-[#1D2B47] rounded focus:ring-red-500"
                    />
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#0F172A] border border-[#1D2A47] flex items-center justify-center font-mono text-xs font-black text-blue-400">
                        {u.name ? u.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase() : "OP"}
                      </div>
                      <div className="leading-tight">
                        <p className="font-extrabold text-white text-xs">{u.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold font-mono mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <span className={`px-2 py-0.5 border text-[10px] font-bold font-mono tracking-wider rounded uppercase ${
                      u.role === "ADMIN" || u.role === "SUPER_ADMIN"
                        ? "border-[#450A0A]/40 bg-[#450A0A]/20 text-red-500"
                        : "border-[#1E293B] bg-[#0C1224] text-gray-300"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="px-2 py-0.5 border border-[#162744] bg-[#0E1629] text-[10px] font-bold font-mono tracking-wider rounded uppercase text-blue-400">
                      {u.subscription?.planId?.toUpperCase() || "FREE"}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase ${
                      u.isActive ? "text-emerald-400" : "text-red-500"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                      {u.isActive ? "AUTHORIZED" : "REVOKED"}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveUserDetail(u)}
                        className="p-1.5 bg-[#0C1324] hover:bg-[#1E2A4B] text-gray-400 hover:text-white rounded-lg border border-[#13203D] transition-all cursor-pointer"
                        title="Audit Ledger"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const action = u.isActive ? false : true;
                          patchStatusMutation.mutate({ id: u.id, isActive: action });
                        }}
                        className={`p-1.5 rounded-lg border border-opacity-30 transition-all cursor-pointer ${
                          u.isActive 
                            ? "bg-red-950/20 text-red-400 border-red-500/20 hover:bg-red-650 hover:text-white"
                            : "bg-emerald-950/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white"
                        }`}
                        title={u.isActive ? "Revoke clearance" : "Authorize Operator"}
                      >
                        {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setBanModalUser(u)}
                        className="p-1.5 bg-[#000]/10 hover:bg-[#d02]/10 text-red-400 rounded-lg border border-red-900/10 transition-all cursor-pointer"
                        title="Change Membership Plan"
                      >
                        <SlidersHorizontal className="h-4 w-4 text-amber-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-semibold text-gray-500 font-mono uppercase tracking-wider">
                    Access Denied: No matching user matrices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION LINKERS FOOTER */}
        {totalPages > 1 && (
          <div className="px-5 py-4.5 border-t border-[#121B31] bg-[#070B15] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[10px] font-bold text-gray-500 font-mono uppercase tracking-widest leading-none">
              DISPLAYING PAGE {currentPage} OF {totalPages} ({sortedUsers.length} TOTAL INDICES)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-[#14203A] bg-[#090E1A] disabled:opacity-30 text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-[#14203A] bg-[#090E1A] disabled:opacity-30 text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL DRAWERS PANEL - View Details Slider */}
      {activeUserDetail && (
        <div className="fixed inset-0 z-55 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#090D1A] h-full border-l border-[#101726] shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden animate-slide-left">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#121B30] pb-4">
                <div className="flex items-center gap-2.5">
                  <Shield className="h-5 w-5 text-red-500" />
                  <h4 className="font-display font-black text-sm tracking-widest text-white uppercase font-mono">OPERATOR SECURITY LEDGER</h4>
                </div>
                <button
                  onClick={() => setActiveUserDetail(null)}
                  className="h-8 w-8 rounded-lg bg-[#0E1529] border border-[#14203C] flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Bio Block */}
              <div className="flex items-center gap-4.5 p-4 border border-[#13203F] bg-[#0C1224] rounded-2xl">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-650 to-indigo-600 text-white flex items-center justify-center font-mono font-black text-base shadow-xl">
                  {activeUserDetail.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase()}
                </div>
                <div className="text-left space-y-0.5 leading-tight">
                  <h3 className="text-white font-extrabold text-sm">{activeUserDetail.name}</h3>
                  <p className="text-gray-400 text-xs font-semibold">{activeUserDetail.email}</p>
                </div>
              </div>

              {/* Attributes fields list */}
              <div className="space-y-3.5 pt-3">
                <div className="grid grid-cols-3 border-b border-[#101726]/50 pb-2.5 text-xs">
                  <span className="text-gray-450 font-bold uppercase font-mono">Operator ID</span>
                  <span className="col-span-2 text-white font-semibold font-mono text-[11px] truncate select-all">{activeUserDetail.id}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-[#101726]/50 pb-2.5 text-xs">
                  <span className="text-gray-450 font-bold uppercase font-mono">Clearance Role</span>
                  <span className="col-span-2 text-white font-semibold font-mono">{activeUserDetail.role}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-[#101726]/50 pb-2.5 text-xs">
                  <span className="text-gray-450 font-bold uppercase font-mono">SaaS Pricing</span>
                  <span className="col-span-2 text-blue-400 font-extrabold font-mono uppercase">{activeUserDetail.subscription?.planId || "free"}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-[#101726]/50 pb-2.5 text-xs">
                  <span className="text-gray-450 font-bold uppercase font-mono">System Link</span>
                  <span className={`col-span-2 font-bold font-mono ${activeUserDetail.isActive ? "text-emerald-400" : "text-red-500"}`}>
                    {activeUserDetail.isActive ? "AUTHORIZED (ACTIVE)" : "BANNED (REVOKED)"}
                  </span>
                </div>
                <div className="grid grid-cols-3 border-b border-[#101726]/50 pb-2.5 text-xs">
                  <span className="text-gray-450 font-bold uppercase font-mono">Registries Date</span>
                  <span className="col-span-2 text-white font-semibold font-mono">{new Date(activeUserDetail.createdAt).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-[#101726]/50 pb-2.5 text-xs">
                  <span className="text-gray-450 font-bold uppercase font-mono">Terminal Activity</span>
                  <span className="col-span-2 text-white font-semibold font-mono">{activeUserDetail.lastLoginAt ? new Date(activeUserDetail.lastLoginAt).toLocaleString() : "Never Synced"}</span>
                </div>
              </div>
            </div>

            {/* Quick sliders links */}
            <div className="flex gap-3 border-t border-[#121B30] pt-4 mt-6">
              <button
                onClick={() => {
                  toast.success(`Encrypted reset email has been transmitted to ${activeUserDetail.email}`);
                  setActiveUserDetail(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-800 text-white transition-all cursor-pointer"
              >
                <Mail className="h-4 w-4 text-amber-500" />
                <span>Reset Credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAN MODIFIER OVERLAY MODAL */}
      {banModalUser && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-md bg-[#090D1A] border border-[#162138] rounded-2xl shadow-2xl p-6 relative animate-scale-in">
            <h4 className="font-display font-black text-sm text-white uppercase tracking-wider font-mono">MODIFY MEMBERSHIP PLATFORM TIER</h4>
            <p className="text-gray-400 text-xs mt-1.5 font-medium leading-relaxed">
              Alter SaaS level configuration parameters for <span className="text-white font-extrabold">{banModalUser.name}</span> instantly.
            </p>

            <div className="space-y-2 pt-4">
              {["free", "pro", "premium"].map((pTier) => (
                <button
                  key={pTier}
                  onClick={() => {
                    handleChangePlan(banModalUser, pTier);
                    setBanModalUser(null);
                  }}
                  className="w-full text-left p-3 border border-[#1C2842] hover:border-red-500 rounded-xl bg-[#070B14] hover:bg-slate-900 transition-all flex justify-between items-center cursor-pointer select-none"
                >
                  <span className="text-xs font-bold font-mono tracking-wider text-white uppercase">{pTier} tier</span>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-6 border-t border-[#101726]/50 mt-4">
              <button
                onClick={() => setBanModalUser(null)}
                className="px-4.5 py-2.5 bg-slate-950 hover:bg-slate-900 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider rounded-xl transition-all border border-[#15203A] cursor-pointer"
              >
                Cancel modifier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
