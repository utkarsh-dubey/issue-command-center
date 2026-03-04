import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#c4e9ee_0,#f2f8ff_42%,#ffffff_100%)] px-4">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/inbox" />
    </div>
  );
}
