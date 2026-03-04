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

export default crons;
