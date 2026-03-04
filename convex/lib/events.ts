export async function logIssueEvent(ctx: { db: any }, payload: {
  issueId: any;
  actorId?: any;
  eventType: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}) {
  await ctx.db.insert("issue_events", {
    issueId: payload.issueId,
    actorId: payload.actorId,
    eventType: payload.eventType,
    before: payload.before,
    after: payload.after,
    metadata: payload.metadata,
    createdAt: Date.now(),
  });
}
