import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// Monday 09:00 Asia/Kolkata = Monday 03:30 UTC
crons.weekly(
  "weekly stakeholder digest",
  {
    dayOfWeek: "monday",
    hourUTC: 3,
    minuteUTC: 30,
  },
  internal.digests.sendWeeklyDigest,
  {},
);

// Daily snapshot at midnight UTC
crons.daily("daily snapshot", { hourUTC: 0, minuteUTC: 0 }, internal.snapshots.takeDailySnapshot, {});

// SLA breach check every hour
crons.interval("sla check", { hours: 1 }, internal.automations.checkSlaBreaches, {});

// Stale issue check every 6 hours
crons.interval("stale check", { hours: 6 }, internal.automations.checkStaleIssues, {});

// Auto-escalation daily at 03:00 UTC
crons.daily("auto-escalation", { hourUTC: 3, minuteUTC: 0 }, internal.automations.autoEscalate, {});

// Customer health scores daily at 06:00 UTC
crons.daily("health scores", { hourUTC: 6, minuteUTC: 0 }, internal.customers.recalculateHealthScores, {});

// On-call rotation daily at 09:00 UTC
crons.daily("oncall rotation", { hourUTC: 9, minuteUTC: 0 }, internal.oncall.rotateIfDue, {});

// Presence cleanup every 5 minutes
crons.interval("presence cleanup", { minutes: 5 }, internal.presence.cleanup, {});

export default crons;
