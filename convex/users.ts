import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertAdmin, normalizeEmail, requireIdentity, requireUser } from "./auth";

export const ensureSelf = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", identity.tokenIdentifier))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: identity.name || existing.name,
        email: normalizeEmail(identity.email || existing.email),
        lastSeenAt: now,
      });
      return await ctx.db.get(existing._id);
    }

    const email = identity.email ? normalizeEmail(identity.email) : null;
    if (!email) {
      throw new Error(
        "Google account email is missing in auth token. Update Clerk JWT template `convex` to include `email: {{user.primary_email_address}}`.",
      );
    }

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();

    // If Clerk user id changed but email matches an existing user, re-link
    // to avoid blocking the original account owner.
    if (existingByEmail) {
      if (!existingByEmail.isActive) {
        throw new Error("Your account has been deactivated. Ask an admin to restore access.");
      }

      await ctx.db.patch(existingByEmail._id, {
        clerkUserId: identity.tokenIdentifier,
        name: identity.name || existingByEmail.name,
        lastSeenAt: now,
      });
      return await ctx.db.get(existingByEmail._id);
    }

    const firstUser = await ctx.db.query("users").first();

    if (!firstUser) {
      const firstUserId = await ctx.db.insert("users", {
        clerkUserId: identity.tokenIdentifier,
        email,
        name: identity.name || email,
        role: "admin",
        isActive: true,
        createdAt: now,
        lastSeenAt: now,
      });
      return await ctx.db.get(firstUserId);
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .first();

    if (!invite) {
      throw new Error("You are not invited yet. Ask an admin to invite you first.");
    }

    const userId = await ctx.db.insert("users", {
      clerkUserId: identity.tokenIdentifier,
      email,
      name: identity.name || email,
      role: invite.role,
      isActive: true,
      invitedBy: invite.invitedBy,
      createdAt: now,
      lastSeenAt: now,
    });

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: now,
    });

    return await ctx.db.get(userId);
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    return await ctx.db.query("users").collect();
  },
});

export const listAssignable = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const users = await ctx.db.query("users").filter((q: any) => q.eq(q.field("isActive"), true)).collect();

    return users.map((u: any) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new Error("User not found.");
    }

    if (target.role === "admin" && args.role !== "admin") {
      const allAdmins = await ctx.db
        .query("users")
        .filter((q: any) => q.and(q.eq(q.field("role"), "admin"), q.eq(q.field("isActive"), true)))
        .collect();
      if (allAdmins.length <= 1) {
        throw new Error("At least one active admin is required.");
      }
    }

    await ctx.db.patch(args.userId, { role: args.role });
    return await ctx.db.get(args.userId);
  },
});

export const deactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new Error("User not found.");
    }

    if (target.role === "admin") {
      const allAdmins = await ctx.db
        .query("users")
        .filter((q: any) => q.and(q.eq(q.field("role"), "admin"), q.eq(q.field("isActive"), true)))
        .collect();
      if (allAdmins.length <= 1) {
        throw new Error("At least one active admin is required.");
      }
    }

    await ctx.db.patch(args.userId, { isActive: false });
    return { success: true };
  },
});
