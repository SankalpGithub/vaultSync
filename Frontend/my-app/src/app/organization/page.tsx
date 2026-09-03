"use client";

import { FormEvent, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import { createOrganization, type WorkspaceVisibility } from "@/lib/workspace";

export default function OrganizationPage() {
  const { accessToken } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<WorkspaceVisibility>("private");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await createOrganization(
        { name, description, visibility },
        accessToken,
      );
      if (!response.success) {
        setError(response.message);
        return;
      }
      setStatus(response.message || "Organization created successfully.");
      setName("");
      setDescription("");
      setVisibility("private");
    } catch {
      setError(
        "The organization could not be created. Check that the API is running.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WorkspaceShell>
      <header className="workspace-header">
        <div>
          <p className="section-kicker">Workspace / Organizations</p>
          <h1>
            Give your team a <em>secure home.</em>
          </h1>
          <p className="dashboard-muted">
            Create an isolated boundary for people, projects, and access
            policies.
          </p>
        </div>
        <span className="workspace-chip">
          <i /> Authenticated
        </span>
      </header>
      <div className="workspace-content-grid">
        <section className="dashboard-panel workspace-form-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">New organization</p>
              <h2>Set the boundary</h2>
            </div>
            <span className="workspace-index">01 / 02</span>
          </div>
          <form className="workspace-form" onSubmit={handleSubmit}>
            <label>
              Organization name
              <input
                className="auth-input"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="acme-platform"
              />
            </label>
            <label>
              Description <span className="field-optional">optional</span>
              <textarea
                className="auth-input workspace-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="The team that owns our production systems"
                rows={4}
              />
            </label>
            <fieldset>
              <legend>Visibility</legend>
              <div className="visibility-options">
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                  />
                  <span>
                    <strong>Private</strong>
                    <small>Owner access only until shared.</small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    value="internal"
                    checked={visibility === "internal"}
                    onChange={() => setVisibility("internal")}
                  />
                  <span>
                    <strong>Internal</strong>
                    <small>Available to your organization.</small>
                  </span>
                </label>
              </div>
            </fieldset>
            {error ? (
              <p className="workspace-error" role="alert">
                {error}
              </p>
            ) : null}
            {status ? (
              <p className="workspace-success" role="status">
                {status}
              </p>
            ) : null}
            <button
              className="button button-accent workspace-submit"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Creating..." : "Create organization"}
              <span>↗</span>
            </button>
          </form>
        </section>
        <aside className="workspace-aside">
          <p className="section-kicker">Why organizations?</p>
          <h2>Keep access close to the work.</h2>
          <p>
            Organizations are the top-level container for your projects. Start
            private, then make collaboration explicit when your team is ready.
          </p>
          <div className="workspace-note">
            <span>◎</span>
            <div>
              <strong>Designed for least privilege</strong>
              <small>Every project belongs to one clear owner boundary.</small>
            </div>
          </div>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
