import { ConvexError } from "convex/values";

import type { Role } from "./types";

function unauthorized(message: string) {
  throw new ConvexError({ code: "UNAUTHORIZED", message });
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<any> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    unauthorized("You must be signed in.");
  }
  return identity;
}

export async function findUserByIdentity(
  ctx: { db: any },
  identity: { tokenIdentifier: string },
) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", identity.tokenIdentifier))
    .first();
}

export async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<any> }; db: any }) {
  const identity = await requireIdentity(ctx);
  const user = await findUserByIdentity(ctx, identity);
  if (!user || !user.isActive) {
    unauthorized("You do not have access. Please ask an admin for an invite.");
  }

  return { identity, user };
}

export function assertRole(user: { role: Role }, allowed: Role[]) {
  if (!allowed.includes(user.role)) {
    unauthorized("Insufficient permissions for this action.");
  }
}

export function assertCanCreateOrEdit(user: { role: Role }) {
  assertRole(user, ["admin", "member"]);
}

export function assertAdmin(user: { role: Role }) {
  assertRole(user, ["admin"]);
}
