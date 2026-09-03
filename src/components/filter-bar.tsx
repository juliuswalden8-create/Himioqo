"use client";

import Link from "next/link";
import { useRef } from "react";
import { FormField, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FilterSelect {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}

/**
 * GET form so filters live in the URL. Selects submit immediately; search
 * submits after a short pause so typing is not interrupted.
 */
export function FilterBar({
  action,
  searchName = "q",
  searchLabel,
  searchPlaceholder,
  searchValue,
  selects,
  clearLabel,
  hasFilters,
  columnsClassName,
}: {
  action: string;
  searchName?: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  selects: FilterSelect[];
  applyLabel?: string;
  clearLabel: string;
  hasFilters: boolean;
  columnsClassName?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number | null>(null);

  function submitNow() {
    formRef.current?.requestSubmit();
  }

  function submitSearch() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(submitNow, 350);
  }

  return (
    <form
      ref={formRef}
      action={action}
      method="get"
      className="rounded-2xl border border-border bg-white p-4 shadow-soft"
    >
      <button type="submit" className="sr-only">
        {searchLabel}
      </button>
      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end",
          columnsClassName,
        )}
      >
        <FormField label={searchLabel} htmlFor={`filter-${searchName}`} className="space-y-1.5">
          <Input
            id={`filter-${searchName}`}
            name={searchName}
            type="search"
            defaultValue={searchValue}
            placeholder={searchPlaceholder}
            className="h-11"
            onChange={submitSearch}
          />
        </FormField>
        {selects.map((select) => (
          <FormField
            key={select.name}
            label={select.label}
            htmlFor={`filter-${select.name}`}
            className="space-y-1.5"
          >
            <NativeSelect
              id={`filter-${select.name}`}
              name={select.name}
              defaultValue={select.value}
              className="h-11"
              onChange={submitNow}
            >
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        ))}
      </div>
      {hasFilters ? (
        <div className="mt-3">
          <Link href={action} className="text-sm font-medium text-navy-700 underline">
            {clearLabel}
          </Link>
        </div>
      ) : null}
    </form>
  );
}
