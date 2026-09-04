"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormField, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/messages";
import {
  addCaseNoteAction,
  assignContractorAction,
  changePriorityAction,
  changeStatusAction,
  rotateWorkTokenAction,
  saveCaseDetailsAction,
} from "@/lib/actions";
import { priorityLabel, statusLabel } from "@/lib/labels";
import { CASE_PRIORITIES, CASE_STATUSES } from "@/lib/types";
import type { CasePriority, CaseStatus, Contractor } from "@/lib/types";

export function TriagePanel({
  caseId,
  status,
  priority,
  contractorId,
  instructions,
  dueAt,
  costEstimate,
  contractors,
  dict,
}: {
  caseId: string;
  status: CaseStatus;
  priority: CasePriority;
  contractorId?: string;
  instructions?: string;
  dueAt?: string;
  costEstimate?: number;
  contractors: Pick<Contractor, "id" | "name" | "trade">[];
  dict: Dictionary;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-5">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <form
          className="space-y-2"
          action={(data) => {
            data.set("caseId", caseId);
            start(async () => {
              await changeStatusAction(data);
            });
          }}
        >
          <FormField label={dict.caseDetail.status} htmlFor="case-status">
            <NativeSelect
              id="case-status"
              name="status"
              defaultValue={status}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {CASE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(dict, value)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <noscript>
            <Button type="submit" variant="secondary" className="mt-1">
              {dict.caseDetail.update}
            </Button>
          </noscript>
        </form>

        <form
          className="space-y-2"
          action={(data) => {
            data.set("caseId", caseId);
            start(async () => {
              await changePriorityAction(data);
            });
          }}
        >
          <FormField label={dict.caseDetail.priority} htmlFor="case-priority">
            <NativeSelect
              id="case-priority"
              name="priority"
              defaultValue={priority}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {CASE_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {priorityLabel(dict, value)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <noscript>
            <Button type="submit" variant="secondary" className="mt-1">
              {dict.caseDetail.update}
            </Button>
          </noscript>
        </form>
      </div>

      <form
        className="space-y-5 border-t border-border pt-4"
        action={(data) => {
          data.set("caseId", caseId);
          start(async () => {
            await saveCaseDetailsAction(data);
          });
        }}
      >
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <FormField label={dict.caseDetail.due} htmlFor="case-due">
            <Input
              id="case-due"
              name="dueAt"
              type="datetime-local"
              defaultValue={dueAt ? dueAt.slice(0, 16) : ""}
            />
          </FormField>
          <FormField label={dict.caseDetail.cost} htmlFor="case-cost" hint={dict.caseDetail.costHelp}>
            <Input
              id="case-cost"
              name="costEstimate"
              type="number"
              min={0}
              step={1}
              defaultValue={costEstimate?.toString() ?? ""}
            />
          </FormField>
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {dict.caseDetail.saveDetails}
        </Button>
      </form>

      <form
        className="space-y-5 border-t border-border pt-4"
        action={(data) => {
          data.set("caseId", caseId);
          start(async () => {
            await assignContractorAction(data);
          });
        }}
      >
        <FormField label={dict.caseDetail.contractor} htmlFor="case-contractor">
          <NativeSelect
            id="case-contractor"
            name="contractorId"
            defaultValue={contractorId ?? ""}
          >
            <option value="">{dict.caseDetail.noContractor}</option>
            {contractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>
                {contractor.name} · {contractor.trade}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField
          label={dict.caseDetail.instructions}
          htmlFor="case-instructions"
          hint={dict.caseDetail.instructionsHelp}
        >
          <Textarea
            id="case-instructions"
            name="instructions"
            rows={3}
            maxLength={2000}
            defaultValue={instructions ?? ""}
          />
        </FormField>
        <Button type="submit" disabled={pending}>
          {dict.caseDetail.assign}
        </Button>
      </form>
    </div>
  );
}

export function WorkLinkPanel({
  caseId,
  url,
  dict,
}: {
  caseId: string;
  url: string;
  dict: Dictionary;
}) {
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-navy-800">{dict.caseDetail.workLink}</p>
      <p className="text-xs text-muted-foreground">{dict.caseDetail.workLinkHelp}</p>
      <p className="overflow-x-auto rounded-xl bg-canvas px-3 py-2 font-mono text-xs text-navy-700">
        {url}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="text-sm font-medium text-navy-700 underline"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
        >
          {copied ? dict.caseDetail.copied : dict.caseDetail.copyLink}
        </button>
        <form
          action={(data) => {
            data.set("caseId", caseId);
            setCopied(false);
            start(async () => {
              await rotateWorkTokenAction(data);
            });
          }}
        >
          <button
            type="submit"
            className="text-sm font-medium text-destructive underline"
            disabled={pending}
          >
            {dict.caseDetail.rotate}
          </button>
        </form>
      </div>
    </div>
  );
}

export function NotesPanel({
  caseId,
  notes,
  dict,
}: {
  caseId: string;
  notes: { id: string; authorName: string; text: string; createdAt: string }[];
  dict: Dictionary;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-navy-800">{dict.caseDetail.notes}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{dict.caseDetail.notesHelp}</p>
      </div>
      {notes.length ? (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl bg-canvas px-3 py-2">
              <p className="text-xs font-medium text-navy-700">{note.authorName}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-navy-700">{note.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{dict.caseDetail.noNotes}</p>
      )}
      <form
        className="space-y-2"
        action={(data) => {
          data.set("caseId", caseId);
          start(async () => {
            await addCaseNoteAction(data);
          });
        }}
      >
        <label htmlFor="case-note" className="sr-only">
          {dict.caseDetail.notePlaceholder}
        </label>
        <Textarea
          id="case-note"
          name="text"
          required
          rows={3}
          maxLength={2000}
          placeholder={dict.caseDetail.notePlaceholder}
        />
        <Button type="submit" variant="secondary" disabled={pending}>
          {dict.caseDetail.addNote}
        </Button>
      </form>
    </div>
  );
}
