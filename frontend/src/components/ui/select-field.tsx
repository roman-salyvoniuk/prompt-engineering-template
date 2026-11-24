import type * as React from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  active?: boolean;
}

export function SelectField({
  id,
  label,
  active = false,
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className="relative">
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <select
        id={id}
        aria-label={label}
        className={cn(
          "h-9 appearance-none rounded-md border pl-2.5 pr-7 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
          active
            ? "border-primary/60 bg-primary/10 text-foreground"
            : "border-input bg-background text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
