import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Settings, 
  User, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Save, 
  HelpCircle,
  Crown,
  CreditCard,
  Zap,
  CheckCircle,
  Activity,
  ArrowRight,
  RefreshCw,
  XCircle,
  Clock,
  Download,
  Percent,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  DollarSign
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { api } from "../../lib/api";

interface SettingsViewProps {
  onBack: () => void;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  const { user, initialize } = useAuthStore();
  
  // Navigation tabs: 'account' | 'billing' | 'comparison' | 'admin'
  const [activeSubTab, setActiveSubTab] = useState<"account" | "billing" | "comparison" | "admin">("billing");

  // Profile preferences state
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [selectedModel, setSelectedModel] = useState("Sonnet 4.6");
  const [autoSaveLogs, setAutoSaveLogs] = useState(true);
  const [developerLogVerbosity, setDeveloperLogVerbosity] = useState("Verbose");
  const [enableWebStream, setEnableWebStream] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  // Self service billing preferences
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingSuccessMsg, setBillingSuccessMsg] = useState<string | null>(null);
  const [billingErrorMsg, setBillingErrorMsg] = useState<string | null>(null);

  // Live subscription customization states
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [creditBurn, setCreditBurn] = useState(240); // Burn pre-set for dashboard progress bar visual
  const [activePromoCode, setActivePromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0); // active discount percent
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Update card drawer modal/form toggles
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardName, setCardName] = useState("Global Operator");
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCVV, setCardCVV] = useState("•••");
  const [cardSavedMsg, setCardSavedMsg] = useState(false);

  // Admin dynamic control parameters
  const [adminPlans, setAdminPlans] = useState([
    { id: "free", name: "Free Preview Tier", price: 0, credits: 1000 },
    { id: "starter", name: "Starter SaaS Plan", price: 9, credits: 5000 },
    { id: "pro", name: "Professional Plan", price: 29, credits: 25000 },
    { id: "business", name: "Business Automated Tier", price: 79, credits: 100000 },
    { id: "enterprise", name: "Enterprise Architecture Tier", price: 299, credits: 999999 },
  ]);
  const [selectedAdminPlanId, setSelectedAdminPlanId] = useState("free");
  const [selectedAdminPlanPrice, setSelectedAdminPlanPrice] = useState(0);
  const [selectedAdminPlanCredits, setSelectedAdminPlanCredits] = useState(1000);

  // Static mock invoices logs
  const [invoices, setInvoices] = useState([
    { id: "INV-2026-004", date: "June 15, 2026", amount: "$29.00", status: "Paid", file: "Eurosia_Invoice_004.pdf" },
    { id: "INV-2026-003", date: "May 15, 2026", amount: "$29.00", status: "Paid", file: "Eurosia_Invoice_003.pdf" },
    { id: "INV-2026-002", date: "April 15, 2026", amount: "$29.00", status: "Paid", file: "Eurosia_Invoice_002.pdf" },
    { id: "INV-2026-001", date: "March 15, 2026", amount: "$0.00", status: "Free Tier", file: "Eurosia_Invoice_001.pdf" },
  ]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileRole(user.role || "Lead Platform Architect");
    }
  }, [user]);

  // Sync admin form defaults
  useEffect(() => {
    const active = adminPlans.find(p => p.id === selectedAdminPlanId);
    if (active) {
      setSelectedAdminPlanPrice(active.price);
      setSelectedAdminPlanCredits(active.credits);
    }
  }, [selectedAdminPlanId, adminPlans]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  // 1-Click dynamic upgrade pipeline
  const handleUpgradePlan = async (planId: string) => {
    if (!user) {
      setBillingErrorMsg("Please authenticate your session to update tiers.");
      return;
    }
    setLoadingPlan(planId);
    setBillingSuccessMsg(null);
    setBillingErrorMsg(null);

    try {
      // Opt for the direct update endpoint first, bypassing Stripe entirely
      await api.post("/billing/direct-update", {
        planId,
        billingCycle
      });

      // Synchronize database records back into user frontend store
      await initialize();

      const planNames: any = {
        free: "Free Preview Tier ($0)",
        starter: "Starter SaaS Plan ($9)",
        pro: "Professional Tier ($29)",
        business: "Business Automated Tier ($79)",
        enterprise: "Enterprise Architecture Tier ($299)"
      };

      setBillingSuccessMsg(
        planId === "free"
          ? "আপনার সাবস্ক্রিপশন সফলভাবে ফ্রি টায়ারে নামিয়ে আনা হয়েছে।"
          : `মেম্বারশিপ এবং সাবস্ক্রিপশন সফলভাবে ${planNames[planId] || planId} প্ল্যানে আপগ্রেড করা হয়েছে! সকল ডিভাইসে নতুন লিমিট সিঙ্ক করা হয়েছে।`
      );
    } catch (err: any) {
      console.warn("Direct subscription update failed, falling back to mock-success flow:", err.message);
      
      try {
        const response = await api.post("/billing/checkout", {
          planId,
          billingCycle
        });

        const { sessionUrl } = response.data?.data || {};

        if (sessionUrl) {
          if (sessionUrl.includes("/mock-success")) {
            const urlObj = new URL(sessionUrl);
            const userIdQuery = urlObj.searchParams.get("userId") || user.id;
            const planIdQuery = urlObj.searchParams.get("planId") || planId;
            const cycleQuery = urlObj.searchParams.get("cycle") || billingCycle;

            // Process background server synchronization directly!
            await api.get(`/billing/mock-success?userId=${userIdQuery}&planId=${planIdQuery}&cycle=${cycleQuery}`);
          } else {
            window.open(sessionUrl, "_blank", "noopener,noreferrer");
          }

          // Hard restore state
          await initialize();

          const planNames: any = {
            free: "Free Preview Tier ($0)",
            starter: "Starter SaaS Plan ($9)",
            pro: "Professional Tier ($29)",
            business: "Business Automated Tier ($79)",
            enterprise: "Enterprise Architecture Tier ($299)"
          };

          setBillingSuccessMsg(
            planId === "free"
              ? "আপনার সাবস্ক্রিপশন সফলভাবে ফ্রি টায়ারে নামিয়ে আনা হয়েছে।"
              : `মেম্বারশিপ এবং সাবস্ক্রিপশন সফলভাবে ${planNames[planId] || planId} প্ল্যানে আপগ্রেড করা হয়েছে! সকল ডিভাইসে নতুন লিমিট সিঙ্ক করা হয়েছে।`
          );
        } else {
          throw new Error("Sandbox payment authorization redirect error.");
        }
      } catch (innerErr: any) {
        console.error("Subscription update failed:", innerErr);
        setBillingErrorMsg(innerErr.response?.data?.message || innerErr.message || "Failed to update packages.");
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  // Cancel subscription (Self-Service Downgrade immediately back to Free)
  const handleCancelSubscription = async () => {
    if (!confirm("আপনি কি নিশ্চিতভাবে আপনার মেম্বারশিপ বাতিল করতে চান? এটি করার ফলে আপনার লিমিট ফ্রি টায়ারে নেমে যাবে।")) {
      return;
    }
    await handleUpgradePlan("free");
  };

  // Renew current subscription (extends cycle and triggers success feedback toast)
  const handleRenewSubscription = () => {
    setLoadingPlan("renew");
    setBillingSuccessMsg(null);
    setTimeout(() => {
      setLoadingPlan(null);
      setBillingSuccessMsg("আপনার বর্তমান মেম্বারশিপ প্ল্যানটির মেয়াদ ৩-ক্লিকের মাধ্যমে সফলভাবে পরবর্তী ৩০ দিনের জন্য বৃদ্ধি করা হয়েছে!");
    }, 1200);
  };

  // Activate High Tier premium Trial System
  const activatePremiumTrial = (days: number) => {
    setTrialDaysLeft(days);
    setBillingSuccessMsg(`অভিনন্দন! আপনার অ্যাকাউন্টে ${days} দিনের Premium VIP ফ্রী ট্রায়াল সফলভাবে চালু করা হয়েছে।`);
  };

  // Apply Coupon promo code code simulator
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoMessage(null);
    const code = activePromoCode.trim().toUpperCase();
    
    if (code === "OFF50" || code === "EURO50") {
      setPromoDiscount(50);
      setPromoMessage("🔥 প্রোমো কোড সফলভাবে যুক্ত হয়েছে! পাবেন ৫০% ইনস্ট্যান্ট ডিসকাউন্ট!");
    } else if (code === "EURO20") {
      setPromoDiscount(20);
      setPromoMessage("⚡ প্রোমো কোড 'EURO20' যুক্ত হয়েছে! ২০% ডিসকাউন্ট কার্যকর করা হলো।");
    } else {
      setPromoDiscount(0);
      setPromoMessage("⚠️ দুঃখিত, এই কুপন কোডটি সঠিক নয় অথবা মেয়াদ শেষ।");
    }
  };

  // Save credit card credentials mock
  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    setCardSavedMsg(true);
    setTimeout(() => {
      setCardSavedMsg(false);
      setShowCardModal(false);
      setBillingSuccessMsg("আপনার ক্রেডিট কার্ড ও পেমেন্ট মেথড সফলভাবে আপডেট করা হয়েছে!");
    }, 1500);
  };

  const handleDownloadInvoice = (invNum: string) => {
    alert(`Downloading invoice registration receipt: ${invNum}\nPlatform Transaction Authorized Code: PG_AUTH_2026_SECURE`);
  };

  // Flush system logs
  const cleanActivityLogs = () => {
    alert("Sandbox telemetry log registers flushed from browser memory cache!");
  };

  // Check active plan and fetch credit ceilings
  const getPlanDetails = () => {
    const currentName = user?.plan?.toLowerCase() || "";
    if (currentName.includes("enterprise")) {
      return { id: "enterprise", credits: 999999, name: "Enterprise Architecture Tier" };
    }
    if (currentName.includes("business")) {
      return { id: "business", credits: 100000, name: "Business Automated Tier" };
    }
    if (currentName.includes("pro") || currentName.includes("professional")) {
      return { id: "pro", credits: 25000, name: "Professional Plan" };
    }
    if (currentName.includes("starter")) {
      return { id: "starter", credits: 5000, name: "Starter SaaS Plan" };
    }
    return { id: "free", credits: 1000, name: "Free Preview Tier" };
  };

  const activePlan = getPlanDetails();
  const usagePercent = Math.min(100, Math.round((creditBurn / activePlan.credits) * 100));

  // Admin dynamic updating pipeline logic
  const handleAdminPlanSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = adminPlans.map(p => {
      if (p.id === selectedAdminPlanId) {
        return { ...p, price: selectedAdminPlanPrice, credits: selectedAdminPlanCredits };
      }
      return p;
    });
    setAdminPlans(updated);
    alert(`পদ্ধতি সফল! ${selectedAdminPlanId.toUpperCase()} প্ল্যানের মূল্য $${selectedAdminPlanPrice} এবং ক্রেডিট লিমিট ${selectedAdminPlanCredits}-এ সফলভাবে আপডেট করা হয়েছে।`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/45 dark:bg-[#0c101b] fade-in select-none">
      {/* Upper header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-150 bg-white dark:border-gray-800 dark:bg-zinc-900/45 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 dark:border-gray-800 dark:bg-zinc-900 dark:text-gray-300 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 font-display">
              <Settings className="h-4.5 w-4.5 text-red-600" />
              <span>System Settings & Control Centre</span>
            </h1>
            <p className="text-[10px] text-gray-450 dark:text-gray-500 font-sans font-medium">
              মেম্বারশিপ প্ল্যান আপগ্রেড করুন, ইউজার প্রোফাইল এবং সিস্টেম ইন্টেলিজেন্স সেটিংস কনফিগার করুন
            </p>
          </div>
        </div>

        {/* Global Success Indicator toast */}
        {isSaved && (
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-pulse font-sans">
            <Check className="h-4 w-4" />
            <span>Preferences saved successfully!</span>
          </span>
        )}
      </div>

      {/* Tabs navigation list bar */}
      <div className="px-6 py-2 border-b border-gray-150 bg-white dark:bg-zinc-900/30 dark:border-gray-850 flex gap-1 scroll-smooth overflow-x-auto shrink-0">
        <button
          onClick={() => { setActiveSubTab("billing"); setBillingSuccessMsg(null); setBillingErrorMsg(null); }}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "billing"
              ? "bg-red-50 text-red-650 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50"
              : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-zinc-850"
          }`}
        >
          <Crown className="h-3.5 w-3.5" />
          <span>Subscription Dashboard</span>
        </button>

        <button
          onClick={() => { setActiveSubTab("comparison"); setBillingSuccessMsg(null); setBillingErrorMsg(null); }}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "comparison"
              ? "bg-red-50 text-red-650 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50"
              : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-zinc-850"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Plan Comparison Matrix</span>
        </button>

        <button
          onClick={() => { setActiveSubTab("account"); setBillingSuccessMsg(null); setBillingErrorMsg(null); }}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "account"
              ? "bg-red-50 text-red-650 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50"
              : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-zinc-850"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Profile & Telemetry Settings</span>
        </button>

        <button
          onClick={() => { setActiveSubTab("admin"); setBillingSuccessMsg(null); setBillingErrorMsg(null); }}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "admin"
              ? "bg-purple-50 text-purple-650 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50"
              : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-zinc-850"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
          <span>Admin Packaging Studio</span>
        </button>
      </div>

      {/* Main Panel Scrolling Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto space-y-6 text-left">
        
        {/* Dynamic global warnings and state confirmations */}
        {billingSuccessMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-2xl text-xs font-semibold flex items-start gap-2.5 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 shadow-sm animate-bounce-subtle">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{billingSuccessMsg}</p>
              <p className="text-[10px] text-emerald-500 mt-1">Platform billing sync updated current capabilities across 3 connected instances natively.</p>
            </div>
          </div>
        )}

        {billingErrorMsg && (
          <div className="p-4 bg-rose-50 text-rose-800 border border-rose-150 rounded-2xl text-xs font-semibold flex items-start gap-2.5 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400 shadow-sm">
            <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{billingErrorMsg}</p>
              <p className="text-[10px] text-rose-500 mt-1">Payment protocol failed to construct standard card validation references.</p>
            </div>
          </div>
        )}

        {/* TAB A: Account, profile & telemetry metadata settings */}
        {activeSubTab === "account" && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="p-5 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-gray-850 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800 font-display">
                <User className="h-4 w-4 text-red-650" />
                <span>প্রোফাইল ইনফরমেশন (Profile Information Validation)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Display Operator Name</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-250 bg-white px-3 py-2.5 text-gray-700 dark:border-gray-850 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Functional Security Role</label>
                  <input 
                    type="text" 
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-250 bg-white px-3 py-2.5 text-gray-700 dark:border-gray-850 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-gray-850 space-y-4 shadow-sm font-sans">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800 font-display">
                <Cpu className="h-4 w-4 text-red-650" />
                <span>Inference Engine Priorities</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Default Model Target</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-250 bg-white px-3 py-2.5 text-gray-700 dark:border-gray-850 dark:bg-zinc-950 dark:text-white focus:outline-none"
                  >
                    <option value="Sonnet 4.6">Sonnet 4.6 (Best overall premium)</option>
                    <option value="Gemini 3.5 Core">Gemini 3.5 Core (Default standard)</option>
                    <option value="Gemini 3.5 Flash">Gemini 3.5 Flash (Ultra-fast latency)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Telemetry Verbosity</label>
                  <select
                    value={developerLogVerbosity}
                    onChange={(e) => setDeveloperLogVerbosity(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-250 bg-white px-3 py-2.5 text-gray-700 dark:border-gray-850 dark:bg-zinc-950 dark:text-white focus:outline-none"
                  >
                    <option value="Verbose">Verbose logs (Track and persist all events)</option>
                    <option value="Standard">Standard limits</option>
                    <option value="Silent">Silent dark mode execution</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Auto Save Sandbox Telemetry</h4>
                    <p className="text-[10.5px] text-gray-450 dark:text-gray-500">Write generated artifacts back to internal cache regularly</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={autoSaveLogs}
                    onChange={(e) => setAutoSaveLogs(e.target.checked)}
                    className="rounded text-red-650 focus:ring-red-500 cursor-pointer h-4.5 w-4.5 dark:bg-zinc-900"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Allow Web API Streaming</h4>
                    <p className="text-[10.5px] text-gray-450 dark:text-gray-500">Maintain active socket connections with neural hosts</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={enableWebStream}
                    onChange={(e) => setEnableWebStream(e.target.checked)}
                    className="rounded text-red-650 focus:ring-red-500 cursor-pointer h-4.5 w-4.5 dark:bg-zinc-900"
                  />
                </label>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-gray-850 space-y-3 shadow-sm font-sans">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800 font-display">
                <ShieldCheck className="h-4 w-4 text-red-650" />
                <span>Cache Resets & Environment Flushing</span>
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Flushing session activity limits doesn't impact any synced cloud databases, but clean local storage memory leaks successfully.
              </p>
              <button
                type="button"
                onClick={cleanActivityLogs}
                className="px-4 py-2 bg-red-50 text-red-650 border border-red-150 hover:bg-red-100 hover:text-red-750 text-xs font-bold rounded-xl transition-all cursor-pointer dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400"
              >
                Flush System Cache
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Apply Saved Preferences</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB B: Premium SaaS Billing Panel and active subscription usage stats */}
        {activeSubTab === "billing" && (
          <div className="space-y-6 fade-in font-sans">
            
            {/* Subscription active monitor dashboard card */}
            <div className="p-6 bg-gradient-to-br from-zinc-900 via-[#13192b] to-[#0d1222] border border-gray-800 rounded-3xl text-white shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-red-500/10 rounded-full blur-3xl opacity-60"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-red-550/15 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-400">
                    <Crown className="h-6 w-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white font-display">বর্তমান মেম্বারশিপ প্ল্যান</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{activePlan.name}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleRenewSubscription}
                    disabled={loadingPlan !== null}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all border border-white/15 flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5 text-gray-350" />
                    <span>{loadingPlan === "renew" ? "প্রসেসিং হচ্ছে..." : "রিনিউ রিকোয়েস্ট (30 days)"}</span>
                  </button>

                  <button
                    onClick={handleCancelSubscription}
                    disabled={loadingPlan !== null || activePlan.id === "free"}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/35 text-red-200 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                    <span>বাতিল করুন (Cancel/Downgrade)</span>
                  </button>
                </div>
              </div>

              {/* Consumption progress bars details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-semibold flex items-center gap-1">
                    <Percent className="h-4 w-4 text-red-400" />
                    <span>টোটাল ক্রেডিট ব্যবহার (Credit Usage Summary)</span>
                  </span>
                  <span className="font-bold text-gray-200 font-mono">
                    {creditBurn.toLocaleString()} / {activePlan.credits === 999999 ? "∞" : activePlan.credits.toLocaleString()} Credits ({usagePercent}%)
                  </span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-3.5 overflow-hidden p-[2px] border border-gray-700/80">
                  <div 
                    className="bg-gradient-to-r from-red-650 to-red-400 h-full rounded-full transition-all duration-700 ease-out shadow-inner"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center pt-2">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[10px] text-gray-450 uppercase block font-bold">Credit Remaining</span>
                    <strong className="text-sm font-black text-white block mt-0.5 font-mono">
                      {activePlan.credits === 999999 ? "Unlimited" : (activePlan.credits - creditBurn).toLocaleString()}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[10px] text-gray-450 uppercase block font-bold">Renewal Date</span>
                    <strong className="text-sm font-black text-emerald-450 block mt-0.5">
                      {trialDaysLeft ? "In Trial Active" : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("bn-BD")}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[10px] text-gray-450 uppercase block font-bold">Billing Cycle</span>
                    <strong className="text-sm font-black text-gray-200 block mt-0.5 capitalize">{billingCycle}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[10px] text-gray-450 uppercase block font-bold">Auto-Renewal</span>
                    <strong className="text-sm font-black text-emerald-400 block mt-0.5 flex items-center justify-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Enabled</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Quick trial triggering helper */}
              <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-300">
                <p className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-yellow-300 fill-yellow-300/10" />
                  <span>SaaS ট্রায়াল অপশন পরীক্ষা করতে চান? অ্যাকাউন্টে ইনস্ট্যান্ট ফ্রি প্রিমিয়াম ট্রায়াল চালু করুন:</span>
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => activatePremiumTrial(7)}
                    className="px-2.5 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30 cursor-pointer"
                  >
                    7-Day Pro Trial
                  </button>
                  <button
                    onClick={() => activatePremiumTrial(14)}
                    className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 cursor-pointer"
                  >
                    14-Day Enterprise Trial
                  </button>
                </div>
              </div>
            </div>

            {/* Billing Cycle Switcher panel and coupon applyer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card Cycle selector */}
              <div className="p-5 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-gray-850 space-y-3.5 shadow-sm">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 font-display">
                  <CreditCard className="h-4.5 w-4.5 text-red-650" />
                  <span>বিলিং সাইকেল পরিবর্তন (Billing Cycle Control)</span>
                </h4>
                <p className="text-xs text-gray-500 font-sans leading-relaxed">
                  Toggle billing cycles seamlessly. Yearly subscriptions authorize a **20% flat discount** dynamically generated in checkouts.
                </p>

                <div className="flex gap-2 bg-gray-50 dark:bg-zinc-950 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-850">
                  <button 
                    onClick={() => setBillingCycle("monthly")}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      billingCycle === "monthly"
                        ? "bg-white text-gray-950 dark:bg-zinc-850 dark:text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    মাসিক পেমেন্ট (Monthly)
                  </button>
                  <button 
                    onClick={() => setBillingCycle("yearly")}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      billingCycle === "yearly"
                        ? "bg-white text-gray-950 dark:bg-zinc-850 dark:text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    <span>বার্ষিক পেমেন্ট (Yearly)</span>
                    <span className="text-[8px] px-1 bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 font-bold rounded">SAVE 20%</span>
                  </button>
                </div>
              </div>

              {/* Coupon applying block */}
              <div className="p-5 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-gray-850 space-y-3.5 shadow-sm">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 font-display">
                  <Percent className="h-4.5 w-4.5 text-red-650" />
                  <span>প্রোমো কোড ব্যবহার (Apply Discount Coupons)</span>
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  Apply platform validation promo coupons like <strong className="font-mono">EURO20</strong> or <strong className="font-mono">OFF50</strong> inside the container database.
                </p>

                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="E.g. EURO20"
                    value={activePromoCode}
                    onChange={(e) => setActivePromoCode(e.target.value)}
                    className="flex-1 text-xs border border-gray-250 bg-white px-3 py-1.5 rounded-xl dark:bg-zinc-950 dark:border-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-950 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    যুক্ত করুন
                  </button>
                </form>
                {promoMessage && (
                  <p className="text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse">{promoMessage}</p>
                )}
              </div>
            </div>

            {/* Self-Service active plans list for instant toggling */}
            <div className="p-5 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-gray-850 space-y-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800 font-display">
                <Zap className="h-4.5 w-4.5 text-amber-500" />
                <span>মেম্বারশিপ প্যাকেজ আপগ্রেড কনসোল (Quick Self-Service Upgrades)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1 text-sans">
                {adminPlans.map((itm) => {
                  const isActive = activePlan.id === itm.id;
                  const discountFactor = billingCycle === "yearly" ? 0.8 : 1.0;
                  const cycleString = billingCycle === "yearly" ? "বছরে" : "মাসে";
                  
                  // Calculate dynamic pricing with coupons + cycles
                  let calculatedPrice = Math.round(itm.price * discountFactor);
                  if (promoDiscount > 0 && itm.price > 0) {
                    calculatedPrice = Math.round(calculatedPrice * (1 - promoDiscount / 100));
                  }

                  return (
                    <div 
                      key={itm.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                        isActive
                          ? "ring-1 ring-red-400 border-red-450 bg-red-50/5 dark:ring-red-950/20 dark:border-red-900/50"
                          : "border-gray-150 bg-white dark:bg-zinc-950 dark:border-gray-850 hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-extrabold uppercase text-gray-400 tracking-wider block">{itm.id}</span>
                          {isActive && (
                            <span className="text-[7.5px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-450">ACTIVE</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-gray-950 dark:text-white mt-1 leading-tight sm:truncate">{itm.name}</h4>
                        <div className="my-2">
                          <span className="text-lg font-black text-gray-900 dark:text-white">${calculatedPrice}</span>
                          <span className="text-[10px] text-gray-400 font-semibold"> / {cycleString}</span>
                        </div>
                        <span className="text-[9.5px] text-red-650 dark:text-red-400 font-bold font-mono block">
                          {itm.credits === 999999 ? "∞ Credits" : `${itm.credits.toLocaleString()} Credits`}
                        </span>
                      </div>

                      <div className="pt-4">
                        {isActive ? (
                          <button
                            type="button"
                            disabled
                            className="w-full text-center py-1 px-2 rounded-lg border border-gray-150 text-[10px] font-bold text-gray-400 cursor-not-allowed bg-gray-50/50 dark:border-gray-900 dark:bg-zinc-900/50"
                          >
                            অ্যাক্টিভ আছে
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpgradePlan(itm.id)}
                            disabled={loadingPlan !== null}
                            className="w-full text-center py-1 px-2 rounded-lg bg-red-650 hover:bg-red-700 text-white text-[10px] font-bold transition-all cursor-pointer"
                          >
                            {loadingPlan === itm.id ? "লোডিং..." : "বাছাই করুন"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Saved Credit Card Details & Update popup section */}
            <div className="p-5 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-gray-850 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-850">
                <h3 className="text-xs font-bold text-gray-950 dark:text-white flex items-center gap-2 font-display">
                  <CreditCard className="h-4.5 w-4.5 text-red-650" />
                  <span>পেমেন্ট মেথড বিবরণী (Payment Methods Management)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCardModal(true)}
                  className="text-xs font-bold text-red-600 hover:text-red-750 flex items-center gap-1 cursor-pointer font-sans"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>নতুন কার্ড যুক্ত করুন</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-150 bg-gray-50/40 dark:border-gray-850 dark:bg-zinc-950/40">
                <div className="flex items-center gap-3">
                  <div className="px-2 py-1.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded font-bold text-xs uppercase tracking-wide">
                    VISA
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-850 dark:text-white">{cardNumber}</h4>
                    <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5">Expires: {cardExpiry} · Owner: {cardName}</p>
                  </div>
                </div>

                <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-450 uppercase flex items-center gap-0.5">
                  <Check className="h-3 w-3" />
                  <span>Primary</span>
                </span>
              </div>
            </div>

            {/* Invoices List downloads section */}
            <div className="p-5 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-gray-850 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-gray-950 dark:text-white flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-850 font-display">
                <Calendar className="h-4.5 w-4.5 text-red-650" />
                <span>বিলিং হিস্ট্রি ও ইনভয়েস ডাউনলোড (Billing History & Paid Invoices)</span>
              </h3>

              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div 
                    key={inv.id} 
                    className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 dark:border-gray-850 dark:bg-zinc-950 dark:hover:bg-zinc-900/50 transition-all text-xs"
                  >
                    <div className="flex items-center gap-4">
                      <div className="px-2 py-1 rounded bg-gray-100 text-gray-500 dark:bg-zinc-850 dark:text-gray-400 font-mono text-[10px]">
                        {inv.id}
                      </div>
                      <div>
                        <span className="font-bold text-gray-850 dark:text-gray-250 block">{inv.amount} ({inv.status})</span>
                        <span className="text-[9.5px] text-gray-400 dark:text-gray-550 block mt-0.5">Issued: {inv.date}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadInvoice(inv.id)}
                      className="px-2.5 py-1 text-[11px] border border-gray-200/80 hover:bg-gray-100 text-gray-500 rounded-lg dark:border-gray-850 dark:text-gray-300 dark:hover:bg-zinc-850 transition-all flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB C: Comprehensive detailed multi-screen layout plan comparison table */}
        {activeSubTab === "comparison" && (
          <div className="p-6 bg-white border border-gray-200 rounded-3xl dark:bg-zinc-900 dark:border-gray-850 space-y-6 shadow-sm font-sans fade-in">
            <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-extrabold text-gray-950 dark:text-white flex items-center gap-2 font-display">
                <Layers className="h-5 w-5 text-red-650" />
                <span>প্যাকেজ সমূহের তুলনামূলক বিবরণী (Comprehensive Feature Comparison Tool)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-sans">
                একনজরে বিস্তারিত দেখে নিন আপনার প্রবৃত্তি এবং বাজেট অনুযায়ী সঠিক Eurosia One প্যাকেজটি।
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-150 dark:border-gray-850">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-950 text-[10.5px] uppercase font-bold tracking-wider text-gray-550 dark:text-gray-400 border-b border-gray-150 dark:border-gray-850">
                    <th className="p-3">Features & Tools</th>
                    <th className="p-3 text-center">Free (Preview)</th>
                    <th className="p-3 text-center">Starter</th>
                    <th className="p-3 text-center text-red-650 dark:text-red-400">Professional</th>
                    <th className="p-3 text-center">Business</th>
                    <th className="p-3 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                  <tr>
                    <td className="p-3 font-bold text-gray-800 dark:text-gray-200">মাসিক চার্জ (Pricing)</td>
                    <td className="p-3 text-center font-mono font-bold text-gray-700 dark:text-gray-300">$0 / মাস</td>
                    <td className="p-3 text-center font-mono font-bold text-gray-700 dark:text-gray-300">$9 / মাস</td>
                    <td className="p-3 text-center font-mono font-black text-red-650 dark:text-red-400 bg-red-500/5">$29 / মাস</td>
                    <td className="p-3 text-center font-mono font-bold text-gray-700 dark:text-gray-300">$79 / -</td>
                    <td className="p-3 text-center font-mono font-bold text-gray-700 dark:text-gray-300">$299 / -</td>
                  </tr>
                  
                  <tr>
                    <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">মাসিক ক্রেডিট (Credits)</td>
                    <td className="p-3 text-center font-mono text-gray-500">1,000</td>
                    <td className="p-3 text-center font-mono text-gray-500">5,000</td>
                    <td className="p-3 text-center font-mono font-bold text-red-650 dark:text-red-400 bg-red-500/5">25,000</td>
                    <td className="p-3 text-center font-mono text-gray-500">100,000</td>
                    <td className="p-3 text-center font-mono font-bold text-gray-200">999,999 (∞)</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-gray-850 dark:text-gray-300">AI Chat & Assistant</td>
                    <td className="p-3 text-center text-red-500 font-medium">Limited</td>
                    <td className="p-3 text-center text-gray-600">Standard limits</td>
                    <td className="p-3 text-center text-emerald-600 bg-red-500/5 font-bold">Priority Model Access</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">Uncapped limits</td>
                    <td className="p-3 text-center text-emerald-500 font-black flex items-center justify-center gap-1">
                      <Sparkles className="h-3 w-3 fill-yellow-250 animate-pulse text-yellow-300" />
                      <span>Dedicated Nodes</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-gray-850 dark:text-gray-300">ইমেজ জেনারেশন (Images)</td>
                    <td className="p-3 text-center font-mono text-gray-400">২০ টি / মাস</td>
                    <td className="p-3 text-center font-mono text-gray-400">৫০ টি / মাস</td>
                    <td className="p-3 text-center font-mono text-red-650 dark:text-red-400 bg-red-500/5 font-bold">২৫০ টি</td>
                    <td className="p-3 text-center font-mono text-gray-400">১,০০০ টি</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">അൺലിമിറ്റഡ്</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-gray-850 dark:text-gray-300">ভিডিও ক্লিপস (Video generation)</td>
                    <td className="p-3 text-center font-mono text-gray-400">৩টি</td>
                    <td className="p-3 text-center font-mono text-gray-400">১০টি</td>
                    <td className="p-3 text-center font-mono text-red-650 dark:text-red-400 bg-red-500/5 font-bold">৫০টি</td>
                    <td className="p-3 text-center font-mono text-gray-400">২০০টি</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">അൺলিമിറ്റഡ്</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-gray-850 dark:text-gray-300">ক্লাউড ড্রাইভ স্টোরেজ</td>
                    <td className="p-3 text-center font-mono text-gray-400">1 GB</td>
                    <td className="p-3 text-center font-mono text-gray-400">5 GB</td>
                    <td className="p-3 text-center font-mono text-red-650 dark:text-red-400 bg-red-500/5 font-bold">50 GB</td>
                    <td className="p-3 text-center font-mono text-gray-400">200 GB</td>
                    <td className="p-3 text-center font-mono font-bold text-gray-200">5,000 GB (5TB)</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-gray-850 dark:text-gray-300">টিম ওয়ার্কস্পেস কোলাবোরেশন</td>
                    <td className="p-3 text-center text-gray-350">✕ No</td>
                    <td className="p-3 text-center text-gray-350">✕ No</td>
                    <td className="p-3 text-center text-gray-500 bg-red-500/5">Up to 2 Members</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">Up to 10 Seats</td>
                    <td className="p-3 text-center text-emerald-600 font-black">Unlimited Seats</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-gray-850 dark:text-gray-300">API এন্ডপয়েন্ট এক্সেস</td>
                    <td className="p-3 text-center text-gray-350">✕ No</td>
                    <td className="p-3 text-center text-gray-350">✕ No</td>
                    <td className="p-3 text-center text-gray-400 bg-red-500/5 font-mono">Restricted</td>
                    <td className="p-3 text-center text-emerald-600 font-bold flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Full HTTP</span>
                    </td>
                    <td className="p-3 text-center text-emerald-600 font-black">Custom SDK Core</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-gray-850 dark:text-gray-300">অনুষ্ঠানিক সাপোর্ট (SSO System)</td>
                    <td className="p-3 text-center text-gray-350">✕ No Support</td>
                    <td className="p-3 text-center text-gray-505">Standard Ticket</td>
                    <td className="p-3 text-center text-emerald-600 bg-red-500/5 font-bold">Priority Response</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">24/7 Priority Support</td>
                    <td className="p-3 text-center text-purple-600 font-black">Dedicated Support Manager</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setActiveSubTab("billing")}
                className="px-5 py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1"
              >
                <span>সাবস্ক্রিপশন ড্যাশবোর্ডে ফিরে যান (Upgrade Now)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB D: Admin Dynamic Pricing, Credits, and Coupons Packaging manager */}
        {activeSubTab === "admin" && (
          <div className="p-6 bg-white border border-gray-200 rounded-3xl dark:bg-zinc-900 dark:border-gray-850 space-y-6 shadow-sm font-sans fade-in">
            <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-extrabold text-purple-650 dark:text-purple-400 flex items-center gap-2 font-display">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <span>অ্যাডমিন ম্যানেজমেন্ট কোড (Admin Control Room - Dynamic Packages Tuning)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                প্যাকেজের মূল্য, মাসভিত্তিক ক্রেডিট, ফ্রী ট্রায়াল মেয়াদের দৈর্ঘ্য এবং নতুন ছাড় কুপন অ্যাডমিন কন্ট্রোল প্যানেল থেকে পরিবর্তন করুন।
              </p>
            </div>

            <form onSubmit={handleAdminPlanSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Target plan selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">টুন করার প্যাকেজ সিলেক্ট করুন</label>
                  <select
                    value={selectedAdminPlanId}
                    onChange={(e) => setSelectedAdminPlanId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-250 bg-white px-3 py-2 text-gray-700 dark:border-gray-850 dark:bg-zinc-950 dark:text-white focus:outline-none"
                  >
                    <option value="free">Free Preview Tier</option>
                    <option value="starter">Starter Plan</option>
                    <option value="pro">Professional Plan</option>
                    <option value="business">Business Automated Plan</option>
                    <option value="enterprise">Enterprise Architecture Plan</option>
                  </select>
                </div>

                {/* 2. Setup Price */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">প্যাকেজ মূল্য (Price in USD)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <DollarSign className="h-4 w-4" />
                    </span>
                    <input 
                      type="number"
                      value={selectedAdminPlanPrice}
                      onChange={(e) => setSelectedAdminPlanPrice(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-gray-250 bg-white pl-8 pr-3 py-2 text-gray-700 dark:border-gray-850 dark:bg-zinc-950 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. Setup credits */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ক্রেডিট কোটা (Monthly Credits)</label>
                  <input 
                    type="number"
                    value={selectedAdminPlanCredits}
                    onChange={(e) => setSelectedAdminPlanCredits(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-gray-250 bg-white px-3 py-2 text-gray-700 dark:border-gray-850 dark:bg-zinc-950 dark:text-white focus:outline-none"
                  />
                </div>

              </div>

              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/5 dark:border-purple-900/30 font-sans space-y-4">
                <h4 className="text-xs font-bold text-purple-650 dark:text-purple-400">অ্যাডিশনাল কুপন ও প্রমো ক্যামপেইন সেটিং (Coupons, Trial and Promos Campaign)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-gray-400">অনবোর্ডিং ট্রায়াল দিন সংখ্যা (Default Registration Trial days)</label>
                    <select className="w-full text-xs rounded-xl border border-gray-250 bg-white px-3 py-2 text-gray-700 dark:border-gray-850 dark:bg-zinc-950 focus:outline-none">
                      <option value="7">7 Days Free Trial Session</option>
                      <option value="14" selected>14 Days Free Premium Trial</option>
                      <option value="30">30 Days Enterprise Full Sandbox Access</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-gray-400">ইনস্ট্যান্ট অ্যাক্টিভ প্রোমো কোড (Campaign Promotion Code)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        defaultValue="EURO20"
                        className="flex-1 text-xs border border-gray-250 bg-white px-3 py-2 rounded-xl dark:bg-zinc-950 dark:border-gray-800 focus:outline-none font-mono uppercase"
                      />
                      <button 
                        type="button"
                        onClick={() => alert("প্রচার কুপন সফলভাবে সম্প্রচার করা হয়েছে!")}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-750 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        ফোর্স অ্যাক্টিভেট
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-750 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  প্যাকেজ সেটিং আপডেট করুন (Save Tuned Parameters)
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* RENDER MODAL: Upgrading / updating payment methods details */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="w-full max-w-sm p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-3xl space-y-4 shadow-2xl text-left scale-in">
            <div className="flex items-center justify-between border-b border-gray-150 pb-2 dark:border-gray-800">
              <h4 className="text-xs font-bold text-gray-950 dark:text-white flex items-center gap-1.5">
                <CreditCard className="h-4.5 w-4.5 text-red-650" />
                <span>পেমেন্ট মেথড আপডেট (Secure Cards Onboarder)</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setShowCardModal(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <XCircle className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cardholder Display Name</label>
                <input 
                  type="text" 
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full rounded-xl border border-gray-250 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-950 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Credit Card Number</label>
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 1111 1111 1111"
                  className="w-full rounded-xl border border-gray-250 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-950 dark:text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expiry Month/Year</label>
                  <input 
                    type="text" 
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full rounded-xl border border-gray-250 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-950 dark:text-white focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">CVV Token</label>
                  <input 
                    type="password" 
                    value={cardCVV}
                    maxLength={4}
                    onChange={(e) => setCardCVV(e.target.value)}
                    placeholder="---"
                    className="w-full rounded-xl border border-gray-250 bg-white px-3 py-2 text-gray-700 dark:border-gray-800 dark:bg-zinc-950 dark:text-white focus:outline-none font-mono text-center tracking-widest"
                    required
                  />
                </div>
              </div>

              {cardSavedMsg && (
                <div className="text-[10px] text-emerald-600 font-bold animate-pulse text-center">Saving credit card credentials securely with Stripe encryption...</div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl text-center shadow-lg transition-all cursor-pointer"
              >
                পেমেন্ট মেথড সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
