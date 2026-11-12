import { getCurrentAccessToken, refreshAccessToken, type ApiResponse } from "./auth";

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX;

export interface ShareInvitation {
  _id: string;
  recipientEmail: string;
  status: string;
  role: string;
  message?: string;
  createdAt: string;
}

export interface AccessGrant {
  _id: string;
  userId: string;
  grantedBy: string;
  resourceType: "organization" | "project" | "environment" | "secret";
  resourceId: string;
  role: string;
  permissions: string[];
  status: "active" | "revoked";
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json().catch(() => ({
    success: false,
    message: "Unable to parse the server response.",
    data: null,
  }))) as ApiResponse<T>;
}

async function request<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers);
  headers.set(
    "Authorization",
    `Bearer ${getCurrentAccessToken() ?? accessToken}`,
  );
  if (init.body) headers.set("Content-Type", "application/json");

  let response = await fetch(`${API_PREFIX}/share${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = await parseResponse<T>(response);
  if (response.status !== 401) return payload;

  const refreshed = await refreshAccessToken();
  if (!refreshed.success || !refreshed.data?.accessToken) return payload;
  headers.set("Authorization", `Bearer ${refreshed.data.accessToken}`);
  response = await fetch(`${API_PREFIX}/share${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  return parseResponse<T>(response);
}

export function createShare(payload: Record<string, unknown>, accessToken: string) {
  return request<{ invitationIds: string[]; recipientCount: number }>("/", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const receivedInvitations = (accessToken: string, status?: string) =>
  request<ShareInvitation[]>(`/invitations/received${status ? `?status=${status}` : ""}`, accessToken);

export const sentInvitations = (accessToken: string, status?: string) =>
  request<ShareInvitation[]>(`/invitations/sent${status ? `?status=${status}` : ""}`, accessToken);

export const listGrants = (accessToken: string) =>
  request<AccessGrant[]>("/grants", accessToken);

export function respondToInvitation(
  id: string,
  action: "accept" | "reject",
  accessToken: string,
  token?: string,
) {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return request<{
    invitationId: string;
    projectIds: string[];
    secretProjectIds?: string[];
  }>(
    `/invitations/${id}/${action}${query}`,
    accessToken,
    { method: "POST" },
  );
}

export function cancelInvitation(id: string, accessToken: string) {
  return request<{ invitationId: string }>(
    `/invitations/${id}/cancel`,
    accessToken,
    { method: "POST" },
  );
}

export function revokeGrant(id: string, accessToken: string) {
  return request<void>(
    `/grants/${id}/revoke`,
    accessToken,
    { method: "POST" },
  );
}
