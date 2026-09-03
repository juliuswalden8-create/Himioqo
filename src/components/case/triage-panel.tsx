"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/messages";
import {
  addCaseNoteAction,
  assignContractorAction,
  changePriorityAction,
  changeStatusAction,
  rotateWorkTokenAction,
} from "@/lib/actions";
import { priorityLabel, statusLabel } from "@/lib/labels";
import { CASE_PRIORITIES, CASE_STATUSES } from "@/lib/types";
import type { CasePriority, CaseStatus, Contractor } from "@/lib/types";

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TriagePanel({
  caseId,
  status,
  priority,
  contractorId,
  instructions,
  contractors,
  dict,
}: {
  caseId: string;
  status: CaseStatus;
  priority: CasePriority;
  contractorId?: string;
  instructions?: string;
  contractors: Pick<Contractor, "id" | "name" | "trade">[];
  dict: Dictionary;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <form
          className="space-y-1.5"
          action={(data) => {
            data.set("caseId", caseId);
            start(async () => {
              await changeStatusAction(data);
            });
          }}
        >
          <label htmlFor="case-status" className="block text-sm font-medium text-navy-800">
            {dict.caseDetail.status}
          </label>
          <select
            id="case-status"
            name="status"
            defaultValue={status}
            className={selectClass}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            {CASE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(dict, value)}
              </option>
            ))}
          </select>
          <noscript>
            <Button type="submit" variant="secondary" className="mt-1">
              {dict.caseDetail.update}
            </Button>
          </noscript>
        </form>

        <form
          className="space-y-1.5"
          action={(data) => {
            data.set("caseId", caseId);
            start(async () => {
              await changePriorityAction(data);
            });
          }}
        >
          <label htmlFor="case-priority" className="block text-sm font-medium text-navy-800">
            {dict.caseDetail.priority}
          </label>
          <select
            id="case-priority"
            name="priority"
            defaultValue={priority}
            className={selectClass}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            {CASE_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {priorityLabel(dict, value)}
              </option>
            ))}
          </select>
          <noscript>
            <Button type="submit" variant="secondary" className="mt-1">
              {dict.caseDetail.update}
            </Button>
          </noscript>
        </form>
      </div>

      <form
        className="space-y-2 border-t border-border pt-4"
        action={(data) => {
          data.set("caseId", caseId);
          start(async () => {
            await assignContractorAction(data);
          });
        }}
      >
        <label htmlFor="case-contractor" className="block text-sm font-medium text-navy-800">
          {dict.caseDetail.contractor}
        </label>
        <select
          id="case-contractor"
          name="contractorId"
          defaultValue={contractorId ?? ""}
          className={selectClass}
        >
          <option value="">{dict.caseDetail.noContractor}</option>
          {contractors.map((contractor) => (
            <option key={contractor.id} value={contractor.id}>
              {contractor.name} · {contractor.trade}
            </option>
          ))}
        </select>

        <label htmlFor="case-instructions" className="block text-sm font-medium text-navy-800">
          {dict.caseDetail.instructions}
        </label>
        <Textarea
          id="case-instructions"
          name="instructions"
          rows={3}
          maxLength={2000}
          defaultValue={instructions ?? ""}
          aria-describedby="case-instructions-help"
        />
        <p id="case-instructions-help" className="text-xs text-muted-foreground">
          {dict.caseDetail.instructionsHelp}
        </p>
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
