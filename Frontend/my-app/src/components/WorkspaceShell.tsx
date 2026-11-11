"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loading, logout } = useAuth();

  if (!loading && !isAuthenticated) {
    router.replace("/auth/login");
    return null;
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="auth-brand" href="/">
          <span className="brand-mark">V</span>VaultSync
          <span className="brand-dot">.</span>
        </Link>
        <div className="sidebar-project">
          <span className="section-kicker">Workspace</span>
          <strong>MY-API</strong>
          <small>Personal workspace</small>
        </div>
        <nav className="dashboard-nav" aria-label="Workspace navigation">
          <Link className="is-active" href="/dashboard">
            <span>◈</span>Overview
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-status">
            <i /> All systems secure
          </span>
          <button
            className="sidebar-logout"
            onClick={() => {
              void logout();
              router.push("/auth/login");
            }}
            type="button"
          >
            Log out <span>↗</span>
          </button>
        </div>
      </aside>
      <section className="dashboard-main workspace-main">{children}</section>
    </main>
  );
}
