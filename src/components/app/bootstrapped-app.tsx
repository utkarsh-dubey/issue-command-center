"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/convex-api";

export function BootstrappedApp({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoading: isConvexAuthLoading, isAuthenticated } = useConvexAuth();
  const ensureSelf = useMutation(api.users.ensureSelf);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || isConvexAuthLoading || !isAuthenticated || ready) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setError(null);
        await ensureSelf({});
        if (!cancelled) {
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Unable to initialize user access.";
          if (message.includes("You must be signed in.")) {
            setError(
              "Authentication with Convex is not ready yet. If this keeps happening, configure Clerk JWT template `convex` and CLERK_JWT_ISSUER_DOMAIN for Convex.",
            );
            return;
          }
          setError(message);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [ensureSelf, isLoaded, isSignedIn, isConvexAuthLoading, isAuthenticated, ready]);

  const me = useQuery(api.users.me, ready ? {} : "skip");
  const showSetupHelp = isLoaded && isSignedIn && !isConvexAuthLoading && !isAuthenticated;

  if (showSetupHelp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <Card className="w-full max-w-2xl border-amber-200 bg-white">
          <CardHeader>
            <CardTitle>First-time setup required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <p>
              You are signed in to Clerk, but Convex has not accepted the auth token yet. Complete this one-time setup,
              then restart both servers.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>In Clerk, create/edit JWT template <code>convex</code> with claims: <code>{`{"aud":"convex"}`}</code></li>
              <li>
                In Clerk app settings, set local URLs:
                <code>http://localhost:3000</code>, <code>/sign-in</code>, <code>/sign-up</code>, redirect to{" "}
                <code>/inbox</code>
              </li>
              <li>
                Ensure <code>CLERK_JWT_ISSUER_DOMAIN</code> in <code>.env.local</code> matches your Clerk issuer domain
              </li>
              <li>
                Restart Convex with env loaded:
                <code className="ml-1">set -a; source .env.local; set +a; bunx convex dev</code>
              </li>
            </ol>
            <p className="text-slate-600">
              After setup, first successful user is auto-created as <code>admin</code>.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>Retry Connection</Button>
              <Button asChild variant="outline">
                <Link href="/sign-in">Back to sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <Card className="w-full max-w-xl border-red-200 bg-white">
          <CardHeader>
            <CardTitle>Access blocked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">{error}</p>
            <p className="text-sm text-slate-600">
              This workspace uses admin invites only. Ask an admin to invite your Google account first.
            </p>
            <Button asChild>
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ready || me === undefined || isConvexAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Preparing workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Syncing your invite and role...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppShell role={me.role} name={me.name}>
      {children}
    </AppShell>
  );
}
