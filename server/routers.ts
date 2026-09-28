import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminPermission, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { generateImage, listImageModels } from "./_core/imageGeneration";
import { createHeartbeatJob, deleteHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { parse as parseCookie } from "cookie";

/**
 * Burn the "Minia IA" watermark into a generated image for free-plan users.
 * Fetches the image, composites "Minia IA" bottom-right via sharp, returns dataURL.
 */
async function burnWatermark(imageUrl: string): Promise<string | null> {
  try {
    const sharp = (await import("sharp")).default;
    const resp = await fetch(imageUrl);
    if (!resp.ok) return null;
    const buffer = Buffer.from(await resp.arrayBuffer());
    const { width, height } = await sharp(buffer).metadata();
    const outWidth = Math.min(width ?? 1280, 1280);
    const outHeight = (height && width) ? Math.round((outWidth / width) * height) : 720;
    const watermark = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}">
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
            <stop offset="55%" stop-color="rgba(0,0,0,0)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
          </linearGradient>
        </defs>
        <rect width="${outWidth}" height="${outHeight}" fill="url(#fade)"/>
        <text x="${outWidth - 24}" y="${outHeight - 22}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="34"
              fill="rgba(255,255,255,0.95)" text-anchor="end">Minia IA</text>
      </svg>`
    );
    const wm = await sharp(watermark).png().toBuffer();
    const composed = await sharp(buffer)
      .resize(outWidth, outHeight, { fit: "cover" })
      .composite([{ input: wm, top: 0, left: 0 }])
      .png()
      .toBuffer();
    return `data:image/png;base64,${composed.toString("base64")}`;
  } catch (err) {
    console.error("[Watermark] Failed:", err);
    return null;
  }
}
import { thumbnails, avatars, endCards, templateCustomizations, imageVersions, abTests, scheduledExports } from "../drizzle/schema";
import {
  getThumbnailsByUserId,
  getThumbnailById,
  createThumbnail,
  updateThumbnailStatus,
  getUserCredits,
  listCreditLedger,
  recordCreditLedger,
  ensureUserCredits,
  deductCredits,
  refundCredits,
  getDb,
  getAdminAccess,
  listAdminAccess,
  upsertAdminAccess,
  revokeAdminAccess,
  listScheduledExports,
  createScheduledExport,
  updateScheduledExportTask,
  updateScheduledExportStatus,
  getGalleryThumbnails,
  getGalleryStats,
  toggleLike,
  getLikesForThumbnails,
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  getTeamTasks,
  createTeamTask,
  updateTaskStatus,
  toggleFavorite,
  getFavoritesByUserId,
  getAllTemplates,
  createTemplate,
  deleteTemplate,
  getAvatarsByUserId,
  createAvatar,
  updateAvatarStatus,
  getEndCardsByUserId,
  createEndCard,
  updateEndCardStatus,
  moveToTrash,
  getTrashedByUserId,
  restoreFromTrash,
  emptyTrash,
  getApiKeysByUserId,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  getNotificationsByUserId,
  getUnreadCountByUserId,
  getRecentUnreadNotifications,
  createNotification,
  getLegacyApiKeySummary,
  migrateLegacyApiKeys,
  createAdminAuditLog,
  getAdminAuditLogs,
  markNotificationRead,
  markAllNotificationsRead,
  getAdminStats,
  getAdminOperations,
  getUserSupportSnapshot,
  getUserEventTimeline,
  getAdminHistoricalMetrics,
  getAllUsers,
  updateUserRole,
  updateUserCredits,
  updateUserPlan,
  resetUserCredits,
  revokeUserSessions,
  sendGlobalNotification,
  createTemplateCustomization,
  updateTemplateCustomization,
  deleteTemplateCustomization,
  createImageVersion,
  deleteImageVersion,
  createAbTest,
  updateAbTest,
  deleteAbTest,
  getAbTestById,
  getAbTestByShareToken,
  setAbTestShareToken,
  getThumbnailsByUserIdFiltered,
  setThumbnailYoutube,
  getOrCreateOrganization,
  updateOrganization,
  getOrgMembers,
  removeOrgMember,
  sendOrgInvitation,
  getSentInvitations,
  cancelSentInvitation,
  getReceivedInvitations,
  acceptInvitation,
  declineInvitation,
  addAbTestContribution,
  getAbTestContributions,
  deleteAbTestContribution,
  globalSearch,
  createPublishedSchedule,
  deletePublishedSchedule,
  getScheduleByIdWithCheck,
  updatePublishedSchedule as updatePublishedScheduleDb,
  getUpcomingSchedules,
  getSchedulesByMonth,
  getRemindersToFire,
  markScheduleReminded,
  getThumbnailByIdWithCheck,
  listCreditPackPurchases,
  createCreditPackPurchase,
  listApprovedTestimonials,
  listAllTestimonials,
  createTestimonial,
  setTestimonialVerified,
  deleteTestimonial as dbDeleteTestimonial,
} from "./db";
import { adminProcedure } from "./_core/trpc";

// === Sub-routers (defined before appRouter to avoid TDZ) ===

export const favoritesRouter = router({
  toggle: protectedProcedure
    .input(z.object({ thumbnailId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isFav = await toggleFavorite(ctx.user.id, input.thumbnailId);
      return { favorited: isFav } as const;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getFavoritesByUserId(ctx.user.id);
  }),
});

export const templatesRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getAllTemplates(input?.category);
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      imageUrl: z.string().url(),
      source: z.enum(["unsplash", "pexels", "custom", "user"]).default("custom"),
      category: z.string().max(64).default("viral"),
    }))
    .mutation(async ({ ctx, input }) => {
      return createTemplate({
        userId: ctx.user.id,
        title: input.title,
        imageUrl: input.imageUrl,
        source: input.source,
        category: input.category,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.isAdminOwner;
      await deleteTemplate(input.id, ctx.user.id, isAdmin);
      return { success: true } as const;
    }),
});

// === Template customizations (user edits of a library template) ===
export const customizationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    return db.select().from(templateCustomizations)
      .where(eq(templateCustomizations.userId, ctx.user.id))
      .orderBy(templateCustomizations.createdAt);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const rows = await db.select().from(templateCustomizations)
        .where(and(eq(templateCustomizations.id, input.id), eq(templateCustomizations.userId, ctx.user.id)))
        .limit(1);
      if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Personnalisation introuvable" });
      return rows[0];
    }),

  create: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      title: z.string().min(1).max(200),
      elements: z.any(),
      backgroundColor: z.string().max(16).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createTemplateCustomization({
        userId: ctx.user.id,
        templateId: input.templateId,
        title: input.title,
        elements: input.elements,
        backgroundColor: input.backgroundColor ?? "#000000",
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().max(200).optional(),
      elements: z.any().optional(),
      backgroundColor: z.string().max(16).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateTemplateCustomization(input.id, ctx.user.id, input);
      return { success: true } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteTemplateCustomization(input.id, ctx.user.id);
      return { success: true } as const;
    }),
});

// === Image versions (Canva editor snapshots) ===
export const imageVersionsRouter = router({
  list: protectedProcedure
    .input(z.object({ thumbnailId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      return db.select().from(imageVersions)
        .where(and(eq(imageVersions.thumbnailId, input.thumbnailId), eq(imageVersions.userId, ctx.user.id)))
        .orderBy(imageVersions.createdAt);
    }),

  create: protectedProcedure
    .input(z.object({
      thumbnailId: z.number(),
      name: z.string().min(1).max(100),
      imageUrl: z.string().url(),
      elements: z.any(),
      isCurrent: z.enum(["yes", "no"]).default("no"),
    }))
    .mutation(async ({ ctx, input }) => {
      return createImageVersion({
        userId: ctx.user.id,
        thumbnailId: input.thumbnailId,
        name: input.name,
        imageUrl: input.imageUrl,
        elements: input.elements,
        isCurrent: input.isCurrent,
      });
    }),

  restore: protectedProcedure
    .input(z.object({ versionId: z.number(), thumbnailId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const rows = await db.select().from(imageVersions)
        .where(and(eq(imageVersions.id, input.versionId), eq(imageVersions.userId, ctx.user.id), eq(imageVersions.thumbnailId, input.thumbnailId)))
        .limit(1);
      if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Version introuvable" });
      // Unmark all versions, mark this one as current
      await db.update(imageVersions).set({ isCurrent: "no" }).where(eq(imageVersions.thumbnailId, input.thumbnailId));
      await db.update(imageVersions).set({ isCurrent: "yes" }).where(eq(imageVersions.id, input.versionId));
      return { version: rows[0] } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), thumbnailId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteImageVersion(input.id, ctx.user.id, input.thumbnailId);
      return { success: true } as const;
    }),
});

// === A/B Tests (thumbnail variants with declared CTR) ===
export const abTestsRouter = router({
  list: protectedProcedure    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const tests = await db.select().from(abTests)
      .where(eq(abTests.userId, ctx.user.id))
      .orderBy(abTests.createdAt);
    // Enrich with variant images
    const enriched = [];
    for (const t of tests) {
      const a = await getThumbnailById(t.variantAId);
      const b = await getThumbnailById(t.variantBId);
      if (a && b && a.userId === ctx.user.id && b.userId === ctx.user.id) {
        enriched.push({ ...t, variantA: a, variantB: b });
      }
    }
    return enriched;
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const rows = await db.select().from(abTests)
        .where(and(eq(abTests.id, input.id), eq(abTests.userId, ctx.user.id)))
        .limit(1);
      if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Test A/B introuvable" });
      const test = rows[0];
      const variantA = await getThumbnailById(test.variantAId);
      const variantB = await getThumbnailById(test.variantBId);
      if (!variantA || !variantB || variantA.userId !== ctx.user.id || variantB.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }
      const ctrA = test.viewsA > 0 ? (test.clicksA / test.viewsA) * 100 : 0;
      const ctrB = test.viewsB > 0 ? (test.clicksB / test.viewsB) * 100 : 0;
      return { ...test, variantA, variantB, ctrA: Math.round(ctrA * 10) / 10, ctrB: Math.round(ctrB * 10) / 10 };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      variantAId: z.number(),
      variantBId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.variantAId === input.variantBId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Les deux variantes doivent être différentes" });
      }
      const a = await getThumbnailById(input.variantAId);
      const b = await getThumbnailById(input.variantBId);
      if (!a || !b || a.userId !== ctx.user.id || b.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vous devez posséder les deux miniatures" });
      }
      return createAbTest({
        userId: ctx.user.id,
        title: input.title,
        variantAId: input.variantAId,
        variantBId: input.variantBId,
      });
    }),

  updateStats: protectedProcedure
    .input(z.object({
      id: z.number(),
      viewsA: z.number().min(0).optional(),
      clicksA: z.number().min(0).optional(),
      viewsB: z.number().min(0).optional(),
      clicksB: z.number().min(0).optional(),
      winner: z.enum(["a", "b", "tie", "undecided"]).optional(),
      status: z.enum(["running", "finished"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await updateAbTest(id, ctx.user.id, rest);

      // Auto-close when the CTR difference is statistically significant
      // (two-proportion z-test, pooled variance, alpha = 0.05 → |z| ≥ 1.96)
      if (!rest.winner && !rest.status) {
        const db = await getDb();
        if (db) {
          const rows = await db.select().from(abTests)
            .where(and(eq(abTests.id, id), eq(abTests.userId, ctx.user.id)))
            .limit(1);
          const test = rows[0];
          if (test && test.status === "running") {
            const nA = Math.max(1, test.viewsA);
            const nB = Math.max(1, test.viewsB);
            const pA = test.clicksA / nA;
            const pB = test.clicksB / nB;
            if (nA >= 100 && nB >= 100) {
              const pooled = (test.clicksA + test.clicksB) / (nA + nB);
              const denom = Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB));
              if (denom > 0) {
                const z = (pA - pB) / denom;
                if (z >= 1.96) {
                  await db.update(abTests)
                    .set({ winner: "a", status: "finished", autoClosed: 1 })
                    .where(and(eq(abTests.id, id), eq(abTests.userId, ctx.user.id)));
                } else if (z <= -1.96) {
                  await db.update(abTests)
                    .set({ winner: "b", status: "finished", autoClosed: 1 })
                    .where(and(eq(abTests.id, id), eq(abTests.userId, ctx.user.id)));
                }
              }
            }
          }
        }
      }
      return { success: true } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteAbTest(input.id, ctx.user.id);
      return { success: true } as const;
    }),

  share: protectedProcedure
    .input(z.object({ id: z.number(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const test = await getAbTestById(input.id);
      if (!test || test.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Test A/B introuvable" });
      }
      const token = input.enabled ? crypto.randomUUID().replace(/-/g, "").slice(0, 32) : null;
      await setAbTestShareToken(input.id, ctx.user.id, token);
      return { token } as const;
    }),

  getByShareToken: publicProcedure
    .input(z.object({ token: z.string().min(16).max(64) }))
    .query(async ({ input }) => {
      const test = await getAbTestByShareToken(input.token);
      if (!test) throw new TRPCError({ code: "NOT_FOUND", message: "Lien de partage invalide ou expiré" });
      const variantA = await getThumbnailById(test.variantAId);
      const variantB = await getThumbnailById(test.variantBId);
      if (!variantA || !variantB) throw new TRPCError({ code: "NOT_FOUND", message: "Variantes introuvables" });
      const ctrA = test.viewsA > 0 ? (test.clicksA / test.viewsA) * 100 : 0;
      const ctrB = test.viewsB > 0 ? (test.clicksB / test.viewsB) * 100 : 0;
      return {
        ...test,
        userId: undefined,
        variantA: { imageUrl: variantA.imageUrl, prompt: variantA.prompt, style: variantA.style },
        variantB: { imageUrl: variantB.imageUrl, prompt: variantB.prompt, style: variantB.style },
        ctrA: Math.round(ctrA * 10) / 10,
        ctrB: Math.round(ctrB * 10) / 10,
      };
    }),

  // === Collaborative stats: team members add their own views/clicks ===
  contributions: router({
    list: protectedProcedure
      .input(z.object({ abTestId: z.number() }))
      .query(async ({ ctx, input }) => {
        const test = await getAbTestById(input.abTestId);
        if (!test || test.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test A/B introuvable" });
        }
        return getAbTestContributions(input.abTestId);
      }),

    add: protectedProcedure
      .input(z.object({
        abTestId: z.number(),
        variant: z.enum(["a", "b"]),
        views: z.number().min(0).max(10_000_000),
        clicks: z.number().min(0).max(10_000_000),
        channelName: z.string().max(255).optional(),
        note: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const test = await getAbTestById(input.abTestId);
        if (!test || test.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test A/B introuvable" });
        }
        return addAbTestContribution({ ...input, userId: ctx.user.id });
      }),

    delete: protectedProcedure
      .input(z.object({ contributionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteAbTestContribution(input.contributionId, ctx.user.id);
        return { success: true } as const;
      }),
  }),

  // Aggregated totals (base stats + all contributions)
  getAggregated: protectedProcedure
    .input(z.object({ abTestId: z.number() }))
    .query(async ({ ctx, input }) => {
      const test = await getAbTestById(input.abTestId);
      if (!test || test.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Test A/B introuvable" });
      }
      const contributions = await getAbTestContributions(input.abTestId);
      const contribA = contributions.filter(c => c.variant === "a");
      const contribB = contributions.filter(c => c.variant === "b");
      const viewsA = test.viewsA + contribA.reduce((s, c) => s + c.views, 0);
      const clicksA = test.clicksA + contribA.reduce((s, c) => s + c.clicks, 0);
      const viewsB = test.viewsB + contribB.reduce((s, c) => s + c.views, 0);
      const clicksB = test.clicksB + contribB.reduce((s, c) => s + c.clicks, 0);
      const ctrA = viewsA > 0 ? Math.round((clicksA / viewsA) * 1000) / 10 : 0;
      const ctrB = viewsB > 0 ? Math.round((clicksB / viewsB) * 1000) / 10 : 0;
      return {
        viewsA, clicksA, viewsB, clicksB,
        ctrA, ctrB,
        contributionCount: contributions.length,
      };
    }),
});

export const avatarsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAvatarsByUserId(ctx.user.id);
  }),

  generate: protectedProcedure
    .input(z.object({
      prompt: z.string().min(10).max(500),
      style: z.string().max(64).default("professional"),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureUserCredits(ctx.user.id);
      if (!(await deductCredits(ctx.user.id, 1))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Crédits insuffisants" });
      }

      const { id } = await createAvatar({ userId: ctx.user.id, prompt: input.prompt, style: input.style });

      try {
        const { url } = await generateImage({
          prompt: `${input.prompt} — avatar portrait, professional headshot style`,
          model: "MODEL_GPT_IMAGE_2",
          quality: "high",
        });
        if (url) {
          await updateAvatarStatus(id, "completed", url);
        } else {
          await updateAvatarStatus(id, "failed");
          await refundCredits(ctx.user.id, 1);
        }
      } catch {
        await updateAvatarStatus(id, "failed");
        await refundCredits(ctx.user.id, 1);
      }

      return { success: true, avatarId: id } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.delete(avatars).where(and(eq(avatars.id, input.id), eq(avatars.userId, ctx.user.id)));
      return { success: true } as const;
    }),
});

export const endCardsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getEndCardsByUserId(ctx.user.id);
  }),

  generate: protectedProcedure
    .input(z.object({
      prompt: z.string().min(10).max(500),
      style: z.string().max(64).default("viral"),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureUserCredits(ctx.user.id);
      if (!(await deductCredits(ctx.user.id, 1))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Crédits insuffisants" });
      }

      const { id } = await createEndCard({ userId: ctx.user.id, prompt: input.prompt, style: input.style });

      try {
        const { url } = await generateImage({
          prompt: `${input.prompt} — YouTube end card, subscribe button area, video suggestion boxes, CTA text`,
          model: "MODEL_GPT_IMAGE_2",
          quality: "high",
        });
        if (url) {
          await updateEndCardStatus(id, "completed", url);
        } else {
          await updateEndCardStatus(id, "failed");
          await refundCredits(ctx.user.id, 1);
        }
      } catch {
        await updateEndCardStatus(id, "failed");
        await refundCredits(ctx.user.id, 1);
      }

      return { success: true, endCardId: id } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.delete(endCards).where(and(eq(endCards.id, input.id), eq(endCards.userId, ctx.user.id)));
      return { success: true } as const;
    }),
});

export const trashRouter = router({
  moveToTrash: protectedProcedure
    .input(z.object({ thumbnailId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const thumb = await getThumbnailById(input.thumbnailId);
      if (!thumb || thumb.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Miniature non trouvée" });
      }
      await moveToTrash(ctx.user.id, input.thumbnailId, thumb.prompt, thumb.imageUrl, thumb.style ?? undefined);
      const db = await getDb();
      if (db) await db.delete(thumbnails).where(eq(thumbnails.id, input.thumbnailId));
      return { success: true } as const;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getTrashedByUserId(ctx.user.id);
  }),

  restore: protectedProcedure
    .input(z.object({ trashId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await restoreFromTrash(input.trashId, ctx.user.id);
      if (!success) throw new TRPCError({ code: "NOT_FOUND", message: "Élément introuvable" });
      return { success: true } as const;
    }),

  empty: protectedProcedure.mutation(async ({ ctx }) => {
    await emptyTrash(ctx.user.id);
    return { success: true } as const;
  }),
});

export const apiKeysRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getApiKeysByUserId(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255), expiryMonths: z.number().min(1).max(24).optional() }))
    .mutation(async ({ ctx, input }) => {
      const key = await createApiKey(ctx.user.id, input.name, input.expiryMonths);
      return key;
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await revokeApiKey(input.id, ctx.user.id);
      return { success: true } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteApiKey(input.id, ctx.user.id);
      return { success: true } as const;
    }),
});

// === Organization Router ===
export const orgRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const org = await getOrCreateOrganization(ctx.user.id);
    if (!org) return null;
    const [members, credits] = await Promise.all([
      getOrgMembers(org),
      getUserCredits(ctx.user.id),
    ]);
    return {
      ...org,
      role: "owner" as const,
      members,
      plan: credits?.planType || "free",
    };
  }),

  update: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255).optional(),
      slug: z.string().regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement").min(3).max(128).optional(),
      description: z.string().max(2000).optional(),
      logoUrl: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateOrganization(ctx.user.id, input);
      return { success: true } as const;
    }),

  members: protectedProcedure.query(async ({ ctx }) => {
    const org = await getOrCreateOrganization(ctx.user.id);
    if (!org) return [];
    return getOrgMembers(org);
  }),

  removeMember: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Le propriétaire ne peut pas se retirer" });
      const org = await getOrCreateOrganization(ctx.user.id);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      await removeOrgMember(org.ownerId, input.userId);
      return { success: true } as const;
    }),

  // Permet à un membre (non-propriétaire) de quitter son organisation
  leaveOrg: protectedProcedure.mutation(async ({ ctx }) => {
    const org = await getOrCreateOrganization(ctx.user.id);
    if (!org) throw new TRPCError({ code: "NOT_FOUND" });
    if (org.ownerId === ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Le propriétaire ne peut pas quitter l'organisation" });
    }
    await removeOrgMember(org.ownerId, ctx.user.id);
    return { success: true } as const;
  }),

  invite: protectedProcedure
    .input(z.object({ email: z.string().email(), role: z.enum(["member", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOrCreateOrganization(ctx.user.id);
      if (!org) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const ok = await sendOrgInvitation({ orgId: org.id, orgOwner: ctx.user.id, email: input.email, role: input.role });
      if (!ok) throw new TRPCError({ code: "CONFLICT", message: "Une invitation est déjà en attente pour cet e-mail" });
      return { success: true } as const;
    }),

  sentInvitations: protectedProcedure.query(async ({ ctx }) => {
    return getSentInvitations(ctx.user.id);
  }),

  cancelInvitation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await cancelSentInvitation(input.id, ctx.user.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true } as const;
    }),

  receivedInvitations: protectedProcedure.query(async ({ ctx }) => {
    return getReceivedInvitations(ctx.user.id);
  }),

  acceptInvitation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await acceptInvitation(input.id, ctx.user.id);
      if (!result.ok) throw new TRPCError({ code: "CONFLICT", message: result.error });
      return { success: true } as const;
    }),

  declineInvitation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await declineInvitation(input.id, ctx.user.id);
      return { success: true } as const;
    }),

  usage: protectedProcedure.query(async ({ ctx }) => {
    const credits = await getUserCredits(ctx.user.id);
    const members = await getOrgMembers({ id: -1, ownerId: ctx.user.id });
    const planType = credits?.planType || "free";
    const limits: Record<string, { credits: number; members: number }> = {
      free: { credits: 2, members: 2 },
      pro: { credits: 100, members: 5 },
      max: { credits: 500, members: 10 },
    };
    const limit = limits[planType] ?? limits.free;
    return {
      planType,
      credits: credits?.credits ?? 0,
      creditsLimit: limit.credits,
      memberCount: members.length,
      membersLimit: limit.members,
    };
  }),
});

export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getNotificationsByUserId(ctx.user.id);
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadCountByUserId(ctx.user.id);
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id, ctx.user.id);
      return { success: true } as const;
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true } as const;
  }),

  /** Pour le dropdown cloche global : 3 notifications non lues récentes */
  recent: protectedProcedure.query(async ({ ctx }) => {
    return getRecentUnreadNotifications(ctx.user.id, 3);
  }),
});

// === Admin Router ===
export const adminRouter = router({
  accessMe: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.isAdminOwner) return { owner: true, enabled: true, role: "owner" as const, permissions: ["*"] as string[] };
    const access = await getAdminAccess(ctx.user.id);
    return access ? { owner: false, enabled: access.enabled === "yes", role: access.role, permissions: access.permissions } : { owner: false, enabled: false, role: null, permissions: [] as string[] };
  }),
  auditLogs: adminProcedure.query(async () => getAdminAuditLogs()),

  secondaryAccess: adminProcedure.query(async () => listAdminAccess()),

  grantSecondaryAccess: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), role: z.enum(["support", "analyst", "operator"]), permissions: z.array(z.enum(["reports.view", "reports.schedule", "users.support", "users.revoke_sessions", "monitoring.view", "monitoring.manage"])).max(10) }))
    .mutation(async ({ ctx, input }) => {
      await upsertAdminAccess(input.userId, input.role, input.permissions);
      await createAdminAuditLog({ actorUserId: ctx.user.id, action: "users_notified", targetUserId: input.userId, details: JSON.stringify({ kind: "admin-access-granted", role: input.role, permissions: input.permissions }) });
      return { success: true } as const;
    }),

  revokeSecondaryAccess: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await revokeAdminAccess(input.userId);
      await createAdminAuditLog({ actorUserId: ctx.user.id, action: "session_revoked", targetUserId: input.userId, details: JSON.stringify({ kind: "admin-access-revoked" }) });
      return { success: true } as const;
    }),

  scheduledExports: adminPermission("reports.view").query(async ({ ctx }) => listScheduledExports(ctx.user.id)),

  createScheduledExport: adminPermission("reports.schedule")
    .input(z.object({ email: z.string().email(), reportType: z.enum(["metrics", "timeline"]), format: z.enum(["csv", "pdf"]), cron: z.string().refine(value => value.trim().split(/\s+/).length === 6, "Cron UTC à 6 champs requis"), filters: z.record(z.string(), z.unknown()).default({}) }))
    .mutation(async ({ ctx, input }) => {
      const created = await createScheduledExport({ createdBy: ctx.user.id, email: input.email, reportType: input.reportType, format: input.format, cron: input.cron, filters: input.filters, status: "active" });
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de créer l’export" });
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      try {
        const job = await createHeartbeatJob({ name: `minia-export-${created.id}`, cron: input.cron, path: "/api/scheduled/runExport", payload: { exportId: created.id }, description: `Export ${input.reportType} ${input.format} vers ${input.email}` }, sessionToken);
        await updateScheduledExportTask(created.id, job.taskUid);
        return { id: created.id, taskUid: job.taskUid } as const;
      } catch (error) {
        await updateScheduledExportStatus(created.id, ctx.user.id, "failed", String(error));
        throw error;
      }
    }),

  pauseScheduledExport: adminPermission("reports.schedule")
    .input(z.object({ id: z.number().int().positive(), taskUid: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      await updateHeartbeatJob(input.taskUid, { enable: false }, sessionToken);
      await updateScheduledExportStatus(input.id, ctx.user.id, "paused");
      return { success: true } as const;
    }),

  deleteScheduledExport: adminPermission("reports.schedule")
    .input(z.object({ id: z.number().int().positive(), taskUid: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      await deleteHeartbeatJob(input.taskUid, sessionToken);
      await updateScheduledExportStatus(input.id, ctx.user.id, "paused");
      return { success: true } as const;
    }),

  /** Health and incident snapshot; no secrets are returned. */
  operations: adminProcedure.query(async () => getAdminOperations()),

  /** Support view for one account, with secrets and raw API keys excluded. */
  userSupport: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const snapshot = await getUserSupportSnapshot(input.userId);
      if (!snapshot) throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
      return snapshot;
    }),

  userTimeline: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), limit: z.number().int().min(1).max(200).default(100), kind: z.enum(["all", "account", "generation", "credit", "notification", "api_key"]).default("all"), from: z.coerce.date().optional(), to: z.coerce.date().optional() }))
    .query(async ({ input }) => {
      const events = await getUserEventTimeline(input.userId, input.limit * 2);
      return events.filter(event => (input.kind === "all" || event.kind === input.kind) && (!input.from || event.timestamp >= input.from) && (!input.to || event.timestamp <= input.to)).slice(0, input.limit);
    }),

  historicalMetrics: adminProcedure
    .input(z.object({ days: z.number().int().min(7).max(90).default(14), planType: z.enum(["free", "pro", "max"]).optional(), userId: z.number().int().positive().optional(), from: z.coerce.date().optional(), to: z.coerce.date().optional() }).optional())
    .query(async ({ input }) => getAdminHistoricalMetrics(input ?? {})),

  legacyApiKeys: adminProcedure.query(async () => {
    const rows = await getLegacyApiKeySummary();
    const users = new Set(rows.map(row => row.userId));
    return { keyCount: rows.length, userCount: users.size, keys: rows };
  }),

  migrateLegacyApiKeys: adminProcedure.mutation(async ({ ctx }) => {
    const revoked = await migrateLegacyApiKeys();
    if (revoked.length > 0) {
      await createAdminAuditLog({ actorUserId: ctx.user.id, action: "legacy_keys_revoked", details: JSON.stringify({ revokedCount: revoked.length }) });
    }
    const userIds = Array.from(new Set(revoked.map(row => row.userId)));
    for (const userId of userIds) {
      await createNotification({
        userId,
        title: "Ancienne clé API désactivée",
        message: "Une ancienne clé API stockée dans un format non sécurisé a été désactivée. Crée une nouvelle clé depuis Paramètres → Clés API.",
        type: "system",
        metadata: JSON.stringify({ kind: "legacy-api-key-migration", revokedCount: revoked.filter(row => row.userId === userId).length }),
      });
      await createAdminAuditLog({ actorUserId: ctx.user.id, action: "users_notified", targetUserId: userId, details: JSON.stringify({ reason: "legacy-api-key-migration", revokedCount: revoked.filter(row => row.userId === userId).length }) });
    }
    return { revokedCount: revoked.length, notifiedUserCount: userIds.length } as const;
  }),

  // Stats overview
  stats: adminProcedure.query(async () => {
    return getAdminStats();
  }),

  // User management
  users: adminProcedure.query(async () => {
    return getAllUsers();
  }),

  updateRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role);
      return { success: true } as const;
    }),

  updateCredits: adminProcedure
    .input(z.object({ userId: z.number(), credits: z.number().min(0).max(10000) }))
    .mutation(async ({ input }) => {
      await updateUserCredits(input.userId, input.credits);
      return { success: true } as const;
    }),

  resetCredits: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), amount: z.number().int().min(0).max(10000).default(10) }))
    .mutation(async ({ ctx, input }) => {
      const success = await resetUserCredits(input.userId, input.amount);
      if (!success) throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable ou crédits indisponibles" });
      await createAdminAuditLog({ actorUserId: ctx.user.id, action: "credits_reset", targetUserId: input.userId, details: JSON.stringify({ amount: input.amount }) });
      await createNotification({ userId: input.userId, title: "Crédits réinitialisés", message: `Ton solde a été réinitialisé à ${input.amount} crédit(s) par le support.`, type: "credit", metadata: JSON.stringify({ kind: "admin-credit-reset", amount: input.amount }) });
      return { success: true, amount: input.amount } as const;
    }),

  notifyUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), title: z.string().min(1).max(200), message: z.string().max(2000).optional(), type: z.enum(["system", "credit", "generation", "team"]).default("system") }))
    .mutation(async ({ ctx, input }) => {
      const recipient = await getUserSupportSnapshot(input.userId);
      if (!recipient) throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
      await createNotification({ userId: input.userId, title: input.title, message: input.message, type: input.type, metadata: JSON.stringify({ kind: "admin-targeted-notification" }) });
      await createAdminAuditLog({ actorUserId: ctx.user.id, action: "users_notified", targetUserId: input.userId, details: JSON.stringify({ scope: "targeted", title: input.title, type: input.type }) });
      return { success: true } as const;
    }),

  revokeSessions: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const success = await revokeUserSessions(input.userId);
      if (!success) throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
      await createAdminAuditLog({ actorUserId: ctx.user.id, action: "session_revoked", targetUserId: input.userId, details: JSON.stringify({ scope: "all_sessions" }) });
      return { success: true } as const;
    }),

  updatePlan: adminProcedure
    .input(z.object({ userId: z.number(), planType: z.enum(["free", "pro", "max"]) }))
    .mutation(async ({ input }) => {
      await updateUserPlan(input.userId, input.planType);
      return { success: true } as const;
    }),

  // Templates management (admin only - force delete any template)
  templates: adminProcedure.query(async () => {
    return getAllTemplates();
  }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTemplate(input.id, undefined, true);
      return { success: true } as const;
    }),

  // API models list
  models: adminProcedure.query(async () => {
    return listImageModels();
  }),

  // Global notifications
  sendNotification: adminProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      message: z.string().max(2000).optional(),
      type: z.enum(["system", "credit", "generation", "team"]).default("system"),
    }))
    .mutation(async ({ ctx, input }) => {
      await sendGlobalNotification(input.title, input.message, input.type);
      await createAdminAuditLog({ actorUserId: ctx.user.id, action: "users_notified", details: JSON.stringify({ scope: "global", title: input.title, type: input.type }) });
      return { success: true } as const;
    }),

  // Credit management - bulk assign credits to all users with a plan
  bulkCredits: adminProcedure
    .input(z.object({ planType: z.enum(["free", "pro", "max"]).optional(), amount: z.number().min(1).max(1000) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const allUsers = await getAllUsers();
      let updated = 0;
      for (const user of allUsers) {
        const existing = await getUserCredits(user.id);
        if (!input.planType || (existing && existing.planType === input.planType) || (!existing && input.planType === "free")) {
          await updateUserCredits(user.id, (existing?.credits ?? 0) + input.amount);
          updated++;
        }
      }
      return { success: true, updated } as const;
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // === Thumbnail Generation ===
  thumbnail: router({
    /** List all thumbnails for the current user */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getThumbnailsByUserId(ctx.user.id);
    }),

    /** List with search & filters (keywords, style, period, youtube status) */
    listFiltered: protectedProcedure
      .input(z.object({
        query: z.string().max(200).optional(),
        style: z.string().max(64).optional(),
        youtubeStatus: z.string().max(32).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const p = input ?? {};
        const dateFrom = p.dateFrom ? new Date(p.dateFrom) : undefined;
        const dateTo = p.dateTo ? new Date(p.dateTo) : undefined;
        return getThumbnailsByUserIdFiltered({
          userId: ctx.user.id,
          query: p.query,
          style: p.style,
          youtubeStatus: p.youtubeStatus,
          dateFrom,
          dateTo,
        });
      }),

    /** Plan a thumbnail for YouTube Studio (title + mark as planned) */
    planYoutube: protectedProcedure
      .input(z.object({
        thumbnailId: z.number(),
        title: z.string().min(1).max(200),
      }))
      .mutation(async ({ ctx, input }) => {
        await setThumbnailYoutube(input.thumbnailId, ctx.user.id, {
          youtubeTitle: input.title,
          youtubeStatus: "planned",
        });
        return { success: true } as const;
      }),

    /** Remove the YouTube plan for a thumbnail */
    unplanYoutube: protectedProcedure
      .input(z.object({ thumbnailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await setThumbnailYoutube(input.thumbnailId, ctx.user.id, {
          youtubeTitle: null,
          youtubeStatus: "unplanned",
        });
        return { success: true } as const;
      }),

    /** Save an editor/custom image (base64) as a new thumbnail in the user's gallery */
    saveFromBase64: protectedProcedure
      .input(z.object({
        b64: z.string().min(10),
        mime: z.string().max(64).default("image/png"),
        title: z.string().min(1).max(200).default("Miniature importée"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        const key = `user-images/${ctx.user.id}/${Date.now()}-custom.png`;
        const { url } = await storagePut(key, input.b64, input.mime);
        return createThumbnail({
          userId: ctx.user.id,
          prompt: input.title,
          style: "custom",
          imageUrl: url,
          status: "completed",
          creditsUsed: 0,
        });
      }),

    /** Get a single thumbnail by ID — verifies ownership */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const thumb = await getThumbnailById(input.id);
        if (!thumb || thumb.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Miniature non trouvée" });
        }
        return thumb;
      }),

    /** Generate thumbnails using Forge AI */
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string().min(10, "La description doit contenir au moins 10 caractères").max(500),
        style: z.enum(["viral", "mrbeast", "minimalist", "dramatic", "tech", "retro"]).default("viral"),
        quantity: z.number().min(1).max(4).default(1),
        inspirationImageUrl: z.string().max(2000).optional(),
        inspirationB64: z.string().max(10_000_000).optional(),
        inspirationMime: z.string().max(64).default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Reserve credits atomically before external AI work.
        const credits = await ensureUserCredits(ctx.user.id);
        if (!(await deductCredits(ctx.user.id, input.quantity))) {
          const currentCredits = await getUserCredits(ctx.user.id);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Crédits insuffisants. Il te reste ${currentCredits?.credits ?? credits.credits} crédit(s). Tu as besoin de ${input.quantity} crédit(s).`,
          });
        }

        // Build AI prompt based on style
        const stylePrompts: Record<string, string> = {
          viral: "YouTube thumbnail, high CTR, bold text overlay, vibrant colors, dramatic composition, professional photo editing style",
          mrbeast: "MrBeast style YouTube thumbnail, exaggerated facial expression, bright saturated colors, large bold text, high energy composition",
          minimalist: "Minimalist YouTube thumbnail, clean design, subtle gradient background, elegant typography, modern aesthetic",
          dramatic: "Dramatic YouTube thumbnail, dark moody lighting, cinematic composition, intense colors, professional color grading",
          tech: "Tech YouTube thumbnail, futuristic design, neon glow effects, digital interface elements, modern tech aesthetic",
          retro: "Retro YouTube thumbnail, vintage color palette, film grain effect, nostalgic typography, 80s/90s aesthetic",
        };

        const fullPrompt = `${input.prompt}\n\nStyle: ${stylePrompts[input.style]}`;
        let referenceImages: Array<{ url?: string; b64Json?: string; mimeType?: string }> | undefined;
        if (input.inspirationImageUrl) {
          referenceImages = [{ url: input.inspirationImageUrl, mimeType: "image/jpeg" }];
        } else if (input.inspirationB64) {
          referenceImages = [{ b64Json: input.inspirationB64, mimeType: input.inspirationMime || "image/jpeg" }];
        }

        // Create thumbnail records and generate images
        const results: Array<{ id: number; status: string; imageUrl: string | null }> = [];
        let successfulCount = 0;

        for (let i = 0; i < input.quantity; i++) {
          // Create placeholder record
          const { id: thumbId } = await createThumbnail({
            userId: ctx.user.id,
            prompt: input.prompt,
            style: input.style,
            imageUrl: "",
            status: "generating",
            creditsUsed: 1,
          });

          try {
            // Generate image via Forge API (with optional reference image for style inspiration)
            const { url } = await generateImage({
              prompt: fullPrompt,
              originalImages: referenceImages,
              model: "MODEL_GPT_IMAGE_2",
              quality: "high",
            });

            if (url) {
              let finalUrl = url;
              // Free-plan users get a watermarked version stored
              if (credits.planType === "free") {
                const wmB64 = await burnWatermark(url);
                if (wmB64) {
                  const { storagePut } = await import("./storage");
                  const key = `thumbnails/${ctx.user.id}/${thumbId}-watermarked.png`;
                  const { url: wmUrl } = await storagePut(key, wmB64, "image/png");
                  finalUrl = wmUrl;
                }
              }
              await updateThumbnailStatus(thumbId, "completed", finalUrl);
              results.push({ id: thumbId, status: "completed", imageUrl: finalUrl });
              successfulCount++;
            } else {
              await updateThumbnailStatus(thumbId, "failed");
              await refundCredits(ctx.user.id, 1);
              results.push({ id: thumbId, status: "failed", imageUrl: null });
            }
          } catch (error) {
            console.error(`[Thumbnail] Generation failed for ${thumbId}:`, error);
            await updateThumbnailStatus(thumbId, "failed");
            await refundCredits(ctx.user.id, 1);
            results.push({ id: thumbId, status: "failed", imageUrl: null });
          }
        }

        const updatedCredits = await getUserCredits(ctx.user.id);

        return {
          thumbnails: results,
          creditsRemaining: updatedCredits?.credits ?? 0,
          successful: successfulCount,
          failed: input.quantity - successfulCount,
        };
      }),

    /** Get user's current credits and plan */
    credits: protectedProcedure.query(async ({ ctx }) => {
      const credits = await ensureUserCredits(ctx.user.id);
      return { ...credits, planType: credits.planType };
    }),

    /** Historique immuable des débits, remboursements et recharges. */
    creditHistory: protectedProcedure.query(async ({ ctx }) => listCreditLedger(ctx.user.id)),

    /** Delete a thumbnail — verifies ownership */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify ownership before deleting
        const thumb = await getThumbnailById(input.id);
        if (!thumb || thumb.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Miniature non trouvée ou non autorisée" });
        }

        await db.delete(thumbnails).where(eq(thumbnails.id, input.id));
        return { success: true };
      }),
  }),

  // === Image Models (for admin) ===
  imageModels: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.isAdminOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      return listImageModels();
    }),
  }),

  // === Public Gallery ===
  gallery: router({
    /** Get public gallery thumbnails (anonymized, no auth required) */
    thumbnails: publicProcedure
      .input(z.object({
        style: z.string().optional(),
        limit: z.number().min(1).max(100).default(24),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(["recent", "popular"]).default("recent").optional(),
      }).optional())
      .query(async ({ input }) => {
        return getGalleryThumbnails(input ?? {});
      }),

    /** Get gallery stats */
    stats: publicProcedure.query(async () => {
      return getGalleryStats();
    }),
  }),

  // === Likes ===
  likes: router({
    /** Toggle like on a thumbnail */
    toggle: protectedProcedure
      .input(z.object({ thumbnailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return toggleLike(ctx.user.id, input.thumbnailId);
      }),

    /** Get likes for multiple thumbnails */
    bulk: publicProcedure
      .input(z.object({ thumbnailIds: z.array(z.number()) }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        return getLikesForThumbnails(input.thumbnailIds, userId);
      }),
  }),

  // === Batch Generation ===
  batch: router({
    /** Generate multiple thumbnails from a list of prompts */
    generate: protectedProcedure
      .input(z.object({
        prompts: z.array(z.string().min(10).max(500)).min(1).max(20),
        style: z.enum(["viral", "mrbeast", "minimalist", "dramatic", "tech", "retro"]).default("viral"),
      }))
      .mutation(async ({ ctx, input }) => {
        const credits = await ensureUserCredits(ctx.user.id);
        const reserved = await deductCredits(ctx.user.id, input.prompts.length);
        if (!reserved) {
          const currentCredits = await getUserCredits(ctx.user.id);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Crédits insuffisants. Il te reste ${currentCredits?.credits ?? credits.credits} crédit(s). Tu as besoin de ${input.prompts.length} crédit(s).`,
          });
        }

        const stylePrompts: Record<string, string> = {
          viral: "YouTube thumbnail, high CTR, bold text overlay, vibrant colors, dramatic composition, professional photo editing style",
          mrbeast: "MrBeast style YouTube thumbnail, exaggerated facial expression, bright saturated colors, large bold text, high energy composition",
          minimalist: "Minimalist YouTube thumbnail, clean design, subtle gradient background, elegant typography, modern aesthetic",
          dramatic: "Dramatic YouTube thumbnail, dark moody lighting, cinematic composition, intense colors, professional color grading",
          tech: "Tech YouTube thumbnail, futuristic design, neon glow effects, digital interface elements, modern tech aesthetic",
          retro: "Retro YouTube thumbnail, vintage color palette, film grain effect, nostalgic typography, 80s/90s aesthetic",
        };

        const fullPrompt = `${stylePrompts[input.style]}`;

        const results: Array<{ id: number; status: string; imageUrl: string | null }> = [];
        let successfulCount = 0;

        for (const prompt of input.prompts) {
          const { id: thumbId } = await createThumbnail({
            userId: ctx.user.id,
            prompt,
            style: input.style,
            imageUrl: "",
            status: "generating",
            creditsUsed: 1,
          });

          try {
            const { url } = await generateImage({
              prompt: `${prompt}\n\nStyle: ${fullPrompt}`,
              model: "MODEL_GPT_IMAGE_2",
              quality: "high",
            });

            if (url) {
              await updateThumbnailStatus(thumbId, "completed", url);
              results.push({ id: thumbId, status: "completed", imageUrl: url });
              successfulCount++;
            } else {
              await updateThumbnailStatus(thumbId, "failed");
              await refundCredits(ctx.user.id, 1);
              results.push({ id: thumbId, status: "failed", imageUrl: null });
            }
          } catch {
            await updateThumbnailStatus(thumbId, "failed");
            await refundCredits(ctx.user.id, 1);
            results.push({ id: thumbId, status: "failed", imageUrl: null });
          }
        }

        const updatedCredits = await getUserCredits(ctx.user.id);

        return {
          thumbnails: results,
          creditsRemaining: updatedCredits?.credits ?? 0,
          successful: successfulCount,
          failed: input.prompts.length - successfulCount,
        };
      }),
  }),

  // === Team ===
  team: router({
    /** List team members */
    members: protectedProcedure.query(async ({ ctx }) => {
      return getTeamMembers(ctx.user.id);
    }),

    /** Invite a team member by user ID */
    invite: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["member", "admin"]).default("member") }))
      .mutation(async ({ ctx, input }) => {
        const success = await inviteTeamMember(ctx.user.id, input.userId, input.role);
        if (!success) {
          throw new TRPCError({ code: "CONFLICT", message: "Membre dj dans l'quipe ou erreur" });
        }
        return { success: true };
      }),

    /** Remove a team member */
    remove: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeTeamMember(ctx.user.id, input.userId);
        return { success: true };
      }),

    /** List team tasks */
    tasks: protectedProcedure.query(async ({ ctx }) => {
      return getTeamTasks(ctx.user.id);
    }),

    /** Create a team task */
    createTask: protectedProcedure
      .input(z.object({
        thumbnailId: z.number(),
        assigneeId: z.number().optional(),
        status: z.enum(["pending", "reviewing", "approved", "rejected", "cancelled"]).default("pending"),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const thumbnail = await getThumbnailByIdWithCheck(input.thumbnailId, ctx.user.id);
        if (!thumbnail) throw new TRPCError({ code: "NOT_FOUND", message: "Miniature introuvable ou non autorisée" });
        return createTeamTask({
          ownerId: ctx.user.id,
          thumbnailId: input.thumbnailId,
          assigneeId: input.assigneeId,
          status: input.status,
          comment: input.comment,
          createdBy: ctx.user.id,
        });
      }),

    /** Update task status */
    updateTask: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        status: z.enum(["pending", "reviewing", "approved", "rejected", "cancelled"]),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updated = await updateTaskStatus(ctx.user.id, input.taskId, input.status, input.comment);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Tâche introuvable ou non autorisée" });
        return { success: true };
      }),
  }),

  // === Templates ===
  templates: templatesRouter,

  // === Template customizations ===
  customizations: customizationsRouter,

  // === Image versions ===
  imageVersions: imageVersionsRouter,

  // === A/B Tests ===
  abTests: abTestsRouter,

  // === Favorites ===
  favorites: favoritesRouter,

  // === Avatars ===
  avatars: avatarsRouter,

  // === End Cards ===
  endCards: endCardsRouter,

  // === Trash ===
  trash: trashRouter,

  // === API Keys ===
  apiKeys: apiKeysRouter,

  // === Notifications ===
  notifications: notificationsRouter,

  // === Global search (multi-page) ===
  search: router({
    global: protectedProcedure
      .input(z.object({ query: z.string().min(1).max(200) }))
      .query(async ({ ctx, input }) => {
        return globalSearch(ctx.user.id, input.query);
      }),
  }),

  // === Planning reminders (countdown to publication) ===
  schedules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUpcomingSchedules(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        thumbnailId: z.number(),
        youtubeTitle: z.string().min(1).max(200),
        scheduledAt: z.string().datetime(),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getThumbnailByIdWithCheck(input.thumbnailId, ctx.user.id);
        if (!t) throw new TRPCError({ code: "NOT_FOUND", message: "Miniature introuvable" });
        return createPublishedSchedule({
          userId: ctx.user.id,
          thumbnailId: input.thumbnailId,
          youtubeTitle: input.youtubeTitle,
          scheduledAt: new Date(input.scheduledAt),
        });
      }),

        delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deletePublishedSchedule(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Vue Calendrier : schedules d'un mois donné (année, mois 1-12) */
    listMonth: protectedProcedure
      .input(z.object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12) }))
      .query(async ({ ctx, input }) => {
        return getSchedulesByMonth(ctx.user.id, input.year, input.month);
      }),
    /** Édition depuis le calendrier : titre et/ou date (ownership vérifié) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        youtubeTitle: z.string().min(1).max(200).optional(),
        scheduledAt: z.string().datetime().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getScheduleByIdWithCheck(input.id, ctx.user.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Planification introuvable" });
        if (input.scheduledAt && new Date(input.scheduledAt).getTime() < Date.now()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La date doit être dans le futur" });
        }
        await updatePublishedScheduleDb(input.id, ctx.user.id, {
          ...(input.youtubeTitle !== undefined ? { youtubeTitle: input.youtubeTitle } : {}),
          ...(input.scheduledAt !== undefined ? { scheduledAt: new Date(input.scheduledAt) } : {}),
        });
        return { success: true } as const;
      }),
  }),
  // === Planning reminders (cron J-1) ===
  reminders: router({
    /** Handler déclenché par le cron Heartbeat quotidien — crée les notifications J-1 */
    fire: publicProcedure
      .input(z.object({ nowIso: z.string().datetime().optional() }).optional())
      .mutation(async ({ input }) => {
        const now = input?.nowIso ? new Date(input.nowIso) : new Date();
        const window = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const due = await getRemindersToFire(window);
        const fired: { scheduleId: number; userId: number; title: string }[] = [];
        for (const s of due) {
          try {
            await createNotification({
              userId: s.userId,
              title: "Rappel de planification",
              message: `« ${s.youtubeTitle} » est programmé pour demain. Prépare ta vidéo et publie la miniature à temps !`,
              type: "system",
              metadata: JSON.stringify({ thumbnailId: s.thumbnailId, scheduleId: s.id, kind: "planning-reminder" }),
            });
            await markScheduleReminded(s.id);
            fired.push({ scheduleId: s.id, userId: s.userId, title: s.youtubeTitle });
          } catch {
            // Continuer sur les autres schedules même si un échoue (idempotent au global)
          }
        }
        return { fired } as const;
      }),
  }),
  // === Subscription plans (selection is simulated until billing is connected) ===
  plans: router({
    catalog: publicProcedure.query(() => ([
      { id: "free", name: "Gratuit", priceCents: 0, description: "Pour découvrir Minia IA sans engagement.", features: ["5 miniatures gratuites", "3 styles", "Espace personnel"] },
      { id: "pro", name: "Pro", priceCents: 1900, description: "Pour les créateurs réguliers qui publient chaque semaine.", features: ["50 miniatures par mois", "6 styles professionnels", "Export HD", "Support prioritaire"] },
      { id: "max", name: "Max", priceCents: 4900, description: "Pour les équipes, agences et workflows collaboratifs.", features: ["Miniatures illimitées", "Batch Upload", "Interface équipe", "Accès API"] },
    ] as const)),
    choose: protectedProcedure
      .input(z.object({ planType: z.enum(["free", "pro", "max"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserPlan(ctx.user.id, input.planType);
        await createNotification({
          userId: ctx.user.id,
          title: "Forfait sélectionné",
          message: `Le forfait ${input.planType === "free" ? "Gratuit" : input.planType === "pro" ? "Pro" : "Max"} a été sélectionné. La facturation réelle sera activée ultérieurement.`,
          type: "system",
        });
        return { success: true, planType: input.planType, simulated: true } as const;
      }),
  }),

  // === Credit packs (simulated payments, ready for Stripe later) ===
  packs: router({
    /** Catalogue des packs rechargeables (prix de simulation) */
    catalog: publicProcedure.query(() => {
      return [
        { id: "starter", label: "Pack Starter", credits: 10, amountCents: 490, currency: "EUR", tag: "Découverte", popular: false },
        { id: "creator", label: "Pack Créateur", credits: 50, amountCents: 1990, currency: "EUR", tag: "Le plus populaire", popular: true },
        { id: "pro", label: "Pack Pro", credits: 200, amountCents: 6990, currency: "EUR", tag: "Pour les réguliers", popular: false },
        { id: "max", label: "Pack Max", credits: 500, amountCents: 14990, currency: "EUR", tag: "Volume maximal", popular: false },
      ] as const;
    }),

    /** Historique des achats de l'utilisateur connecté */
    purchases: protectedProcedure.query(async ({ ctx }) => {
      return listCreditPackPurchases(ctx.user.id);
    }),

    /** Achat simulé : enregistre le paiement fictif et crédite immédiatement le compte */
    purchase: protectedProcedure
      .input(z.object({ packId: z.enum(["starter", "creator", "pro", "max"]) }))
      .mutation(async ({ ctx, input }) => {
        const catalog = [
          { id: "starter", label: "Pack Starter", credits: 10, amountCents: 490 },
          { id: "creator", label: "Pack Créateur", credits: 50, amountCents: 1990 },
          { id: "pro", label: "Pack Pro", credits: 200, amountCents: 6990 },
          { id: "max", label: "Pack Max", credits: 500, amountCents: 14990 },
        ];
        const pack = catalog.find(p => p.id === input.packId);
        if (!pack) throw new TRPCError({ code: "BAD_REQUEST", message: "Pack introuvable" });

        // 1) Enregistrer l'achat (paiement fictif — paymentId placeholder pour Stripe plus tard)
        const purchase = await createCreditPackPurchase({
          userId: ctx.user.id,
          packId: pack.id,
          packLabel: pack.label,
          creditsGranted: pack.credits,
          amountCents: pack.amountCents,
          currency: "EUR",
          status: "completed",
          paymentId: `sim_${Date.now()}_${ctx.user.id}`,
        });
        if (!purchase) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Échec de l'enregistrement de l'achat" });

        // 2) Créditer immédiatement le compte
        const current = await ensureUserCredits(ctx.user.id);
        await updateUserCredits(ctx.user.id, (current?.credits ?? 0) + pack.credits);
        const updatedBalance = await getUserCredits(ctx.user.id);
        if (updatedBalance) {
          await recordCreditLedger({
            userId: ctx.user.id,
            amount: pack.credits,
            balanceAfter: updatedBalance.credits,
            type: "grant",
            reason: "credit_pack",
            referenceId: String(purchase.id),
          });
        }

        // 3) Notification in-app de confirmation
        try {
          await createNotification({
            userId: ctx.user.id,
            title: "Crédits rechargés",
            message: `${pack.credits} crédits ont été ajoutés à ton compte (${pack.label}).`,
            type: "credit",
            metadata: JSON.stringify({ purchaseId: purchase.id, packId: pack.id, credits: pack.credits }),
          });
        } catch { /* les notifications ne doivent pas casser l'achat */ }

        const updated = await getUserCredits(ctx.user.id);
        return { success: true, credits: updated?.credits ?? 0, purchase } as const;
      }),
  }),
  // === Testimonials (real user reviews — collected via feedback form, moderated by admins) ===
  testimonials: router({
    /** Public list — only admin-approved reviews are displayed (never fabricated) */
    approved: publicProcedure.query(async () => listApprovedTestimonials()),
    /** Submit or resubmit a real review from a connected user (goes into moderation) */
    create: protectedProcedure
      .input(z.object({
        content: z.string().min(10).max(1000),
        rating: z.number().min(1).max(5).int(),
        authorName: z.string().max(128).optional(),
        authorChannel: z.string().max(128).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = (await listApprovedTestimonials()).find(r => r.userId === ctx.user.id);
        if (existing) await setTestimonialVerified(existing.id, "pending");
        const t = await createTestimonial({
          userId: ctx.user.id,
          content: input.content.trim(),
          rating: input.rating,
          authorName: input.authorName || ctx.user.name || undefined,
          authorChannel: input.authorChannel || undefined,
          verified: "pending",
        });
        return { success: true, testimonial: t } as const;
      }),
    /** Admin moderation */
    setVerified: adminProcedure
      .input(z.object({ id: z.number(), verified: z.enum(["pending", "approved", "rejected"]) }))
      .mutation(async ({ input }) => {
        await setTestimonialVerified(input.id, input.verified);
        return { success: true } as const;
      }),
    /** Admin deletion */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await dbDeleteTestimonial(input.id);
        return { success: true } as const;
      }),
    /** Admin moderation list — all reviews including pending */
    list: adminProcedure.query(async () => listAllTestimonials()),
  }),
  // === Organization ===
  org: orgRouter,

  // === Admin ===
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
