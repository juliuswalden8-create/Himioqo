"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormError, FormField, NativeCheckbox, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/messages";
import { cleanerStatusAction, recordCleaningMinutesAction, reportCleaningIssueAction } from "@/lib/cleaning-actions";
import type { CleaningStatus } from "@/lib/types";

export function CleanerStatusButtons({
  token,
  jobId,
  current,
  dict,
}: {
  token?: string;
  jobId?: string;
  current: CleaningStatus;
  dict: Dictionary;
}) {
  const [pending, start] = useTransition();
  const options: [CleaningStatus, string][] = [
    ["accepted", dict.cleaning.accept],
    ["in_progress", dict.cleaning.start],
    ["completed", dict.cleaning.done],
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map(([status, label]) => (
        <form
          key={status}
          action={(data) => {
            data.set("token", token ?? "");
            data.set("jobId", jobId ?? "");
            data.set("status", status);
            start(async () => {
              await cleanerStatusAction(data);
            });
          }}
        >
          <Button
            type="submit"
            variant={current === status ? "default" : "secondary"}
            className="h-11 w-full px-2 text-xs"
            disabled={pending}
            aria-pressed={current === status}
          >
            {label}
          </Button>
        </form>
      ))}
    </div>
  );
}

export function CleaningTimeForm({
  token,
  jobId,
  minutes,
  dict,
}: {
  token?: string;
  jobId?: string;
  minutes?: number;
  dict: Dictionary;
}) {
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-4 space-y-3"
      action={(data) => {
        data.set("token", token ?? "");
        data.set("jobId", jobId ?? "");
        start(async () => {
          await recordCleaningMinutesAction(data);
        });
      }}
    >
      <FormField label={dict.cleaning.minutes} htmlFor="cleaning-minutes" hint={dict.cleaning.minutesHelp}>
        <Input
          id="cleaning-minutes"
          name="minutes"
          type="number"
          min={0}
          max={1440}
          step={1}
          defaultValue={minutes?.toString() ?? ""}
          required
        />
      </FormField>
      <Button type="submit" variant="secondary" className="h-11 w-full" disabled={pending}>
        {dict.cleaning.minutesSave}
      </Button>
    </form>
  );
}

export function CleaningIssueForm({
  token,
  jobId,
  dict,
}: {
  token?: string;
  jobId?: string;
  dict: Dictionary;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-3"
      action={(data) => {
        data.set("token", token ?? "");
        data.set("jobId", jobId ?? "");
        setError(null);
        start(async () => {
          const result = await reportCleaningIssueAction(data);
          if (result?.error) setError(dict.errors.generic);
        });
      }}
    >
      <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.issue}</h2>
      <p className="text-xs text-muted-foreground">{dict.cleaning.issueHelp}</p>

      <label htmlFor="issue-kind" className="sr-only">
        {dict.cleaning.issue}
      </label>
      <NativeSelect id="issue-kind" name="kind">
        <option value="damage">{dict.cleaning.damage}</option>
        <option value="missing">{dict.cleaning.missing}</option>
        <option value="repair">{dict.cleaning.repair}</option>
      </NativeSelect>

      <label htmlFor="issue-text" className="sr-only">
        {dict.cleaning.issueHelp}
      </label>
      <Textarea id="issue-text" name="text" required maxLength={2000} rows={3} />

      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-ocean">
        <NativeCheckbox name="convert" defaultChecked />
        {dict.cleaning.convert}
      </label>

      {error ? <FormError>{error}</FormError> : null}

      <Button type="submit" variant="secondary" className="h-11 w-full" disabled={pending}>
        {dict.cleaning.reportIssue}
      </Button>
    </form>
  );
}
