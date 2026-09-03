"use client";

import { FormEvent, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import { createProject, type WorkspaceVisibility } from "@/lib/workspace";

export default function ProjectPage() {
  const { accessToken } = useAuth();
  const [name, setName] = useState("");
  const [orgId, setOrgId] = useState("");
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
      const response = await createProject(
        { name, orgId, description, visibility },
        accessToken,
      );
      if (!response.success) {
        setError(response.message);
        return;
      }
      setStatus(response.message || "Project created successfully.");
      setName("");
      setOrgId("");
      setDescription("");
      setVisibility("private");
    } catch {
      setError(
        "The project could not be created. Check that the API is running.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WorkspaceShell>
      <header className="workspace-header">
        <div>
          <p className="section-kicker">Workspace / Projects</p>
          <h1>
            Ship with a <em>clean boundary.</em>
          </h1>
          <p className="dashboard-muted">
            Projects connect your application to the environments and secrets it
            needs.
          </p>
        </div>
        <span className="workspace-chip">
          <i /> Protected route
        </span>
      </header>
      <div className="workspace-content-grid">
        <section className="dashboard-panel workspace-form-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">New project</p>
              <h2>Register an application</h2>
            </div>
            <span className="workspace-index">02 / 02</span>
          </div>
          <form className="workspace-form" onSubmit={handleSubmit}>
            <label>
              Project name
              <input
                className="auth-input"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="payments-api"
              />
            </label>
            <label>
              Organization ID
              <input
                className="auth-input workspace-mono-input"
                required
                value={orgId}
                onChange={(event) => setOrgId(event.target.value)}
                placeholder="64f1..."
              />
              <small className="field-help">
                Use the MongoDB ID of the organization that owns this project.
              </small>
            </label>
            <label>
              Description <span className="field-optional">optional</span>
              <textarea
                className="auth-input workspace-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Core payments service and its deployment environments"
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
              {submitting ? "Creating..." : "Create project"}
              <span>↗</span>
            </button>
          </form>
        </section>
        <aside className="workspace-aside">
          <p className="section-kicker">Project anatomy</p>
          <h2>One project. Every environment.</h2>
          <p>
            Keep production, staging, and development configuration organized
            under the application that uses it.
          </p>
          <div className="workspace-terminal">
            <span>$ vaultsync project init</span>
            <b>✓ access boundary ready</b>
            <small>production / staging / development</small>
          </div>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
