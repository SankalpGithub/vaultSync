"use client";

import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import {
  cancelInvitation,
  listGrants,
  receivedInvitations,
  respondToInvitation,
  revokeGrant,
  sentInvitations,
  type AccessGrant,
  type ShareInvitation,
} from "@/lib/sharing";

type ShareTab = "received" | "sent" | "access";

export default function SharePage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<ShareTab>("received");
  const [received, setReceived] = useState<ShareInvitation[]>([]);
  const [sent, setSent] = useState<ShareInvitation[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [status, setStatus] = useState("");

  async function refresh() {
    if (!accessToken) return;
    const [inbox, sentResult, grantsResult] = await Promise.all([
      receivedInvitations(accessToken),
      sentInvitations(accessToken),
      listGrants(accessToken),
    ]);
    if (inbox.success) setReceived(inbox.data ?? []);
    if (sentResult.success) setSent(sentResult.data ?? []);
    if (grantsResult.success) setGrants(grantsResult.data ?? []);
  }

  useEffect(() => {
    const token = accessToken ?? "";
    if (!token) return;
    let cancelled = false;
    async function loadInvitations() {
      const [inbox, sentResult, grantsResult] = await Promise.all([
        receivedInvitations(token),
        sentInvitations(token),
        listGrants(token),
      ]);
      if (cancelled) return;
      if (inbox.success) setReceived(inbox.data ?? []);
      if (sentResult.success) setSent(sentResult.data ?? []);
      if (grantsResult.success) setGrants(grantsResult.data ?? []);
    }
    void loadInvitations();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function respond(id: string, action: "accept" | "reject") {
    if (!accessToken) return;
    const result = await respondToInvitation(id, action, accessToken);
    setStatus(result.message);
    await refresh();
  }

  async function cancel(id: string) {
    if (!accessToken) return;
    const result = await cancelInvitation(id, accessToken);
    setStatus(result.message);
    await refresh();
  }

  async function revoke(id: string) {
    if (!accessToken) return;
    const result = await revokeGrant(id, accessToken);
    setStatus(result.message);
    await refresh();
  }

  return (
    <WorkspaceShell>
      <header className="workspace-header">
        <div>
          <p className="section-kicker">Workspace / Invitations</p>
          <h1>
            Review <em>access requests.</em>
          </h1>
        </div>
      </header>
      <div className="dashboard-tabs">
        {(["received", "sent", "access"] as const).map((value) => (
          <button
            className={tab === value ? "active" : ""}
            key={value}
            onClick={() => setTab(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
      {status ? <p className="workspace-success">{status}</p> : null}
      {tab === "received" ? (
        <section className="dashboard-panel">
          <h2>Received invitations</h2>
          {received.map((invitation) => (
            <article className="workspace-note" key={invitation._id}>
              <div>
                <strong>{invitation.role}</strong>
                <small>Status: {invitation.status}</small>
                {invitation.message ? <p>{invitation.message}</p> : null}
              </div>
              {invitation.status === "pending" ? (
                <>
                  <button
                    className="button"
                    onClick={() => void respond(invitation._id, "accept")}
                    type="button"
                  >
                    Accept
                  </button>
                  <button
                    className="button"
                    onClick={() => void respond(invitation._id, "reject")}
                    type="button"
                  >
                    Reject
                  </button>
                </>
              ) : null}
            </article>
          ))}
        </section>
      ) : tab === "sent" ? (
        <section className="dashboard-panel">
          <h2>Sent invitations</h2>
          {sent.map((invitation) => (
            <article className="workspace-note" key={invitation._id}>
              <div>
                <strong>{invitation.recipientEmail}</strong>
                <small>
                  {invitation.role} · {invitation.status}
                </small>
              </div>
              {invitation.status === "pending" ? (
                <button
                  className="button"
                  onClick={() => void cancel(invitation._id)}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <section className="dashboard-panel">
          <h2>Effective access</h2>
          {grants.map((grant) => (
            <article className="workspace-note" key={grant._id}>
              <div>
                <strong>{grant.resourceType}</strong>
                <small>
                  {grant.role} · {grant.status}
                </small>
                <p>{grant.permissions.join(", ")}</p>
              </div>
              {grant.status === "active" ? (
                <button
                  className="button"
                  onClick={() => void revoke(grant._id)}
                  type="button"
                >
                  Revoke
                </button>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </WorkspaceShell>
  );
}
