"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import {
  createOrganization,
  createProject,
  deleteOrganization,
  deleteProject,
  listOrganizations,
  listProjects,
  type Organization,
  type Project,
  type WorkspaceVisibility,
} from "@/lib/workspace";

type Panel = "organization" | "project" | null;

type FormProps = {
  accessToken: string | null;
  onComplete: (message: string) => Promise<void>;
  onError: (message: string) => void;
};

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, refreshSession } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const selectedOrganization = organizations.find(
    (organization) => organization._id === selectedOrganizationId,
  );
  const visibleProjects = useMemo(
    () =>
      projects.filter((project) => project.orgId === selectedOrganizationId),
    [projects, selectedOrganizationId],
  );

  const loadWorkspace = useCallback(
    async (showSpinner = true) => {
      if (!accessToken) return;
      if (showSpinner) setLoading(true);
      setError("");
      try {
        const [organizationResponse, projectResponse] = await Promise.all([
          listOrganizations(accessToken),
          listProjects(accessToken),
        ]);
        if (!organizationResponse.success) {
          setError(organizationResponse.message);
          return;
        }
        if (!projectResponse.success) {
          setError(projectResponse.message);
          return;
        }
        const nextOrganizations = organizationResponse.data ?? [];
        setOrganizations(nextOrganizations);
        setProjects(projectResponse.data ?? []);
        setSelectedOrganizationId((currentId) =>
          nextOrganizations.some(
            (organization) => organization._id === currentId,
          )
            ? currentId
            : (nextOrganizations[0]?._id ?? ""),
        );
      } catch {
        setError(
          "Workspace data could not be loaded. Check that the API is running.",
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    const fetchWorkspace = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);
    return () => window.clearTimeout(fetchWorkspace);
  }, [loadWorkspace]);

  async function handleRefresh() {
    setRefreshing(true);
    setStatus("");
    await refreshSession();
    await loadWorkspace(false);
    setRefreshing(false);
  }

  async function handleDeleteOrganization() {
    if (!accessToken || !selectedOrganization) return;
    if (
      !window.confirm(
        `Delete ${selectedOrganization.name}? This cannot be undone.`,
      )
    )
      return;
    const response = await deleteOrganization(
      selectedOrganization._id,
      accessToken,
    );
    if (!response.success) {
      setError(response.message);
      return;
    }
    setStatus("Organization deleted successfully.");
    await loadWorkspace(false);
  }

  async function handleDeleteProject(project: Project) {
    if (
      !accessToken ||
      !window.confirm(`Delete ${project.name}? This cannot be undone.`)
    )
      return;
    const response = await deleteProject(project._id, accessToken);
    if (!response.success) {
      setError(response.message);
      return;
    }
    setStatus("Project deleted successfully.");
    await loadWorkspace(false);
  }

  const complete = async (message: string) => {
    setStatus(message);
    setPanel(null);
    await loadWorkspace(false);
  };

  return (
    <WorkspaceShell>
      <header className="dashboard-header">
        <div>
          <p className="section-kicker">Tuesday, August 20, 2026</p>
          <h1>Good to see you back.</h1>
          <p className="dashboard-muted">
            Your organizations and projects, in one secure workspace.
          </p>
        </div>
        <span className="workspace-chip">
          <i /> {loading ? "Syncing" : "All systems secure"}
        </span>
      </header>

      {error ? (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="workspace-success dashboard-message" role="status">
          {status}
        </p>
      ) : null}

      <section className="workspace-overview-bar">
        <div>
          <p className="section-kicker">Active organization</p>
          <label
            className="organization-select-label"
            htmlFor="organization-select"
          >
            Select an organization
          </label>
          <select
            className="organization-select"
            id="organization-select"
            value={selectedOrganizationId}
            onChange={(event) => setSelectedOrganizationId(event.target.value)}
            disabled={loading || organizations.length === 0}
          >
            {organizations.length === 0 ? (
              <option value="">No organizations yet</option>
            ) : null}
            {organizations.map((organization) => (
              <option key={organization._id} value={organization._id}>
                {organization.name}
              </option>
            ))}
          </select>
        </div>
        <div className="overview-bar-actions">
          <button
            className="panel-action"
            onClick={() =>
              setPanel(panel === "organization" ? null : "organization")
            }
            type="button"
          >
            + Organization
          </button>
          <button
            className="panel-action"
            disabled={!selectedOrganization}
            onClick={() => setPanel(panel === "project" ? null : "project")}
            type="button"
          >
            + Project
          </button>
          <button
            className="panel-action danger-action"
            disabled={!selectedOrganization}
            onClick={() => void handleDeleteOrganization()}
            type="button"
          >
            Delete organization
          </button>
        </div>
      </section>

      {panel === "organization" ? (
        <OrganizationForm
          accessToken={accessToken}
          onComplete={complete}
          onError={setError}
        />
      ) : null}
      {panel === "project" ? (
        <ProjectForm
          accessToken={accessToken}
          organizationId={selectedOrganizationId}
          onComplete={complete}
          onError={setError}
        />
      ) : null}

      <section className="dashboard-panel overview-project-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">
              Projects in {selectedOrganization?.name ?? "your organization"}
            </p>
            <h2>Project overview</h2>
          </div>
          <span className="workspace-index">
            {String(visibleProjects.length).padStart(2, "0")} projects
          </span>
        </div>
        {loading ? (
          <p className="workspace-empty">Loading workspace...</p>
        ) : visibleProjects.length === 0 ? (
          <p className="workspace-empty">
            {selectedOrganization
              ? "No projects in this organization yet."
              : "Create an organization to start your workspace."}
          </p>
        ) : (
          <div className="project-list">
            {visibleProjects.map((project) => (
              <div
                className="project-row"
                key={project._id}
                onClick={() =>
                  router.push(
                    `/secrets?projectId=${encodeURIComponent(project._id)}&projectName=${encodeURIComponent(project.name)}`,
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(
                      `/secrets?projectId=${encodeURIComponent(project._id)}&projectName=${encodeURIComponent(project.name)}`,
                    );
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className="environment-icon production">●</span>
                <div>
                  <strong>{project.name}</strong>
                  <small>{project.description || "No description"}</small>
                </div>
                <span className="project-meta">
                  {project.visibility}
                  <b>{project.status}</b>
                </span>
                <button
                  aria-label={`Delete ${project.name}`}
                  className="row-delete"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDeleteProject(project);
                  }}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="dashboard-actions">
        <span>
          Latest organization is selected automatically ·{" "}
          <b>{organizations.length} total</b>
        </span>
      </div>
    </WorkspaceShell>
  );
}

function OrganizationForm({ accessToken, onComplete, onError }: FormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<WorkspaceVisibility>("private");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken)
      return onError("Your session has expired. Please sign in again.");
    setSubmitting(true);
    try {
      const response = await createOrganization(
        { name, description, visibility },
        accessToken,
      );
      if (!response.success) return onError(response.message);
      await onComplete(
        response.message || "Organization created successfully.",
      );
    } catch {
      onError("The organization could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dashboard-panel inline-form" onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Create organization</p>
          <h2>Set a new boundary</h2>
        </div>
      </div>
      <div className="inline-form-fields">
        <label>
          Name
          <input
            className="auth-input"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="acme-platform"
          />
        </label>
        <label>
          Description
          <input
            className="auth-input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Production systems team"
          />
        </label>
        <label>
          Visibility
          <select
            className="auth-input"
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as WorkspaceVisibility)
            }
          >
            <option value="private">Private</option>
            <option value="internal">Internal</option>
          </select>
        </label>
      </div>
      <button
        className="button button-accent workspace-submit"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Creating..." : "Create organization"}
        <span>↗</span>
      </button>
    </form>
  );
}

function ProjectForm({
  accessToken,
  organizationId,
  onComplete,
  onError,
}: FormProps & { organizationId: string }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<WorkspaceVisibility>("private");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken)
      return onError("Your session has expired. Please sign in again.");
    setSubmitting(true);
    try {
      const response = await createProject(
        { name, description, orgId: organizationId, visibility },
        accessToken,
      );
      if (!response.success) return onError(response.message);
      await onComplete(response.message || "Project created successfully.");
    } catch {
      onError("The project could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dashboard-panel inline-form" onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Create project</p>
          <h2>Add to the active organization</h2>
        </div>
      </div>
      <div className="inline-form-fields">
        <label>
          Name
          <input
            className="auth-input"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="payments-api"
          />
        </label>
        <label>
          Description
          <input
            className="auth-input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Core payments service"
          />
        </label>
        <label>
          Visibility
          <select
            className="auth-input"
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as WorkspaceVisibility)
            }
          >
            <option value="private">Private</option>
            <option value="internal">Internal</option>
          </select>
        </label>
      </div>
      <button
        className="button button-accent workspace-submit"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Creating..." : "Create project"}
        <span>↗</span>
      </button>
    </form>
  );
}
