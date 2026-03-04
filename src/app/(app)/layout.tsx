import { BootstrappedApp } from "@/components/app/bootstrapped-app";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <BootstrappedApp>{children}</BootstrappedApp>;
}
