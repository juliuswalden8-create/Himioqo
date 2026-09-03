import { cn } from "@/lib/utils";

export function SegmentedControl({
  name,
  value,
  defaultValue,
  options,
  onChange,
  labelledBy,
  id,
  className,
}: {
  name: string;
  value?: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  labelledBy?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn(
        "grid auto-cols-fr grid-flow-col gap-1 rounded-[12px] border border-field-border bg-ivory p-1",
        className,
      )}
    >
      {options.map((option) => {
        const controlled = value !== undefined;
        return (
          <label
            key={option.value}
            className={cn(
              "relative flex h-12 cursor-pointer items-center justify-center rounded-[10px] px-3 text-center text-[15px] font-medium text-ocean transition-colors duration-200",
              "hover:bg-white/70",
              "has-[:focus-visible]:shadow-field-focus",
              "has-[:checked]:bg-white has-[:checked]:shadow-soft",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              className="sr-only"
              checked={controlled ? value === option.value : undefined}
              defaultChecked={!controlled ? option.value === defaultValue : undefined}
              onChange={onChange ? () => onChange(option.value) : undefined}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
