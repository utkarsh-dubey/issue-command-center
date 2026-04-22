"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeProvider, useTheme } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud");

function ClerkThemed({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <ClerkProvider
      appearance={
        resolvedTheme === "dark"
          ? {
              baseTheme: dark,
              variables: {
                colorBackground: "oklch(0.21 0.006 285.885)",
                colorInputBackground: "oklch(0.274 0.006 286.033)",
                colorPrimary: "oklch(0.795 0.184 86.047)",
              },
            }
          : {
              variables: {
                colorPrimary: "oklch(0.852 0.199 91.936)",
              },
            }
      }
    >
      {children}
    </ClerkProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ClerkThemed>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ConvexProviderWithClerk>
      </ClerkThemed>
    </ThemeProvider>
  );
}
