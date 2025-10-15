import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/custom-dialog';
import { Button } from '@/components/ui/button';

interface ReusableDialogProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel?: string;
  dialogTitle?: string; // Make dialogTitle optional
  children: ReactNode;
  footerButtons?: Array<{ // Make footerButtons optional
    label: string;
    variant?: 'outline' | 'solid';
    action?: () => void;
    type?: 'button' | 'submit';
  }>;
}

const ReusableDialog: React.FC<ReusableDialogProps> = ({
  isOpen,
  onOpenChange,
  triggerLabel,
  dialogTitle,
  children,
  footerButtons,
}) => {
    const handleCloseAutoFocus = (event) => {
    event.preventDefault();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="md" className="h-9 w-[100%] mt-2">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="px-0"
        size="2xl"
        onCloseAutoFocus={handleCloseAutoFocus}
        hiddenCloseIcon={true}
      >
        {dialogTitle && <DialogHeader className=''>{dialogTitle}</DialogHeader>} {/* Conditionally render header */}
        
        <div className="p-4">
          {children}
        </div>

        {footerButtons && footerButtons.length > 0 && ( /* Conditionally render footer */
          <DialogFooter className="gap-2 pr-4 ">
            {footerButtons.map((button, index) => (
              <Button
                key={index}
                variant='outline'
                onClick={button.action}
                type={button.type || 'button'}
              >
                {button.label}
              </Button>
            ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReusableDialog;
