import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Define types for DialogProps
interface DialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {}
interface DialogTriggerProps extends React.ComponentProps<typeof DialogPrimitive.Trigger> {}
interface DialogOverlayProps extends React.ComponentProps<typeof DialogPrimitive.Overlay> {
  className?: string;
}
interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full"; // Restrict to allowed size values
  overlayClass?: string;
  overlayScroll?: boolean;
  hiddenCloseIcon?: boolean;
}

interface DialogHeaderProps extends React.ComponentProps<"div"> {}
interface DialogFooterProps extends React.ComponentProps<"div"> {}
interface DialogTitleProps extends React.ComponentProps<typeof DialogPrimitive.Title> {}
interface DialogDescriptionProps extends React.ComponentProps<typeof DialogPrimitive.Description> {}
interface DialogContentWrapperProps extends DialogContentProps {
  children: React.ReactNode;
}

// Define dialog variants
const dialogVariants = cva(
  "fixed left-1/2 top-1/2 z-[9999] grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg grid gap-4",
  {
    variants: {
      size: {
        xs: "md:max-w-[332px] w-[90%]",
        sm: "md:max-w-[384px] w-[90%]",
        md: "md:max-w-[444px] w-[90%]",
        lg: "md:max-w-[536px] w-[90%]",
        xl: "md:max-w-[628px] w-[90%]",
        "2xl": "md:max-w-[720px] w-[90%]",
        "3xl": "md:max-w-[812px] w-[90%]",
        "4xl": "md:max-w-[904px] w-[90%]",
        "5xl": "md:max-w-[996px] w-[90%]",
        full: "h-screen max-w-full",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// Component Definitions
const Dialog: React.FC<DialogProps> = DialogPrimitive.Root;

const DialogTrigger: React.FC<DialogTriggerProps> = DialogPrimitive.Trigger;

const DialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DialogPrimitive.Portal>
    {children}
  </DialogPrimitive.Portal>
);

const DialogClose: React.FC<React.ComponentProps<typeof DialogPrimitive.Close>> = ({ children, ...props }) => (
  <DialogPrimitive.Close {...props}>
    {children}
  </DialogPrimitive.Close>
);

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed z-[999] inset-0 bg-black/50 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      className,
      children,
      size,
      overlayClass,
      overlayScroll = false,
      hiddenCloseIcon = false,
      ...props
    },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay className={overlayClass} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogVariants({ size }), className)}
        {...props}
      >
        {children}
        {!hiddenCloseIcon && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = DialogPrimitive.Content.displayName;


const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children, ...props }) => (
  <div
    className={cn(
      "flex justify-between items-center relative px-4 py-0", // Adjusted layout
      className
    )}
    {...props}
  >
    <div className="flex items-center space-x-2">

      <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
        {children}
      </DialogTitle>
    </div>

    <DialogPrimitive.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  </div>
);

DialogHeader.displayName = "DialogHeader";

const DialogFooter: React.FC<DialogFooterProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<HTMLDivElement, DialogTitleProps>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogContentWrapper: React.FC<DialogContentWrapperProps> = ({
  size = undefined,
  className = undefined,
  hiddenCloseIcon = undefined,
  children = undefined,
  ...props
}) => {
  return (
    <DialogContent size={size} className={className} hiddenCloseIcon={hiddenCloseIcon} {...props}>
      {children}
    </DialogContent>
  );
};

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogContentWrapper,
};
