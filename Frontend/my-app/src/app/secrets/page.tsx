"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { ShareDialog } from "@/components/ShareDialog";
import { useAuth } from "@/context/AuthContext";
import {
  createProjectEnvironment,
  createSecret,
  deleteProjectEnvironment,
  deleteSecret,
  getSecretValue,
  listSecrets,
  listProjects,
  renameProjectEnvironment,
  updateSecret,
  type ProjectEnvironment,
  type Secret,
  type SecretEnvironment,
} from "@/lib/workspace";

export default function SecretsPage() {
  return (
    <Suspense fallback={<p className="workspace-empty">Loading project...</p>}>
      <SecretsPageContent />
    </Suspense>
  );
}

function SecretsPageContent() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const projectName = searchParams.get("projectName") ?? "Project";
  const [environments, setEnvironments] = useState<ProjectEnvironment[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState("all");
  const [showEnvironmentManager, setShowEnvironmentManager] = useState(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState("");
  const [visibleValues, setVisibleValues] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingEnvironment, setSavingEnvironment] = useState(false);
  const [activeSecretId, setActiveSecretId] = useState("");
  const [editingSecretId, setEditingSecretId] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");
  const [savingSecret, setSavingSecret] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] =
    useState<SecretEnvironment>("development");
  const [projectOrgId, setProjectOrgId] = useState("");
  const [openSecretMenuId, setOpenSecretMenuId] = useState("");
  const [sharingSecret, setSharingSecret] = useState<Secret | null>(null);

  useEffect(() => {
    if (!accessToken || !projectId) {
      return;
    }
    let cancelled = false;
    void Promise.all([
      listSecrets(projectId, accessToken),
      listProjects(accessToken),
    ])
      .then(([secretResponse, projectResponse]) => {
        if (cancelled) return;
        setError("");
        if (!secretResponse.success) {
          setError(secretResponse.message);
          return;
        }
        if (!projectResponse.success) {
          setError(projectResponse.message);
          return;
        }

        const project = projectResponse.data?.find(
          (item) => item._id === projectId,
        );
        if (!project) {
          setError("The selected project could not be found.");
          return;
        }

        const projectEnvironments = project.environments ?? [];
        setProjectOrgId(project.orgId);
        setEnvironments(projectEnvironments);
        setSecrets(secretResponse.data ?? []);
        setEnvironment((current) =>
          projectEnvironments.some((item) => item.name === current)
            ? current
            : projectEnvironments.find((item) => item.name === "development")
                ?.name ?? projectEnvironments[0]?.name ?? "",
        );
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Secrets could not be loaded. Check that the API is running.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, projectId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !projectId) {
      setError("A valid project is required to add a secret.");
      return;
    }

    setSubmitting(true);
    setError("");
    setStatus("");
    try {
      const response = await createSecret(
        { projectId, key, encryptedValue: value, description, environment },
        accessToken,
      );
      if (!response.success) {
        setError(response.message);
        return;
      }
      if (!response.data) {
        setError("The server did not return the created secret.");
        return;
      }
      const createdSecret = response.data;
      setSecrets((current) =>
        [...current, createdSecret].sort((a, b) => a.key.localeCompare(b.key)),
      );
      setKey("");
      setValue("");
      setDescription("");
      setEnvironment("development");
      setStatus("Secret added successfully.");
    } catch {
      setError("The secret could not be added. Check that the API is running.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateEnvironment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !projectId) return;
    setSavingEnvironment(true);
    setError("");
    setStatus("");
    try {
      const response = await createProjectEnvironment(
        projectId,
        newEnvironmentName,
        accessToken,
      );
      if (!response.success || !response.data) {
        setError(response.message);
        return;
      }
      const createdEnvironment = response.data;
      setEnvironments((current) => [...current, createdEnvironment]);
      setEnvironment(createdEnvironment.name);
      setSelectedEnvironment(createdEnvironment.name);
      setNewEnvironmentName("");
      setStatus("Environment added successfully.");
    } catch {
      setError("The environment could not be added. Check that the API is running.");
    } finally {
      setSavingEnvironment(false);
    }
  }

  async function handleRenameEnvironment(item: ProjectEnvironment) {
    if (!accessToken || item.isDefault) return;
    const name = window.prompt("Enter a new environment name", item.name);
    if (name === null || !name.trim()) return;
    setError("");
    setStatus("");
    try {
      const response = await renameProjectEnvironment(
        projectId,
        item._id,
        name,
        accessToken,
      );
      if (!response.success || !response.data) {
        setError(response.message);
        return;
      }
      const renamed = response.data;
      setEnvironments((current) =>
        current.map((environmentItem) =>
          environmentItem._id === item._id ? renamed : environmentItem,
        ),
      );
      setSecrets((current) =>
        current.map((secret) =>
          secret.environment === item.name
            ? { ...secret, environment: renamed.name }
            : secret,
        ),
      );
      setEnvironment((current) =>
        current === item.name ? renamed.name : current,
      );
      setSelectedEnvironment((current) =>
        current === item.name ? renamed.name : current,
      );
      setStatus("Environment renamed successfully.");
    } catch {
      setError(
        "The environment could not be renamed. Check that the API is running.",
      );
    }
  }

  async function handleDeleteEnvironment(item: ProjectEnvironment) {
    if (
      !accessToken ||
      item.isDefault ||
      !window.confirm(`Delete the ${item.name} environment?`)
    )
      return;
    setError("");
    setStatus("");
    try {
      const response = await deleteProjectEnvironment(
        projectId,
        item._id,
        accessToken,
      );
      if (!response.success) {
        setError(response.message);
        return;
      }
      const remainingEnvironments = environments.filter(
        (environmentItem) => environmentItem._id !== item._id,
      );
      setEnvironments(remainingEnvironments);
      if (environment === item.name) {
        setEnvironment(
          remainingEnvironments.find(
            (environmentItem) => environmentItem.name === "development",
          )?.name ??
            remainingEnvironments[0]?.name ??
            "",
        );
      }
      if (selectedEnvironment === item.name) {
        setSelectedEnvironment("all");
      }
      setStatus("Environment deleted successfully.");
    } catch {
      setError(
        "The environment could not be deleted. Check that the API is running.",
      );
    }
  }

  async function handleReveal(secret: Secret) {
    if (!accessToken) return;
    if (visibleValues[secret._id] !== undefined) {
      setVisibleValues((current) => {
        const next = { ...current };
        delete next[secret._id];
        return next;
      });
      return;
    }

    setActiveSecretId(secret._id);
    setError("");
    try {
      const response = await getSecretValue(secret._id, accessToken);
      if (!response.success || !response.data) {
        setError(response.message);
        return;
      }
      const secretValue = response.data;
      setVisibleValues((current) => ({
        ...current,
        [secret._id]: secretValue.value,
      }));
    } catch {
      setError("The secret value could not be revealed.");
    } finally {
      setActiveSecretId("");
    }
  }

  async function handleDelete(secret: Secret) {
    if (!accessToken || !window.confirm(`Delete ${secret.key}?`)) return;
    setError("");
    const response = await deleteSecret(secret._id, accessToken);
    if (!response.success) {
      setError(response.message);
      return;
    }
    setSecrets((current) => current.filter((item) => item._id !== secret._id));
    setVisibleValues((current) => {
      const next = { ...current };
      delete next[secret._id];
      return next;
    });
    setStatus("Secret deleted successfully.");
  }

  function handleStartEdit(secret: Secret) {
    setEditingSecretId(secret._id);
    setEditKey("");
    setEditValue("");
    setError("");
    setStatus("");
  }

  async function handleUpdateSecret(
    event: FormEvent<HTMLFormElement>,
    secret: Secret,
  ) {
    event.preventDefault();
    if (!accessToken) return;

    const key = editKey.trim();
    if (!key && !editValue) {
      setError("Enter a new key or value to update the secret.");
      return;
    }

    setSavingSecret(true);
    setError("");
    setStatus("");
    try {
      const response = await updateSecret(
        secret._id,
        {
          ...(key && { key }),
          ...(editValue && { value: editValue }),
        },
        accessToken,
      );
      if (!response.success || !response.data) {
        setError(response.message);
        return;
      }
      setSecrets((current) =>
        current
          .map((item) => (item._id === secret._id ? response.data! : item))
          .sort((a, b) => a.key.localeCompare(b.key)),
      );
      setVisibleValues((current) => {
        const next = { ...current };
        delete next[secret._id];
        return next;
      });
      setEditingSecretId("");
      setEditKey("");
      setEditValue("");
      setStatus("Secret updated successfully.");
    } catch {
      setError("The secret could not be updated. Check that the API is running.");
    } finally {
      setSavingSecret(false);
    }
  }

  return (
    <WorkspaceShell>
      <header className="secrets-page-header">
        <div>
          <p className="section-kicker">Secret management</p>
          <h1>{projectName}</h1>
          <p className="dashboard-muted">
            Add, inspect, and remove protected configuration for this project.
          </p>
        </div>
        <Link className="panel-action" href="/dashboard">
          ← Projects
        </Link>
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

      {!projectId ? (
        <section className="dashboard-panel secrets-empty-panel">
          <p className="workspace-empty">No project was selected.</p>
          <Link className="button button-accent" href="/dashboard">
            Back to projects <span>↗</span>
          </Link>
        </section>
      ) : (
        <>
          <section className="dashboard-panel secret-create-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Add secret</p>
                <h2>Protect a new value</h2>
              </div>
              <span className="workspace-index">AES-256-GCM</span>
            </div>
            <form className="secret-create-form" onSubmit={handleCreate}>
              <label>
                Secret key
                <input
                  className="auth-input workspace-mono-input"
                  required
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  placeholder="DATABASE_URL"
                />
              </label>
              <label>
                Secret value
                <input
                  className="auth-input workspace-mono-input"
                  required
                  type="password"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="Paste a value to encrypt"
                />
              </label>
              <label>
                Environment
                <select
                  className="auth-input"
                  value={environment}
                  onChange={(event) => setEnvironment(event.target.value)}
                  required
                >
                  {environments.map((item) => (
                    <option key={item._id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="secret-description-field">
                Description <span className="field-optional">optional</span>
                <input
                  className="auth-input"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Primary database connection"
                />
              </label>
              <button
                className="button button-accent secret-add-button"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Encrypting..." : "Add secret"} <span>↗</span>
              </button>
            </form>
          </section>

          <section className="dashboard-panel secret-list-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Protected values</p>
                <h2>Project secrets</h2>
              </div>
              <div className="environment-list-controls">
                <label>
                  Environment
                  <select
                    className="auth-input"
                    value={selectedEnvironment}
                    onChange={(event) =>
                      setSelectedEnvironment(event.target.value)
                    }
                  >
                    <option value="all">All environments</option>
                    {environments.map((item) => (
                      <option key={item._id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="panel-action"
                  onClick={() =>
                    setShowEnvironmentManager((current) => !current)
                  }
                  type="button"
                >
                  {showEnvironmentManager
                    ? "Close environment manager"
                    : "Manage environments"}
                </button>
                <span className="workspace-index">
                  {loading
                    ? "Syncing"
                    : `${secrets.filter((secret) => selectedEnvironment === "all" || secret.environment === selectedEnvironment).length} secrets`}
                </span>
              </div>
            </div>
            {showEnvironmentManager ? (
              <div className="environment-manager">
                <form
                  className="environment-create-form"
                  onSubmit={handleCreateEnvironment}
                >
                  <label>
                    Add environment
                    <input
                      className="auth-input"
                      maxLength={50}
                      minLength={1}
                      onChange={(event) =>
                        setNewEnvironmentName(event.target.value)
                      }
                      placeholder="e.g. qa"
                      required
                      value={newEnvironmentName}
                    />
                  </label>
                  <button
                    className="panel-action"
                    disabled={savingEnvironment}
                    type="submit"
                  >
                    {savingEnvironment ? "Adding..." : "+ Add"}
                  </button>
                </form>
                <div className="environment-manager-list">
                  {environments.map((item) => (
                    <div className="environment-manager-row" key={item._id}>
                      <span>{item.name}</span>
                      {item.isDefault ? (
                        <small>Default</small>
                      ) : (
                        <div>
                          <button
                            className="panel-action"
                            onClick={() => void handleRenameEnvironment(item)}
                            type="button"
                          >
                            Rename
                          </button>
                          <button
                            className="panel-action danger-action"
                            onClick={() => void handleDeleteEnvironment(item)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {loading ? (
              <p className="workspace-empty">Loading secrets...</p>
            ) : secrets.filter(
                (secret) =>
                  selectedEnvironment === "all" ||
                  secret.environment === selectedEnvironment,
              ).length === 0 ? (
              <p className="workspace-empty">
                No secrets found for this environment.
              </p>
            ) : (
              <div className="managed-secret-list">
                {secrets
                  .filter(
                    (secret) =>
                      selectedEnvironment === "all" ||
                      secret.environment === selectedEnvironment,
                  )
                  .map((secret) => (
                    <div className="managed-secret-entry" key={secret._id}>
                      <div className="managed-secret-row">
                        <div className="managed-secret-name">
                          <strong>{secret.key}</strong>
                          <small>
                            {secret.description || "Protected configuration"}
                          </small>
                        </div>
                        <span
                          className={`environment-tag ${secret.environment}`}
                        >
                          <i /> {secret.environment}
                        </span>
                        <code>
                          {visibleValues[secret._id] ?? "••••••••••••••"}
                        </code>
                        <button
                          className="secret-icon-button"
                          aria-label={`${visibleValues[secret._id] !== undefined ? "Hide" : "View"} ${secret.key}`}
                          disabled={activeSecretId === secret._id}
                          onClick={() => void handleReveal(secret)}
                          type="button"
                        >
                          {activeSecretId === secret._id
                            ? "…"
                            : visibleValues[secret._id] !== undefined
                              ? "◉"
                              : "◌"}
                        </button>
                        <div className="resource-menu-wrap">
                          <button
                            aria-expanded={openSecretMenuId === secret._id}
                            aria-label={`Actions for ${secret.key}`}
                            className="resource-menu-trigger"
                            onClick={() =>
                              setOpenSecretMenuId((current) =>
                                current === secret._id ? "" : secret._id,
                              )
                            }
                            type="button"
                          >
                            <span aria-hidden="true">•••</span>
                          </button>
                          {openSecretMenuId === secret._id ? (
                            <div className="resource-menu" role="menu">
                              <button
                                onClick={() => {
                                  setOpenSecretMenuId("");
                                  setSharingSecret(secret);
                                }}
                                role="menuitem"
                                type="button"
                              >
                                Share
                              </button>
                              <button
                                onClick={() => {
                                  setOpenSecretMenuId("");
                                  if (editingSecretId === secret._id) {
                                    setEditingSecretId("");
                                  } else {
                                    handleStartEdit(secret);
                                  }
                                }}
                                role="menuitem"
                                type="button"
                              >
                                {editingSecretId === secret._id
                                  ? "Cancel edit"
                                  : "Edit"}
                              </button>
                              <button
                                className="danger-action"
                                onClick={() => {
                                  setOpenSecretMenuId("");
                                  void handleDelete(secret);
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
                      {editingSecretId === secret._id ? (
                        <form
                          className="secret-edit-form"
                          onSubmit={(event) =>
                            void handleUpdateSecret(event, secret)
                          }
                        >
                          <label>
                            Secret key <span className="field-optional">optional</span>
                            <input
                              className="auth-input workspace-mono-input"
                              autoFocus
                              onChange={(event) =>
                                setEditKey(event.target.value)
                              }
                              placeholder={secret.key}
                              value={editKey}
                            />
                          </label>
                          <label>
                            Secret value <span className="field-optional">optional</span>
                            <input
                              className="auth-input workspace-mono-input"
                              autoComplete="new-password"
                              onChange={(event) =>
                                setEditValue(event.target.value)
                              }
                              placeholder="Leave blank to keep the current value"
                              type="password"
                              value={editValue}
                            />
                          </label>
                          <button
                            className="button button-accent"
                            disabled={savingSecret}
                            type="submit"
                          >
                            {savingSecret ? "Saving..." : "Save changes"}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ))}
              </div>
            )}
          </section>
        </>
      )}
      {sharingSecret && accessToken && projectOrgId ? (
        <ShareDialog
          accessToken={accessToken}
          initialOrganizationId={projectOrgId}
          initialProjectId={projectId}
          initialScope="secret"
          initialSecretId={sharingSecret._id}
          onClose={() => setSharingSecret(null)}
        />
      ) : null}
    </WorkspaceShell>
  );
}
