import * as React from "react";
import { fieldControlClass, fieldInvalidClass, fileFieldClass } from "@/components/ui/field-styles";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { invalid?: boolean }
>(({ className, type, invalid, ...props }, ref) => (
  <input
    type={type}
    aria-invalid={invalid || undefined}
    className={cn(
      fieldControlClass,
      type === "file" && fileFieldClass,
      invalid && fieldInvalidClass,
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
