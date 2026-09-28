import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getAdminAccess, type AdminPermission } from "../db";

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
    if (ctx.user.isAdminOwner) return next({ ctx: { ...ctx, user: ctx.user } });
    const access = await getAdminAccess(ctx.user.id);
    if (!access?.permissions.includes(permission)) throw new TRPCError({ code: "FORBIDDEN", message: `Permission requise : ${permission}` });
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
