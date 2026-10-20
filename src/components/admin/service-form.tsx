"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createServiceAction, updateServiceAction } from "@/lib/admin/services-actions";
import type { ServiceInput } from "@/lib/admin/services-admin-service";
import { generateSlug } from "@/lib/admin/slug-utils";
import type { ServiceRow } from "@/types/domain";

interface ServiceFormProps {
  initialService?: ServiceRow;
  mode: "create" | "edit";
}

export function ServiceForm({ initialService, mode }: ServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialService?.name || "");
  const [slug, setSlug] = useState(initialService?.slug || "");
  const [isSlugCustomized, setIsSlugCustomized] = useState(mode === "edit");
  const [shortDesc, setShortDesc] = useState(initialService?.short_description || "");
  const [description, setDescription] = useState(initialService?.description || "");
  const [imageUrl, setImageUrl] = useState(initialService?.image_url || "");
  const [duration, setDuration] = useState(initialService?.duration_minutes ?? 60);
  const [bufferBefore, setBufferBefore] = useState(initialService?.buffer_before_minutes ?? 0);
  const [bufferAfter, setBufferAfter] = useState(initialService?.buffer_after_minutes ?? 0);
  const [displayOrder, setDisplayOrder] = useState(initialService?.display_order ?? 10);
  const [isActive, setIsActive] = useState(initialService?.is_active ?? false);

  function handleNameChange(val: string) {
    setName(val);
    if (!isSlugCustomized && mode === "create") {
      setSlug(generateSlug(val));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: ServiceInput = {
      name,
      slug,
      short_description: shortDesc.trim() || null,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      duration_minutes: Number(duration),
      buffer_before_minutes: Number(bufferBefore),
      buffer_after_minutes: Number(bufferAfter),
      display_order: Number(displayOrder),
      is_active: isActive,
    };

    startTransition(async () => {
      let res;
      if (mode === "create") {
        res = await createServiceAction(input);
      } else if (initialService) {
        res = await updateServiceAction(initialService.id, input);
      }

      if (res && !res.success) {
        setError(res.error || "Failed to save service.");
      } else {
        router.push("/admin/services");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error" title="Submission Error">
          {error}
        </Alert>
      )}

      <Card className="space-y-5 border-border bg-surface p-6 shadow-card">
        <h2 className="border-b border-border/60 pb-2 text-base font-semibold text-foreground">
          Service Identity & Visibility
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Service Title"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="e.g. Spiritual Consultation"
          />

          <div>
            <Input
              label="URL Slug"
              value={slug}
              onChange={(e) => {
                setIsSlugCustomized(true);
                setSlug(e.target.value);
              }}
              required
              placeholder="e.g. spiritual-consultation"
              hint="Lowercase letters, numbers, and hyphens only."
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>Active & Published (Visible to public visitors for booking)</span>
          </label>
        </div>
      </Card>

      <Card className="space-y-5 border-border bg-surface p-6 shadow-card">
        <h2 className="border-b border-border/60 pb-2 text-base font-semibold text-foreground">
          Duration & Buffer Configuration
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Duration (Minutes)"
            type="number"
            min={1}
            max={720}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            required
            hint="Appointment length"
          />

          <Input
            label="Buffer Before (Mins)"
            type="number"
            min={0}
            max={240}
            value={bufferBefore}
            onChange={(e) => setBufferBefore(Number(e.target.value))}
            hint="Prep time"
          />

          <Input
            label="Buffer After (Mins)"
            type="number"
            min={0}
            max={240}
            value={bufferAfter}
            onChange={(e) => setBufferAfter(Number(e.target.value))}
            hint="Post-consultation rest"
          />
        </div>

        <div className="w-full sm:w-48">
          <Input
            label="Display Priority Order"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            hint="Lower numbers show first"
          />
        </div>
      </Card>

      <Card className="space-y-5 border-border bg-surface p-6 shadow-card">
        <h2 className="border-b border-border/60 pb-2 text-base font-semibold text-foreground">
          Descriptions & Imagery
        </h2>

        <Textarea
          label="Short Summary"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="Brief 1-2 sentence description shown in service cards."
          hint={`${280 - shortDesc.length} characters remaining`}
        />

        <Textarea
          label="Detailed Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={10000}
          placeholder="Detailed breakdown of what the consultation includes, what to prepare, etc."
        />

        <Input
          label="Image Path or URL (Optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="/images/services/consultation.jpg or https://..."
          hint="Must begin with / or https://"
        />
      </Card>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          className="min-h-[44px] w-full sm:w-auto"
        >
          {mode === "create" ? "Create Service" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
