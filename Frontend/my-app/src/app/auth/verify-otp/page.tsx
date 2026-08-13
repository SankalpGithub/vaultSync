"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/context/AuthContext";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, resendOtp, pendingEmail, error } = useAuth();
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = searchParams.get("email") ?? pendingEmail ?? "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await verifyOtp(email, otp);
      router.push("/dashboard");
    } catch {
      // Error is surfaced from context.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/40">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
            Verify email
          </p>
          <h1 className="mt-2 text-3xl font-semibold">One-time password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter the OTP sent to {email || "your email"}.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-cyan-400"
            placeholder="Enter OTP"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            required
          />

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <button
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <button
          className="mt-4 w-full rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
          onClick={() => resendOtp(email)}
          type="button"
        >
          Resend OTP
        </button>
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          Loading...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
