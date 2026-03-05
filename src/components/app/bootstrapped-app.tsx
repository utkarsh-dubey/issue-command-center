"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

export function BootstrappedApp({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isLoading: isConvexAuthLoading, isAuthenticated } = useConvexAuth();
  const ensureSelf = useMutation(api.users.ensureSelf);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSwitchAccount = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ redirectUrl: "/sign-in" });
    } catch {
      window.location.href = "/sign-in";
    } finally {
      setIsSigningOut(false);
    }
  };

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
          setError(getErrorMessage(err, "Unable to initialize user access."));
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [ensureSelf, isLoaded, isSignedIn, isConvexAuthLoading, isAuthenticated, ready]);

  const me = useQuery(api.users.me, ready && isAuthenticated ? {} : "skip");
  const showSetupHelp = isLoaded && isSignedIn && !isConvexAuthLoading && !isAuthenticated;

  if (showSetupHelp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-2xl border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle>First-time setup required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              You are signed in to Clerk, but Convex has not accepted the auth token yet. Complete this one-time setup,
              then restart both servers.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>In Clerk, create/edit JWT template <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">convex</code> with claims: <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{`{"aud":"convex"}`}</code></li>
              <li>
                In Clerk app settings, set local URLs:
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">http://localhost:3000</code>, <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">/sign-in</code>, <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">/sign-up</code>, redirect to{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">/inbox</code>
              </li>
              <li>
                Ensure <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">CLERK_JWT_ISSUER_DOMAIN</code> in <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">.env.local</code> matches your Clerk issuer domain
              </li>
              <li>
                Restart Convex with env loaded:
                <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">set -a; source .env.local; set +a; bunx convex dev</code>
              </li>
            </ol>
            <p>
              After setup, first successful user is auto-created as <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">admin</code>.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>Retry Connection</Button>
              <Button variant="outline" onClick={handleSwitchAccount} disabled={isSigningOut}>
                {isSigningOut ? "Signing out..." : "Sign out & switch account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-xl border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle>Access blocked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user?.primaryEmailAddress?.emailAddress ?? "unknown account"}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              This workspace uses admin invites only. Ask an admin to invite this email, or switch to an invited account.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
              <Button onClick={handleSwitchAccount} disabled={isSigningOut}>
                {isSigningOut ? "Signing out..." : "Sign out & switch account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ready || me === undefined || isConvexAuthLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold tracking-[0.14em] text-primary-foreground">
            ICC
          </div>
          <h1 className="text-lg font-semibold text-foreground">Issue Command Center</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing workspace...
        </div>
      </div>
    );
  }

  return (
    <AppShell role={me.role} name={me.name}>
      {children}
    </AppShell>
  );
}
