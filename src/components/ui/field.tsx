import { AlertCircle, ChevronDown } from "lucide-react";
import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Label } from "@/components/ui/label";
import { fieldControlClass, fieldInvalidClass, fileFieldClass } from "@/components/ui/field-styles";
import { cn } from "@/lib/utils";

export { fieldControlClass, fieldInvalidClass, fileFieldClass };

export function FormGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-x-6 gap-y-5 sm:grid-cols-2", className)}>{children}</div>
  );
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>, {
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span
            className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-terracotta/70 align-middle"
            aria-hidden
          />
        ) : null}
      </Label>
      {control}
      {hint && !error ? (
        <p id={hintId} className="text-sm text-muted-green">
          {hint}
        </p>
      ) : null}
      {error ? <FormError id={errorId}>{error}</FormError> : null}
    </div>
  );
}

export function FormError({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      id={id}
      role="alert"
      className={cn("flex items-start gap-1.5 text-sm text-destructive", className)}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function NativeSelect({
  className,
  invalid,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <div className="relative w-full">
      <select
        aria-invalid={invalid || undefined}
          className={cn(
            fieldControlClass,
            "hq-select cursor-pointer appearance-none pr-11",
            invalid && fieldInvalidClass,
            className,
          )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ocean"
        strokeWidth={1.85}
        aria-hidden
      />
    </div>
  );
}

export function NativeCheckbox({
  className,
  ...props
}: ComponentProps<"input">) {
  return <input type="checkbox" className={cn("hq-checkbox", className)} {...props} />;
}

export function NativeRadio({
  className,
  ...props
}: ComponentProps<"input">) {
  return <input type="radio" className={cn("hq-radio", className)} {...props} />;
}
