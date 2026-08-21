"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup, error } = useAuth();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signup(form);
      router.push(`/auth/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch {
      // Error is surfaced in the auth context.
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
      <div className="auth-layout signup-layout">
        <section className="auth-aside">
          <p className="section-kicker">Create your workspace</p>
          <h1>
            Put your secrets
            <br />
            <em>in their place.</em>
          </h1>
          <p>
            One calm, secure home for the credentials your applications rely on.
          </p>
          <div className="auth-aside-list">
            <span>01</span>
            <p>Build a vault for every project and environment.</p>
            <span>02</span>
            <p>Invite your team with clear access controls.</p>
            <span>03</span>
            <p>Ship without putting secrets in Git.</p>
          </div>
        </section>
        <section className="auth-card">
          <div className="auth-card-heading">
            <p className="section-kicker">New workspace / 01</p>
            <h2>Sign up</h2>
            <p>Register your account and verify your email to begin.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-row">
              <label>
                Full name
                <input
                  className="auth-input"
                  placeholder="Sankalp Sharma"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Username
                <input
                  className="auth-input"
                  placeholder="sankalp"
                  value={form.username}
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                  required
                />
              </label>
            </div>
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
                placeholder="Create a strong password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                required
              />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button
              className="button button-accent auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
              <span>↗</span>
            </button>
          </form>
          <p className="auth-switch">
            Already have an account?{" "}
            <Link href="/auth/login">
              Sign in <span>→</span>
            </Link>
          </p>
        </section>
      </div>
      <p className="auth-footnote">
        By continuing, you agree to keep your workspace secure.{" "}
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
