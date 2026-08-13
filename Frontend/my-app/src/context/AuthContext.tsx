"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  resendOtpUser,
  signupUser,
  verifyOtpUser,
  type LoginPayload,
  type SignupPayload,
} from "@/lib/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  accessToken: string | null;
  pendingEmail: string | null;
  loading: boolean;
  error: string | null;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = async () => {
    setError(null);

    try {
      const response = await refreshAccessToken();

      if (response.success && response.data?.accessToken) {
        setAccessToken(response.data.accessToken as string);
        return;
      }

      setAccessToken(null);
    } catch {
      setAccessToken(null);
    }
  };

  useEffect(() => {
    void refreshSession().finally(() => setLoading(false));
  }, []);

  const signup = async (payload: SignupPayload) => {
    setError(null);
    const response = await signupUser(payload);

    if (!response.success) {
      setError(response.message);
      throw new Error(response.message);
    }

    setPendingEmail(payload.email);
  };

  const login = async (payload: LoginPayload) => {
    setError(null);
    const response = await loginUser(payload);

    if (!response.success) {
      setError(response.message);
      throw new Error(response.message);
    }

    const token = response.data?.accessToken;
    if (token) {
      setAccessToken(token);
      setPendingEmail(null);
      return;
    }

    setError("The server did not return a token.");
    throw new Error("The server did not return a token.");
  };

  const verifyOtp = async (email: string, otp: string) => {
    setError(null);
    const response = await verifyOtpUser({ email, otp });

    if (!response.success) {
      setError(response.message);
      throw new Error(response.message);
    }

    const token = response.data?.accessToken;
    if (token) {
      setAccessToken(token);
      setPendingEmail(null);
      return;
    }

    setError("The server did not return a token.");
    throw new Error("The server did not return a token.");
  };

  const resendOtp = async (email: string) => {
    setError(null);
    const response = await resendOtpUser(email);

    if (!response.success) {
      setError(response.message);
      throw new Error(response.message);
    }

    setPendingEmail(email);
  };

  const logout = async () => {
    setError(null);
    try {
      await logoutUser();
    } catch {
      // Ignore logout errors and clear the local session.
    }

    setAccessToken(null);
    setPendingEmail(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(accessToken),
      accessToken,
      pendingEmail,
      loading,
      error,
      signup,
      login,
      verifyOtp,
      resendOtp,
      logout,
      refreshSession,
    }),
    [accessToken, pendingEmail, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
