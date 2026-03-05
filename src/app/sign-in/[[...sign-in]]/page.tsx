import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#c4e9ee_0,#f2f8ff_42%,#ffffff_100%)] px-4 dark:bg-[radial-gradient(circle_at_top_left,oklch(0.22_0.03_220)_0,oklch(0.17_0.01_250)_42%,oklch(0.15_0.01_250)_100%)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto inline-flex rounded-lg bg-primary px-3 py-1.5 text-sm font-bold tracking-[0.14em] text-primary-foreground">
            ICC
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">Issue Command Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace</p>
        </div>
        <div className="flex justify-center">
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/inbox" />
        </div>
      </div>
    </div>
  );
}
