import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 p-10 shadow-2xl shadow-black/40">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
          Secret Management System
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
          Secure authentication for your vault.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-400">
          Sign up, verify your email, log in, refresh your access token, and
          sign out from the dashboard.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded-xl bg-cyan-500 px-5 py-3 text-center font-semibold text-slate-950 transition hover:bg-cyan-400"
            href="/auth/signup"
          >
            Create account
          </Link>
          <Link
            className="rounded-xl border border-slate-700 px-5 py-3 text-center font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
            href="/auth/login"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
