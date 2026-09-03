"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";
import { addCleaningPhotosAction } from "@/lib/cleaning-actions";
import { fileToDataUrl } from "@/lib/utils";
import { MAX_PHOTOS } from "@/lib/constants";

export function CleaningPhotoUpload({
  token,
  dict,
}: {
  token: string;
  dict: Dictionary;
}) {
  const [kind, setKind] = useState<"before" | "after">("after");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const input = form.elements.namedItem("files") as HTMLInputElement;
        const files = [...(input.files ?? [])].slice(0, MAX_PHOTOS);
        if (!files.length) return;
        setPending(true);
        const photos = await Promise.all(
          files.map(async (file) => ({ url: await fileToDataUrl(file) })),
        );
        const data = new FormData();
        data.set("token", token);
        data.set("kind", kind);
        data.set("photos", JSON.stringify(photos));
        await addCleaningPhotosAction(data);
        input.value = "";
        setPending(false);
      }}
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setKind("before")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            kind === "before" ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-700"
          }`}
        >
          {dict.dashboard.before}
        </button>
        <button
          type="button"
          onClick={() => setKind("after")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            kind === "after" ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-700"
          }`}
        >
          {dict.dashboard.after}
        </button>
      </div>
      <input
        name="files"
        type="file"
        accept="image/*"
        multiple
        className="block w-full text-sm text-muted-foreground"
      />
      <Button type="submit" variant="secondary" disabled={pending}>
        {dict.cleaning.upload}
      </Button>
    </form>
  );
}
