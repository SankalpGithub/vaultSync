"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import { respondToInvitation } from "@/lib/sharing";

export default function AcceptSharedInvitationPage() {
  const params = useParams<{ invitationId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken, loading } = useAuth();
  const [status, setStatus] = useState("Checking invitation...");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [sharedSecretsProjectId, setSharedSecretsProjectId] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      const returnUrl = `/share/accept/${params.invitationId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    let active = true;
    void respondToInvitation(
      params.invitationId,
      "accept",
      accessToken,
      searchParams.get("token") ?? undefined,
    ).then((result) => {
      if (!active) return;
      if (result.success) {
        setAccepted(true);
        setSharedSecretsProjectId(
          result.data?.secretProjectIds?.[0] ?? "",
        );
        setStatus("Invitation accepted. Your shared resources are now available.");
      } else {
        setError(result.message);
        setStatus("");
      }
    });

    return () => {
      active = false;
    };
  }, [accessToken, loading, params.invitationId, router, searchParams]);

  return (
    <WorkspaceShell>
      <section className="dashboard-panel workspace-form-panel">
        <p className="section-kicker">Shared access</p>
        <h1>{accepted ? "Access accepted" : "Invitation"}</h1>
        {status ? <p className="workspace-success">{status}</p> : null}
        {error ? <p className="workspace-error">{error}</p> : null}
        <div className="workspace-actions">
          {accepted ? (
            <Link
              className="button button-accent"
              href={
                sharedSecretsProjectId
                  ? `/secrets?projectId=${encodeURIComponent(sharedSecretsProjectId)}`
                  : "/dashboard"
              }
            >
              View shared resources
            </Link>
          ) : null}
          <Link className="button" href="/share">Manage sharing</Link>
        </div>
      </section>
    </WorkspaceShell>
  );
}
