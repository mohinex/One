import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: any) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: data.email });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setApiError(err.response?.data?.message || err.message || "Failed to trigger passphrase recovery.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#060913] px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-[#0D121F] border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-none text-left">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 uppercase tracking-widest mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Command Central</span>
          </Link>
          <h2 className="font-display font-extrabold text-2xl tracking-tight leading-tight text-gray-900 dark:text-white">
            Reset System Secret
          </h2>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Deploy recovery instructions to re-authenticate command privileges
          </p>
        </div>

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-250 dark:bg-red-950/20 dark:border-red-900 text-xs font-semibold text-red-600 rounded-xl leading-relaxed">
            {apiError}
          </div>
        )}

        {success ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-350 leading-relaxed max-w-xs mx-auto">
                If the email address exists in Eurosia Central, a secure link has been dispatched to update your passphrase.
              </p>
              <p className="text-[10px] text-gray-400 font-medium">
                Verify spam or junk folders if notification does not arrive shortly.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">
                Authorized Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@domain.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Incorrect system email syntax.",
                    },
                  })}
                  className="w-full border border-gray-250 bg-white pl-10 pr-4 py-2.5 rounded-xl text-xs dark:bg-[#111827] dark:border-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none leading-none placeholder-gray-400"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-red-600 hover:bg-red-750 disabled:opacity-40 text-xs font-bold text-white uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6"
            >
              {isSubmitting ? "Dispatched Queries..." : "Dispatch Password Instructions"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
