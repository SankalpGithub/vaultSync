"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, error } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(form);
      router.push("/dashboard");
    } catch {
      // Error is shown from auth context.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/40">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">
            Access your secure vault and manage your sessions.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none ring-0 transition focus:border-cyan-400"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            required
          />
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none ring-0 transition focus:border-cyan-400"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            required
          />

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <button
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New here?{" "}
          <Link className="font-semibold text-cyan-400" href="/auth/signup">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
