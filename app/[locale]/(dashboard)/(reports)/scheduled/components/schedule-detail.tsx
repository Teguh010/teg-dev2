import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

interface ScheduleDetailProps {
  schedule: any;
  repetitionTypes: string[];
  onClose: () => void;
}

const ScheduleDetail = ({ schedule, repetitionTypes, onClose }: ScheduleDetailProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {t('schedule.detail')}
          </h2>
          <Button variant="outline" onClick={onClose}>
            {t('general.close')}
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="font-medium">{t('schedule.name')}:</label>
            <p>{schedule?.name}</p>
          </div>
          
          <div>
            <label className="font-medium">{t('schedule.scheduled_time')}:</label>
            <p>{schedule?.scheduled_time}</p>
          </div>
          
          <div>
            <label className="font-medium">{t('schedule.repeatable')}:</label>
            <p>{schedule?.repeatable ? 'Yes' : 'No'}</p>
          </div>
          
          {schedule?.repeatable && (
            <>
              <div>
                <label className="font-medium">{t('schedule.repetition_type')}:</label>
                <p>{repetitionTypes[schedule?.repetition_type]}</p>
              </div>
              
              <div>
                <label className="font-medium">{t('schedule.repetition_step')}:</label>
                <p>{schedule?.repetition_step}</p>
              </div>
            </>
          )}
          
          <div>
            <label className="font-medium">{t('schedule.status')}:</label>
            <p>{schedule?.enabled ? 'Enabled' : 'Disabled'}</p>
          </div>
          
          <div>
            <label className="font-medium">{t('schedule.email')}:</label>
            <p>{schedule?.parameters?.email?.join(', ')}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScheduleDetail; 