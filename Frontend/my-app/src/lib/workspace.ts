import {
  getCurrentAccessToken,
  refreshAccessToken,
  type ApiResponse,
} from "./auth";

export type WorkspaceVisibility = "private" | "internal";

export interface CreateOrganizationPayload {
  name: string;
  description: string;
  visibility: WorkspaceVisibility;
}

export interface CreateProjectPayload extends CreateOrganizationPayload {
  orgId: string;
}

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  visibility: WorkspaceVisibility;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  orgId: string;
  visibility: WorkspaceVisibility;
  status: "active" | "archived";
  createdAt: string;
}

export type SecretEnvironment = "development" | "staging" | "production";

export interface Secret {
  _id: string;
  projectId: string;
  key: string;
  description?: string;
  encryptedValue?: string;
  environment: SecretEnvironment;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSecretPayload {
  projectId: string;
  key: string;
  description?: string;
  encryptedValue: string;
  environment: SecretEnvironment;
}

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX;

let refreshPromise: Promise<string | null> | null = null;

async function getRefreshedAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .then((response) =>
        response.success ? (response.data?.accessToken ?? null) : null,
      )
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json().catch(() => ({
    success: false,
    message: "Unable to parse response from the server.",
    data: null,
  }))) as ApiResponse<T>;
}

async function request<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const makeRequest = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${token}`);

    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return fetch(`${API_PREFIX}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  };

  const response = await makeRequest(getCurrentAccessToken() ?? accessToken);
  const payload = await parseResponse<T>(response);
  const isUnauthorized = response.status === 401 || payload.statusCode === 401;

  if (!isUnauthorized) return payload;

  const refreshedToken = await getRefreshedAccessToken();
  if (!refreshedToken) return payload;

  const retryResponse = await makeRequest(refreshedToken);
  return parseResponse<T>(retryResponse);
}

export function createOrganization(
  payload: CreateOrganizationPayload,
  accessToken: string,
) {
  return request("/org/create", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createProject(
  payload: CreateProjectPayload,
  accessToken: string,
) {
  return request("/project/create", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listOrganizations(accessToken: string) {
  return request<Organization[]>("/org", accessToken);
}

export function listProjects(accessToken: string) {
  return request<Project[]>("/project", accessToken);
}

export function listSecrets(projectId: string, accessToken: string) {
  return request<Secret[]>(
    `/secret?projectId=${encodeURIComponent(projectId)}`,
    accessToken,
  );
}

export function createSecret(
  payload: CreateSecretPayload,
  accessToken: string,
) {
  return request<Secret>("/secret/create", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSecretValue(secretId: string, accessToken: string) {
  return request<{ value: string }>(`/secret/${secretId}`, accessToken);
}

export function deleteSecret(secretId: string, accessToken: string) {
  return request(`/secret/${secretId}`, accessToken, { method: "DELETE" });
}

export function deleteOrganization(
  organizationId: string,
  accessToken: string,
) {
  return request(`/org/${organizationId}`, accessToken, { method: "DELETE" });
}

export function deleteProject(projectId: string, accessToken: string) {
  return request(`/project/${projectId}`, accessToken, { method: "DELETE" });
}
