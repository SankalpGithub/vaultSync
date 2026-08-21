"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
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
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <a className="is-active" href="#overview">
            <span>◈</span>Overview
          </a>
          <a href="#vaults">
            <span>◇</span>Vaults
          </a>
          <a href="#activity">
            <span>◷</span>Activity
          </a>
          <a href="#team">
            <span>◎</span>Team access
          </a>
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
      <section className="dashboard-main" id="overview">
        <header className="dashboard-header">
          <div>
            <p className="section-kicker">Tuesday, August 20, 2026</p>
            <h1>Good to see you back.</h1>
            <p className="dashboard-muted">
              Here&apos;s what&apos;s happening across your secure workspace.
            </p>
          </div>
          <div className="dashboard-user">
            <span>SS</span>
            <div>
              <strong>Sankalp</strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>
        {error ? <p className="dashboard-error">{error}</p> : null}
        <div className="dashboard-stats">
          <div>
            <span>Protected secrets</span>
            <strong>24</strong>
            <small>
              <b>+4</b> this month
            </small>
          </div>
          <div>
            <span>Active vaults</span>
            <strong>03</strong>
            <small>Across 3 environments</small>
          </div>
          <div>
            <span>Team members</span>
            <strong>08</strong>
            <small>All access reviewed</small>
          </div>
          <div>
            <span>Last activity</span>
            <strong>2m</strong>
            <small>Everything is up to date</small>
          </div>
        </div>
        <div className="dashboard-grid">
          <section className="dashboard-panel vault-panel" id="vaults">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Your vaults</p>
                <h2>Environment overview</h2>
              </div>
              <button className="panel-action" type="button">
                + New vault
              </button>
            </div>
            <div className="environment-list">
              <div className="environment-row">
                <span className="environment-icon production">●</span>
                <div>
                  <strong>Production</strong>
                  <small>12 secrets · Updated 2 min ago</small>
                </div>
                <span className="environment-count">
                  12 <b>protected</b>
                </span>
                <span className="row-arrow">↗</span>
              </div>
              <div className="environment-row">
                <span className="environment-icon staging">●</span>
                <div>
                  <strong>Staging</strong>
                  <small>08 secrets · Updated 1 hour ago</small>
                </div>
                <span className="environment-count">
                  08 <b>protected</b>
                </span>
                <span className="row-arrow">↗</span>
              </div>
              <div className="environment-row">
                <span className="environment-icon development">●</span>
                <div>
                  <strong>Development</strong>
                  <small>04 secrets · Updated yesterday</small>
                </div>
                <span className="environment-count">
                  04 <b>protected</b>
                </span>
                <span className="row-arrow">↗</span>
              </div>
            </div>
          </section>
          <section className="dashboard-panel activity-panel" id="activity">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Audit trail</p>
                <h2>Recent activity</h2>
              </div>
              <a className="panel-link" href="#activity">
                View all →
              </a>
            </div>
            <div className="activity-list">
              <div>
                <span className="activity-dot orange-dot" />
                <p>
                  <strong>Sankalp</strong> accessed <b>DATABASE_URL</b>
                  <small>12:42 PM · Production</small>
                </p>
              </div>
              <div>
                <span className="activity-dot lime-dot" />
                <p>
                  <strong>Rahul</strong> updated <b>STRIPE_SECRET_KEY</b>
                  <small>12:38 PM · Production</small>
                </p>
              </div>
              <div>
                <span className="activity-dot muted-dot" />
                <p>
                  <strong>Admin</strong> created production vault
                  <small>11:17 AM · Workspace</small>
                </p>
              </div>
            </div>
          </section>
        </div>
        <section className="dashboard-panel secure-panel" id="team">
          <div>
            <p className="section-kicker">Security pulse</p>
            <h2>Your workspace is in good shape.</h2>
            <p>
              All vaults are encrypted and your team access was last reviewed
              today.
            </p>
          </div>
          <div className="security-meter">
            <span>92</span>
            <small>security score</small>
            <div>
              <i />
            </div>
          </div>
        </section>
        <div className="dashboard-actions">
          <button
            className="button button-accent"
            onClick={handleRefresh}
            disabled={refreshing}
            type="button"
          >
            {refreshing ? "Refreshing..." : "Refresh session"}
            <span>↻</span>
          </button>
          <span>
            Session status: <b>active</b> · Token refreshed automatically
          </span>
        </div>
      </section>
    </main>
  );
}
