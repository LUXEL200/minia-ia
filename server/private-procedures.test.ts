import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const publicProcedures = new Set([
  "system.health",
  "demo.config",
  "demo.generate",
  "auth.me",
  "auth.logout",
  "gallery.thumbnails",
  "gallery.stats",
  "likes.bulk",
  "templates.list",
  "abTests.getByShareToken",
  "testimonials.approved",
  "plans.catalog",
  "packs.catalog",
]);

function getProcedure(caller: any, path: string) {
  return path.split(".").reduce((node, part) => node[part], caller);
}

describe("Protection des procédures privées", () => {
  it("refuse chaque procédure privée sans session", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { headers: {}, socket: { remoteAddress: "private-test" } },
    } as never);
    const procedures = Object.keys(appRouter._def.procedures).filter(path => !publicProcedures.has(path));

    expect(procedures.length).toBeGreaterThan(40);
    for (const path of procedures) {
      try {
        await getProcedure(caller, path)(undefined);
        throw new Error(`${path} a accepté une requête sans session`);
      } catch (error: any) {
        expect(["UNAUTHORIZED", "FORBIDDEN"]).toContain(error?.code);
      }
    }
  });
});
