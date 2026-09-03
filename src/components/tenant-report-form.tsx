"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError, FormField, NativeRadio } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/messages";
import { submitReportAction } from "@/lib/actions";
import { MAX_PHOTO_BYTES, MAX_PHOTOS } from "@/lib/constants";
import type { CaseCategory, CasePriority } from "@/lib/types";
import { CASE_CATEGORIES, GUEST_PRIORITIES } from "@/lib/types";
import { fileToDataUrl } from "@/lib/utils";

export function TenantReportForm({
  token,
  propertyName,
  dict,
  locale,
}: {
  token: string;
  propertyName: string;
  dict: Dictionary;
  locale: string;
}) {
  const [category, setCategory] = useState<CaseCategory>("other");
  const [priority, setPriority] = useState<CasePriority>("soon");
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => submitReportAction(formData),
    null,
  );

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const input = form.elements.namedItem("files") as HTMLInputElement;
        const files = [...(input.files ?? [])].slice(0, MAX_PHOTOS);
        const photos: { url: string; caption?: string }[] = [];
        const notes: string[] = [];
        for (const file of files) {
          if (file.type.startsWith("video/") && file.size > 1_500_000) {
            notes.push(file.name);
            continue;
          }
          if (file.size > MAX_PHOTO_BYTES) continue;
          photos.push({ url: await fileToDataUrl(file), caption: file.name });
        }
        if (notes.length) {
          data.set(
            "description",
            `${String(data.get("description") ?? "")}\n\n${notes.join(", ")}`,
          );
        }
        data.set("photos", JSON.stringify(photos));
        data.set("category", category);
        data.set("priority", priority);
        action(data);
      }}
    >
      <input type="hidden" name="propertyToken" value={token} />
      <input type="hidden" name="locale" value={locale} />
      <p className="text-sm text-muted-foreground">{propertyName}</p>
      <div className="grid grid-cols-2 gap-2">
        {CASE_CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${
              category === item ? "border-navy-800 bg-navy-50" : "border-border bg-white"
            }`}
          >
            {dict.report.categories[item]}
          </button>
        ))}
      </div>
      <FormField label={dict.report.heading} htmlFor="title" required>
        <Input id="title" name="title" required />
      </FormField>
      <FormField label={dict.report.description} htmlFor="description" required>
        <Textarea id="description" name="description" required />
      </FormField>
      <FormField label={dict.report.photos} htmlFor="files" hint={dict.report.photosHelp}>
        <Input
          id="files"
          name="files"
          type="file"
          accept="image/*,video/*"
          multiple
        />
      </FormField>
      <fieldset>
        <legend className="mb-2 text-[15px] font-medium text-ocean">{dict.report.urgency}</legend>
        <div className="grid gap-2">
          {GUEST_PRIORITIES.map((item) => (
            <label
              key={item}
              className={`flex min-h-14 items-center gap-3 rounded-[12px] border px-4 text-[15px] ${
                priority === item ? "border-ocean bg-navy-50" : "border-field-border bg-white"
              }`}
            >
              <NativeRadio
                name="priorityChoice"
                checked={priority === item}
                onChange={() => setPriority(item)}
              />
              {dict.report.priorities[item]}
            </label>
          ))}
        </div>
      </fieldset>
      <input type="hidden" name="discoveredAt" value={new Date().toISOString()} />
      <input type="hidden" name="stillOngoing" value="true" />
      <FormField label={dict.report.name} htmlFor="reporterName" required>
        <Input id="reporterName" name="reporterName" required />
      </FormField>
      <FormField label={dict.report.phone} htmlFor="reporterPhone" required>
        <Input id="reporterPhone" name="reporterPhone" required />
      </FormField>
      <FormField label={dict.report.email} htmlFor="reporterEmail" required>
        <Input id="reporterEmail" name="reporterEmail" type="email" required />
      </FormField>
      {state?.error ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" className="h-12 w-full" disabled={pending}>
        {pending ? dict.report.sending : dict.report.submit}
      </Button>
    </form>
  );
}
