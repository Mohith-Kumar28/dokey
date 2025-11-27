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
    properties?: {
      placeholder?: string;
      defaultValue?: string;
      options?: string[];
    };
  };
  scale: number;
  value?: string;
  onChange?: (value: string) => void;
  onInteract?: () => void; // For signature clicks
}

export function SigningField({
  field,
  scale,
  value,
  onChange,
  onInteract
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // For signature/stamp, we trigger the external interaction handler (to open pad)
    if (field.type === 'signature' || field.type === 'stamp') {
      onInteract?.();
      return;
    }

    setIsEditing(true);
  };

  // If we are editing, show the input component
  if (isEditing) {
    return (
      <div
        id={`field-${field.id}`}
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
                  options={field.properties?.options || field.options}
                  placeholder={
                    field.properties?.placeholder || field.placeholder
                  }
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
            // Signature/Stamp handled by click, but if we somehow get here:
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
      id={`field-${field.id}`}
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
        value && 'border-green-500 bg-green-50',
        // Highlight required empty fields
        field.required && !value && 'ring-2 ring-yellow-400 ring-offset-1'
      )}
    >
      {/* Required Indicator */}
      {field.required && !value && (
        <div className='absolute -top-2 -right-2 z-20'>
          <span className='flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black shadow-sm'>
            *
          </span>
        </div>
      )}

      {/* Use config's renderDisplay if available, otherwise default rendering */}
      {fieldConfig.renderDisplay ? (
        fieldConfig.renderDisplay({ value, field, FieldIcon })
      ) : (
        <>
          <FieldIcon className='h-3 w-3' />
          <span className='pointer-events-none flex-1 truncate px-0.5 font-medium select-none'>
            {value || field.label || fieldConfig.label}
          </span>
        </>
      )}
    </div>
  );
}
