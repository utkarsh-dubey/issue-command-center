import { format, formatDistanceToNowStrict } from "date-fns";

export function relativeTime(timestamp: number) {
  return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
}

export function formatDueDate(dateValue: string) {
  return format(new Date(`${dateValue}T00:00:00`), "MMM d, yyyy");
}
