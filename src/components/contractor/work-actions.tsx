"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/messages";
import { MAX_PHOTOS } from "@/lib/constants";
import {
  contractorMessageAction,
  contractorPhotosAction,
  contractorRespondAction,
  contractorStatusAction,
} from "@/lib/contractor-actions";
import type { CaseStatus } from "@/lib/types";
import { checkFiles } from "@/lib/uploads";
import { fileToDataUrl } from "@/lib/utils";

function useActionError(dict: Dictionary) {
  const [error, setError] = useState<string | null>(null);
  const show = (reason?: string) => {
    if (!reason) return setError(null);
    if (reason === "type") return setError(dict.errors.photoType);
    if (reason === "size") return setError(dict.errors.photoSize);
    if (reason === "count") return setError(dict.errors.photoCount);
    setError(dict.errors.generic);
  };
  return { error, show };
}

export function RespondButtons({
  token,
  caseId,
  dict,
}: {
  token?: string;
  caseId?: string;
  dict: Dictionary;
}) {
  const [declining, setDeclining] = useState(false);
  const [pending, start] = useTransition();

  if (declining) {
    return (
      <form
        className="space-y-3"
        action={(data) => {
          data.set("token", token ?? "");
          data.set("caseId", caseId ?? "");
          data.set("accept", "0");
          start(async () => {
            await contractorRespondAction(data);
          });
        }}
      >
        <FormField label={dict.contractor.declineReason} htmlFor="decline-reason">
          <Textarea id="decline-reason" name="reason" rows={3} maxLength={500} />
        </FormField>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="secondary" disabled={pending}>
            {dict.contractor.declineSubmit}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setDeclining(false)}>
            {dict.filters.clear}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <form
        className="sm:flex-1"
        action={(data) => {
          data.set("token", token ?? "");
          data.set("caseId", caseId ?? "");
          data.set("accept", "1");
          start(async () => {
            await contractorRespondAction(data);
          });
        }}
      >
        <Button type="submit" className="h-12 w-full" disabled={pending}>
          {dict.contractor.accept}
        </Button>
      </form>
      <Button
        type="button"
        variant="secondary"
        className="h-12 sm:flex-1"
        onClick={() => setDeclining(true)}
      >
        {dict.contractor.decline}
      </Button>
    </div>
  );
}

export function StatusButtons({
  token,
  caseId,
  current,
  dict,
}: {
  token?: string;
  caseId?: string;
  current: CaseStatus;
  dict: Dictionary;
}) {
  const [pending, start] = useTransition();
  const options: { status: CaseStatus; label: string }[] = [
    { status: "in_progress", label: dict.contractor.start },
    { status: "waiting", label: dict.contractor.pause },
    { status: "resolved", label: dict.contractor.complete },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <form
          key={option.status}
          action={(data) => {
            data.set("token", token ?? "");
            data.set("caseId", caseId ?? "");
            data.set("status", option.status);
            start(async () => {
              await contractorStatusAction(data);
            });
          }}
        >
          <Button
            type="submit"
            variant={current === option.status ? "default" : "secondary"}
            className="h-12 w-full"
            disabled={pending}
            aria-pressed={current === option.status}
          >
            {option.label}
          </Button>
        </form>
      ))}
    </div>
  );
}

export function WorkPhotoUpload({
  token,
  caseId,
  kind,
  label,
  dict,
}: {
  token?: string;
  caseId?: string;
  kind: "before" | "after";
  label: string;
  dict: Dictionary;
}) {
  const [pending, setPending] = useState(false);
  const { error, show } = useActionError(dict);
  const inputId = `work-photos-${kind}`;

  return (
    <form
      className="space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const input = form.elements.namedItem("files") as HTMLInputElement;
        const files = [...(input.files ?? [])];
        if (!files.length) return;
        if (files.length > MAX_PHOTOS) return show("count");
        const check = checkFiles(files);
        if (!check.ok) return show(check.reason);

        show(undefined);
        setPending(true);
        try {
          const photos = await Promise.all(
            files.map(async (file) => ({ url: await fileToDataUrl(file) })),
          );
          const data = new FormData();
          data.set("token", token ?? "");
          data.set("caseId", caseId ?? "");
          data.set("kind", kind);
          data.set("photos", JSON.stringify(photos));
          const result = await contractorPhotosAction(data);
          if (result?.error) show(result.error);
          else input.value = "";
        } finally {
          setPending(false);
        }
      }}
    >
      <label htmlFor={inputId} className="block text-[15px] font-medium text-ocean">
        {label}
      </label>
      <Input
        id={inputId}
        name="files"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
      />
      <p className="text-xs text-muted-foreground">{dict.contractor.uploadHelp}</p>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? dict.report.sending : dict.contractor.upload}
      </Button>
    </form>
  );
}

export function WorkMessageForm({
  token,
  caseId,
  locale,
  dict,
}: {
  token?: string;
  caseId?: string;
  locale: string;
  dict: Dictionary;
}) {
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-2"
      action={(data) => {
        data.set("token", token ?? "");
        data.set("caseId", caseId ?? "");
        data.set("locale", locale);
        start(async () => {
          await contractorMessageAction(data);
        });
      }}
    >
      <FormField label={dict.contractor.messagePlaceholder} htmlFor="work-message" required>
        <Textarea
          id="work-message"
          name="text"
          required
          maxLength={2000}
          rows={3}
        />
      </FormField>
      <Button type="submit" disabled={pending}>
        {dict.contractor.send}
      </Button>
    </form>
  );
}
