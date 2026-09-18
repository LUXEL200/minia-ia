import type { Express, Request } from "express";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { rateLimit } from "./rateLimit";

const PUBLIC_PREFIXES = ["generated/", "templates/"];

function isSafeKey(key: string) {
  return key.length <= 512 && !key.includes("..") && !key.startsWith("/") && !key.includes("\\") && /^[a-zA-Z0-9/_:.()-]+$/.test(key);
}

async function canReadKey(req: Request, key: string) {
  if (PUBLIC_PREFIXES.some(prefix => key.startsWith(prefix))) return true;
  const ownerMatch = key.match(/^(?:user-images|thumbnails)\/(\d+)\//);
  if (!ownerMatch) return false;
  try {
    const user = await sdk.authenticateRequest(req);
    return Boolean(user && user.id === Number(ownerMatch[1]));
  } catch {
    return false;
  }
}

export function registerStorageProxy(app: Express) {
  app.use("/manus-storage", rateLimit({ name: "storage", windowMs: 60_000, max: 120 }));
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key || !isSafeKey(key)) {
      res.status(400).send("Invalid storage key");
      return;
    }

    if (!(await canReadKey(req, key))) {
      res.status(404).send("Asset not found");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL("v1/storage/presign/get", ENV.forgeApiUrl.replace(/\/+$/, "") + "/");
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` } });
      if (!forgeResp.ok) {
        console.error(`[StorageProxy] forge error: ${forgeResp.status}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "private, no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
