import React from 'react';
import { Input } from '@/components/ui/custom-input';

interface DynamicInputProps {
  name: string;
  value: string | number;
  onChange: (name: string, value: string | number) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  label?: string;
  min?: number;
  disabled?: boolean;
  inputSize?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'primary' | 'info' | 'warning' | 'success' | 'destructive';
  variant?: 'flat' | 'underline' | 'bordered' | 'faded' | 'ghost' | 'flat-underline';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const DynamicInput: React.FC<DynamicInputProps> = ({
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  label,
  min = 0,
  disabled = false,
  inputSize = 'md',
  color = 'default',
  variant = 'bordered',
  radius = 'md',
  shadow = 'none',
}) => {
  return (
    <div>
      {label && <label className='block mb-1 text-sm font-medium text-gray-500'>{label}</label>}

      <Input
        type={type}
        value={value}
        onChange={(e) => {
          const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
          onChange(name, newValue);
        }}
        placeholder={placeholder}
        min={type === 'number' ? min : undefined}
        disabled={disabled}
        inputSize={inputSize}
        color={color}
        variant={variant}
        radius={radius}
        shadow={shadow}
      />
    </div>
  );
};

export default DynamicInput;
