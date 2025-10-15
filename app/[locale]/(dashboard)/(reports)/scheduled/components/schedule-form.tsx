import React from "react";
import { Button } from "@/components/ui/button";
import DynamicInput from "./custom-input";
import { useTranslation } from 'react-i18next';
import TransportModeSelect from './custom-seleect';
import SwitchPicker from './switch-picker';

interface RepetitionType {
  name: string;
  [key: string]: any;
}

interface ScheduleFormProps {
  schedule?: {
    name: string;
    scheduled_time: string;
    repeatable: boolean;
    parameters: {
      email?: string[];
      start_date?: string;
      end_date?: string;
      report_type?: string;
    };
    repetition_type: number;
    repetition_count: number;
    repetition_end: string;
    repetition_step: number;
    enabled: boolean;
    schedule_id: number | null;
  };
  onCancel: () => void;
  onSubmit: (formData: ScheduleFormData) => void;
  repetitionTypes: (string | RepetitionType)[];
}

interface ScheduleFormData {
  name: string;
  scheduled_time: string;
  repeatable: boolean;
  parameters: {
    email?: string[];
    rep_interval?: number;
    rep_int_len?: number;
    report_type?: string;
    start_date?: string;
    end_date?: string;
  };
  repetition_type: number;
  repetition_count: number;
  repetition_end: string;
  repetition_step: number;
  enabled: boolean;
  done: boolean;
  schedule_id: number | null;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  schedule, 
  onCancel, 
  onSubmit, 
  repetitionTypes 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState<ScheduleFormData>({
    name: schedule?.name || '',
    scheduled_time: schedule?.scheduled_time || '',
    repeatable: schedule?.repeatable || false,
    parameters: {
      email: schedule?.parameters?.email || [],
      // time_range akan digenerate oleh server
    },
    repetition_type: schedule?.repetition_type || 0,
    repetition_count: schedule?.repetition_count || 0,
    repetition_end: schedule?.repetition_end || '',
    repetition_step: schedule?.repetition_step || 0,
    enabled: schedule?.enabled || true,
    done: false,
    schedule_id: schedule?.schedule_id || null
  });

  React.useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name || '',
        scheduled_time: schedule.scheduled_time || '',
        repeatable: schedule.repeatable || false,
        parameters: {
          email: Array.isArray(schedule.parameters?.email) ? schedule.parameters.email : [],
          start_date: schedule.parameters?.start_date || '',
          end_date: schedule.parameters?.end_date || '',
          report_type: schedule.parameters?.report_type || ''
        },
        repetition_type: schedule.repetition_type || 0,
        repetition_count: schedule.repetition_count || 0,
        repetition_end: schedule.repetition_end || '',
        repetition_step: schedule.repetition_step || 0,
        enabled: schedule.enabled ?? true,
        done: false,
        schedule_id: schedule.schedule_id || null
      });
    }
  }, [schedule]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emails = e.target.value.split(',').map(email => email.trim());
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        email: emails
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      repetition_type: formData.repetition_type || 0,
      repetition_count: formData.repetition_count || 0,
      repetition_step: formData.repetition_step || 0,
      repetition_end: formData.repetition_end || "",
      parameters: {
        ...formData.parameters,
        email: formData.parameters.email || [],
        start_date: formData.parameters.start_date || null,
        end_date: formData.parameters.end_date || null
      }
    };
    onSubmit(payload);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handleRepeatableChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      repeatable: checked
    }));
  };

  const handleEnabledChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      enabled: checked
    }));
  };

  const getLabel = (key: string): string => {
    const translation = t(key);
    if (typeof translation === 'string') {
        return translation;
    }
    if (translation && typeof translation === 'object' && 'name' in translation) {
        return (translation as { name: string }).name;
    }
    return key;
  };


  const getOptions = () => {
    if (!repetitionTypes || repetitionTypes.length === 0) {
      return [];
    }
    return repetitionTypes.map((type, index) => {
      const label = typeof type === 'string' ? type : (type as RepetitionType).name;
      return {
        value: index.toString(),
        label: label
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <DynamicInput
          label={t('general.name')}
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <DynamicInput
          label={t('schedule.scheduled_time')}
          type="datetime-local"
          name="scheduled_time"
          value={formData.scheduled_time}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <DynamicInput
          label={t('general.email')}
          name="email"
          value={formData.parameters.email?.join(', ')}
          onChange={handleEmailChange}
          placeholder="email1@example.com, email2@example.com"
        />
      </div>

      <div className="space-y-2">
        <SwitchPicker
          label="Repeatable"
          handleCheckedChange={handleRepeatableChange}
        />
      </div>

      {formData.repeatable && (
        <>
          <div className="space-y-2">
            <TransportModeSelect
              label={getLabel('schedule.repetition_type')}
              value={formData.repetition_type.toString()}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                repetition_type: parseInt(value)
              }))}
              options={getOptions()}
              placeholder={getLabel('schedule.select_repetition_type')}
            />
          </div>

          <div className="space-y-2">
            <span>{getLabel('schedule.repetition_step')}</span>
            <DynamicInput
              id="repetition_step"
              type="number"
              name="repetition_step"
              value={formData.repetition_step}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <span>{getLabel('schedule.repetition_count')}</span>
            <DynamicInput
              id="repetition_count"
              type="number"
              name="repetition_count"
              value={formData.repetition_count}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <span>{getLabel('schedule.repetition_end')}</span>
            <DynamicInput
              id="repetition_end"
              type="datetime-local"
              name="repetition_end"
              value={formData.repetition_end}
              onChange={handleInputChange}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <SwitchPicker
          label="Status"
          handleCheckedChange={handleEnabledChange}
        />
      </div>

      <div className="space-y-2">
        <DynamicInput
          label='Report Type'
          name="report_type"
          value={formData.parameters.report_type || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            parameters: {
              ...prev.parameters,
              report_type: e.target.value
            }
          }))}
        />
      </div>

      <div className="space-y-2">
        <DynamicInput
          label='Rep Interval'
          type="number"
          name="rep_interval"
          value={formData.parameters.rep_interval || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            parameters: {
              ...prev.parameters,
              rep_interval: parseInt(e.target.value)
            }
          }))}
        />
      </div>

      <div className="space-y-2">
        <DynamicInput
          label='Rep int Len'
          type="number"
          name="rep_int_len"
          value={formData.parameters.rep_int_len || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            parameters: {
              ...prev.parameters,
              rep_int_len: parseInt(e.target.value)
            }
          }))}
        />
      </div>

      <div className="space-y-2">
        <DynamicInput
          label='Report Start date'
          type="date"
          name="start_date"
          value={formData.parameters.start_date || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            parameters: {
              ...prev.parameters,
              start_date: e.target.value
            }
          }))}
        />
      </div>

      <div className="space-y-2">
        <DynamicInput
          label='Report End Date'
          type="date"
          name="end_date"
          value={formData.parameters.end_date || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            parameters: {
              ...prev.parameters,
              end_date: e.target.value
            }
          }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          {t('general.cancel')}
        </Button>
        <Button type="submit" color="success">
          {schedule ? t('general.save') : t('general.create')}
        </Button>
      </div>
    </form>
  );
};

export default ScheduleForm; 