"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

export default function ThemesPage() {
  const me = useQuery(api.users.me, {});
  const themes = useQuery(api.themes.list, {});

  const createTheme = useMutation(api.themes.create);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const onCreate = async () => {
    if (!name.trim()) {
      toast.error("Theme name is required");
      return;
    }

    try {
      await createTheme({ name, description, colorToken: "stone" });
      setName("");
      setDescription("");
      toast.success("Theme created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to create theme."));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Themes</CardTitle>
          <p className="text-sm text-muted-foreground">Use themes to group issues for leadership reporting without adding epic complexity.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {themes?.map((theme: any) => (
            <div key={theme._id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{theme.name}</p>
                <Badge variant={theme.isActive ? "secondary" : "outline"}>{theme.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              {theme.description ? <p className="mt-1 text-sm text-muted-foreground">{theme.description}</p> : null}
            </div>
          ))}
          {themes && themes.length === 0 ? <p className="text-sm text-muted-foreground">No themes yet.</p> : null}
        </CardContent>
      </Card>

      {me?.role === "admin" ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </div>
            <Button onClick={onCreate}>Create Theme</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
