import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { api } from "../../lib/api";
import { Shield, KeyRound, Lock, User, Terminal, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAccessToken, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      
      if (response.data?.data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTempToken(response.data.data.tempToken);
        toast("Multi-factor authentication required. Please enter your TOTP code.");
      } else {
        const token = response.data?.data?.accessToken;
        const user = response.data?.data?.user;

        if (token && user) {
          if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
            setAuthError("Access Restricted: Operator role is insufficient.");
            toast.error("Access Forbidden: Administrators only.");
            return;
          }

          setAccessToken(token);
          setUser(user);
          toast.success(`Welcome back, ${user.name || "Administrator"}`);
          navigate("/admin/dashboard");
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Authentication handshaking failed.";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit authorization sequence.");
      return;
    }
    setIsLoading(true);
    setAuthError("");

    try {
      const response = await api.post("/auth/2fa/validate", {
        tempToken,
        code,
      });

      const token = response.data?.data?.accessToken;
      const user = response.data?.data?.user;

      if (token && user) {
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
          setAuthError("Access Restricted: Operator role is insufficient.");
          toast.error("Access Forbidden.");
          return;
        }

        setAccessToken(token);
        setUser(user);
        toast.success(`Encrypted connection established. Welcome ${user.name}`);
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid security code verification code.";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#E2E8F0] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background radial overlays */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950/40 to-black pointer-events-none z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-red-655/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-650/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Indicator */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-red-650 to-red-500 text-white flex items-center justify-center font-display font-extrabold text-2xl shadow-xl shadow-red-500/15 mb-4 animate-pulse">
            E
          </div>
          <h2 className="font-display font-black text-2xl tracking-tight text-white flex items-center gap-2">
            EUROSIA <span className="text-red-550 font-medium text-lg leading-none border border-red-500/20 px-1.5 py-0.5 rounded bg-red-950/20">ONE</span>
          </h2>
          <p className="text-gray-500 text-xs font-mono font-bold uppercase tracking-widest mt-1.5">
            Admin Cryptographic Gateway
          </p>
        </div>

        {/* Access denied warnings */}
        {authError && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-xs font-semibold text-red-400 flex items-start gap-3">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Handshake Denied</p>
              <p className="font-medium mt-0.5 opacity-90">{authError}</p>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-md">
          {!requiresTwoFactor ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">
                  Administrator ID (Email)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="architect@eurosia.one"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">
                  Access Passphrase
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-750 disabled:opacity-40 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-650/10 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking Credentials...
                  </>
                ) : (
                  <>
                    Init Session Handshake
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div>
                <div className="flex flex-col items-center text-center pb-2">
                  <Shield className="h-10 w-10 text-red-500 mb-2" />
                  <h4 className="text-white font-bold text-sm tracking-tight">Two-Factor Key Required</h4>
                  <p className="text-gray-400 text-[11px] font-medium leading-relaxed mt-1">
                    Enter the rotating verification code generated from your authenticator app below.
                  </p>
                </div>

                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono text-left mt-2">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000 000"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-center tracking-[12px] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-750 disabled:opacity-40 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-650/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying Token...
                    </>
                  ) : (
                    <>
                      Verify Passcode
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRequiresTwoFactor(false)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer font-mono"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Credentials
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Notes */}
        <p className="text-center text-[10px] font-semibold text-gray-600 font-mono mt-8 select-none border-t border-slate-900 pt-4 uppercase tracking-widest">
          Sovereign Console Area. Authorized operators only. IP: [Logged]
        </p>
      </div>
    </div>
  );
}
