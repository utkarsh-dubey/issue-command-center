import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertAdmin, normalizeEmail, requireUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    return await ctx.db.query("invites").collect();
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    const email = normalizeEmail(args.email);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error("User already exists.");
    }

    const pendingInvite = await ctx.db
      .query("invites")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .first();

    if (pendingInvite) {
      throw new Error("Pending invite already exists.");
    }

    const inviteId = await ctx.db.insert("invites", {
      email,
      role: args.role,
      status: "pending",
      invitedBy: user._id,
      createdAt: Date.now(),
    });

    return await ctx.db.get(inviteId);
  },
});

export const revoke = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found.");
    }

    if (invite.status !== "pending") {
      throw new Error("Only pending invites can be revoked.");
    }

    await ctx.db.patch(args.inviteId, { status: "revoked" });
    return { success: true };
  },
});
