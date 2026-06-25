import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { api } from "../lib/api";
import { 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  Github,
  Globe,
  Lock,
  MessageSquare,
  Image as ImageIcon,
  Sliders,
  Terminal,
  RefreshCw,
  ChevronDown,
  Shield,
  Clock,
  ExternalLink
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  // Magic Link credentials
  const [email, setEmail] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Onboarding simulation steps
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null);
  const [simulatedEmail, setSimulatedEmail] = useState("");
  const [isNewUserRegistered, setIsNewUserRegistered] = useState(false);

  // Social SSO click trigger simulation
  const [selectedSocial, setSelectedSocial] = useState<string | null>(null);

  // Auto-verify token from URL parameters on boot if provided
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      handleTokenVerification(token);
    }
  }, [searchParams]);

  // Helper to format API/network errors gracefully
  const formatError = (err: any, provider?: string): string => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.response?.data?.error?.message || err.message || "";
    
    // Check for rate limiting
    if (status === 429 || message.includes("429") || message.toLowerCase().includes("too many login") || message.toLowerCase().includes("too many attempts") || message.toLowerCase().includes("too many requests")) {
      return "Too many login attempts. Please wait 1 minute and try again. / অল্প সময়ে অনেকবার লগইন চেষ্টা করা হয়েছে। অনুগ্রহ করে ১ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।";
    }

    // Provider specific error
    if (provider === "Google") {
      return "Google sign-in could not be completed. Please try again or use email login.";
    } else if (provider) {
      return `${provider} sign-in could not be completed. Please try again or use email login.`;
    }

    // Internal Server Error / DB error sanitization
    if (status === 500 || message.includes("prisma") || message.includes("database") || message.includes("sql") || message.includes("Internal Server Error")) {
      return "An unexpected server error occurred. Please try again in a few moments.";
    }

    return message || "একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
  };

  // Magic link dispatch handler
  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setApiError("দয়া করে একটি সঠিক ইমেল অ্যাড্রেস প্রদান করুন।");
      return;
    }
    setApiError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/magic-link", { email: email.trim() });
      const { token, isNewUser } = res.data?.data || {};
      
      setSimulatedToken(token);
      setSimulatedEmail(email.trim());
      setIsNewUserRegistered(isNewUser);
      setMagicLinkSent(true);
      setInfoMessage(res.data?.message || "Secure login link has been prepared successfully!");
    } catch (err: any) {
      console.error("Magic link request failed:", err);
      setApiError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct login verification handler
  const handleTokenVerification = async (token: string) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/magic-verify", { token });
      const { accessToken, user } = res.data.data;
      setAccessToken(accessToken);
      setUser(user);
      
      const next = searchParams.get("next") || "/dashboard";
      navigate(next);
    } catch (err: any) {
      console.error("Token verification failed:", err);
      setApiError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Social SSO instant onboarding simulation 
  const invokeSocialSSO = (provider: string) => {
    setSelectedSocial(provider);
    setApiError(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    setTimeout(async () => {
      try {
        const dummyEmail = `${provider.toLowerCase()}_user_${Math.random().toString(36).substring(5)}@eurosia.one`;
        // Hits magic link endpoint to create user and issues active session directly
        const mlRes = await api.post("/auth/magic-link", { email: dummyEmail });
        const { token } = mlRes.data.data;
        
        // Instantly verify and sign in
        const verifyRes = await api.post("/auth/magic-verify", { token });
        const { accessToken, user } = verifyRes.data.data;
        
        setAccessToken(accessToken);
        setUser(user);
        navigate("/dashboard");
      } catch (err: any) {
        console.error("Social SSO error:", err);
        setApiError(formatError(err, provider));
      } finally {
        setSelectedSocial(null);
        setIsSubmitting(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-[#060913] transition-colors duration-200">
      
      {/* LEFT PANEL: Branding & Beautiful Capability Showcase */}
      <div className="hidden lg:flex lg:col-span-5 bg-white dark:bg-[#090D1A] p-8 lg:p-12 xl:p-16 flex flex-col justify-between border-r border-gray-100 dark:border-[#111A2E]/50">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-red-600 rounded-xl flex items-center justify-center text-white font-extrabold text-base tracking-tight shadow-md shadow-red-500/10">
            E
          </div>
          <span className="font-sans font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
            Eurosia One
          </span>
        </div>

        {/* Feature pitches */}
        <div className="my-12 space-y-10">
          <div className="space-y-3">
            <h1 className="font-sans font-black text-3xl xl:text-4xl text-slate-900 dark:text-white tracking-tight leading-tight">
              Welcome to <br />
              <span className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 bg-clip-text text-transparent">
                Eurosia One
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-sans text-sm font-medium">
              Your AI Operating System
            </p>
          </div>

          <div className="space-y-6">
            {/* Item A */}
            <div className="flex items-start gap-4">
              <div className="mt-1 h-9 w-9 shrink-0 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200">
                  AI Powered Conversations
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-550 mt-1 leading-relaxed">
                  Smart, contextual AI chat for everyone.
                </p>
              </div>
            </div>

            {/* Item B */}
            <div className="flex items-start gap-4">
              <div className="mt-1 h-9 w-9 shrink-0 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200">
                  Create & Generate
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-550 mt-1 leading-relaxed">
                  Generate images, videos, documents and more.
                </p>
              </div>
            </div>

            {/* Item C */}
            <div className="flex items-start gap-4">
              <div className="mt-1 h-9 w-9 shrink-0 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200">
                  Build & Automate
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-550 mt-1 leading-relaxed">
                  Build websites, automate tasks, write code.
                </p>
              </div>
            </div>

            {/* Item D */}
            <div className="flex items-start gap-4">
              <div className="mt-1 h-9 w-9 shrink-0 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200">
                  Work Your Way
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-550 mt-1 leading-relaxed">
                  Personal workspace, projects, and team collaboration.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Overlapping user pile */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-850/60">
            <div className="flex -space-x-2">
              <div className="h-7 w-7 rounded-full border border-white dark:border-[#090D1A] bg-red-100 text-[10px] font-bold text-red-650 flex items-center justify-center">AH</div>
              <div className="h-7 w-7 rounded-full border border-white dark:border-[#090D1A] bg-amber-100 text-[10px] font-bold text-amber-655 flex items-center justify-center">MD</div>
              <div className="h-7 w-7 rounded-full border border-white dark:border-[#090D1A] bg-blue-100 text-[10px] font-bold text-blue-650 flex items-center justify-center">SK</div>
              <div className="h-7 w-7 rounded-full border border-white dark:border-[#090D1A] bg-emerald-100 text-[10px] font-bold text-emerald-650 flex items-center justify-center">SH</div>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400">
              +12K Happy Users
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-sans">
            © 2026 Eurosia One. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form & Pricing Info */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 md:p-10 xl:p-12 space-y-8">
        
        {/* Top bar controls */}
        <div className="flex justify-between items-center self-end space-x-4">
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-bold text-slate-700 dark:text-gray-300 transition-all">
              <Globe className="h-3.5 w-3.5 text-gray-400" />
              <span>English</span>
              <ChevronDown className="h-3 w-3 text-gray-450" />
            </button>
          </div>
          <a href="mailto:support@eurosia.one" className="text-xs font-bold text-slate-500 hover:text-red-500 transition-all flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Need help?</span>
          </a>
        </div>

        {/* Central Card container */}
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="bg-white dark:bg-[#0D1222] border border-gray-100 dark:border-[#1A2542]/40 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 leading-relaxed">
            
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4 select-none">
              <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm tracking-tight shadow-md shadow-red-500/15">
                E
              </div>
              <span className="font-sans font-black text-sm text-slate-900 dark:text-white tracking-tight uppercase">
                Eurosia One
              </span>
            </div>

            {/* Header titles */}
            <div className="text-center space-y-1.5 pb-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Sign in to Eurosia One
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">
                Access your AI workspace
              </p>
            </div>

            {/* Feedbacks */}
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900 text-xs font-semibold text-red-600 rounded-xl leading-relaxed">
                ⚠️ {apiError}
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 dark:bg-emerald-950/20 dark:border-emerald-900 text-xs font-medium text-emerald-700 dark:text-emerald-400 rounded-xl leading-relaxed flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Dynamic Core Magic Link Views */}
            {!magicLinkSent ? (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-250 bg-white pl-10 pr-4 py-3 rounded-xl text-xs dark:bg-[#111827] dark:border-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 dark:focus:border-slate-400 outline-none placeholder-gray-405 font-sans transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:text-slate-950 text-white disabled:opacity-45 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg hover:shadow-slate-500/5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending secure link...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Email</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Simulated inbox experience card */
              <div className="p-4 bg-gradient-to-r from-red-50/50 to-amber-50/50 border border-amber-200/50 dark:from-red-950/20 dark:to-amber-950/10 dark:border-amber-900/40 rounded-2xl space-y-4 animate-fade-in font-sans">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <Sparkles className="h-4 w-4 animate-bounce shrink-0" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider">ড্যামো ইনবক্স সিমুলেশন (Inbox Simulator)</h3>
                </div>
                
                <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 space-y-2 text-left">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-1.5 text-[10px] text-gray-400">
                    <span>প্রেরক: <b>Eurosia One ID</b></span>
                    <span>সদ্য প্রেরিত</span>
                  </div>
                  <div className="text-[10px] text-gray-550 bg-gray-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg mb-1 font-mono break-all border border-gray-100 dark:border-gray-800">
                    To: <span className="font-bold text-slate-800 dark:text-gray-200">{simulatedEmail}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">🔑 Your Magic Login Handshake Link</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
                    {isNewUserRegistered 
                      ? "Eurosia One-এ স্বাগতম! আপনার অ্যাকাউন্ট এবং ফ্রি প্ল্যান সফলভাবে সক্রিয় করা হয়েছে। নিচের বাটনে ক্লিক করে সরাসরি সিস্টেমে প্রবেশ করুন।"
                      : "আপনার Eurosia One ড্যাশবোর্ডে প্রবেশের জন্য নিরাপদ ম্যাজিক ভেরিফিকেশন কোডটি প্রস্তুত। এই বাটনে ক্লিক করুন:"
                    }
                  </p>
                  
                  <button
                    onClick={() => {
                      if (simulatedToken) {
                        handleTokenVerification(simulatedToken);
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>যাচাই করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <span>নিরাপদ লগইন করুন (SECURE LOGIN NOW)</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    onClick={() => { setMagicLinkSent(false); setApiError(null); setInfoMessage(null); }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-750 transition-all font-sans cursor-pointer"
                  >
                    ভুল ইমেইল পরিবর্তন করুন (Change Email)
                  </button>
                </div>
              </div>
            )}

            {/* Separator block */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 border-t border-gray-100 dark:border-gray-800" />
              <span className="relative bg-white dark:bg-[#0D1222] px-3.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                or continue with
              </span>
            </div>

            {/* Single click social login buttons */}
            <div className="grid grid-cols-3 gap-2.5 font-sans">
              
              {/* Google */}
              <button
                type="button"
                onClick={() => invokeSocialSSO("Google")}
                disabled={isSubmitting || magicLinkSent}
                className="py-2.5 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-[11px] font-bold text-slate-650 dark:text-gray-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-transparent"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.437-2.882-6.437-6.437 0-3.555 2.882-6.437 6.437-6.437 1.488 0 2.857.512 3.948 1.365l3.107-3.107C19.066 1.933 15.827 1 12.24 1 6.032 1 12.24s5.032 11.24 11.24 11.24c5.82 0 10.976-4.148 10.976-11.24 0-.663-.075-1.3-.18-1.955H12.24z" />
                </svg>
                <span>Google</span>
              </button>

              {/* Microsoft */}
              <button
                type="button"
                onClick={() => invokeSocialSSO("Microsoft")}
                disabled={isSubmitting || magicLinkSent}
                className="py-2.5 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-[11px] font-bold text-slate-650 dark:text-gray-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-transparent"
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 23 23">
                  <path fill="#F25022" d="M0 0h11v11H0z"/>
                  <path fill="#7FBA00" d="M12 0h11v11H12z"/>
                  <path fill="#00A4EF" d="M0 12h11v11H0z"/>
                  <path fill="#FFB900" d="M12 12h11v11H12z"/>
                </svg>
                <span>Microsoft</span>
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={() => invokeSocialSSO("GitHub")}
                disabled={isSubmitting || magicLinkSent}
                className="py-2.5 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-[11px] font-bold text-slate-650 dark:text-gray-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-transparent"
              >
                <Github className="h-4 w-4 text-[#24292E] dark:text-white" />
                <span>GitHub</span>
              </button>

            </div>

            {/* Magic Link warning check statement */}
            <div className="flex gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-gray-100 dark:border-gray-850/60 items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-550 dark:text-gray-400 shrink-0" />
                <span className="text-[10px] text-gray-400 dark:text-gray-400 leading-normal font-sans">
                  We'll send you a secure link to sign in instantly. <b>No password required.</b>
                </span>
              </div>
            </div>

            {/* Bottom link logic */}
            <div className="text-center">
              <span className="text-[11px] text-gray-450 dark:text-gray-550 font-sans">
                New to Eurosia One?{" "}
                <button
                  type="button"
                  onClick={() => {
                    const fallbackMail = `operator_${Date.now()}@eurosia.one`;
                    setEmail(fallbackMail);
                    setInfoMessage(`নতুন ইমেইল বসানো হয়েছে: ${fallbackMail}। সাইন আপ করার জন্য 'Continue with Email' প্রেস করুন।`);
                  }}
                  className="text-red-500 hover:text-red-600 font-bold underline"
                >
                  Create your free account
                </button>
              </span>
            </div>

          </div>
        </div>

        {/* BOTTOM: Beautiful SaaS Pricing Comparison Table Grid (Start for free. Upgrade anytime.) */}
        <div className="w-full max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-850/60">
            <h3 className="text-xs font-black text-slate-800 dark:text-white tracking-wider uppercase font-sans">
              Start for free. Upgrade anytime.
            </h3>
            <span className="text-[9px] font-black tracking-wider uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              Free Plan Included
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 font-sans">
            
            {/* Free */}
            <div className="p-3 bg-white dark:bg-[#0D1222] border border-emerald-250 dark:border-emerald-950/60 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.2 rounded-bl-lg">Active</div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Free</h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5">$0 / month</p>
                <ul className="mt-2 space-y-1 text-[9px] text-gray-500 dark:text-gray-400">
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Limited AI chats</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Basic tools access</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Starter credits</li>
                </ul>
              </div>
            </div>

            {/* Starter */}
            <div className="p-3 bg-white dark:bg-[#090D1B] border border-gray-100 dark:border-gray-850 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-gray-250 uppercase">Starter</h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5">$9 / month</p>
                <ul className="mt-2 space-y-1 text-[9px] text-gray-500 dark:text-gray-400">
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> More AI credits</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Advanced tools</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Priority support</li>
                </ul>
              </div>
            </div>

            {/* Professional */}
            <div className="p-3 bg-white dark:bg-[#090D1B] border border-gray-100 dark:border-gray-850 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-gray-250 uppercase">Professional</h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5">$29 / month</p>
                <ul className="mt-2 space-y-1 text-[9px] text-gray-500 dark:text-gray-400">
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Unlimited AI chats</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> All tools access</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Export & downloads</li>
                </ul>
              </div>
            </div>

            {/* Business */}
            <div className="p-3 bg-white dark:bg-[#090D1B] border border-gray-100 dark:border-gray-850 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-gray-250 uppercase">Business</h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5">$79 / month</p>
                <ul className="mt-2 space-y-1 text-[9px] text-gray-500 dark:text-gray-400">
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Team collaboration</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Shared workspace</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Advanced analytics</li>
                </ul>
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-3 bg-white dark:bg-[#090D1B] border border-gray-100 dark:border-gray-850 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-gray-250 uppercase">Enterprise</h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5">Custom Price</p>
                <ul className="mt-2 space-y-1 text-[9px] text-gray-500 dark:text-gray-400">
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> SSO & API Access</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Custom limits</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> Dedicated support</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Under-grid certifications list */}
          <div className="flex justify-center items-center gap-6 pt-2 text-[10px] text-gray-400 font-sans">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-gray-400" /> Secure
            </span>
            <span className="flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-gray-400" /> Privacy First
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" /> 99.9% Uptime
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
