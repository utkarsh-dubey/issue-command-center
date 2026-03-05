"use client";

import { Button } from "@/components/ui/button";

export function CommentVisibilityToggle({
  visibility,
  onChange,
}: {
  visibility: "internal" | "external";
  onChange: (v: "internal" | "external") => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={visibility === "internal" ? "default" : "outline"}
        onClick={() => onChange("internal")}
      >
        Internal
      </Button>
      <Button
        size="sm"
        variant={visibility === "external" ? "default" : "outline"}
        onClick={() => onChange("external")}
      >
        External
      </Button>
    </div>
  );
}
