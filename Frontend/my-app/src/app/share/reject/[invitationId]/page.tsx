"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import { respondToInvitation } from "@/lib/sharing";

export default function RejectSharedInvitationPage() {
  const params = useParams<{ invitationId: string }>();
  const router = useRouter();
  const { accessToken, loading } = useAuth();
  const [message, setMessage] = useState("Rejecting invitation...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(`/share/reject/${params.invitationId}`)}`);
      return;
    }

    void respondToInvitation(params.invitationId, "reject", accessToken).then((result) => {
      if (result.success) setMessage("Invitation rejected.");
      else setError(result.message);
    });
  }, [accessToken, loading, params.invitationId, router]);

  return (
    <WorkspaceShell>
      <section className="dashboard-panel workspace-form-panel">
        <p className="section-kicker">Shared access</p>
        <h1>Invitation declined</h1>
        {message ? <p className="workspace-success">{message}</p> : null}
        {error ? <p className="workspace-error">{error}</p> : null}
        <Link className="button" href="/share">Return to sharing</Link>
      </section>
    </WorkspaceShell>
  );
}
