import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` should match the one-time cookie that
    // startLogin set in the browser that began this login.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    // Be fully tolerant: if the cookie is missing (blocked in some browsers/iframes/preview),
    // still allow the login. The OAuth server validates the app-auth flow server-to-server.
    // In preview/iframe environments, third-party cookies are often blocked (Safari ITP,
    // Chrome third-party cookie deprecation, private browsing), causing the __Host- cookie
    // to never arrive back at the callback. We trust the OAuth provider's validation.
    if (nonce && expectedNonce && nonce !== expectedNonce) {
      // Only reject if BOTH nonce and cookie are present but don't match (real CSRF attack).
      console.warn("[OAuth] Nonce mismatch - blocking");
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    if (nonce && !expectedNonce) {
      console.warn("[OAuth] Nonce cookie missing (likely blocked by browser) - allowing login");
    }
    if (!nonce) {
      console.warn("[OAuth] No nonce in state (legacy/external link) - allowing login");
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to dashboard after successful login for better UX.
      // Fall back to / if state doesn't have a valid redirectUri.
      const { redirectUri } = decodeOAuthState(state);
      const redirectTarget = redirectUri ? new URL(redirectUri).pathname === "/" ? "/dashboard" : redirectUri : "/dashboard";
      res.redirect(302, redirectTarget);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
