import { internalMutation } from "./_generated/server";

export const takeDailySnapshot = internalMutation({
  args: {},
  handler: async (ctx) => {
    const issues = await ctx.db.query("issues").collect();
    const today = new Date().toISOString().slice(0, 10);
    const dayStart = new Date(today).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const statusCounts = { inbox: 0, triage: 0, planned: 0, doing: 0, done: 0 };
    const priorityCounts = { p0: 0, p1: 0, p2: 0, p3: 0 };
    let totalDone = 0;

    for (const issue of issues) {
      if (issue.archivedAt) continue;
      if (issue.status in statusCounts) {
        statusCounts[issue.status as keyof typeof statusCounts]++;
      }
      if (issue.priorityBand in priorityCounts && issue.status !== "done") {
        priorityCounts[issue.priorityBand as keyof typeof priorityCounts]++;
      }
      if (issue.status === "done") totalDone++;
    }

    const totalActive = statusCounts.inbox + statusCounts.triage + statusCounts.planned + statusCounts.doing;
    const issuesCreated = issues.filter((i) => i.createdAt >= dayStart && i.createdAt < dayEnd).length;

    const transitions = await ctx.db.query("stage_transitions").collect();
    const closedToday = transitions.filter(
      (t) => t.toStatus === "done" && t.transitionedAt >= dayStart && t.transitionedAt < dayEnd,
    );

    const cycleTimes = closedToday
      .filter((t) => t.durationInPreviousMs)
      .map((t) => t.durationInPreviousMs!);
    const avgCycleTimeHours =
      cycleTimes.length > 0
        ? Math.round((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length / 3600000) * 10) / 10
        : undefined;

    await ctx.db.insert("daily_snapshots", {
      date: today,
      statusCounts,
      priorityCounts,
      totalActive,
      totalDone,
      issuesCreated,
      issuesClosed: closedToday.length,
      avgCycleTimeHours,
      createdAt: Date.now(),
    });
  },
});
