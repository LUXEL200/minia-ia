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
import { getRemindersToFire, markScheduleReminded, createNotification } from "../db";
import { serveStatic, setupVite } from "./vite";

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
  registerOAuthRoutes(app);
  // Cron Heartbeat — planning reminders (J-1 notifications)
  app.post("/api/scheduled/fireReminders", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }
      const window = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const due = await getRemindersToFire(window);
      const fired: { scheduleId: number; userId: number; title: string }[] = [];
      for (const s of due) {
        try {
          await createNotification({
            userId: s.userId,
            title: "Rappel de planification",
            message: `« ${s.youtubeTitle} » est programmé pour demain. Prépare ta vidéo et publie la miniature à temps !`,
            type: "system",
          });
          await markScheduleReminded(s.id);
          fired.push({ scheduleId: s.id, userId: s.userId, title: s.youtubeTitle });
        } catch {
          // Continuer sur les autres schedules même si un échoue (idempotent au global)
        }
      }
      res.json({ ok: true, fired });
    } catch (err) {
      res.status(500).json(JSON.parse(JSON.stringify({ error: String(err), context: { url: req.originalUrl }, timestamp: new Date().toISOString() })));
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
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
