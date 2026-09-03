import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-ocean text-white hover:bg-ocean-hover shadow-soft",
        cta: "bg-terracotta text-white hover:bg-terracotta-hover shadow-soft",
        secondary:
          "bg-white text-ocean border border-ocean/20 hover:bg-sage shadow-soft",
        outline:
          "border border-ocean bg-white/80 text-ocean hover:bg-sage hover:border-ocean",
        ghost: "text-ocean hover:bg-sage",
        success: "bg-green-500 text-white hover:bg-green-600 shadow-soft",
        link: "text-terracotta underline-offset-4 hover:underline hover:text-terracotta-hover px-0",
        destructive: "bg-destructive text-white hover:bg-red-700",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-xs rounded-lg",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
