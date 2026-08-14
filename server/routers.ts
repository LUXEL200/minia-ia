import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { generateImage, listImageModels } from "./_core/imageGeneration";
import { thumbnails, avatars, endCards } from "../drizzle/schema";
import {
  getThumbnailsByUserId,
  getThumbnailById,
  createThumbnail,
  updateThumbnailStatus,
  getUserCredits,
  ensureUserCredits,
  deductCredits,
  getDb,
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
  getNotificationsByUserId,
  getUnreadCountByUserId,
  markNotificationRead,
  markAllNotificationsRead,
  getAdminStats,
  getAllUsers,
  updateUserRole,
  updateUserCredits,
  updateUserPlan,
  sendGlobalNotification,
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
      const isAdmin = ctx.user.role === "admin";
      await deleteTemplate(input.id, ctx.user.id, isAdmin);
      return { success: true } as const;
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
      const credits = await ensureUserCredits(ctx.user.id);
      if (credits.credits < 1) {
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
          await deductCredits(ctx.user.id, 1);
        } else {
          await updateAvatarStatus(id, "failed");
        }
      } catch {
        await updateAvatarStatus(id, "failed");
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
      const credits = await ensureUserCredits(ctx.user.id);
      if (credits.credits < 1) {
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
          await deductCredits(ctx.user.id, 1);
        } else {
          await updateEndCardStatus(id, "failed");
        }
      } catch {
        await updateEndCardStatus(id, "failed");
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
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      return createApiKey(ctx.user.id, input.name);
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await revokeApiKey(input.id, ctx.user.id);
      return { success: true } as const;
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
});

// === Admin Router ===
export const adminRouter = router({
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
    .mutation(async ({ input }) => {
      await sendGlobalNotification(input.title, input.message, input.type);
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
      }))
      .mutation(async ({ ctx, input }) => {
        // Check credits
        const credits = await ensureUserCredits(ctx.user.id);
        if (credits.credits < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Crédits insuffisants. Il te reste ${credits.credits} crédit(s). Tu as besoin de ${input.quantity} crédit(s).`,
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
            // Generate image via Forge API
            const { url } = await generateImage({
              prompt: fullPrompt,
              model: "MODEL_GPT_IMAGE_2",
              quality: "high",
            });

            if (url) {
              await updateThumbnailStatus(thumbId, "completed", url);
              results.push({ id: thumbId, status: "completed", imageUrl: url });
              successfulCount++;
            } else {
              await updateThumbnailStatus(thumbId, "failed");
              results.push({ id: thumbId, status: "failed", imageUrl: null });
            }
          } catch (error) {
            console.error(`[Thumbnail] Generation failed for ${thumbId}:`, error);
            await updateThumbnailStatus(thumbId, "failed");
            results.push({ id: thumbId, status: "failed", imageUrl: null });
          }
        }

        // Only deduct credits for successfully generated thumbnails
        if (successfulCount > 0) {
          await deductCredits(ctx.user.id, successfulCount);
        }

        const updatedCredits = await getUserCredits(ctx.user.id);

        return {
          thumbnails: results,
          creditsRemaining: updatedCredits?.credits ?? 0,
          successful: successfulCount,
          failed: input.quantity - successfulCount,
        };
      }),

    /** Get user's current credits */
    credits: protectedProcedure.query(async ({ ctx }) => {
      return ensureUserCredits(ctx.user.id);
    }),

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
      if (ctx.user.role !== "admin") {
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
        if (credits.credits < input.prompts.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Crdits insuffisants. Il te reste ${credits.credits} crdit(s). Tu as besoin de ${input.prompts.length} crdit(s).`,
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
              results.push({ id: thumbId, status: "failed", imageUrl: null });
            }
          } catch {
            await updateThumbnailStatus(thumbId, "failed");
            results.push({ id: thumbId, status: "failed", imageUrl: null });
          }
        }

        if (successfulCount > 0) {
          await deductCredits(ctx.user.id, successfulCount);
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
        await updateTaskStatus(input.taskId, input.status, input.comment);
        return { success: true };
      }),
  }),

  // === Templates ===
  templates: templatesRouter,

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

  // === Admin ===
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
