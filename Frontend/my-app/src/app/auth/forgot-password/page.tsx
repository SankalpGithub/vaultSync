"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword, error } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const message = await forgotPassword(email);
      setSuccessMessage(`${message}. Check your inbox for the reset link.`);
    } catch {
      // Error is surfaced from the auth context.
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
      <div className="auth-layout forgot-layout">
        <section className="auth-aside">
          <p className="section-kicker">Account recovery</p>
          <h1>
            Keep moving,
            <br />
            <em>securely.</em>
          </h1>
          <p>
            We&apos;ll send a private reset link to your verified email address
            so you can get back into your workspace.
          </p>
          <div className="auth-aside-note">
            <span>⌁</span>
            <div>
              <strong>Your secrets stay protected</strong>
              <small>Reset links expire after 15 minutes.</small>
            </div>
          </div>
        </section>
        <section className="auth-card">
          <div className="auth-card-heading">
            <p className="section-kicker">Password recovery / 01</p>
            <h2>Forgot password?</h2>
            <p>Enter the email linked to your VaultSync account.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                className="auth-input"
                placeholder="you@company.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button
              className="button button-accent auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending email..." : "Send reset email"}
              <span>↗</span>
            </button>
          </form>
          {successMessage ? (
            <p className="auth-success" role="status">
              {successMessage}
            </p>
          ) : null}
          <p className="auth-switch">
            <Link href="/auth/login">← Back to sign in</Link>
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
