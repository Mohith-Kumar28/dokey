import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { getFieldTypeConfig } from '../config/field-type-config';
import { TextFieldInput } from './field-inputs/text-field-input';
import { CheckboxFieldInput } from './field-inputs/checkbox-field-input';
import { DropdownFieldInput } from './field-inputs/dropdown-field-input';
import { DateFieldInput } from './field-inputs/date-field-input';
import { SignatureFieldInput } from './field-inputs/signature-field-input';
import { useState } from 'react';

interface SigningFieldProps {
  field: {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    pageId: string;
    value?: string | null;
    required?: boolean;
    recipientId?: string | null;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    options?: string[];
  };
  scale: number;
  value?: string;
  onChange?: (value: string) => void;
}

export function SigningField({
  field,
  scale,
  value,
  onChange
}: SigningFieldProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Get field type configuration
  const fieldConfig = getFieldTypeConfig(field.type);
  const FieldIcon = Icons[fieldConfig.icon];

  const handleSave = (newValue: string) => {
    onChange?.(newValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleClick = () => {
    setIsEditing(true);
  };

  // If we are editing, show the input component
  if (isEditing) {
    return (
      <div
        style={{
          left: field.x * scale,
          top: field.y * scale,
          width: field.width * scale,
          height: field.height * scale
        }}
        className='absolute z-30'
      >
        {(() => {
          switch (field.type.toLowerCase()) {
            case 'text':
              return (
                <TextFieldInput
                  value={value || ''}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  placeholder={field.placeholder || 'Enter text...'}
                  width={field.width}
                  height={field.height}
                />
              );
            case 'checkbox':
              return <CheckboxFieldInput value={value} onSave={handleSave} />;
            case 'dropdown':
              return (
                <DropdownFieldInput
                  value={value}
                  onSave={handleSave}
                  options={field.options}
                  placeholder={field.placeholder}
                  width={field.width}
                  height={field.height}
                />
              );
            case 'date':
              return (
                <DateFieldInput
                  value={value}
                  onSave={handleSave}
                  width={field.width}
                  height={field.height}
                />
              );
            case 'signature':
            case 'stamp':
              return (
                <SignatureFieldInput
                  value={value}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  type={field.type.toLowerCase() as 'signature' | 'stamp'}
                />
              );
            default:
              return null;
          }
        })()}
      </div>
    );
  }

  // Display Mode (Interactive)
  return (
    <div
      onClick={handleClick}
      style={{
        left: field.x * scale,
        top: field.y * scale,
        width: field.width * scale,
        height: field.height * scale
      }}
      className={cn(
        'absolute z-10 flex cursor-pointer items-center justify-center gap-1.5 text-xs transition-all hover:shadow-md',
        `border ${fieldConfig.borderColor} ${fieldConfig.bgColor} ${fieldConfig.textColor}`,
        value && 'border-green-500 bg-green-50'
      )}
    >
      {(() => {
        switch (field.type.toLowerCase()) {
          case 'checkbox':
            return (
              <div className='flex h-full w-full items-center justify-center'>
                {value === 'true' || value === 'checked' ? (
                  <Icons.checkSquare className='h-4 w-4' />
                ) : (
                  <Icons.square className='h-4 w-4' />
                )}
              </div>
            );
          case 'signature':
          case 'stamp':
            return value ? (
              <img
                src={value}
                alt={field.type}
                className='h-full w-full object-contain'
              />
            ) : (
              <>
                <FieldIcon className='h-3 w-3' />
                <span className='pointer-events-none flex-1 truncate px-0.5 font-medium select-none'>
                  Sign
                </span>
              </>
            );
          default:
            return (
              <>
                <FieldIcon className='h-3 w-3' />
                <span className='pointer-events-none flex-1 truncate px-0.5 font-medium select-none'>
                  {value || field.label || field.type}
                </span>
              </>
            );
        }
      })()}
    </div>
  );
}
