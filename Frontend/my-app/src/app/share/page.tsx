"use client";

import { FormEvent, useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import { listOrganizations, listProjects, type Organization, type Project } from "@/lib/workspace";
import {
  cancelInvitation, createShare, listGrants, receivedInvitations, respondToInvitation,
  revokeGrant, sentInvitations, type AccessGrant, type ShareInvitation,
} from "@/lib/sharing";

const permissionOptions = ["organization:read", "project:read", "environment:read", "secret:list", "secret:metadata:read", "secret:value:read"];

export default function SharePage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState("share");
  const [received, setReceived] = useState<ShareInvitation[]>([]);
  const [sent, setSent] = useState<ShareInvitation[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [emails, setEmails] = useState("");
  const [orgId, setOrgId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [secretId, setSecretId] = useState("");
  const [role, setRole] = useState("viewer");
  const [permissions, setPermissions] = useState(["organization:read"]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function refresh() {
    if (!accessToken) return;
    const [inbox, sentResult, grantsResult] = await Promise.all([receivedInvitations(accessToken), sentInvitations(accessToken), listGrants(accessToken)]);
    if (inbox.success) setReceived(inbox.data ?? []);
    if (sentResult.success) setSent(sentResult.data ?? []);
    if (grantsResult.success) setGrants(grantsResult.data ?? []);
  }

  useEffect(() => {
    if (!accessToken) return;
    void refresh();
    void listOrganizations(accessToken).then((result) => { if (result.success) setOrganizations(result.data ?? []); });
    void listProjects(accessToken).then((result) => { if (result.success) setProjects(result.data ?? []); });
  }, [accessToken]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    const result = await createShare({
      recipientEmails: emails.split(",").map((email) => email.trim()).filter(Boolean),
      orgId, orgPermissions: permissions,
      projectId: projectId ? [projectId] : [], projectPermissions: projectId ? permissions : [],
      environment: [], secretId: secretId ? [secretId] : [], secretPermission: secretId ? permissions : [],
      role, message,
    }, accessToken);
    setStatus(result.message);
    if (result.success) await refresh();
  }

  async function respond(id: string, action: "accept" | "reject") {
    if (!accessToken) return;
    const result = await respondToInvitation(id, action, accessToken);
    setStatus(result.message);
    await refresh();
  }

  return (
    <WorkspaceShell>
      <header className="workspace-header"><div><p className="section-kicker">Workspace / Sharing</p><h1>Invite and <em>control access.</em></h1></div></header>
      <div className="dashboard-tabs">{["share", "received", "sent", "access"].map((value) => <button className={tab === value ? "active" : ""} key={value} onClick={() => setTab(value)} type="button">{value}</button>)}</div>
      {status ? <p className="workspace-success">{status}</p> : null}
      {tab === "share" ? (
        <section className="dashboard-panel workspace-form-panel"><form className="workspace-form" onSubmit={submit}>
          <label>Recipient emails<input required className="auth-input" value={emails} onChange={(event) => setEmails(event.target.value)} placeholder="user@example.com, other@example.com" /></label>
          <label>Organization<select required className="auth-input" value={orgId} onChange={(event) => { setOrgId(event.target.value); setProjectId(""); }}><option value="">Select organization</option>{organizations.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
          <label>Project <span className="field-optional">optional</span><select className="auth-input" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Organization only</option>{projects.filter((item) => item.orgId === orgId).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
          <label>Specific secret ID <span className="field-optional">optional</span><input className="auth-input" value={secretId} onChange={(event) => setSecretId(event.target.value)} /></label>
          <label>Role<select className="auth-input" value={role} onChange={(event) => setRole(event.target.value)}><option value="viewer">Viewer</option><option value="developer">Developer</option><option value="secretManager">Secret Manager</option><option value="projectAdmin">Project Admin</option></select></label>
          <fieldset><legend>Permissions</legend>{permissionOptions.map((permission) => <label key={permission}><input type="checkbox" checked={permissions.includes(permission)} onChange={() => setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission])} /> {permission}</label>)}</fieldset>
          <label>Message<textarea className="auth-input" value={message} onChange={(event) => setMessage(event.target.value)} /></label>
          <button className="button button-accent workspace-submit" type="submit">Send invitation <span>↗</span></button>
        </form></section>
      ) : tab === "received" ? (
        <section className="dashboard-panel"><h2>Received invitations</h2>{received.map((invitation) => <article className="workspace-note" key={invitation._id}><div><strong>{invitation.role}</strong><small>Status: {invitation.status}</small>{invitation.message ? <p>{invitation.message}</p> : null}</div>{invitation.status === "pending" && <><button className="button" onClick={() => respond(invitation._id, "accept")} type="button">Accept</button><button className="button" onClick={() => respond(invitation._id, "reject")} type="button">Reject</button></>}</article>)}</section>
      ) : tab === "sent" ? (
        <section className="dashboard-panel"><h2>Sent invitations</h2>{sent.map((invitation) => <article className="workspace-note" key={invitation._id}><div><strong>{invitation.recipientEmail}</strong><small>{invitation.role} · {invitation.status}</small></div>{invitation.status === "pending" && <button className="button" onClick={async () => { if (accessToken) { await cancelInvitation(invitation._id, accessToken); await refresh(); } }} type="button">Cancel</button>}</article>)}</section>
      ) : (
        <section className="dashboard-panel"><h2>Effective access</h2>{grants.map((grant) => <article className="workspace-note" key={grant._id}><div><strong>{grant.resourceType}</strong><small>{grant.role} · {grant.status}</small><p>{grant.permissions.join(", ")}</p></div>{grant.status === "active" && <button className="button" onClick={async () => { if (accessToken) { await revokeGrant(grant._id, accessToken); await refresh(); } }} type="button">Revoke</button>}</article>)}</section>
      )}
    </WorkspaceShell>
  );
}
