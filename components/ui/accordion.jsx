import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      " shadow-sm dark:shadow-lg py-3.5 px-4 dark:bg-slate-700 rounded-md ",
      className
    )}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef(
  ({ className, children, arrow, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between  font-medium text-sm transition-all  [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        {!arrow && (
          <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200" />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all  text-muted-foreground dark:text-slate-100 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className="pt-3">{children}</div>
    </AccordionPrimitive.Content>
  )
);
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

const AccordionContentWrapper = ({ className = undefined, children = undefined, ...props }) => {
  return (
    <AccordionContent className={className} {...props}>
      {children}
    </AccordionContent>
  );
};

const AccordionItemWrapper = ({ className = undefined, children = undefined, ...props }) => {
  return (
    <AccordionItem className={className} {...props}>
      {children}
    </AccordionItem>
  );
};

const AccordionTriggerWrapper = ({ className = undefined, children = undefined, arrow = undefined, ...props }) => {
  return (
    <AccordionTrigger className={className} arrow={arrow} {...props}>
      {children}
    </AccordionTrigger>
  );
};

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionContentWrapper,
  AccordionItemWrapper,
  AccordionTriggerWrapper
};
