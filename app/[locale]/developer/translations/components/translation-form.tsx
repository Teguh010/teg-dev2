"use client";
import { Button } from "@/components/ui/button";
import DynamicInput from './custom-input';
import { Icon } from '@iconify/react';
import TransportModeSelect from './custom-seleect';

interface TranslationFormProps {
  translationInputs: { key: string; value: string; category: string }[];
  onAddInputField: () => void;
  onRemoveInputField: (index: number) => void;
  onInputChange: (index: number, field: string, value: string) => void;
  onAddTranslations: () => void;
  t: (key: string) => string;
  categories: string[];
  handleFileUpload: (file: File) => void;
  isUploading: boolean;
  submitUploadedTranslations: () => void; 
  hasUploadedTranslations: boolean; 
}


const TranslationForm = ({
  translationInputs,
  onAddInputField,
  onRemoveInputField,
  onInputChange,
  onAddTranslations,
  t,
  handleFileUpload,
  isUploading,
  submitUploadedTranslations, 
  hasUploadedTranslations
}: TranslationFormProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file); 
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className='flex justify-between'>
      <h2 className="text-lg font-semibold mb-4">{t('translation_page.add_new_translations')}</h2>
      <div>
           <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button
            variant="outline"
            className="w-full sm:w-auto cursor-pointer"
            asChild
          >
            <span>
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <span>Uploading...</span>
                  <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />
                </div>
              ) : (
                t('translation_page.upload_json')
              )}
            </span>
          </Button>
        </label>

        {hasUploadedTranslations && (
          <Button
            onClick={submitUploadedTranslations}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
          >
            {t('translation_page.submit_uploaded_translations')}
          </Button>
        )}
      </div>
      </div>
      {translationInputs.map((input, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <DynamicInput
                label={t('translation_page.translation_key')}
                value={input.key}
                onChange={(value) => onInputChange(index, 'key', value)}
                placeholder={t('translation_page.enter_translation_key')}
                inputSize="md"
              />
            </div>
            <div className="flex-1">
              <DynamicInput
                label={t('translation_page.translation_value')}
                value={input.value}
                onChange={(value) => onInputChange(index, 'value', value)}
                placeholder={t('translation_page.enter_translation_value')}
                inputSize="md"
                className={index > 0 ? 'mr-4' : 'mr-0'}
              />
            </div>
          </div>
          {index > 0 && (
            <div className="flex items-end pb-2">
              <button
                onClick={() => onRemoveInputField(index)}
                className="text-red-500 hover:text-red-700 ml-[-25px]"
                title={t('translation_page.remove_translation')}
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-4 justify-between">
        <Button
          onClick={onAddInputField}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {translationInputs.length === 0 ? t('translation_page.general.add_new') : t('translation_page.add_more')}
        </Button>
        
        {translationInputs.length > 0 && (
          <Button
            onClick={onAddTranslations}
            className="w-full sm:w-auto"
          >
            {t('translation_page.add_translations')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TranslationForm;