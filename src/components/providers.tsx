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
                colorBackground: "oklch(0.19 0.01 250)",
                colorInputBackground: "oklch(0.22 0.01 250)",
                colorPrimary: "oklch(0.7 0.08 220)",
              },
            }
          : {
              variables: {
                colorPrimary: "oklch(0.35 0.08 252)",
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
