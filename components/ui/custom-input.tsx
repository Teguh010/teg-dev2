import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const inputVariants = cva(
  "w-full bg-background border-default-300 dark:border-700 px-3 h-9 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium read-only:leading-9 read-only:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition duration-300",
  {
    variants: {
      color: {
        default: "border-default-300 text-default-500 focus:outline-none focus:border-primary disabled:bg-default-200 placeholder:text-accent-foreground/50",
        primary: "border-primary text-primary focus:outline-none focus:border-primary-700 disabled:bg-primary/30 disabled:placeholder:text-primary placeholder:text-primary/70",
        info: "border-info/50 text-info focus:outline-none focus:border-info-700 disabled:bg-info/30 disabled:placeholder:text-info placeholder:text-info/70",
        warning: "border-warning/50 text-warning focus:outline-none focus:border-warning-700 disabled:bg-warning/30 disabled:placeholder:text-info placeholder:text-warning/70",
        success: "border-success/50 text-success focus:outline-none focus:border-success-700 disabled:bg-success/30 disabled:placeholder:text-info placeholder:text-success/70",
        destructive: "border-destructive/50 text-destructive focus:outline-none focus:border-destructive-700 disabled:bg-destructive/30 disabled:placeholder:text-destructive placeholder:text-destructive/70",
      },
      variant: {
        flat: "bg-default-100 read-only:bg-default-100",
        underline: "border-b",
        bordered: "border",
        faded: "border border-default-300 bg-default-100",
        ghost: "border-0 focus:border",
        "flat-underline": "bg-default-100 border-b",
      },
      shadow: {
        none: "",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
        xl: "shadow-xl",
        "2xl": "shadow-2xl",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded",
        md: "rounded-lg",
        lg: "rounded-xl",
        xl: "rounded-[20px]",
      },
      size: {
        sm: "h-8 text-xs read-only:leading-8",
        md: "h-9 text-xs read-only:leading-9",
        lg: "h-10 text-sm read-only:leading-10",
        xl: "h-12 text-base read-only:leading-[48px]",
      },
    },
    compoundVariants: [
      // ... compound variants omitted for brevity
    ],
    defaultVariants: {
      color: "default",
      size: "md",
      variant: "bordered",
      radius: "md",
    },
  }
);

// Define the props interface for the Input component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: "sm" | "md" | "lg" | "xl";
  color?: "default" | "primary" | "info" | "warning" | "success" | "destructive";
  variant?: "flat" | "underline" | "bordered" | "faded" | "ghost" | "flat-underline";
  radius?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  removeWrapper?: boolean;
}

// Update Input component with the props interface
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text", // Set a default type
      inputSize = "md", // Default value for inputSize
      color,
      radius,
      variant,
      shadow,
      removeWrapper = false,
      ...props
    },
    ref
  ) => {
    const inputElement = (
      <input
        type={type}
        className={cn(inputVariants({ color, size: inputSize, radius, variant, shadow }), className)}
        ref={ref}
        {...props}
      />
    );

    return removeWrapper ? inputElement : <div className="flex-1 w-full">{inputElement}</div>;
  }
);

Input.displayName = "Input";

export { Input };
