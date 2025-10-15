"use client";
import { Button } from "@/components/ui/button";
import { Icon } from '@iconify/react';

interface SaveButtonProps {
  isSaving: boolean;
  onSave: () => void;
  t: (key: string) => string;
}

const SaveButton = ({ isSaving, onSave, t }: SaveButtonProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={onSave}
        disabled={isSaving}
        className="shadow-lg capitalize"
      >
        <Icon icon="material-symbols:save-outline" className="w-5 h-5 pr-1" />
        {isSaving ? t('saving') : t('general.save')} save and update
      </Button>
    </div>
  );
};

export default SaveButton;