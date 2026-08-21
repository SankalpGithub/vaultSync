export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode?: number;
}

export interface SignupPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

const API_PREFIX = "http://localhost:5000/api/v1/auth";

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const payload = (await response.json().catch(() => ({
    success: false,
    message: "Unable to parse response from the server.",
    data: null,
  }))) as ApiResponse<T>;

  return payload;
}

export async function signupUser(payload: SignupPayload) {
  return request<{ accessToken?: string }>("/sign-up", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginPayload) {
  return request<{ accessToken?: string }>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyOtpUser(payload: VerifyOtpPayload) {
  return request<{ accessToken?: string }>("/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendOtpUser(email: string) {
  return request("/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotPasswordUser(payload: ForgotPasswordPayload) {
  return request("/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutUser() {
  return request("/logout", {
    method: "GET",
  });
}

export async function refreshAccessToken() {
  return request<{ accessToken?: string }>("/refresh-token", {
    method: "GET",
  });
}
