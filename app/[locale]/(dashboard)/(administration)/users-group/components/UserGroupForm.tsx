"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import DynamicInput from '@/app/[locale]/(dashboard)/(reports)/map-route/components/input-form/custom-input2';
import { useRouter } from "next/navigation";

interface UserGroupFormProps {
  onSubmit: (data: { name: string }) => void;
  initialData?: { name: string };
  isEdit?: boolean;
}

export default function UserGroupForm({ onSubmit, initialData, isEdit = false }: UserGroupFormProps) {
  const [form, setForm] = useState<{ name: string }>(initialData || { name: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label className="block font-medium mb-1">Group Name *</label>
        <DynamicInput
          label=""
          value={form.name}
          onChange={(v) => {
            setForm({ ...form, name: typeof v === 'string' ? v : String(v) });
            setError(null);
          }}
          type="text"
          placeholder="Enter group name"
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
         <div className='flex w-full gap-4 mt-4'>
         <Button type="submit" disabled={submitting} className='w-full' color='primary'>
        {isEdit ? "Update Group" : "Create Group"}
      </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.back();
                }}
                className='w-full'
                variant='outline'
                color='destructive'
              >
                Cancel
              </Button>
            </div>
    </form>
  );
}