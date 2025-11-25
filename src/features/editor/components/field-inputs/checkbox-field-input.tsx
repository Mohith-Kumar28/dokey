import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface CheckboxFieldInputProps {
  value: string | null | undefined;
  onSave: (value: string) => void;
  className?: string;
}

export function CheckboxFieldInput({
  value,
  onSave,
  className
}: CheckboxFieldInputProps) {
  const isChecked = value === 'true' || value === 'checked';

  const handleToggle = (checked: boolean) => {
    onSave(checked ? 'true' : 'false');
  };

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={handleToggle}
        className='h-6 w-6'
      />
    </div>
  );
}
