import { QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function getAuthedUserId(ctx: QueryCtx) {
  return await getAuthUserId(ctx);
}
