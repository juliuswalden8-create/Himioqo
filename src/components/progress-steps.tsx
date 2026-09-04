import { cn } from "@/lib/utils";

export function ProgressSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, minmax(0, 1fr))` }}
    >
      {steps.map((label, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <li key={`${index}-${label}`} className="min-w-0">
            <div
              className={cn(
                "h-1 rounded-full",
                done || active ? "bg-navy-800" : "bg-navy-100",
              )}
            />
            <p
              className={cn(
                "mt-2 truncate text-xs",
                active ? "font-medium text-navy-800" : "text-muted-foreground",
              )}
            >
              {index + 1}. {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
