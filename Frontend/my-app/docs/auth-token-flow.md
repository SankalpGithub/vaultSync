# Frontend access-token and refresh-token flow

This document describes how the frontend handles authentication tokens and when
it calls the backend refresh endpoint.

## Where the tokens are kept

- **Access token:** kept in React auth state and a module-level in-memory
  variable. It is not persisted to `localStorage` or `sessionStorage`. The
  frontend uses it as the bearer token for protected workspace API requests.
- **Refresh token:** the frontend does not read or store this token in
  JavaScript. The backend sets it in an `HttpOnly` cookie named `refreshToken`.
  The cookie is `SameSite=Strict`, has a seven-day maximum age, and is marked
  `Secure` in production.

Frontend requests use `credentials: "include"`, allowing the browser to attach
the refresh-token cookie to requests when the cookie's rules permit it.

## When `/refresh-token` is requested

The frontend calls `GET ${NEXT_PUBLIC_API_PREFIX}/auth/refresh-token` in two
situations:

1. **When the app's auth provider mounts.** The root layout wraps the app in
   `AuthProvider`. On mount, it calls `refreshSession()`, which requests a new
   access token using the refresh-token cookie. The app remains in its initial
   loading state until this attempt finishes. This startup request is made
   whether or not an access token is already in memory.
2. **After a protected workspace request receives a 401.** The workspace API
   helper first makes the requested API call with the current access token. If
   the HTTP response or API response indicates status 401, it calls the
   refresh endpoint. If refresh succeeds, it retries the original request
   once with the new access token. It does not retry again if that request
   fails.

There is no frontend timer that waits for the access token to expire, and
ordinary API requests are not refreshed pre-emptively. Concurrent protected
requests that receive 401 share one in-flight refresh request.

The automatic 401-and-retry behavior is implemented by the workspace request
helper. Calls made through the auth API helper, such as login and logout, do not
use that retry flow.

## What happens during refresh

1. The browser sends the refresh-token cookie with the refresh request.
2. The backend validates the refresh token and rotates it, setting the new
   refresh token in the cookie.
3. The response body contains the new access token; the refresh token is not
   returned in the JSON body.
4. The frontend updates its in-memory access token. For a 401-triggered
   refresh, it retries the original workspace request with that token.

On startup, if refresh does not produce an access token or the request fails,
the frontend clears its in-memory token and treats the user as unauthenticated.
For a protected request, if refresh fails, the original unauthorized response
is returned to the caller without retrying.

## Other token lifecycle events

- A successful login or OTP verification stores the returned access token in
  memory and marks the user authenticated.
- Logout calls the backend logout endpoint, then clears the access token and
  other local auth state even if the logout request fails.
- Signing up does not itself establish the frontend session; the frontend
  waits for OTP verification or a subsequent login to receive an access token.

## Implementation references

- [`AuthContext.tsx`](../src/context/AuthContext.tsx) — startup refresh,
  in-memory auth state, login, OTP verification, and logout.
- [`auth.ts`](../src/lib/auth.ts) — credentialed auth requests and the refresh
  endpoint call.
- [`workspace.ts`](../src/lib/workspace.ts) — bearer-token requests, 401
  refresh, concurrent refresh sharing, and retry.
- [`layout.tsx`](../src/app/layout.tsx) — app-wide `AuthProvider` setup.
