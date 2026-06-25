import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { User, Mail, Lock, KeyRound, CheckCircle2, ShieldCheck } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form hooks
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordVal = watch("password", "");

  // Real-time password strength meter helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: "", color: "bg-gray-200", percent: 0, rating: 0 };
    let rating = 0;
    if (pwd.length >= 6) rating += 1;
    if (pwd.length >= 10) rating += 1;
    if (/[A-Z]/.test(pwd)) rating += 1;
    if (/[0-9]/.test(pwd)) rating += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) rating += 1;

    switch (rating) {
      case 0:
      case 1:
        return { label: "Weak Security", color: "bg-red-500", percent: 20, rating };
      case 2:
      case 3:
        return { label: "Moderate Safety", color: "bg-amber-500", percent: 60, rating };
      default:
        return { label: "Strategic Strength", color: "bg-emerald-500", percent: 100, rating };
    }
  };

  const strength = getPasswordStrength(passwordVal);

  const onSubmit = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      setApiError("Password parameters do not match.");
      return;
    }

    setApiError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      setSuccessMsg(res.data?.message || "Registration completed. Please inspect your inbox for verification.");
    } catch (err: any) {
      console.error(err);
      setApiError(err.response?.data?.message || err.message || "Failed to initialize active node user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#060913] px-4 py-12 transition-colors duration-200">
        <div className="w-full max-w-md p-8 bg-white dark:bg-[#0D121F] border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-none text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900 animate-pulse">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-2xl tracking-tight leading-tight text-gray-900 dark:text-white">
              Check Your Inbox
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              {successMsg}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="px-6 py-2.5 bg-gray-900 max-w-xs mx-auto text-xs font-bold text-white uppercase tracking-wider rounded-xl hover:bg-gray-800 block text-center"
            >
              Back to SSO Sign-in
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-red-650 to-red-500 text-white font-extrabold font-display text-xl shadow-lg shadow-red-500/10 glow-active mb-3">
            E
          </div>
          <h2 className="font-display font-extrabold text-2xl tracking-tight leading-tight text-gray-900 dark:text-white">
            Operator Enrollment
          </h2>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium font-sans">
            Deploy your secure profile node into the Eurosia OS environment
          </p>
        </div>

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-250 dark:bg-red-950/20 dark:border-red-900 text-xs font-semibold text-red-600 rounded-xl leading-relaxed">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">
              Human/Display Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <User className="h-4 w-4" />
              </span>
              <input
                id="name"
                type="text"
                placeholder="Chief Architect"
                {...register("name", { required: "Name token is required" })}
                className="w-full border border-gray-250 bg-white pl-10 pr-4 py-2.5 rounded-xl text-xs dark:bg-[#111827] dark:border-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none leading-none placeholder-gray-400"
              />
            </div>
            {errors.name && (
              <p className="text-[10px] font-bold text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">
              Primary Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="email"
                type="email"
                placeholder="architect@eurosia.one"
                {...register("email", {
                  required: "Email parameter is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email formatting is incorrect",
                  },
                })}
                className="w-full border border-gray-250 bg-white pl-10 pr-4 py-2.5 rounded-xl text-xs dark:bg-[#111827] dark:border-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none leading-none placeholder-gray-400"
              />
            </div>
            {errors.email && (
              <p className="text-[10px] font-bold text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">
              Secret Passphrase
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
                  required: "Password parameter is required",
                  minLength: {
                    value: 6,
                    message: "Safety index expects at least 6 letters",
                  },
                })}
                className="w-full border border-gray-250 bg-white pl-10 pr-4 py-2.5 rounded-xl text-xs dark:bg-[#111827] dark:border-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none leading-none placeholder-gray-400"
              />
            </div>
            {errors.password && (
              <p className="text-[10px] font-bold text-red-500 mt-1">{errors.password.message}</p>
            )}

            {/* PASSWORD STRENGTH Visual meter */}
            {passwordVal && (
              <div className="mt-1.5 space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-gray-400">Security Index</span>
                  <span className={strength.rating >= 4 ? "text-emerald-500" : strength.rating >= 2 ? "text-amber-500" : "text-red-500"}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">
              Re-type Passphrase
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
                  validate: (val) => val === passwordVal || "Passwords are not matchable",
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
            {isSubmitting ? "Processing Node..." : "Provision Operator Account"}
          </button>
        </form>

        <div className="border-t border-gray-150 dark:border-gray-800/80 pt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Existing Command Operator?{" "}
            <Link
              to="/login"
              className="text-red-500 font-bold hover:text-red-600"
            >
              Sign into Central Node
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
