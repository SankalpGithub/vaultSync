"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createShare } from "@/lib/sharing";
import {
  listOrganizations,
  listProjects,
  listSecrets,
  type Organization,
  type Project,
  type Secret,
} from "@/lib/workspace";

type ShareScope = "organization" | "project" | "secret";

type ShareDialogProps = {
  accessToken: string;
  initialOrganizationId: string;
  initialProjectId?: string;
  initialSecretId?: string;
  initialScope: ShareScope;
  onClose: () => void;
};

const scopes: ShareScope[] = ["organization", "project", "secret"];
const roles = [
  ["viewer", "Viewer"],
  ["developer", "Developer"],
  ["secretManager", "Secret Manager"],
  ["projectAdmin", "Project Admin"],
  ["organizationAdmin", "Organization Admin"],
] as const;

export function ShareDialog({
  accessToken,
  initialOrganizationId,
  initialProjectId,
  initialSecretId,
  initialScope,
  onClose,
}: ShareDialogProps) {
  const [scope, setScope] = useState(initialScope);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [secretsByProject, setSecretsByProject] = useState<
    Record<string, Secret[]>
  >({});
  const [organizationId, setOrganizationId] = useState(
    initialOrganizationId,
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    initialProjectId ? [initialProjectId] : [],
  );
  const [selectedSecretIds, setSelectedSecretIds] = useState<string[]>(
    initialSecretId ? [initialSecretId] : [],
  );
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSecrets, setLoadingSecrets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const loadingResources = loading || (scope === "secret" && loadingSecrets);

  const visibleProjects = useMemo(
    () => projects.filter((project) => project.orgId === organizationId),
    [organizationId, projects],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoading(true);
      setError("");
      try {
        const [organizationResult, projectResult] = await Promise.all([
          listOrganizations(accessToken),
          listProjects(accessToken),
        ]);
        if (!organizationResult.success) {
          setError(organizationResult.message);
          return;
        }
        if (!projectResult.success) {
          setError(projectResult.message);
          return;
        }
        if (cancelled) return;
        setOrganizations(organizationResult.data ?? []);
        setProjects(projectResult.data ?? []);
        const validOrganizationId =
          initialOrganizationId &&
          organizationResult.data?.some(
            (organization) => organization._id === initialOrganizationId,
          )
            ? initialOrganizationId
            : (organizationResult.data?.[0]?._id ?? "");
        setOrganizationId(validOrganizationId);
      } catch {
        if (!cancelled) {
          setError("Sharing options could not be loaded. Check that the API is running.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [accessToken, initialOrganizationId]);

  useEffect(() => {
    if (scope !== "secret") return;
    let cancelled = false;
    async function loadSecrets() {
      if (!organizationId || projects.length === 0) {
        await Promise.resolve();
        if (!cancelled) {
          setSecretsByProject({});
          setLoadingSecrets(false);
        }
        return;
      }
      setLoadingSecrets(true);
      setError("");
      try {
        const relatedProjects = projects.filter(
          (project) => project.orgId === organizationId,
        );
        const secretResults = await Promise.all(
          relatedProjects.map(async (project) => ({
            projectId: project._id,
            response: await listSecrets(project._id, accessToken),
          })),
        );
        if (cancelled) return;
        const failedResult = secretResults.find(
          ({ response }) => !response.success,
        );
        if (failedResult) {
          setError(failedResult.response.message);
          return;
        }
        setSecretsByProject(
          Object.fromEntries(
            secretResults.map(({ projectId, response }) => [
              projectId,
              response.data ?? [],
            ]),
          ),
        );
      } catch {
        if (!cancelled) {
          setError("Secrets could not be loaded. Check that the API is running.");
        }
      } finally {
        if (!cancelled) setLoadingSecrets(false);
      }
    }

    void loadSecrets();
    return () => {
      cancelled = true;
    };
  }, [accessToken, organizationId, projects, scope]);

  function toggleSelection(
    id: string,
    current: string[],
    setCurrent: (next: string[]) => void,
  ) {
    setCurrent(
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    const recipientEmails = emails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    if (!organizationId) {
      setError("Select an organization to share.");
      return;
    }
    if (
      (scope === "project" && selectedProjectIds.length === 0) ||
      (scope === "secret" && selectedSecretIds.length === 0)
    ) {
      setError(`Select at least one ${scope} to share.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await createShare(
        {
          recipientEmails,
          orgId: organizationId,
          projectId: scope === "project" ? selectedProjectIds : [],
          secretId: scope === "secret" ? selectedSecretIds : [],
          role,
        },
        accessToken,
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      setStatus(result.message || "Invitation sent successfully.");
    } catch {
      setError("The invitation could not be sent. Check that the API is running.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="share-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="share-dialog-title"
        aria-modal="true"
        className="share-dialog dashboard-panel"
        role="dialog"
      >
        <div className="share-dialog-heading">
          <div>
            <p className="section-kicker">Access control</p>
            <h2 id="share-dialog-title">Share securely</h2>
          </div>
          <button
            aria-label="Close sharing form"
            className="share-dialog-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <form className="share-form" onSubmit={(event) => void submit(event)}>
          <div aria-label="Sharing scope" className="share-scope-tabs" role="tablist">
            {scopes.map((item) => (
              <button
                aria-selected={scope === item}
                className={scope === item ? "active" : ""}
                key={item}
                onClick={() => {
                  setScope(item);
                }}
                role="tab"
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          {scope !== "organization" ? (
            <label className="share-organization-select">
              Organization
              <select
                className="auth-input"
                onChange={(event) => {
                  setOrganizationId(event.target.value);
                  setSelectedProjectIds([]);
                  setSelectedSecretIds([]);
                }}
                required
                value={organizationId}
              >
                <option value="">Select organization</option>
                {organizations.map((organization) => (
                  <option key={organization._id} value={organization._id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="share-resource-list" role="tabpanel">
            {loadingResources ? (
              <p className="workspace-empty">Loading resources...</p>
            ) : scope === "organization" ? (
              organizations.length === 0 ? (
                <p className="workspace-empty">No organizations found.</p>
              ) : (
                organizations.map((organization) => (
                  <label className="share-resource-option" key={organization._id}>
                    <input
                      checked={organizationId === organization._id}
                      name="share-organization"
                      onChange={() => {
                        setOrganizationId(organization._id);
                        setSelectedProjectIds([]);
                        setSelectedSecretIds([]);
                      }}
                      type="radio"
                    />
                    <span>
                      <strong>{organization.name}</strong>
                      <small>Organization access</small>
                    </span>
                  </label>
                ))
              )
            ) : scope === "project" ? (
              visibleProjects.length === 0 ? (
                <p className="workspace-empty">No projects in this organization.</p>
              ) : (
                visibleProjects.map((project) => (
                  <label className="share-resource-option" key={project._id}>
                    <input
                      checked={selectedProjectIds.includes(project._id)}
                      onChange={() =>
                        toggleSelection(
                          project._id,
                          selectedProjectIds,
                          setSelectedProjectIds,
                        )
                      }
                      type="checkbox"
                    />
                    <span>
                      <strong>{project.name}</strong>
                      <small>{project.description || "Project access"}</small>
                    </span>
                  </label>
                ))
              )
            ) : visibleProjects.length === 0 ? (
              <p className="workspace-empty">No projects in this organization.</p>
            ) : (
              visibleProjects.flatMap((project) =>
                (secretsByProject[project._id] ?? []).map((secret) => (
                  <label className="share-resource-option" key={secret._id}>
                    <input
                      checked={selectedSecretIds.includes(secret._id)}
                      onChange={() =>
                        toggleSelection(
                          secret._id,
                          selectedSecretIds,
                          setSelectedSecretIds,
                        )
                      }
                      type="checkbox"
                    />
                    <span>
                      <strong>{secret.key}</strong>
                      <small>{project.name} · {secret.environment}</small>
                    </span>
                  </label>
                )),
              )
            )}
          </div>
          <div className="share-form-footer">
            <label>
              Add recipients
              <input
                className="auth-input"
                onChange={(event) => setEmails(event.target.value)}
                placeholder="name@example.com, ..."
                required
                value={emails}
              />
              <small className="field-help">Separate multiple emails with commas.</small>
            </label>
            <label>
              Assign role
              <select
                className="auth-input"
                onChange={(event) => setRole(event.target.value)}
                value={role}
              >
                {roles.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <button
              className="button button-accent workspace-submit"
              disabled={submitting || loadingResources}
              type="submit"
            >
              {submitting ? "Sending..." : "Send invitation"} <span>↗</span>
            </button>
          </div>
          {error ? <p className="workspace-error" role="alert">{error}</p> : null}
          {status ? <p className="workspace-success" role="status">{status}</p> : null}
        </form>
      </section>
    </div>
  );
}
