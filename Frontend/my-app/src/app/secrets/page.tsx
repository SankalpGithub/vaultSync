"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { ShareDialog } from "@/components/ShareDialog";
import { useAuth } from "@/context/AuthContext";
import { parseEnvFile, serializeEnvFile } from "@/lib/envFile";
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
  const [editingEnvironmentId, setEditingEnvironmentId] = useState("");
  const [renamedEnvironmentName, setRenamedEnvironmentName] = useState("");
  const [visibleValues, setVisibleValues] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateSecret, setShowCreateSecret] = useState(false);
  const [createSecretError, setCreateSecretError] = useState("");
  const [savingEnvironment, setSavingEnvironment] = useState(false);
  const [environmentManagerError, setEnvironmentManagerError] = useState("");
  const [environmentManagerStatus, setEnvironmentManagerStatus] = useState("");
  const [importingEnvFile, setImportingEnvFile] = useState(false);
  const [exportingEnvFile, setExportingEnvFile] = useState(false);
  const [envFileProgress, setEnvFileProgress] = useState("");
  const envFileInput = useRef<HTMLInputElement>(null);
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
      setCreateSecretError("A valid project is required to add a secret.");
      return;
    }

    setSubmitting(true);
    setCreateSecretError("");
    setStatus("");
    try {
      const response = await createSecret(
        { projectId, key, encryptedValue: value, description, environment },
        accessToken,
      );
      if (!response.success) {
        setCreateSecretError(response.message);
        return;
      }
      if (!response.data) {
        setCreateSecretError("The server did not return the created secret.");
        return;
      }
      const createdSecret = response.data;
      setSecrets((current) =>
        [...current, createdSecret].sort((a, b) => a.key.localeCompare(b.key)),
      );
      setKey("");
      setValue("");
      setDescription("");
      setShowCreateSecret(false);
      setStatus("Secret added successfully.");
    } catch {
      setCreateSecretError(
        "The secret could not be added. Check that the API is running.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImportEnvFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    if (!accessToken || !projectId) {
      setError("A valid project and session are required to import secrets.");
      return;
    }
    if (selectedEnvironment === "all") {
      setError("Choose one environment before importing a .env file.");
      return;
    }

    setImportingEnvFile(true);
    setError("");
    setStatus("");
    setEnvFileProgress("Reading .env file...");
    try {
      const variables = parseEnvFile(await file.text());
      if (variables.length === 0) {
        setError("The selected .env file does not contain any variables.");
        return;
      }
      setEnvFileProgress(`Importing 0 of ${variables.length} variables...`);

      const existingKeys = new Set(
        secrets
          .filter((secret) => secret.environment === selectedEnvironment)
          .map((secret) => secret.key),
      );
      const importedSecrets: Secret[] = [];
      const failedKeys: string[] = [];
      let skippedExisting = 0;

      for (const [index, variable] of variables.entries()) {
        setEnvFileProgress(
          `Importing ${index + 1} of ${variables.length}: ${variable.key}`,
        );
        if (existingKeys.has(variable.key)) {
          skippedExisting += 1;
          continue;
        }
        existingKeys.add(variable.key);

        try {
          const response = await createSecret(
            {
              projectId,
              key: variable.key,
              encryptedValue: variable.value,
              environment: selectedEnvironment,
            },
            accessToken,
          );
          if (!response.success || !response.data) {
            failedKeys.push(`${variable.key}: ${response.message}`);
            continue;
          }
          importedSecrets.push(response.data);
        } catch {
          failedKeys.push(`${variable.key}: request failed`);
        }
      }

      if (importedSecrets.length) {
        setSecrets((current) =>
          [...current, ...importedSecrets].sort((a, b) =>
            a.key.localeCompare(b.key),
          ),
        );
      }

      const summary = `${importedSecrets.length} imported, ${skippedExisting} existing key${skippedExisting === 1 ? "" : "s"} skipped, ${failedKeys.length} failed.`;
      if (failedKeys.length) {
        setError(
          `${summary} First failure: ${failedKeys[0]}`,
        );
      } else {
        setStatus(summary);
      }
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "The .env file could not be read.",
      );
    } finally {
      setImportingEnvFile(false);
      setEnvFileProgress("");
    }
  }

  async function handleExportEnvFile() {
    if (!accessToken || !projectId) {
      setError("A valid project and session are required to export secrets.");
      return;
    }
    if (selectedEnvironment === "all") {
      setError("Choose one environment before exporting a .env file.");
      return;
    }

    const environmentSecrets = secrets.filter(
      (secret) => secret.environment === selectedEnvironment,
    );
    setExportingEnvFile(true);
    setError("");
    setStatus("");
    setEnvFileProgress(`Preparing ${environmentSecrets.length} secrets...`);
    try {
      const variables = [];
      for (const [index, secret] of environmentSecrets.entries()) {
        setEnvFileProgress(
          `Reading ${index + 1} of ${environmentSecrets.length}: ${secret.key}`,
        );
        const response = await getSecretValue(secret._id, accessToken);
        if (!response.success || !response.data) {
          throw new Error(`${secret.key}: ${response.message}`);
        }
        variables.push({ key: secret.key, value: response.data.value });
      }
      const content = serializeEnvFile(variables);
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileBaseName = `${projectName}-${selectedEnvironment}`
        .replace(/[^A-Za-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      link.href = url;
      link.download = `${fileBaseName || "secrets"}.env`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus(
        `Downloaded ${variables.length} secrets as plaintext. Store the file securely.`,
      );
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? `The .env file could not be exported. ${exportError.message}`
          : "The .env file could not be exported.",
      );
    } finally {
      setExportingEnvFile(false);
      setEnvFileProgress("");
    }
  }

  async function handleCreateEnvironment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !projectId) return;
    setSavingEnvironment(true);
    setEnvironmentManagerError("");
    setEnvironmentManagerStatus("");
    try {
      const response = await createProjectEnvironment(
        projectId,
        newEnvironmentName,
        accessToken,
      );
      if (!response.success || !response.data) {
        setEnvironmentManagerError(response.message);
        return;
      }
      const createdEnvironment = response.data;
      setEnvironments((current) => [...current, createdEnvironment]);
      setEnvironment(createdEnvironment.name);
      setSelectedEnvironment(createdEnvironment.name);
      setNewEnvironmentName("");
      setEnvironmentManagerStatus(
        `Environment "${createdEnvironment.name}" added successfully.`,
      );
    } catch {
      setEnvironmentManagerError(
        "The environment could not be added. Check that the API is running.",
      );
    } finally {
      setSavingEnvironment(false);
    }
  }

  async function handleRenameEnvironment(
    event: FormEvent<HTMLFormElement>,
    item: ProjectEnvironment,
  ) {
    event.preventDefault();
    if (!accessToken || item.isDefault) return;
    const name = renamedEnvironmentName.trim();
    if (!name) {
      setEnvironmentManagerError("Environment name is required.");
      return;
    }
    setSavingEnvironment(true);
    setEnvironmentManagerError("");
    setEnvironmentManagerStatus("");
    try {
      const response = await renameProjectEnvironment(
        projectId,
        item._id,
        name,
        accessToken,
      );
      if (!response.success || !response.data) {
        setEnvironmentManagerError(response.message);
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
      setEnvironmentManagerStatus(
        `Environment renamed to "${renamed.name}".`,
      );
      setEditingEnvironmentId("");
      setRenamedEnvironmentName("");
    } catch {
      setEnvironmentManagerError(
        "The environment could not be renamed. Check that the API is running.",
      );
    } finally {
      setSavingEnvironment(false);
    }
  }

  async function handleDeleteEnvironment(item: ProjectEnvironment) {
    if (
      !accessToken ||
      item.isDefault ||
      !window.confirm(`Delete the ${item.name} environment?`)
    )
      return;
    setSavingEnvironment(true);
    setEnvironmentManagerError("");
    setEnvironmentManagerStatus("");
    try {
      const response = await deleteProjectEnvironment(
        projectId,
        item._id,
        accessToken,
      );
      if (!response.success) {
        setEnvironmentManagerError(response.message);
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
      setEnvironmentManagerStatus(
        `Environment "${item.name}" deleted successfully.`,
      );
    } catch {
      setEnvironmentManagerError(
        "The environment could not be deleted. Check that the API is running.",
      );
    } finally {
      setSavingEnvironment(false);
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

  const selectedEnvironmentSecretCount = secrets.filter(
    (secret) => secret.environment === selectedEnvironment,
  ).length;

  function closeCreateSecret() {
    if (submitting) return;
    setShowCreateSecret(false);
    setCreateSecretError("");
    setKey("");
    setValue("");
    setDescription("");
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
          <section className="dashboard-panel secret-list-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Protected values</p>
                <h2>Project secrets</h2>
              </div>
              <div className="secret-list-heading-actions">
                <span className="workspace-index">
                  {loading
                    ? "Syncing"
                    : `${selectedEnvironment === "all" ? secrets.length : selectedEnvironmentSecretCount} secrets`}
                </span>
                <button
                  className="button button-accent"
                  disabled={loading || environments.length === 0}
                  onClick={() => {
                    setCreateSecretError("");
                    setError("");
                    setStatus("");
                    setEnvironment(
                      selectedEnvironment !== "all"
                        ? selectedEnvironment
                        : environments.find((item) => item.name === "development")
                            ?.name ?? environments[0]?.name ?? "",
                    );
                    setShowCreateSecret(true);
                  }}
                  type="button"
                >
                  + Add secret
                </button>
              </div>
            </div>
            <div className="secret-tools">
              <div className="secret-environment-picker">
                <label htmlFor="secret-environment">Environment</label>
                <select
                  className="auth-input"
                  id="secret-environment"
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
                <small>
                  {selectedEnvironment === "all"
                    ? "Select one environment to import or export."
                    : selectedEnvironmentSecretCount
                      ? `${selectedEnvironment} · ${selectedEnvironmentSecretCount} secrets`
                      : "No secrets yet. Import a .env file or add a secret."}
                </small>
              </div>
              <div className="secret-tools-actions">
                <input
                  ref={envFileInput}
                  accept=".env,.txt,text/plain"
                  aria-label="Choose a .env file to import"
                  hidden
                  onChange={(event) => void handleImportEnvFile(event)}
                  type="file"
                />
                <div className="env-file-actions">
                  <button
                    className="panel-action"
                    disabled={
                      loading ||
                      selectedEnvironment === "all" ||
                      importingEnvFile ||
                      exportingEnvFile
                    }
                    onClick={() => envFileInput.current?.click()}
                    type="button"
                  >
                    {importingEnvFile ? "Importing..." : "Import .env"}
                  </button>
                  <button
                    className="button button-accent env-export-button"
                    disabled={
                      loading ||
                      selectedEnvironment === "all" ||
                      selectedEnvironmentSecretCount === 0 ||
                      importingEnvFile ||
                      exportingEnvFile
                    }
                    onClick={() => void handleExportEnvFile()}
                    type="button"
                  >
                    {exportingEnvFile ? "Exporting..." : "Export .env"}
                    {!exportingEnvFile ? <span>↗</span> : null}
                  </button>
                </div>
                <button
                  aria-haspopup="dialog"
                  className="panel-action"
                  onClick={() => {
                    setEnvironmentManagerError("");
                    setEnvironmentManagerStatus("");
                    setShowEnvironmentManager(true);
                  }}
                  type="button"
                >
                  Manage environments
                </button>
              </div>
            </div>
            {selectedEnvironment !== "all" ? (
              <p className="env-file-help">
                Imports add new keys and skip existing ones. Exports download
                plaintext values; keep the file private and out of source
                control.
              </p>
            ) : null}
            {envFileProgress ? (
              <p className="env-file-progress" role="status" aria-live="polite">
                <span className="env-file-spinner" aria-hidden="true" />
                {envFileProgress}
              </p>
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
      {showEnvironmentManager ? (
        <div
          className="share-dialog-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingEnvironment
            ) {
              setShowEnvironmentManager(false);
              setEditingEnvironmentId("");
              setEnvironmentManagerError("");
            }
          }}
        >
          <section
            aria-labelledby="environment-manager-title"
            aria-modal="true"
            className="share-dialog resource-form-dialog environment-manager-dialog"
            role="dialog"
          >
            <div className="share-dialog-heading">
              <div>
                <p className="section-kicker">Project settings</p>
                <h2 id="environment-manager-title">Manage environments</h2>
              </div>
              <button
                aria-label="Close environment settings"
                className="share-dialog-close"
                disabled={savingEnvironment}
                onClick={() => {
                  setShowEnvironmentManager(false);
                  setEditingEnvironmentId("");
                  setEnvironmentManagerError("");
                  setEnvironmentManagerStatus("");
                }}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="environment-dialog-description">
              Separate secrets by deployment stage. Each environment keeps its
              own set of values; the default environment cannot be deleted.
            </p>
            <form
              className="environment-create-form"
              onSubmit={handleCreateEnvironment}
            >
              <label>
                New environment
                <input
                  autoFocus
                  className="auth-input"
                  maxLength={50}
                  minLength={1}
                  onChange={(event) =>
                    setNewEnvironmentName(event.target.value)
                  }
                  placeholder="e.g. preview"
                  required
                  value={newEnvironmentName}
                />
              </label>
              <button
                className="button button-accent"
                disabled={savingEnvironment}
                type="submit"
              >
                {savingEnvironment ? "Adding..." : "Add environment"}
                {!savingEnvironment ? <span>↗</span> : null}
              </button>
            </form>
            {environmentManagerError ? (
              <p className="workspace-error" role="alert">
                {environmentManagerError}
              </p>
            ) : null}
            {environmentManagerStatus ? (
              <p className="workspace-success" role="status">
                {environmentManagerStatus}
              </p>
            ) : null}
            <div className="environment-dialog-list-heading">
              <h3>Project environments</h3>
              <span>{environments.length} total</span>
            </div>
            <div className="environment-manager-list">
              {environments.map((item) => (
                <div className="environment-manager-row" key={item._id}>
                  {editingEnvironmentId === item._id ? (
                    <form
                      className="environment-rename-form"
                      onSubmit={(event) =>
                        void handleRenameEnvironment(event, item)
                      }
                    >
                      <input
                        aria-label={`New name for ${item.name}`}
                        autoFocus
                        className="auth-input"
                        maxLength={50}
                        minLength={1}
                        onChange={(event) =>
                          setRenamedEnvironmentName(event.target.value)
                        }
                        required
                        value={renamedEnvironmentName}
                      />
                      <button
                        className="panel-action"
                        disabled={savingEnvironment}
                        type="submit"
                      >
                        {savingEnvironment ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="panel-action"
                        disabled={savingEnvironment}
                        onClick={() => {
                          setEditingEnvironmentId("");
                          setRenamedEnvironmentName("");
                          setEnvironmentManagerError("");
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="environment-manager-name">
                        <span className="environment-manager-dot" />
                        <strong>{item.name}</strong>
                        {item.isDefault ? (
                          <span className="environment-default-badge">
                            Default
                          </span>
                        ) : null}
                      </div>
                      {item.isDefault ? (
                        <small className="environment-locked">
                          Always available
                        </small>
                      ) : (
                        <div>
                          <button
                            className="panel-action"
                            disabled={savingEnvironment}
                            onClick={() => {
                              setEnvironmentManagerError("");
                              setEditingEnvironmentId(item._id);
                              setRenamedEnvironmentName(item.name);
                            }}
                            type="button"
                          >
                            Rename
                          </button>
                          <button
                            className="panel-action danger-action"
                            disabled={savingEnvironment}
                            onClick={() => void handleDeleteEnvironment(item)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      {showCreateSecret ? (
        <div
          className="share-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreateSecret();
          }}
        >
          <section
            aria-labelledby="create-secret-title"
            aria-modal="true"
            className="share-dialog resource-form-dialog secret-create-dialog"
            role="dialog"
          >
            <div className="share-dialog-heading">
              <div>
                <p className="section-kicker">Protected configuration</p>
                <h2 id="create-secret-title">Add a secret</h2>
              </div>
              <button
                aria-label="Close secret form"
                className="share-dialog-close"
                disabled={submitting}
                onClick={closeCreateSecret}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="resource-dialog-context">
              Secret values are encrypted before they are stored.
            </p>
            <form className="secret-create-form" onSubmit={handleCreate}>
              <label>
                Secret key
                <input
                  autoFocus
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
                  autoComplete="new-password"
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
              {createSecretError ? (
                <p className="workspace-error" role="alert">
                  {createSecretError}
                </p>
              ) : null}
              <button
                className="button button-accent secret-add-button"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Encrypting..." : "Create secret"} <span>↗</span>
              </button>
            </form>
          </section>
        </div>
      ) : null}
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
