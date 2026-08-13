"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, logout, refreshSession, loading, error } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/40">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold">You are signed in.</h1>
        <p className="mt-3 text-slate-400">
          This screen demonstrates the authenticated state after login or OTP
          verification.
        </p>

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
            onClick={handleRefresh}
            disabled={refreshing}
            type="button"
          >
            {refreshing ? "Refreshing..." : "Refresh token"}
          </button>
          <button
            className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
            onClick={() => {
              void logout();
              router.push("/auth/login");
            }}
            type="button"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
