import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_FALLBACK_COOKIE,
  encodeOAuthState,
} from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

let loginNavigationStarted = false;

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export const startLogin = () => {
  if (typeof window === "undefined" || loginNavigationStarted) return;

  const oauthPortalUrl = String(import.meta.env.VITE_OAUTH_PORTAL_URL ?? "").replace(/\/+$/, "");
  const appId = String(import.meta.env.VITE_APP_ID ?? "");
  if (!oauthPortalUrl || !appId) {
    console.error("[OAuth] Missing VITE_OAUTH_PORTAL_URL or VITE_APP_ID");
    window.location.assign("/dashboard?auth_error=configuration");
    return;
  }

  loginNavigationStarted = true;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const nonce = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const isSecure = window.location.protocol === "https:";
  const stateCookie = isSecure ? OAUTH_STATE_COOKIE : OAUTH_STATE_FALLBACK_COOKIE;

  // SameSite=Lax works for the top-level OAuth redirect. On localhost the
  // __Host- prefix is invalid without Secure, so use the explicit fallback.
  document.cookie = `${stateCookie}=${encodeURIComponent(nonce)}; Path=/; Max-Age=600; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  if (isSecure) {
    document.cookie = `${OAUTH_STATE_FALLBACK_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }

  try {
    sessionStorage.setItem("manus-login-return", `${window.location.pathname}${window.location.search}`);
  } catch {
    // sessionStorage can be unavailable in private or embedded browsers.
  }

  const state = encodeOAuthState({
    redirectUri,
    nonce,
    returnPath: `${window.location.pathname}${window.location.search}`,
  });
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  window.location.assign(url.toString());
};
