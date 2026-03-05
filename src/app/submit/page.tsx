"use client";

import { useMutation } from "convex/react";
import { Bug, CheckCircle2, Lightbulb, Plus, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { api } from "../../../convex/_generated/api";

type ItemType = "feature_request" | "bug_report";

interface SubmitItem {
  id: string;
  type: ItemType;
  title: string;
  description: string;
}

function createItem(): SubmitItem {
  return { id: crypto.randomUUID(), type: "feature_request", title: "", description: "" };
}

export default function SubmitPage() {
  const submitIssues = useMutation(api.portal.submitIssues);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [items, setItems] = useState<SubmitItem[]>([createItem()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  function updateItem(id: string, patch: Partial<SubmitItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function addItem() {
    if (items.length >= 20) {
      toast.error("Maximum 20 items per submission.");
      return;
    }
    setItems((prev) => [...prev, createItem()]);
  }

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!email.trim() || !email.includes("@")) return "A valid email is required.";
    if (items.length === 0) return "Add at least one item.";
    for (let i = 0; i < items.length; i++) {
      if (!items[i].title.trim()) return `Item ${i + 1} needs a title.`;
    }
    return null;
  }

  async function handleSubmit() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitIssues({
        submitterName: name.trim(),
        submitterEmail: email.trim(),
        submitterCompany: company.trim() || undefined,
        items: items.map((item) => ({
          type: item.type,
          title: item.title.trim(),
          description: item.description.trim() || undefined,
        })),
      });
      setSuccessCount(result.count);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setCompany("");
    setItems([createItem()]);
    setSuccessCount(null);
  }

  if (successCount !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-2xl font-semibold">Thank you!</h2>
            <p className="mb-6 text-muted-foreground">
              {successCount === 1
                ? "Your submission has been received."
                : `Your ${successCount} submissions have been received.`}
            </p>
            <Button onClick={resetForm} variant="outline">
              Submit more feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-background p-4 pt-12 pb-20">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Submit Feedback</h1>
          <p className="text-muted-foreground">
            Share feature requests or report bugs. Your feedback helps us build a better product.
          </p>
        </div>

        {/* Your Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Inc."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Items</h2>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1 h-4 w-4" />
              Add another
            </Button>
          </div>

          {items.map((item, index) => (
            <Card key={item.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={item.type}
                      onValueChange={(value: ItemType) => updateItem(item.id, { type: value })}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature_request">
                          <span className="flex items-center gap-2">
                            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                            Feature Request
                          </span>
                        </SelectItem>
                        <SelectItem value="bug_report">
                          <span className="flex items-center gap-2">
                            <Bug className="h-3.5 w-3.5 text-red-500" />
                            Bug Report
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={
                      item.type === "feature_request"
                        ? "e.g. Add dark mode support"
                        : "e.g. Login page crashes on Safari"
                    }
                    value={item.title}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Provide details, steps to reproduce, or context..."
                    rows={3}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit */}
        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting
            ? "Submitting..."
            : items.length === 1
              ? "Submit feedback"
              : `Submit ${items.length} items`}
        </Button>
      </div>
    </div>
  );
}
