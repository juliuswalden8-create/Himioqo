import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label={searchLabel} htmlFor={`filter-${searchName}`} className="sm:col-span-2">
          <Input
            id={`filter-${searchName}`}
            name={searchName}
            type="search"
            defaultValue={searchValue}
            placeholder={searchPlaceholder}
          />
        </FormField>
        {selects.map((select) => (
          <FormField key={select.name} label={select.label} htmlFor={`filter-${select.name}`}>
            <NativeSelect
              id={`filter-${select.name}`}
              name={select.name}
              defaultValue={select.value}
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
      <div className="mt-4 flex flex-wrap items-center gap-3">
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
