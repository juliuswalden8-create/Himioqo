"use client";

import { Toaster as Sonner } from "sonner";

function Toaster() {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-white text-navy-700 border-border shadow-lift rounded-xl",
          description: "text-muted-foreground",
          actionButton: "bg-navy-700 text-white",
          cancelButton: "bg-muted text-navy-700",
        },
      }}
    />
  );
}

export { Toaster };
