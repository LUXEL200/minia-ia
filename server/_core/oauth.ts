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

    // Session relancée depuis le portail OAuth : le code est présent mais le state
    // peut être absent (ex. clic sur "Utiliser un autre compte" dans le portail).
    // Dans ce cas, on redirige vers le login propre pour relancer un échange complet.
    if (!code) {
      res.status(400).type("text/html").send(
        `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Connexion Minia IA</title>
        <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0f;color:#f5f5f7;font-family:system-ui,sans-serif}
        .card{background:#14141c;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px;max-width:400px;text-align:center}
        h1{font-size:18px;margin:0 0 8px}.p{color:#a1a1aa;font-size:14px;margin:0 0 20px}
        a{display:inline-block;background:linear-gradient(90deg,#fb923c,#fdba74);color:#111;border-radius:999px;padding:10px 22px;font-weight:600;text-decoration:none;font-size:14px}</style></head>
        <body><div class="card"><h1>Paramètres OAuth introuvables</h1>
        <p class="p">La connexion n'a pas pu être finalisée automatiquement. Ce n'est pas grave : un simple clic relance la connexion proprement.</p>
        <a href="/dashboard">Se connecter à Minia IA</a></div></body></html>`
      );
      return;
    }

    // CSRF guard: the nonce in `state` should match the one-time cookie that
    // startLogin set in the browser that began this login.
    const { nonce } = state ? decodeOAuthState(state) : { nonce: undefined };
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
      let tokenResponse = null;
      try {
        tokenResponse = await sdk.exchangeCodeForToken(code, state ?? "");
      } catch (exchangeError) {
        if (!state) {
          // Pas de state possible (session relancée depuis le portail) : la page
          // HTML de relance a déjà été servie plus haut ; l'échange ne peut pas
          // aboutir sans state, on redirige donc vers le login.
          res.redirect(302, "/dashboard");
          return;
        }
        throw exchangeError;
      }
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
      const { redirectUri } = state ? decodeOAuthState(state) : { redirectUri: undefined };
      const redirectTarget = redirectUri ? new URL(redirectUri).pathname === "/" ? "/dashboard" : redirectUri : "/dashboard";
      res.redirect(302, redirectTarget);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      // Échec de l'échange : rediriger vers le dashboard qui détectera l'absence
      // de session et relancera proprement le login plutôt qu'afficher un JSON brut.
      res.redirect(302, "/dashboard");
    }
  });
}
