import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#c4e9ee_0,#f2f8ff_42%,#ffffff_100%)] px-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/inbox" />
    </div>
  );
}
