import { formatDistanceToNowStrict } from "date-fns";

export function relativeTime(timestamp: number) {
  return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
}
