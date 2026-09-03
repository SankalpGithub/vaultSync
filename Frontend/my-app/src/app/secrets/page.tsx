"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import {
  createSecret,
  deleteSecret,
  getSecretValue,
  listSecrets,
  type Secret,
  type SecretEnvironment,
} from "@/lib/workspace";

const environments: SecretEnvironment[] = [
  "development",
  "staging",
  "production",
];

export default function SecretsPage() {
  const { accessToken } = useAuth();
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("Project");
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [visibleValues, setVisibleValues] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSecretId, setActiveSecretId] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] =
    useState<SecretEnvironment>("development");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setProjectId(params.get("projectId") ?? "");
    setProjectName(params.get("projectName") ?? "Project");
  }, []);

  useEffect(() => {
    if (!accessToken || !projectId) {
      if (!projectId) setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    void listSecrets(projectId, accessToken)
      .then((response) => {
        if (cancelled) return;
        if (!response.success) {
          setError(response.message);
          return;
        }
        setSecrets(response.data ?? []);
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
                  onChange={(event) =>
                    setEnvironment(event.target.value as SecretEnvironment)
                  }
                >
                  {environments.map((item) => (
                    <option key={item} value={item}>
                      {item}
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
              <span className="workspace-index">
                {loading ? "Syncing" : `${secrets.length} secrets`}
              </span>
            </div>
            {loading ? (
              <p className="workspace-empty">Loading secrets...</p>
            ) : secrets.length === 0 ? (
              <p className="workspace-empty">
                No secrets have been added to this project yet.
              </p>
            ) : (
              <div className="managed-secret-list">
                {secrets.map((secret) => (
                  <div className="managed-secret-row" key={secret._id}>
                    <div className="managed-secret-name">
                      <strong>{secret.key}</strong>
                      <small>
                        {secret.description || "Protected configuration"}
                      </small>
                    </div>
                    <span className={`environment-tag ${secret.environment}`}>
                      <i /> {secret.environment}
                    </span>
                    <code>{visibleValues[secret._id] ?? "••••••••••••••"}</code>
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
                    <button
                      className="row-delete"
                      aria-label={`Delete ${secret.key}`}
                      onClick={() => void handleDelete(secret)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </WorkspaceShell>
  );
}
