import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getAdminAccess, type AdminPermission } from "../db";
import { getAdminTotpStatus } from "../db";
import { parse as parseCookie } from "cookie";
import { verifyAdminMfaCookie } from "../adminTotp";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Admin access requires the verified owner account (openId gate set in context)
    if (!ctx.user || !ctx.user.isAdminOwner) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    const totp = await getAdminTotpStatus(ctx.user.id);
    if (totp.enabled && !verifyAdminMfaCookie(parseCookie(ctx.req.headers.cookie ?? "").minia_admin_mfa, ctx.user.id)) throw new TRPCError({ code: "FORBIDDEN", message: "Validation TOTP requise pour le Super Admin." });

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/** Permission-scoped admin access; the verified owner keeps unrestricted access. */
export const adminPermission = (permission: AdminPermission) => t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    if (ctx.user.isAdminOwner) {
      const totp = await getAdminTotpStatus(ctx.user.id);
      if (totp.enabled && !verifyAdminMfaCookie(parseCookie(ctx.req.headers.cookie ?? "").minia_admin_mfa, ctx.user.id)) throw new TRPCError({ code: "FORBIDDEN", message: "Validation TOTP requise pour le Super Admin." });
      return next({ ctx: { ...ctx, user: ctx.user } });
    }
    const access = await getAdminAccess(ctx.user.id);
    const rolePermissions: Record<string, AdminPermission[]> = {
      admin: ["dashboard.view", "models.view", "models.manage", "users.view", "users.manage", "users.export", "audit.view", "audit.export", "security.manage"],
      moderator: ["dashboard.view", "users.view", "users.manage", "audit.view"],
      support: ["dashboard.view", "users.view", "users.manage", "audit.view"],
      analyst: ["dashboard.view", "models.view", "audit.view", "audit.export"],
      operator: ["dashboard.view", "models.view", "models.manage", "audit.view"],
      read_only: ["dashboard.view", "models.view", "users.view", "audit.view"],
    };
    if (!access || (!access.permissions.includes(permission) && !rolePermissions[access.role]?.includes(permission))) throw new TRPCError({ code: "FORBIDDEN", message: `Permission requise : ${permission}` });
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
