import { format, formatDistanceToNowStrict } from "date-fns";

export function relativeTime(timestamp: number | null | undefined) {
  if (timestamp === null || timestamp === undefined) return "—";
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return "—";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatDueDate(dateValue: string | null | undefined) {
  if (!dateValue) return "—";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "MMM d, yyyy");
}
