import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import DynamicInput from "@/app/[locale]/(dashboard)/(reports)/map-route/components/input-form/custom-input2";
import SearchableSelect from '@/components/ui/searchable-select';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import MultiSelect from "./MultiSelect";
import { WorkerWithLoginPayload, WorkerGroup, getWorkerGroupsList, getUserGroupsList } from "@/models/workers";
import { objectList, objectGroupList } from "@/models/object";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import DatePickerSingle from "@/components/date-picker-single";
import { tachoUnassignedDriverIds, UnassignedTachoDriver } from "@/models/tachograph";
import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';


const defaultWorker: Partial<WorkerWithLoginPayload> = {
  name: "",
  surname: "",
  phone: "",
  email: "",
  tacho_driver_id: undefined,
  foreign_system_id: "",
  groups_list: [],
  rfid: "",
  rfid_size: undefined,
  rfid_reversed: undefined,
  assigned_to: undefined,
  login: "",
  password: "",
  user_type_id: 4,
  user_groups: [],
  all_objects_visible: false,
  user_expires: "",
  user_data_age_limit: undefined,
  visible_objects: [],
  visible_object_groups: [],
};

interface WorkerWithLoginFormProps {
  onSubmit: (data: WorkerWithLoginPayload) => void;
  loading?: boolean;
}

function hasValProp(group: unknown): group is { id: number; val: string } {
  return typeof group === 'object' && group !== null && 'val' in group && typeof (group as Record<string, unknown>).val === 'string';
}

export default function WorkerWithLoginForm({ onSubmit, loading }: WorkerWithLoginFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Partial<WorkerWithLoginPayload>>(defaultWorker);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [groups, setGroups] = useState<WorkerGroup[]>([]);
  const [tachoDrivers, setTachoDrivers] = useState<UnassignedTachoDriver[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingTachoDrivers, setLoadingTachoDrivers] = useState(false);
  const [userGroups, setUserGroups] = useState<{ id: number; val: string }[]>([]);
  const [visibleObjects, setVisibleObjects] = useState<{ id: number; name: string }[]>([]);
  const [visibleObjectGroups, setVisibleObjectGroups] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const UserContext = useUser();

  // Fetch users, groups, tacho drivers
  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!UserContext.models.user) return;
      const token = UserContext.operations.getUserRef().token;
      setLoadingGroups(true);
      try {
        const groupsData = await getWorkerGroupsList(token);
        setGroups(groupsData);
      } catch {
        setGroups([]);
      }
      setLoadingGroups(false);
      setLoadingTachoDrivers(true);
      try {
        const driversData = await tachoUnassignedDriverIds(token);
        setTachoDrivers(driversData);
      } catch {
        setTachoDrivers([]);
      }
      setLoadingTachoDrivers(false);
      // Fetch user groups
      try {
        const userGroupsData = await getUserGroupsList(token);
        setUserGroups(userGroupsData);
      } catch {
        setUserGroups([]);
      }
      // Fetch visible objects
      try {
        const objectsData = await objectList(token);
        setVisibleObjects(Array.isArray(objectsData) ? objectsData : []);
      } catch {
        setVisibleObjects([]);
      }
      // Fetch visible object groups
      try {
        const objectGroupsData = await objectGroupList(token);
        setVisibleObjectGroups(Array.isArray(objectGroupsData) ? objectGroupsData : []);
      } catch {
        setVisibleObjectGroups([]);
      }
    };
    fetchDropdownData();
  }, []);

  const handleChange = useCallback((name: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (value) delete newErrors[name];
      return newErrors;
    });
  }, []);

  // Update validate to require login starts with a letter and only contains allowed chars
  const validate = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!form.name) newErrors.name = "Name is required";
    if (!form.surname) newErrors.surname = "Surname is required";
    if (!form.login) newErrors.login = "Login is required";
    else if (!/^[a-z][a-z0-9_]*$/.test(form.login)) newErrors.login = "Login must start with a letter and contain only lowercase letters, numbers, and underscores";
    if (!form.password) newErrors.password = "Password is required";
    if (!form.user_type_id) newErrors.user_type_id = "User type is required";
    // Email validation
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    // Phone validation (hanya angka, min 6 digit)
    if (form.phone && !/^\d{6,}$/.test((form.phone as string).replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be at least 6 digits and only numbers';
    }
    if (form.rfid_size && (form.rfid_size < 3 || form.rfid_size > 8)) {
      newErrors.rfid_size = "RFID size must be between 3 and 8";
    }
    return newErrors;
  }, [form]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form as WorkerWithLoginPayload);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('general.basic_information')}</h3>
            <DynamicInput label={t('general.name_required')} value={form.name} onChange={v => handleChange("name", v)} type="text" placeholder={t('general.worker_name')} />
            {errors.name && <span className="text-xs text-red-500">{t('general.name_required_error')}</span>}
            <DynamicInput label={t('general.surname_required')} value={form.surname} onChange={v => handleChange("surname", v)} type="text" placeholder={t('general.worker_surname')} />
            {errors.surname && <span className="text-xs text-red-500">{t('general.surname_required_error')}</span>}
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('general.phone')}</label>
            <PhoneInput
              country={'id'}
              value={form.phone || ''}
              onChange={v => handleChange('phone', v)}
              inputProps={{
                name: 'phone',
                required: false,
                autoFocus: false,
                className: 'w-full border rounded px-11 py-2',
                placeholder: t('general.phone_number')
              }}
              inputStyle={{ width: '100%' }}
              specialLabel=""
              enableSearch={true}
            />
            {errors.phone && <span className="text-xs text-red-500">{t('general.phone_error')}</span>}
            <DynamicInput label={t('general.email')} value={form.email} onChange={v => handleChange("email", v)} type="text" placeholder={t('general.email_address')} />
            {errors.email && <span className="text-xs text-red-500">{t('general.email_error')}</span>}
            <DynamicInput label={t('general.foreign_system_id')} value={form.foreign_system_id} onChange={v => handleChange("foreign_system_id", v)} type="text" placeholder={t('general.id_in_foreign_system')} />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('general.tachograph_information')}</h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('general.tacho_driver_id')}</label>
              <SearchableSelect 
                label="" 
                value={form.tacho_driver_id ? String(form.tacho_driver_id) : ""} 
                onChange={v => handleChange("tacho_driver_id", v ? Number(v) : undefined)} 
                options={Array.isArray(tachoDrivers) ? tachoDrivers.map(driver => ({ value: String(driver.id), label: driver.name })) : []} 
                placeholder={loadingTachoDrivers ? t('general.loading_drivers') : t('general.select_tacho_driver')} 
                disabled={loadingTachoDrivers} 
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('general.rfid_information')}</h3>
            <DynamicInput label={t('general.rfid_tag_id')} value={form.rfid} onChange={v => handleChange("rfid", v)} type="text" placeholder={t('general.rfid_tag_id_hex')} />
            <DynamicInput label={t('general.rfid_size_bytes')} value={form.rfid_size || ""} onChange={v => handleChange("rfid_size", v === "" ? undefined : Number(v))} type="number" placeholder={t('general.rfid_size_placeholder')} />
            {errors.rfid_size && <span className="text-xs text-red-500">{t('general.rfid_size_error')}</span>}
            {form.rfid_size && <button type="button" onClick={() => handleChange("rfid_size", undefined)} className="text-xs text-blue-600 hover:text-blue-800 mt-1">{t('general.clear_rfid_size')}</button>}
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="rfid_reversed" checked={form.rfid_reversed === true} onChange={e => handleChange("rfid_reversed", e.target.checked ? true : undefined)} className="rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="rfid_reversed" className="text-sm font-medium text-gray-700">{t('general.rfid_reversed')}</label>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('general.assignment_information')}</h3>
            <SearchableSelect 
              label={t('general.assigned_to_object')}
              value={form.assigned_to ? String(form.assigned_to) : ""}
              onChange={v => handleChange("assigned_to", v ? Number(v) : undefined)}
              options={Array.isArray(visibleObjects) ? visibleObjects.map(obj => ({ value: String(obj.id), label: obj.name })) : []}
              placeholder={!Array.isArray(visibleObjects) || visibleObjects.length === 0 ? t('general.loading') : t('general.select_object')}
              disabled={!Array.isArray(visibleObjects) || visibleObjects.length === 0}
            />
            <MultiSelect 
              label={t('general.groups')} 
              value={form.groups_list || []} 
              onChange={selectedGroups => handleChange("groups_list", selectedGroups)} 
              options={Array.isArray(groups) ? groups.map(group => ({ 
                value: group.id, 
                label: group.foreign_system_id ? `${group.name} (ID: ${group.foreign_system_id})` : group.name 
              })) : []} 
              placeholder={loadingGroups ? t('general.loading_groups') : t('general.select_groups')} 
              disabled={loadingGroups || !Array.isArray(groups) || groups.length === 0} 
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className=" space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('general.user_login_information')}</h3>
            <DynamicInput 
              label={t('general.login_required')} 
              value={form.login} 
              onChange={v => {
                const strVal = typeof v === "string" ? v : String(v);
                let filtered = strVal.replace(/[^a-z0-9_]/g, "");
                if (filtered && !/^[a-z]/.test(filtered)) {
                  filtered = filtered.replace(/^[^a-z]+/, "");
                }
                handleChange("login", filtered);
              }} 
              type="text" 
              placeholder={t('general.user_login')} 
            />
            {errors.login && <span className="text-xs text-red-500">{errors.login}</span>}
            <DynamicInput label={t('general.password_required')} value={form.password} onChange={v => handleChange("password", v)} type="text" placeholder={t('general.user_password')} />
            {errors.password && <span className="text-xs text-red-500">{t('general.password_required_error')}</span>}
            <DynamicInput label={t('general.user_type_id_required')} value={form.user_type_id || 4} onChange={v => handleChange("user_type_id", Number(v))} type="number" placeholder={t('general.user_type_id_placeholder')} />
            {errors.user_type_id && <span className="text-xs text-red-500">{errors.user_type_id}</span>}
            <MultiSelect 
              label={t('general.user_groups')} 
              value={form.user_groups || []} 
              onChange={selectedGroups => handleChange("user_groups", selectedGroups)} 
              options={Array.isArray(userGroups) ? userGroups.map(group => ({ value: group.id, label: group.val })) : []} 
              placeholder={!Array.isArray(userGroups) || userGroups.length === 0 ? t('general.loading_user_groups') : t('general.select_user_groups')} 
              disabled={!Array.isArray(userGroups) || userGroups.length === 0} 
            />
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="all_objects_visible" checked={form.all_objects_visible === true} onChange={e => handleChange("all_objects_visible", e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="all_objects_visible" className="text-sm font-medium text-gray-700">{t('general.all_objects_visible')}</label>
            </div>
            <label className="block text-sm font-medium text-gray-500 mb-1">{t('general.user_expires')}</label>
            <DatePickerSingle
              value={form.user_expires || ""}
              onChange={date => handleChange("user_expires", date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00` : "")}
              minDate={new Date()}
            />
            <DynamicInput label={t('general.data_age_limit_days')} value={form.user_data_age_limit || ""} onChange={v => handleChange("user_data_age_limit", v === "" ? undefined : Number(v))} type="number" placeholder={t('general.data_age_limit_placeholder')} />
            <MultiSelect 
              label={t('general.visible_objects')} 
              value={form.visible_objects || []} 
              onChange={selected => handleChange("visible_objects", selected)} 
              options={Array.isArray(visibleObjects) ? visibleObjects.map(obj => ({ value: obj.id, label: obj.name })) : []} 
              placeholder={!Array.isArray(visibleObjects) || visibleObjects.length === 0 ? t('general.loading_objects') : t('general.select_visible_objects')} 
              disabled={!Array.isArray(visibleObjects) || visibleObjects.length === 0} 
            />
            <MultiSelect 
              label={t('general.visible_object_groups')} 
              value={form.visible_object_groups || []} 
              onChange={selected => handleChange("visible_object_groups", selected)} 
              options={Array.isArray(visibleObjectGroups) ? visibleObjectGroups.map(group => ({ value: group.id, label: group.name || (hasValProp(group) ? group.val : "") })) : []} 
              placeholder={!Array.isArray(visibleObjectGroups) || visibleObjectGroups.length === 0 ? t('general.loading') : t('general.select_visible_object_groups')} 
              disabled={!Array.isArray(visibleObjectGroups) || visibleObjectGroups.length === 0} 
            />
          </div>
          <div className='flex w-full gap-4 mt-4'>
            <Button type='submit' disabled={submitting} className='w-full'>
            {submitting || loading ? t('general.creating') : t('general.create_worker_with_login')}
            </Button>
            <Button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                router.back();
              }}
              className='w-full'
              variant='outline'
              color='destructive'
            >
              {t('general.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}