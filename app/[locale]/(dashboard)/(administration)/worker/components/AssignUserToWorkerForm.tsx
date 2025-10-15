import { useState } from "react";
import { Button } from "@/components/ui/button";
import DynamicInput from "@/app/[locale]/(dashboard)/(reports)/map-route/components/input-form/custom-input2";
import SearchableSelect from '@/components/ui/searchable-select';
import DatePickerSingle from "@/components/date-picker-single";
import toast from "react-hot-toast";
import type { CreateAndAssignUserPayload } from "@/models/workers";

interface Props {
  workerId: number;
  onSubmit: (data: CreateAndAssignUserPayload) => void;
  loading?: boolean;
  userTypes?: { value: number; label: string }[];
  objectOptions?: { value: number; label: string }[];
  objectGroupOptions?: { value: number; label: string }[];
}

type FormState = Omit<CreateAndAssignUserPayload, "worker_id">;

export default function AssignUserToWorkerForm({ workerId, onSubmit, loading, userTypes = [], objectOptions = [], objectGroupOptions = [] }: Props) {
  const [form, setForm] = useState<FormState>({
    user_name: "",
    user_password: "",
    user_type: userTypes.length > 0 ? userTypes[0].value : 4,
    user_expire: "",
    user_data_age_limit: undefined,
    all_objects_visible: false,
    visible_objects: [],
    visible_object_groups: [],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.user_name) newErrors.user_name = "User name is required";
    if (!form.user_password) newErrors.user_password = "Password is required";
    if (!form.user_type) newErrors.user_type = "User type is required";
    return newErrors;
  };

  const handleChange = (name: keyof FormState, value: string | number | boolean | undefined | string[] | number[]) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (value) delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill all required fields.");
      return;
    }
    onSubmit({ worker_id: workerId, ...form });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
      <DynamicInput label="User Name *" value={form.user_name} onChange={v => handleChange("user_name", v)} type="text" placeholder="User name" />
      {errors.user_name && <span className="text-xs text-red-500">{errors.user_name}</span>}
      <DynamicInput label="Password *" value={form.user_password} onChange={v => handleChange("user_password", v)} type="text" placeholder="Password" />
      {errors.user_password && <span className="text-xs text-red-500">{errors.user_password}</span>}
      <SearchableSelect
        label="User Type *"
        value={String(form.user_type)}
        onChange={v => handleChange("user_type", Number(v))}
        options={userTypes}
        placeholder="Select user type"
      />
      {errors.user_type && <span className="text-xs text-red-500">{errors.user_type}</span>}
      <label className="block text-sm font-medium text-gray-500 mb-1">User Expire</label>
      <DatePickerSingle
        value={form.user_expire}
        onChange={date => handleChange("user_expire", date ? date.toISOString() : "")}
        minDate={new Date()}
      />
      <DynamicInput label="Data Age Limit (days)" value={form.user_data_age_limit || ""} onChange={v => handleChange("user_data_age_limit", v === "" ? undefined : Number(v))} type="number" placeholder="Data age limit in days" />
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="all_objects_visible" checked={form.all_objects_visible === true} onChange={e => handleChange("all_objects_visible", e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
        <label htmlFor="all_objects_visible" className="text-sm font-medium text-gray-700">All Objects Visible</label>
      </div>
      <SearchableSelect
        label="Visible Objects"
        value={form.visible_objects.map(String)}
        onChange={v => handleChange("visible_objects", Array.isArray(v) ? v.map(Number) : [])}
        options={objectOptions}
        placeholder={objectOptions.length === 0 ? "Loading..." : "Select visible objects (optional)"}
        disabled={objectOptions.length === 0}
      />
      <SearchableSelect
        label="Visible Object Groups"
        value={form.visible_object_groups.map(String)}
        onChange={v => handleChange("visible_object_groups", Array.isArray(v) ? v.map(Number) : [])}
        options={objectGroupOptions}
        placeholder={objectGroupOptions.length === 0 ? "Loading..." : "Select visible object groups (optional)"}
        disabled={objectGroupOptions.length === 0}
      />
      <Button type="submit" disabled={loading}>{loading ? "Assigning..." : "Assign User"}</Button>
    </form>
  );
} 