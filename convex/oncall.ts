import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import { assertAdmin, requireUser } from "./auth";

export const createRotation = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    memberIds: v.array(v.id("users")),
    rotationIntervalDays: v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    if (args.memberIds.length === 0) throw new Error("Need at least one member.");
    const now = Date.now();
    return await ctx.db.insert("oncall_rotations", {
      teamId: args.teamId,
      name: args.name.trim(),
      memberIds: args.memberIds,
      currentIndex: 0,
      rotationIntervalDays: args.rotationIntervalDays,
      lastRotatedAt: now,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateRotation = mutation({
  args: {
    rotationId: v.id("oncall_rotations"),
    name: v.optional(v.string()),
    memberIds: v.optional(v.array(v.id("users"))),
    rotationIntervalDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const rotation = await ctx.db.get(args.rotationId);
    if (!rotation) throw new Error("Rotation not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name) patch.name = args.name.trim();
    if (args.memberIds) patch.memberIds = args.memberIds;
    if (args.rotationIntervalDays) patch.rotationIntervalDays = args.rotationIntervalDays;

    await ctx.db.patch(args.rotationId, patch);
    return await ctx.db.get(args.rotationId);
  },
});

export const getCurrentOncall = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const rotations = await ctx.db
      .query("oncall_rotations")
      .withIndex("by_team", (q: any) => q.eq("teamId", args.teamId))
      .collect();

    return rotations.map((r) => {
      const currentUserId = r.memberIds[r.currentIndex];
      return { rotationName: r.name, currentUserId, rotation: r };
    });
  },
});

export const listRotations = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db.query("oncall_rotations").collect();
  },
});

export const rotateIfDue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rotations = await ctx.db.query("oncall_rotations").collect();
    const now = Date.now();

    for (const rotation of rotations) {
      const msSinceRotation = now - rotation.lastRotatedAt;
      const intervalMs = rotation.rotationIntervalDays * 24 * 60 * 60 * 1000;
      if (msSinceRotation >= intervalMs) {
        const nextIndex = (rotation.currentIndex + 1) % rotation.memberIds.length;
        await ctx.db.patch(rotation._id, {
          currentIndex: nextIndex,
          lastRotatedAt: now,
          updatedAt: now,
        });
      }
    }
  },
});
