"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
      <SegmentedControl
        name="photoKind"
        value={kind}
        onChange={(value) => setKind(value === "before" ? "before" : "after")}
        options={[
          { value: "before", label: dict.dashboard.before },
          { value: "after", label: dict.dashboard.after },
        ]}
      />
      <Input name="files" type="file" accept="image/*" multiple />
      <Button type="submit" variant="secondary" disabled={pending}>
        {dict.cleaning.upload}
      </Button>
    </form>
  );
}
