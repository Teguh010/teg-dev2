"use client";
import { Button } from "@/components/ui/button";
import DynamicInput from './custom-input';
import { useState } from 'react';

interface Translation {
  key: string;
  value: string;
  category: string;
}

interface TranslationsTableProps {
  translations: Translation[];
  categories: string[];
  onSaveTranslations: (translations: Translation[]) => void; 
  onDeleteTranslation: (key: string) => void;
  t: (key: string) => string;
}

const TranslationsTable = ({ 
  translations = [],
  onSaveTranslations,
  t
}: TranslationsTableProps) => {
  const [editableTranslations, setEditableTranslations] = useState(translations);

  const handleChange = (key: string, newValue: string) => {
    const updatedTranslations = editableTranslations.map(t => 
      t.key === key ? { ...t, value: newValue } : t
    );
    setEditableTranslations(updatedTranslations);
  };

  const handleSave = () => {
    onSaveTranslations(editableTranslations); 
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
              {t('key')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
              {t('category')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
              {t('value')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {editableTranslations.map(({ key, value, category }) => (
            <tr key={key}>
              <td className="px-6 py-1 whitespace-nowrap text-sm font-medium text-gray-900 w-1/4">
                {key}
              </td>
              <td className="px-6 py-1 whitespace-nowrap text-sm font-medium text-gray-900 w-1/4">
                {category}
              </td>
              <td className="px-6 py-1 whitespace-nowrap w-1/3">
                <DynamicInput
                  value={value}
                  onChange={(newValue) => handleChange(key, newValue)} 
                  inputSize="md"
                  className="w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="fixed bottom-4 right-4">
        <Button onClick={handleSave} className="w-full sm:w-auto">
          {t('translation_page.update_translation')}
        </Button>
      </div>
    </div>
  );
};

export default TranslationsTable;