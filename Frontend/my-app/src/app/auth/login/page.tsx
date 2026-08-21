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
    <main className="auth-shell">
      <Link className="auth-brand" href="/">
        <span className="brand-mark">V</span>VaultSync
        <span className="brand-dot">.</span>
      </Link>
      <div className="auth-layout">
        <section className="auth-aside">
          <p className="section-kicker">Welcome back</p>
          <h1>
            Your secrets are
            <br />
            <em>waiting safely.</em>
          </h1>
          <p>
            Access your secure vault and keep your team moving with confidence.
          </p>
          <div className="auth-aside-note">
            <span>⌁</span>
            <div>
              <strong>Encrypted by default</strong>
              <small>Your credentials stay out of your codebase.</small>
            </div>
          </div>
        </section>
        <section className="auth-card">
          <div className="auth-card-heading">
            <p className="section-kicker">Vault access / 01</p>
            <h2>Sign in</h2>
            <p>Enter your details to access your secure workspace.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                className="auth-input"
                placeholder="you@company.com"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
              />
            </label>
            <label>
              Password
              <input
                className="auth-input"
                placeholder="Enter your password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                required
              />
            </label>
            <div className="auth-forgot-row">
              <span />
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </div>
            {error ? <p className="auth-error">{error}</p> : null}
            <button
              className="button button-accent auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              <span>↗</span>
            </button>
          </form>
          <p className="auth-switch">
            New here?{" "}
            <Link href="/auth/signup">
              Create an account <span>→</span>
            </Link>
          </p>
        </section>
      </div>
      <p className="auth-footnote">
        Secure secret management for modern applications.{" "}
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
