import { Icons } from '@/components/icons';

export interface FieldTypeConfig {
  label: string;
  icon: keyof typeof Icons;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const FIELD_TYPE_CONFIG: Record<string, FieldTypeConfig> = {
  text: {
    label: 'Text',
    icon: 'type',
    color: 'blue',
    bgColor: 'bg-blue-50/80',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700'
  },
  signature: {
    label: 'Signature',
    icon: 'pen',
    color: 'purple',
    bgColor: 'bg-purple-50/80',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-700'
  },
  initials: {
    label: 'Initials',
    icon: 'user',
    color: 'indigo',
    bgColor: 'bg-indigo-50/80',
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-700'
  },
  date: {
    label: 'Date',
    icon: 'calendar',
    color: 'green',
    bgColor: 'bg-green-50/80',
    borderColor: 'border-green-500',
    textColor: 'text-green-700'
  },
  checkbox: {
    label: 'Checkbox',
    icon: 'check',
    color: 'teal',
    bgColor: 'bg-teal-50/80',
    borderColor: 'border-teal-500',
    textColor: 'text-teal-700'
  },
  dropdown: {
    label: 'Dropdown',
    icon: 'select',
    color: 'orange',
    bgColor: 'bg-orange-50/80',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-700'
  },
  radio: {
    label: 'Radio',
    icon: 'circle',
    color: 'pink',
    bgColor: 'bg-pink-50/80',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-700'
  }
};

export function getFieldTypeConfig(type: string): FieldTypeConfig {
  return FIELD_TYPE_CONFIG[type] || FIELD_TYPE_CONFIG.text;
}
