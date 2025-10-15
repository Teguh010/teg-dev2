'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import DynamicInput from '@/app/[locale]/(dashboard)/(reports)/map-route/components/input-form/custom-input2';
import MultiSelect from './MultiSelect';
import SearchableSelect from '@/components/ui/searchable-select';
import {
  WorkerFormData,
  WorkerGroup,
  getWorkerGroupsList
} from '@/models/workers';
import { objectList } from '@/models/object';
import { objectListResultVehicle } from '@/types/object';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import { tachoUnassignedDriverIds, UnassignedTachoDriver } from '@/models/tachograph';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';

const defaultWorker: WorkerFormData = {
  name: '',
  surname: '',
  phone: '',
  email: '',
  tacho_driver_id: undefined,
  tacho_driver_name: '', // tambahkan default
  foreign_system_id: '',
  groups_list: [],
  rfid: '',
  rfid_size: undefined,
  rfid_reversed: undefined,
  assigned_to: undefined
};

interface WorkerFormProps {
  onSubmit: (data: WorkerFormData) => void
  initialData?: WorkerFormData
  isEdit?: boolean
}

export default function WorkerForm({
  onSubmit,
  initialData,
  isEdit = false
}: WorkerFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<WorkerFormData>(initialData || defaultWorker);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [groups, setGroups] = useState<WorkerGroup[]>([]);
  const [tachoDrivers, setTachoDrivers] = useState<UnassignedTachoDriver[]>([]);
  const [objects, setObjects] = useState<objectListResultVehicle[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingTachoDrivers, setLoadingTachoDrivers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  

  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  // Fetch users, groups, and tacho drivers for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!UserContext.models.user) return;
      const token = getUserRef().token;

      // Fetch objects for assigned_to
      setLoadingGroups(true);
      try {
        const objectsData = await objectList(token, { with_archived: false, without_virtual: true });
        setObjects(objectsData);
      } catch {
        setObjects([]);
      }
      setLoadingGroups(false);

      // Fetch worker groups
      setLoadingGroups(true);
      try {
        const groupsData = await getWorkerGroupsList(token);
        setGroups(groupsData);
      } catch {
        setGroups([]);
      }
      setLoadingGroups(false);

      // Fetch tacho drivers
      setLoadingTachoDrivers(true);
      try {
        const driversData = await tachoUnassignedDriverIds(token);
        setTachoDrivers(driversData);
      } catch {
        setTachoDrivers([]);
      }
      setLoadingTachoDrivers(false);
    };

    fetchDropdownData();
  }, []);

  // Ensure assigned_to object is present in objects list for edit mode
  useEffect(() => {
    const ensureAssignedObject = async () => {
      if (!isEdit || !form.assigned_to || objects.some(obj => obj.id === form.assigned_to)) return;
      try {
        const token = getUserRef().token;
        const result = await objectList(token, { id: form.assigned_to });
        if (Array.isArray(result) && result.length > 0) {
          setObjects(prev => [...prev, ...result.filter(obj => !prev.some(o => o.id === obj.id))]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    ensureAssignedObject();
  }, [isEdit, form.assigned_to, objects, getUserRef]);

  // Tambahkan useEffect untuk inject tacho_driver_name jika perlu
  useEffect(() => {
    if (
      isEdit &&
      form.tacho_driver_id &&
      !tachoDrivers.some((d) => d.id === form.tacho_driver_id)
    ) {
      setTachoDrivers((prev) => [
        ...prev,
        {
          id: form.tacho_driver_id,
          name: form.tacho_driver_name || `ID: ${form.tacho_driver_id}`,
        },
      ]);
    }
    // eslint-disable-next-line
  }, [isEdit, form.tacho_driver_id, form.tacho_driver_name, tachoDrivers]);

  const handleChange = useCallback((name: string, value: string | number | boolean | number[]) => {
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      return newForm;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (value) delete newErrors[name];
      return newErrors;
    });
  }, []);

  const validate = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.surname) newErrors.surname = 'Surname is required';
    // Email validation
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    // Phone validation (hanya angka, min 6 digit)
    if (form.phone && !/^\d{6,}$/.test(form.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be at least 6 digits and only numbers';
    }
    if (form.rfid_size && (form.rfid_size < 3 || form.rfid_size > 8)) {
      newErrors.rfid_size = 'RFID size must be between 3 and 8';
    }
    return newErrors;
  }, [form]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const validationErrors = validate();
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        toast.error('Please fill all required fields correctly.');
        return;
      }
      setSubmitting(true);
      try {
        // Hapus tacho_driver_name dan foreign_system_id (jika edit) dari payload
        let submitForm = { ...form };
        delete submitForm.tacho_driver_name;
        if (isEdit) {
          delete submitForm.foreign_system_id;
          // Hapus field kosong
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
        }
        await onSubmit(submitForm);
      } catch {
        // Optional: handle error jika perlu
      } finally {
        setSubmitting(false);
      }
    },
    [form, validate, onSubmit, isEdit]
  );

  return (
    <form onSubmit={handleSubmit} className='w-full'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Kiri: Basic Information */}
        <div className='flex flex-col gap-4'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900'>{t('general.basic_information')}</h3>
            <div>
              <DynamicInput
                label={t('general.name_required')}
                value={form.name}
                onChange={(v) => handleChange('name', v)}
                type='text'
                placeholder={t('worker.worker_name')}
              />
              {errors.name && <span className='text-xs text-red-500'>{t('general.name_required_error')}</span>}
            </div>
            <div>
              <DynamicInput
                label={t('general.surname_required')}
                value={form.surname}
                onChange={(v) => handleChange('surname', v)}
                type='text'
                placeholder={t('general.worker_surname')}
              />
              {errors.surname && <span className='text-xs text-red-500'>{t('general.surname_required_error')}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('general.phone')}</label>
              <PhoneInput
                country={'id'}
                value={form.phone}
                onChange={(v) => handleChange('phone', v)}
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
              {errors.phone && <span className='text-xs text-red-500'>{t('general.phone_error')}</span>}
            </div>
            <div>
              <DynamicInput
                label={t('general.email')}
                value={form.email}
                onChange={(v) => handleChange('email', v)}
                type='text'
                placeholder={t('general.email_address')}
              />
              {errors.email && <span className='text-xs text-red-500'>{t('general.email_error')}</span>}
            </div>
            {/* Foreign System ID hanya tampil jika bukan edit */}
            {!isEdit && (
              <div>
                <DynamicInput
                  label={t('general.foreign_system_id')}
                  value={form.foreign_system_id}
                  onChange={(v) => handleChange('foreign_system_id', v)}
                  type='text'
                  placeholder={t('general.id_in_foreign_system')}
                />
              </div>
            )}
            {/* Tachograph Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900'>{t('general.tachograph_information')}</h3>
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>{t('general.tacho_driver_id')}</label>
                <SearchableSelect
                  label=""
                  value={form.tacho_driver_id ? String(form.tacho_driver_id) : ''}
                  onChange={(v) => handleChange('tacho_driver_id', v ? Number(v) : undefined)}
                  options={tachoDrivers.map((driver) => ({
                    value: String(driver.id),
                    label: driver.name
                  }))}
                  placeholder={loadingTachoDrivers ? t('general.loading_drivers') : t('general.select_tacho_driver')}
                  disabled={loadingTachoDrivers}
                />
                <div className='text-xs text-gray-500 mt-1'>
                  {t('general.tacho_driver_id_optional')}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-4'>
          {/* RFID Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900'>{t('general.rfid_information')}</h3>
            <div>
              <DynamicInput
                label={t('general.rfid_tag_id')}
                value={form.rfid}
                onChange={(v) => handleChange('rfid', v)}
                type='text'
                placeholder={t('general.rfid_tag_id_hex')}
              />
              <div className='text-xs text-gray-500 mt-1'>
                {t('general.rfid_fields_optional')}
              </div>
            </div>
            <div>
              <DynamicInput
                label={t('general.rfid_size_bytes')}
                value={form.rfid_size || ''}
                onChange={(v) => handleChange('rfid_size', v === '' ? undefined : Number(v))}
                type='number'
                placeholder={t('general.rfid_size_placeholder')}
              />
              {errors.rfid_size && <span className='text-xs text-red-500'>{t('general.rfid_size_error')}</span>}
              {form.rfid_size && (
                <button
                  type='button'
                  onClick={() => handleChange('rfid_size', undefined)}
                  className='text-xs text-blue-600 hover:text-blue-800 mt-1'
                >
                  {t('general.clear_rfid_size')}
                </button>
              )}
              <div className='text-xs text-gray-500 mt-1'>
                {t('general.rfid_size_must_be_between')}
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='rfid_reversed'
                checked={form.rfid_reversed === true}
                onChange={(e) => handleChange('rfid_reversed', e.target.checked ? true : undefined)}
                className='rounded border-gray-300 text-primary focus:ring-primary'
              />
              <label htmlFor='rfid_reversed' className='text-sm font-medium text-gray-700'>
                {t('general.rfid_reversed')}
              </label>
            </div>
          </div>
          {/* Assignment Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900'>{t('general.assignment_information')}</h3>
            <div>
            <SearchableSelect
              label={t('general.assigned_to_object')}
              value={form.assigned_to ? String(form.assigned_to) : ''}
              onChange={(v) => handleChange('assigned_to', v ? Number(v) : undefined)}
              options={objects.map((obj) => ({
                value: String(obj.id),
                label: obj.name
              }))}
              placeholder={loadingGroups ? t('general.loading') : t('general.select_object')}
              disabled={loadingGroups}
            />
            </div>
            <div>
              <MultiSelect
                label={t('general.groups')}
                value={form.groups_list || []}
                onChange={(selectedGroups) => handleChange('groups_list', selectedGroups)}
                options={Array.isArray(groups) ? groups.map((group) => ({
                  value: group.id,
                  label: group.foreign_system_id
                    ? `${group.name} (ID: ${group.foreign_system_id})`
                    : group.name
                })) : []}
                placeholder={loadingGroups ? t('general.loading_groups') : t('general.select_groups')}
                disabled={loadingGroups || !Array.isArray(groups) || groups.length === 0}
              />
            </div>
          </div>
          <div className='flex w-full gap-4 mt-4'>
            <Button type='submit' disabled={submitting} className='w-full'>
              {submitting
                ? isEdit
                  ? t('general.updating')
                  : t('general.creating')
                : isEdit
                ? t('worker.update_worker')
                : t('worker.create_worker')}
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
