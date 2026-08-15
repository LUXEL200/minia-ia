import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { sdk } from "./sdk";

/** User enriched with `isAdminOwner` — true only for the verified owner account */
export type TrpcUser = User & { isAdminOwner: boolean };

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: TrpcUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Admin access is granted ONLY at login with the verified owner account
  // (openId matching OWNER_OPEN_ID). A DB role alone is not enough — the
  // openId check is the authoritative gate.
  const isAdminOwner = Boolean(user && ENV.ownerOpenId && user.openId === ENV.ownerOpenId);
  if (user) {
    (user as TrpcUser).isAdminOwner = isAdminOwner;
  }

  return {
    req: opts.req,
    res: opts.res,
    user: user as TrpcUser | null,
  };
}
