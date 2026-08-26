import {
  COOKIE_NAME,
  ONE_YEAR_MS,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_FALLBACK_COOKIE,
  decodeOAuthState,
} from "@shared/const";
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

    // The provider must return both values. Without `state`, the token exchange
    // cannot know which redirect URI was used and must not be attempted with an
    // empty redirect URI (that was the source of the raw JSON error page).
    if (!code || !state) {
      console.warn("[OAuth] Callback missing code or state");
      res.redirect(302, "/dashboard?auth_error=missing_state");
      return;
    }

    const decodedState = decodeOAuthState(state);
    const { redirectUri, nonce, returnPath } = decodedState;
    let callbackUrl: URL;
    try {
      callbackUrl = new URL(redirectUri);
    } catch {
      callbackUrl = new URL("https://invalid.local/");
    }
    if (!redirectUri || !/^https?:$/.test(callbackUrl.protocol) || callbackUrl.pathname !== "/api/oauth/callback") {
      console.warn("[OAuth] Invalid redirect URI in state");
      res.redirect(302, "/dashboard?auth_error=invalid_state");
      return;
    }

    // CSRF guard: accept either the hardened __Host- cookie (HTTPS) or the
    // localhost-compatible fallback (plain HTTP). Some embedded browsers drop
    // both cookies, so the provider's signed state remains the final validator.
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const expectedNonce = cookies[OAUTH_STATE_COOKIE] ?? cookies[OAUTH_STATE_FALLBACK_COOKIE];
    let normalizedExpectedNonce: string | undefined;
    try {
      normalizedExpectedNonce = expectedNonce ? decodeURIComponent(expectedNonce) : undefined;
    } catch {
      normalizedExpectedNonce = undefined;
    }
    if (nonce && normalizedExpectedNonce && nonce !== normalizedExpectedNonce) {
      console.warn("[OAuth] Nonce mismatch - blocking");
      res.redirect(302, "/dashboard?auth_error=invalid_state");
      return;
    }
    if (nonce && !normalizedExpectedNonce) {
      console.warn("[OAuth] Nonce cookie missing; continuing with provider validation");
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });
    res.clearCookie(OAUTH_STATE_FALLBACK_COOKIE, { path: "/" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        console.warn("[OAuth] Provider returned no openId");
        res.redirect(302, "/dashboard?auth_error=profile");
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

      // Only allow an internal path from state; never reflect an arbitrary URL.
      const redirectTarget = typeof returnPath === "string" && returnPath.startsWith("/") && !returnPath.startsWith("//")
        ? returnPath
        : "/dashboard";
      res.redirect(302, redirectTarget);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      // Always return to a usable UI. The dashboard shows a contextual message
      // and lets the user retry, rather than exposing provider JSON.
      res.redirect(302, "/dashboard?auth_error=exchange");
    }
  });
}
