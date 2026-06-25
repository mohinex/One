import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const triggerVerify = async () => {
      if (!token) {
        setLoading(false);
        setSuccess(false);
        setMessage("Verification parameters are invalid or missing.");
        return;
      }

      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setSuccess(true);
        setMessage(res.data?.message || "Your address has been verified successfully!");
      } catch (err: any) {
        console.error(err);
        setSuccess(false);
        setMessage(err.response?.data?.message || "Invalid or expired email verification token.");
      } finally {
        setLoading(false);
      }
    };

    triggerVerify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#060913] px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-[#0D121F] border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-none text-center space-y-6">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-red-650 to-red-500 text-white font-extrabold font-display text-xl mb-6">
            E
          </div>
          <h2 className="font-display font-extrabold text-2xl tracking-tight leading-tight text-gray-900 dark:text-white">
            Email Node verification
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Synchronizing tokens with Eurosia Cloud...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${
              success 
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border-emerald-100 dark:border-emerald-900" 
                : "bg-red-50 dark:bg-red-950/20 text-red-500 border-red-100 dark:border-red-900"
            }`}>
              {success ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
            </div>

            <p className="text-xs font-semibold text-gray-650 dark:text-gray-350 leading-relaxed max-w-xs mx-auto">
              {message}
            </p>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full py-2.5 bg-gray-900 dark:bg-white dark:text-gray-950 text-xs font-bold text-white uppercase tracking-wider rounded-xl hover:bg-gray-800 block text-center"
              >
                Sign into Eurosia One
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
