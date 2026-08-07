import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { generateImage, listImageModels } from "./_core/imageGeneration";
import { thumbnails } from "../drizzle/schema";
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
} from "./db";

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
});

export type AppRouter = typeof appRouter;
