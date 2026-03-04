import type { AuthConfig } from "convex/server";

const domain =
  process.env.CLERK_JWT_ISSUER_DOMAIN?.trim().replace(/\/$/, "") ??
  process.env.CLERK_FRONTEND_API_URL?.trim().replace(/\/$/, "");

if (!domain) {
  throw new Error(
    "Missing Clerk issuer domain for Convex. Set CLERK_JWT_ISSUER_DOMAIN (or CLERK_FRONTEND_API_URL) before running `convex dev`.",
  );
}

export default {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
