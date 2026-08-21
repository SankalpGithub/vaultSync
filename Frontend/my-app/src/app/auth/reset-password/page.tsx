"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setValidationError("");

    if (form.password.length < 8) {
      setValidationError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    // try {
    //   await resetPassword({
    //     password: form.password,
    //     confirmPassword: form.confirmPassword,
    //   });

    //   router.push("/auth/login");
    // } catch {
    //   // Error is shown from auth context.
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  return (
    <main className="auth-shell">
      <Link className="auth-brand" href="/">
        <span className="brand-mark">V</span>
        VaultSync
        <span className="brand-dot">.</span>
      </Link>

      <div className="auth-layout">
        {/* Editorial section */}
        <section className="auth-aside">
          <p className="section-kicker">Account recovery</p>

          <h1>
            Protect your vault
            <br />
            <em>with a new key.</em>
          </h1>

          <p>
            Create a strong new password to keep your VaultSync workspace
            protected and your secrets secure.
          </p>

          <div className="auth-aside-note">
            <span>⌁</span>

            <div>
              <strong>Security first</strong>
              <small>
                Choose a unique password that you do not use anywhere else.
              </small>
            </div>
          </div>
        </section>

        {/* Reset password form */}
        <section className="auth-card">
          <div className="auth-card-heading">
            <p className="section-kicker">Vault access / 02</p>

            <h2>Reset password</h2>

            <p>Enter your new password below to secure your account.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              New password
              <input
                className="auth-input"
                placeholder="Enter your new password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({
                    ...form,
                    password: event.target.value,
                  })
                }
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>

            <label>
              Confirm password
              <input
                className="auth-input"
                placeholder="Confirm your new password"
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm({
                    ...form,
                    confirmPassword: event.target.value,
                  })
                }
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>

            <p className="auth-helper">
              Use at least 8 characters. A unique password is recommended.
            </p>

            {validationError ? (
              <p className="auth-error">{validationError}</p>
            ) : null}

            {/* {error ? <p className="auth-error">{error}</p> : null} */}

            <button
              className="button button-accent auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating password..." : "Update password"}

              <span>↗</span>
            </button>
          </form>

          <p className="auth-switch">
            Remember your password?{" "}
            <Link href="/auth/login">
              Back to sign in <span>→</span>
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
