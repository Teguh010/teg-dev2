"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DynamicInput from "@/app/[locale]/(dashboard)/(reports)/map-route/components/input-form/custom-input2";
import DatePickerSingle from "@/components/date-picker-single";
import { useUser } from "@/context/UserContext";
import { objectList } from "@/models/object";
import { objectGroupList } from "@/models/object_group";
import MultiSelect from "@/app/[locale]/(dashboard)/(administration)/worker/components/MultiSelect";
import SearchableSelect from "@/components/ui/searchable-select";
import { getUserTypesList } from "@/models/users";
import { useRouter } from "next/navigation";

interface UserFormData {
  user_name: string
  user_password: string
  user_type: number
  user_expire: string
  user_data_age_limit?: number
  all_objects_visible: boolean
  visible_objects: number[]
  visible_object_groups: number[]
  worker_id?: number // Tambahan untuk assign to worker
}

interface UserFormProps {
  onSubmit: (data: UserFormData) => void
  initialData?: UserFormData
  isEdit?: boolean
  workers?: { id: number; name: string; surname: string }[] // name should be string
  isAssignToWorker?: boolean // Tambahan
}

const defaultUser: UserFormData = {
  user_name: "",
  user_password: "",
  user_type: 1,
  user_expire: "",
  user_data_age_limit: undefined,
  all_objects_visible: false,
  visible_objects: [],
  visible_object_groups: []
};

export default function UserForm({
  onSubmit,
  initialData,
  isEdit = false,
  workers = [],
  isAssignToWorker = false
}: UserFormProps) {
  const [form, setForm] = useState<UserFormData>(initialData || defaultUser);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [objects, setObjects] = useState<{ id: number; name: string }[]>([]);
  const [objectGroups, setObjectGroups] = useState<{ id: number; val: string }[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [userTypes, setUserTypes] = useState<{ id: number; val: string }[]>([]);
  const [loadingUserTypes, setLoadingUserTypes] = useState(false);
  const router = useRouter();

  const UserContext = useUser();
  const token = UserContext.operations.getUserRef()?.token || null;

  useEffect(() => {
    if (!token) return;
    setLoadingObjects(true);
    objectList(token)
      .then((data: any) => {
        if (Array.isArray(data)) setObjects(data);
        else setObjects([]);
      })
      .catch(() => setObjects([]))
      .finally(() => setLoadingObjects(false));
    setLoadingGroups(true);
    objectGroupList(token)
      .then((data: { id: number; val: string }[]) => {
        if (Array.isArray(data)) setObjectGroups(data);
        else setObjectGroups([]);
      })
      .catch(() => setObjectGroups([]))
      .finally(() => setLoadingGroups(false));
    setLoadingUserTypes(true);
    getUserTypesList(token)
      .then((data) => {
        if (Array.isArray(data)) setUserTypes(data);
        else setUserTypes([]);
      })
      .catch(() => setUserTypes([]))
      .finally(() => setLoadingUserTypes(false));
  }, [token]);

  const handleChange = (name: keyof UserFormData, value: string | number | boolean | number[]) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (value) delete newErrors[name];
      return newErrors;
    });
  };

  // Update validate function to require username starts with a letter
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (isAssignToWorker && !form.worker_id) newErrors.worker_id = "Worker is required";
    if (!form.user_name.trim()) newErrors.user_name = "User name is required";
    else if (!/^[a-z][a-z0-9_]*$/.test(form.user_name))
      newErrors.user_name =
        "User name must start with a letter and contain only lowercase letters, numbers, and underscores";
    if (!isEdit && !form.user_password.trim()) newErrors.user_password = "Password is required";
    if (!form.user_type) newErrors.user_type = "User type is required";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSubmitting(true);
    try {
      // Hapus field kosong dari payload
      let submitForm = { ...form };
      Object.keys(submitForm).forEach((key) => {
        const value = submitForm[key as keyof typeof submitForm];
        if (
          value === '' ||
          value === undefined ||
          (Array.isArray(value) && value.length === 0)
        ) {
          delete submitForm[key as keyof typeof submitForm];
        }
      });
      if (isAssignToWorker) {
        await (onSubmit as any)({ ...submitForm, worker_id: form.worker_id! });
      } else {
        await onSubmit(submitForm);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='w-full'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <div className='flex flex-col gap-4'>
          {(isAssignToWorker || (isEdit && workers.length > 0)) && (
            <div>
              <SearchableSelect
                label='Worker'
                value={
                  form.worker_id !== undefined && form.worker_id !== null
                    ? String(form.worker_id)
                    : ""
                }
                onChange={(v) => handleChange("worker_id", v ? Number(v) : undefined)}
                options={workers.map((w) => ({
                  value: String(w.id),
                  label: `${w.name} ${w.surname}`
                }))}
                placeholder='Select worker'
                disabled={submitting}
              />
              {errors.worker_id && <span className='text-xs text-red-500'>{errors.worker_id}</span>}
            </div>
          )}
          <DynamicInput
            label='User Name *'
            value={form.user_name}
            onChange={(v) => {
              const strVal = typeof v === "string" ? v : String(v);
              // Only allow lowercase letters, numbers, and underscore, and must start with a letter
              let filtered = strVal.replace(/[^a-z0-9_]/g, "");
              if (filtered && !/^[a-z]/.test(filtered)) {
                filtered = filtered.replace(/^[^a-z]+/, "");
              }
              handleChange("user_name", filtered);
            }}
            type='text'
            placeholder='Enter user name'
          />
          {errors.user_name && <span className='text-xs text-red-500'>{errors.user_name}</span>}

          {!isEdit && (
            <>
              <div>
                <DynamicInput
                  label='Password *'
                  value={form.user_password}
                  onChange={(v) => handleChange("user_password", v)}
                  type='text'
                  placeholder='Enter password'
                />
                {errors.user_password && (
                  <span className='text-xs text-red-500'>{errors.user_password}</span>
                )}
              </div>
            </>
          )}

          <SearchableSelect
            label='User Type *'
            value={form.user_type ? String(form.user_type) : ""}
            onChange={(v) => handleChange("user_type", v ? Number(v) : undefined)}
            options={userTypes.map((type) => ({ value: String(type.id), label: type.val }))}
            placeholder={loadingUserTypes ? "Loading..." : "Select user type"}
            disabled={loadingUserTypes || submitting}
          />
          {errors.user_type && <span className='text-xs text-red-500'>{errors.user_type}</span>}

          <div>
            <label className='block mb-1 text-sm font-medium text-gray-500'>User Expire*</label>
            <DatePickerSingle
              value={form.user_expire}
              onChange={(date: Date | null) =>
                handleChange(
                  "user_expire",
                  date
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      )}-${String(date.getDate()).padStart(2, "0")} ${String(
                        date.getHours()
                      ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00`
                    : ""
                )
              }
              minDate={new Date()}
            />
          </div>
        </div>
        <div className='flex flex-col gap-4'>
          {/* <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="all_objects_visible"
              checked={form.all_objects_visible}
              onChange={(e) => handleChange("all_objects_visible", e.target.checked)}
              disabled={submitting}
            />
            <label>All Objects Visible</label>
          </div> */}

          <DynamicInput
            label='User Data Age Limit (optional)'
            value={form.user_data_age_limit || ""}
            onChange={(v) => handleChange("user_data_age_limit", v === "" ? undefined : Number(v))}
            type='number'
            placeholder='Data age limit'
          />
          <MultiSelect
            label='Visible Objects'
            value={form.visible_objects}
            onChange={(v) => handleChange("visible_objects", v)}
            options={objects.map((obj) => ({ value: obj.id, label: obj.name }))}
            placeholder={loadingObjects ? "Loading..." : "Select objects"}
            disabled={form.all_objects_visible || loadingObjects}
          />
          <MultiSelect
            label='Visible Object Groups'
            value={form.visible_object_groups}
            onChange={(v) => handleChange("visible_object_groups", v)}
            options={objectGroups.map((group) => ({ value: group.id, label: group.val }))}
            placeholder={loadingGroups ? "Loading..." : "Select object groups"}
            disabled={form.all_objects_visible || loadingGroups}
          />

          <div className='flex w-full gap-4 mt-4'>
            <Button type='submit' disabled={submitting} className='w-full'>
              {isEdit ? "Update User" : "Create User"}
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
        </div>
      </div>
    </form>
  );
}
