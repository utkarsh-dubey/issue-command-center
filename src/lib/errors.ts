function pickRawMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error && typeof error === "object") {
    const dataMessage = (error as { data?: { message?: unknown } }).data?.message;
    if (typeof dataMessage === "string" && dataMessage.trim()) {
      return dataMessage.trim();
    }

    const objectMessage = (error as { message?: unknown }).message;
    if (typeof objectMessage === "string" && objectMessage.trim()) {
      return objectMessage.trim();
    }
  }

  return fallback;
}

function stripTechnicalDetails(message: string) {
  const trimmed = message.trim();
  const uncaughtPrefix = "Uncaught Error:";
  const uncaughtIndex = trimmed.indexOf(uncaughtPrefix);
  const withoutUncaught = uncaughtIndex >= 0 ? trimmed.slice(uncaughtIndex + uncaughtPrefix.length).trim() : trimmed;

  const convexMatch = withoutUncaught.match(/Error:\s*([\s\S]*?)(?:\s+at handler\b|\s+Called by client\b|$)/i);
  if (convexMatch?.[1]) {
    return convexMatch[1].trim();
  }

  const withoutConvexPrefix = withoutUncaught.replace(/^\[CONVEX[^\]]*\]\s*/i, "").trim();
  return withoutConvexPrefix || withoutUncaught;
}

function mapFriendlyMessage(message: string) {
  if (message.includes("Issue is not triage-ready.")) {
    return "Can't move to Planned yet. Add description, assignee, and complete RICE (reach, impact, confidence, effort).";
  }

  if (message.includes("Only admins can move items through inbox/triage/planned transitions.")) {
    return "Only admins can move issues through inbox, triage, or planned transitions.";
  }

  if (message.includes("Insufficient permissions for this action.")) {
    return "You do not have permission to do this action.";
  }

  if (message.includes("You are not invited yet.")) {
    return "This account is signed in, but is not invited to this workspace.";
  }

  if (message.includes("Google account email is missing in auth token.")) {
    return "Auth token is missing email. Update Clerk JWT template `convex` to include email and name claims.";
  }

  if (message.includes("You must be signed in.")) {
    return "You are signed out. Sign in again and retry.";
  }

  if (message.includes("Cannot assign an inactive customer.")) {
    return "This customer is archived. Select an active customer.";
  }

  return message;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please retry.") {
  const raw = pickRawMessage(error, fallback);
  const cleaned = stripTechnicalDetails(raw);
  const friendly = mapFriendlyMessage(cleaned);
  return friendly.trim() || fallback;
}
