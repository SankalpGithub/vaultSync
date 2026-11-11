"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import { ShareDialog } from "@/components/ShareDialog";
import {
  createOrganization,
  createProject,
  deleteOrganization,
  deleteProject,
  listOrganizations,
  listProjects,
  updateProject,
  type Organization,
  type Project,
  type WorkspaceVisibility,
} from "@/lib/workspace";

type Panel = "organization" | "project" | null;
const SELECTED_ORGANIZATION_STORAGE_KEY = "vaultsync:selected-organization";

type FormProps = {
  accessToken: string | null;
  onComplete: (message: string) => Promise<void>;
  onCancel: () => void;
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
  const [openProjectMenuId, setOpenProjectMenuId] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sharingProject, setSharingProject] = useState<Project | null>(null);

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
        let savedOrganizationId = "";
        try {
          savedOrganizationId =
            window.localStorage.getItem(SELECTED_ORGANIZATION_STORAGE_KEY) ?? "";
        } catch {
          setError(
            "Your browser could not restore the previously selected organization.",
          );
        }
        const nextSelectedOrganizationId =
          nextOrganizations.find(
            (organization) => organization._id === savedOrganizationId,
          )?._id ??
          nextOrganizations[0]?._id ??
          "";
        setOrganizations(nextOrganizations);
        setProjects(projectResponse.data ?? []);
        setSelectedOrganizationId(nextSelectedOrganizationId);
        try {
          if (nextSelectedOrganizationId) {
            window.localStorage.setItem(
              SELECTED_ORGANIZATION_STORAGE_KEY,
              nextSelectedOrganizationId,
            );
          } else {
            window.localStorage.removeItem(SELECTED_ORGANIZATION_STORAGE_KEY);
          }
        } catch {
          setError("Your browser could not save the selected organization.");
        }
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

  function handleOrganizationChange(organizationId: string) {
    setSelectedOrganizationId(organizationId);
    try {
      if (organizationId) {
        window.localStorage.setItem(
          SELECTED_ORGANIZATION_STORAGE_KEY,
          organizationId,
        );
      } else {
        window.localStorage.removeItem(SELECTED_ORGANIZATION_STORAGE_KEY);
      }
    } catch {
      setError("Your browser could not save the selected organization.");
    }
  }

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
    setError("");
    setStatus(message);
    setPanel(null);
    setEditingProject(null);
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
            onChange={(event) =>
              handleOrganizationChange(event.target.value)
            }
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
        <ResourceFormDialog onClose={() => setPanel(null)}>
          <OrganizationForm
            accessToken={accessToken}
            onComplete={complete}
            onCancel={() => setPanel(null)}
          />
        </ResourceFormDialog>
      ) : null}
      {panel === "project" ? (
        <ResourceFormDialog onClose={() => setPanel(null)}>
          <ProjectForm
            key="create-project"
            accessToken={accessToken}
            organizationId={selectedOrganizationId}
            organizationName={selectedOrganization?.name ?? ""}
            onComplete={complete}
            onCancel={() => setPanel(null)}
          />
        </ResourceFormDialog>
      ) : null}
      {editingProject ? (
        <ResourceFormDialog onClose={() => setEditingProject(null)}>
          <ProjectForm
            key={editingProject._id}
            accessToken={accessToken}
            onComplete={complete}
            onCancel={() => setEditingProject(null)}
            project={editingProject}
          />
        </ResourceFormDialog>
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
                <div
                  className="resource-menu-wrap"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <button
                    aria-expanded={openProjectMenuId === project._id}
                    aria-label={`Actions for ${project.name}`}
                    className="resource-menu-trigger"
                    onClick={() =>
                      setOpenProjectMenuId((current) =>
                        current === project._id ? "" : project._id,
                      )
                    }
                    type="button"
                  >
                    <span aria-hidden="true">•••</span>
                  </button>
                  {openProjectMenuId === project._id ? (
                    <div className="resource-menu" role="menu">
                      <button
                        onClick={() => {
                          setOpenProjectMenuId("");
                          setSharingProject(project);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => {
                          setOpenProjectMenuId("");
                          setPanel(null);
                          setEditingProject(project);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="danger-action"
                        onClick={() => {
                          setOpenProjectMenuId("");
                          void handleDeleteProject(project);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
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
      {sharingProject && accessToken ? (
        <ShareDialog
          accessToken={accessToken}
          initialOrganizationId={sharingProject.orgId}
          initialProjectId={sharingProject._id}
          initialScope="project"
          onClose={() => setSharingProject(null)}
        />
      ) : null}
    </WorkspaceShell>
  );
}

function ResourceFormDialog({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="share-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="resource-dialog-title"
        aria-modal="true"
        className="share-dialog resource-form-dialog"
        role="dialog"
      >
        {children}
      </section>
    </div>
  );
}

function OrganizationForm({ accessToken, onComplete, onCancel }: FormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<WorkspaceVisibility>("private");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
      await onComplete(
        response.message || "Organization created successfully.",
      );
    } catch {
      setError("The organization could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="resource-dialog-form share-form" onSubmit={submit}>
      <div className="share-dialog-heading">
        <div>
          <p className="section-kicker">Workspace setup</p>
          <h2 id="resource-dialog-title">Create organization</h2>
        </div>
        <button
          aria-label="Close organization form"
          className="share-dialog-close"
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
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
      {error ? <p className="workspace-error" role="alert">{error}</p> : null}
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
  organizationName,
  onComplete,
  onCancel,
  project,
}: FormProps & {
  organizationId?: string;
  organizationName?: string;
  project?: Project;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [visibility, setVisibility] = useState<WorkspaceVisibility>(
    project?.visibility ?? "private",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setSubmitting(true);
    try {
      const response = project
        ? await updateProject(
            project._id,
            { name, description, visibility },
            accessToken,
          )
        : await createProject(
            {
              name,
              description,
              orgId: organizationId ?? "",
              visibility,
            },
            accessToken,
          );
      if (!response.success) {
        setError(response.message);
        return;
      }
      await onComplete(
        response.message ||
          (project ? "Project updated successfully." : "Project created successfully."),
      );
    } catch {
      setError(
        project
          ? "The project could not be updated."
          : "The project could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="resource-dialog-form share-form" onSubmit={submit}>
      <div className="share-dialog-heading">
        <div>
          <p className="section-kicker">
            {project ? "Project settings" : "Workspace setup"}
          </p>
          <h2 id="resource-dialog-title">
            {project ? "Edit project" : "Create project"}
          </h2>
        </div>
        <button
          aria-label={project ? "Close project editor" : "Close project form"}
          className="share-dialog-close"
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>
      {!project ? (
        <p className="resource-dialog-context">
          Adding to <strong>{organizationName}</strong>
        </p>
      ) : null}
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
      {error ? <p className="workspace-error" role="alert">{error}</p> : null}
      <button
        className="button button-accent workspace-submit"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Saving..." : project ? "Save changes" : "Create project"}
        <span>↗</span>
      </button>
    </form>
  );
}
