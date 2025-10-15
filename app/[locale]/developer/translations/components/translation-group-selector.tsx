"use client";
import { Card } from "@/components/ui/card";
import { Icon } from '@iconify/react';

interface TranslationGroup {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface TranslationGroupSelectorProps {
  groups: TranslationGroup[];
  selectedGroup: number;
  onSelect: (groupId: number) => void;
  t: (key: string) => string;
}

const TranslationGroupSelector = ({
  groups,
  selectedGroup,
  onSelect,
  t
}: TranslationGroupSelectorProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h3 className="text-md font-semibold mb-3">{t('translation_page.select_translation_group')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card
            key={group.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedGroup === group.id
                ? 'border-2 border-primary bg-primary/5'
                : 'border border-gray-200'
            }`}
            onClick={() => onSelect(group.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                selectedGroup === group.id ? 'bg-primary/10' : 'bg-gray-100'
              }`}>
                <Icon 
                  icon={group.icon} 
                  className={`w-6 h-6 ${
                    selectedGroup === group.id ? 'text-primary' : 'text-gray-600'
                  }`} 
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{group.name}</h4>
                <p className="text-xs text-gray-500">{group.description}</p>
              </div>
              {selectedGroup === group.id && (
                <Icon icon="mdi:check-circle" className="w-5 h-5 text-primary" />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TranslationGroupSelector;

