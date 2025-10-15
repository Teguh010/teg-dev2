import React from 'react';
import { Input } from '@/components/ui/custom-input';

interface DynamicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  inputSize?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'primary' | 'info' | 'warning' | 'success' | 'destructive';
  variant?: 'flat' | 'underline' | 'bordered' | 'faded' | 'ghost' | 'flat-underline';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  rightContent?: React.ReactNode;
}

const DynamicInput = React.forwardRef<HTMLInputElement, DynamicInputProps>(
  (
    {
      label,
      inputSize = 'md',
      color = 'default',
      variant = 'bordered',
      radius = 'md',
      shadow = 'none',
      className = '',
      rightContent,
      ...props
    },
    ref
  ) => {
    return (
      <div className={className}>
        {label && <label className='block mb-1 text-sm font-medium text-gray-500'>{label}</label>}

        <div className="relative">
          <Input
            ref={ref}
            inputSize={inputSize}
            color={color}
            variant={variant}
            radius={radius}
            shadow={shadow}
            className="w-full pr-10"
            {...props}
          />
          {rightContent && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DynamicInput.displayName = 'DynamicInput';

export default DynamicInput;
