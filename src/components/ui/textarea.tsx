import * as React from "react";
import { fieldControlClass, fieldInvalidClass } from "@/components/ui/field-styles";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    aria-invalid={invalid || undefined}
    className={cn(
      fieldControlClass,
      "h-auto min-h-32 resize-y py-3.5",
      invalid && fieldInvalidClass,
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
