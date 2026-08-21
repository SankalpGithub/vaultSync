"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
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
    <main className="auth-shell">
      <Link className="auth-brand" href="/">
        <span className="brand-mark">V</span>VaultSync
        <span className="brand-dot">.</span>
      </Link>
      <div className="auth-layout otp-layout">
        <section className="auth-aside">
          <p className="section-kicker">One last step</p>
          <h1>
            Verify your
            <br />
            <em>workspace.</em>
          </h1>
          <p>
            A quick confirmation keeps your vault access tied to a real,
            verified identity.
          </p>
          <div className="auth-aside-note">
            <span>01</span>
            <div>
              <strong>Protected from day one</strong>
              <small>Verification helps keep unauthorized users out.</small>
            </div>
          </div>
        </section>
        <section className="auth-card otp-card">
          <div className="auth-card-heading">
            <p className="section-kicker">Email verification / 02</p>
            <h2>Check your inbox</h2>
            <p>
              Enter the one-time password we sent to{" "}
              <strong className="otp-email">{email || "your email"}</strong>.
            </p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              One-time password
              <input
                className="auth-input otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                required
              />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button
              className="button button-accent auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify email"}
              <span>↗</span>
            </button>
          </form>
          <button
            className="otp-resend"
            onClick={() => resendOtp(email)}
            type="button"
          >
            Didn&apos;t receive it? <span>Resend OTP →</span>
          </button>
          <p className="auth-switch">
            <Link href="/auth/signup">← Back to sign up</Link>
          </p>
        </section>
      </div>
      <p className="auth-footnote">
        VaultSync keeps your credentials private.{" "}
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell auth-loading">
          <span className="brand-mark">V</span>
          <p>Loading secure verification...</p>
        </main>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
