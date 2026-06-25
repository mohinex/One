import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Lock, KeyRound, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const passwordVal = watch("password", "");

  const onSubmit = async (data: any) => {
    if (!token) {
      setApiError("Reset token context is empty or corrupted.");
      return;
    }

    setApiError(null);
    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: data.password,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setApiError(err.response?.data?.message || err.message || "Failed to update profile passcode.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#060913] px-4 py-12 transition-colors duration-200">
        <div className="w-full max-w-sm p-8 bg-white dark:bg-[#0D121F] border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-none text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900 animate-pulse">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-2xl tracking-tight leading-tight text-gray-900 dark:text-white">
              System Pass Updated
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
              Your security commands are now updated. Active workspace sessions are logged out.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="w-full py-2.5 bg-gray-900 text-xs font-bold text-white uppercase tracking-wider rounded-xl hover:bg-gray-800 block text-center"
            >
              Sign back into Central SSO
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#060913] px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-[#0D121F] border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-none text-left">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-red-650 to-red-500 text-white font-extrabold font-display text-xl mb-3">
            E
          </div>
          <h2 className="font-display font-extrabold text-2xl tracking-tight leading-tight text-gray-900 dark:text-white">
            Set New Secret Pass
          </h2>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            Record a strong security pass to regain command privileges.
          </p>
        </div>

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-250 dark:bg-red-950/20 dark:border-red-900 text-xs font-semibold text-red-600 rounded-xl leading-relaxed">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="password" className="text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">
              New Secret Passphrase
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Index expects at least 6 letters.",
                  },
                })}
                className="w-full border border-gray-250 bg-white pl-10 pr-4 py-2.5 rounded-xl text-xs dark:bg-[#111827] dark:border-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none leading-none placeholder-gray-400"
              />
            </div>
            {errors.password && (
              <p className="text-[10px] font-bold text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">
              Re-type Secret Passphrase
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••••••"
                {...register("confirmPassword", {
                  required: "Re-entering is required",
                  validate: (val) => val === passwordVal || "Passwords are not matchable.",
                })}
                className="w-full border border-gray-250 bg-white pl-10 pr-4 py-2.5 rounded-xl text-xs dark:bg-[#111827] dark:border-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none leading-none placeholder-gray-400"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] font-bold text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-red-600 hover:bg-red-750 disabled:opacity-40 text-xs font-bold text-white uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6"
          >
            {isSubmitting ? "Updating Database..." : "Commit Secret Passphrase"}
          </button>
        </form>
      </div>
    </div>
  );
}
