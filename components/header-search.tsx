import React from "react";
import { Dialog, DialogContentWrapper } from "@/components/ui/dialog";

interface HeaderSearchProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const HeaderSearch: React.FC<HeaderSearchProps> = ({ open, setOpen }) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContentWrapper size="xl" className="p-0 " hiddenCloseIcon>
        
      </DialogContentWrapper>
    </Dialog>
  );
};

export default HeaderSearch;
