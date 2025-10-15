import React from 'react';
import { Input } from '@/components/ui/custom-input';

interface DynamicInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  label?: string;
  min?: number;
  inputSize?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'primary' | 'info' | 'warning' | 'success' | 'destructive';
  variant?: 'flat' | 'underline' | 'bordered' | 'faded' | 'ghost' | 'flat-underline';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  rightContent?: React.ReactNode;
}

const DynamicInput: React.FC<DynamicInputProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  label,
  min = 0,
  inputSize = 'md',
  color = 'default',
  variant = 'bordered',
  radius = 'md',
  shadow = 'none',
  className = '',
  rightContent,
}) => {
  return (
    <div className={className}>
      {label && <label className='block mb-1 text-sm font-medium text-gray-500'>{label}</label>}

      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={type === 'number' ? min : undefined}
          inputSize={inputSize}
          color={color}
          variant={variant}
          radius={radius}
          shadow={shadow}
          className="w-full pr-10"
        />
        {rightContent && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicInput;
