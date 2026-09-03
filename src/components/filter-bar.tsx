import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FilterSelect {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}

/**
 * Plain GET form, so filters live in the URL, survive a reload, can be shared
 * and work with JavaScript disabled.
 */
export function FilterBar({
  action,
  searchName = "q",
  searchLabel,
  searchPlaceholder,
  searchValue,
  selects,
  applyLabel,
  clearLabel,
  hasFilters,
}: {
  action: string;
  searchName?: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  selects: FilterSelect[];
  applyLabel: string;
  clearLabel: string;
  hasFilters: boolean;
}) {
  return (
    <form
      action={action}
      method="get"
      className="rounded-2xl border border-border bg-white p-4 shadow-soft"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`filter-${searchName}`}>{searchLabel}</Label>
          <Input
            id={`filter-${searchName}`}
            name={searchName}
            type="search"
            defaultValue={searchValue}
            placeholder={searchPlaceholder}
          />
        </div>
        {selects.map((select) => (
          <div key={select.name} className="space-y-1.5">
            <Label htmlFor={`filter-${select.name}`}>{select.label}</Label>
            <select
              id={`filter-${select.name}`}
              name={select.name}
              defaultValue={select.value}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary">
          {applyLabel}
        </Button>
        {hasFilters ? (
          <Link href={action} className="text-sm font-medium text-navy-700 underline">
            {clearLabel}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
