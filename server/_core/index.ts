// Environment variables are injected by the runtime, no need for dotenv
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { getUsersWithLowCredits, markLowCreditNotified, createNotification, getScheduledExportByTaskUid, updateScheduledExportStatus, getAdminHistoricalMetrics, getUserEventTimeline } from "../db";
import { serveStatic, setupVite } from "./vite";
import { rateLimit } from "./rateLimit";
import { ENV } from "./env";

function csvReport(rows: Record<string, unknown>[]) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const esc = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.map(esc).join(","), ...rows.map(row => headers.map(key => esc(row[key])).join(","))].join("\n");
}

function simplePdfReport(title: string, rows: Record<string, unknown>[]) {
  const ascii = (value: unknown) => String(value).normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
  const lines = [ascii(title), `Generated ${new Date().toISOString()}`, ...rows.slice(0, 80).map(row => ascii(Object.values(row).join(" | ")))];
  const text = lines.map(line => line.replace(/[()\\]/g, "\\$&").slice(0, 180)).map((line, index) => `BT /F1 9 Tf 40 ${760 - index * 12} Td (${line}) Tj ET`).join("\n");
  const objects = [`1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj`, `2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj`, `3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>endobj`, `4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj`, `5 0 obj<< /Length ${text.length} >>stream\n${text}\nendstream endobj`];
  let pdf = "%PDF-1.4\n"; const offsets: number[] = [0];
  for (const object of objects) { offsets.push(pdf.length); pdf += `${object}\n`; }
  const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "utf8").toString("base64");
}

async function sendScheduledReport(to: string, subject: string, format: "csv" | "pdf", rows: Record<string, unknown>[]) {
  if (!ENV.resendApiKey) throw new Error("RESEND_API_KEY is not configured");
  const isPdf = format === "pdf";
  const content = isPdf ? simplePdfReport(subject, rows) : Buffer.from(csvReport(rows), "utf8").toString("base64");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: ENV.resendFromEmail, to: [to], subject, html: `<p>Ton rapport Minia IA est prêt. Il contient ${rows.length} ligne(s) et est joint à cet email.</p>`, attachments: [{ filename: `minia-report.${isPdf ? "pdf" : "csv"}`, content }] }) });
  if (!response.ok) throw new Error(`Email provider error ${response.status}: ${await response.text()}`);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app, rateLimit({ name: "oauth", windowMs: 60_000, max: 20 }));
  // Cron Heartbeat — alertes de crédits bas (solde <= 5)
  app.post("/api/scheduled/fireLowCreditAlerts", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }
      const low = await getUsersWithLowCredits(5);
      const fired: { userId: number; credits: number }[] = [];
      for (const c of low) {
        try {
          await createNotification({
            userId: c.userId,
            title: "Crédits bientôt épuisés",
            message: `Il te reste ${c.credits} crédit(s). Recharge tes packs de crédits dans Facturation pour ne pas interrompre tes générations.`,
            type: "system",
          });
          await markLowCreditNotified(c.userId);
          fired.push({ userId: c.userId, credits: c.credits });
        } catch {
          // Continuer sur les autres users même si un échoue (idempotent au global)
        }
      }
      res.json({ ok: true, fired });
    } catch (err) {
      res.status(500).json(JSON.parse(JSON.stringify({ error: String(err), context: { url: req.originalUrl }, timestamp: new Date().toISOString() })));
    }
  });

  // Cron Heartbeat — livraison des exports administrateur récurrents.
  app.post("/api/scheduled/runExport", async (req, res) => {
    let report: Awaited<ReturnType<typeof getScheduledExportByTaskUid>> = null;
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      report = await getScheduledExportByTaskUid(user.taskUid);
      if (!report) return res.json({ ok: true, skipped: "orphan" });
      const filters = (report.filters && typeof report.filters === "object" ? report.filters : {}) as { days?: number; planType?: "free" | "pro" | "max"; userId?: number; from?: string; to?: string };
      const rows = report.reportType === "metrics"
        ? await getAdminHistoricalMetrics({ ...filters, from: filters.from ? new Date(filters.from) : undefined, to: filters.to ? new Date(filters.to) : undefined })
        : (filters.userId ? await getUserEventTimeline(filters.userId, 200) : []);
      await sendScheduledReport(report.email, `Minia IA · rapport ${report.reportType}`, report.format, rows as unknown as Record<string, unknown>[]);
      await updateScheduledExportStatus(report.id, report.createdBy, "active");
      return res.json({ ok: true, exportId: report.id, rows: rows.length });
    } catch (err) {
      if (report) await updateScheduledExportStatus(report.id, report.createdBy, "failed", String(err));
      res.status(500).json(JSON.parse(JSON.stringify({ error: String(err), context: { url: req.originalUrl, taskUid: req.body?.taskUid ?? null }, timestamp: new Date().toISOString() })));
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    rateLimit({ name: "api", windowMs: 60_000, max: 180 }),
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
