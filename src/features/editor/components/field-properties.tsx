'use client';

import { useEditorStore } from '../store/use-editor-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useState } from 'react';

export function FieldProperties() {
  const selectedFieldId = useEditorStore((state) => state.selectedFieldId);
  const pages = useEditorStore((state) => state.pages);
  const updateField = useEditorStore((state) => state.updateField);
  const deleteField = useEditorStore((state) => state.deleteField);
  const selectField = useEditorStore((state) => state.selectField);

  // Find the selected field
  let selectedField = null;
  let pageNumber = 0;
  for (const page of pages) {
    const field = page.fields.find((f) => f.id === selectedFieldId);
    if (field) {
      selectedField = field;
      pageNumber = page.pageNumber;
      break;
    }
  }

  if (!selectedField) {
    return null;
  }

  const handleUpdate = (updates: any) => {
    updateField(pageNumber, selectedField.id, updates);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this field?')) {
      deleteField(pageNumber, selectedField.id);
      selectField(null);
    }
  };

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='border-b p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-blue-700'>
              <span className='text-xs font-semibold'>
                {selectedField.type.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className='text-sm font-semibold'>
                {selectedField.type} field
              </h3>
              <p className='text-muted-foreground text-xs'>
                Configure field properties
              </p>
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6'
            onClick={() => selectField(null)}
          >
            <Icons.close className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Properties */}
      <div className='flex-1 space-y-4 overflow-y-auto p-4'>
        {/* Field Label */}
        <div className='space-y-2'>
          <Label htmlFor='field-label'>Field Label</Label>
          <Input
            id='field-label'
            value={selectedField.label || ''}
            onChange={(e) => handleUpdate({ label: e.target.value })}
            placeholder='Enter field label'
            className='text-sm'
          />
        </div>

        {/* Required Toggle */}
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label>Required Field</Label>
            <p className='text-muted-foreground text-xs'>
              User must fill this field
            </p>
          </div>
          <Switch
            checked={selectedField.required || false}
            onCheckedChange={(checked) => handleUpdate({ required: checked })}
          />
        </div>

        <Separator />

        {/* Type-specific properties */}
        {selectedField.type === 'text' && (
          <>
            <div className='space-y-2'>
              <Label htmlFor='placeholder'>Placeholder</Label>
              <Input
                id='placeholder'
                value={selectedField.placeholder || ''}
                onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                placeholder='Enter placeholder text'
                className='text-sm'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='default-value'>Default Value</Label>
              <Input
                id='default-value'
                value={selectedField.defaultValue || ''}
                onChange={(e) => handleUpdate({ defaultValue: e.target.value })}
                placeholder='Enter default value'
                className='text-sm'
              />
            </div>
          </>
        )}

        {selectedField.type === 'dropdown' && (
          <div className='space-y-2'>
            <Label>Options</Label>
            <div className='space-y-2'>
              {(selectedField.options || []).map(
                (option: string, index: number) => (
                  <div key={index} className='flex gap-2'>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(selectedField.options || [])];
                        newOptions[index] = e.target.value;
                        handleUpdate({ options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                      className='text-sm'
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        const newOptions = (selectedField.options || []).filter(
                          (_: string, i: number) => i !== index
                        );
                        handleUpdate({ options: newOptions });
                      }}
                    >
                      <Icons.trash className='h-4 w-4' />
                    </Button>
                  </div>
                )
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  const newOptions = [
                    ...(selectedField.options || []),
                    `Option ${(selectedField.options || []).length + 1}`
                  ];
                  handleUpdate({ options: newOptions });
                }}
                className='w-full'
              >
                <Icons.add className='mr-2 h-4 w-4' />
                Add Option
              </Button>
            </div>
          </div>
        )}

        {selectedField.type === 'date' && (
          <div className='space-y-2'>
            <Label>Date Format</Label>
            <Select
              value={selectedField.defaultValue || 'MM/DD/YYYY'}
              onValueChange={(value) => handleUpdate({ defaultValue: value })}
            >
              <SelectTrigger className='text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='MM/DD/YYYY'>MM/DD/YYYY</SelectItem>
                <SelectItem value='DD/MM/YYYY'>DD/MM/YYYY</SelectItem>
                <SelectItem value='YYYY-MM-DD'>YYYY-MM-DD</SelectItem>
                <SelectItem value='MMM DD, YYYY'>MMM DD, YYYY</SelectItem>
                <SelectItem value='DD MMM YYYY'>DD MMM YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedField.type === 'checkbox' && (
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Default Checked</Label>
              <p className='text-muted-foreground text-xs'>Check by default</p>
            </div>
            <Switch
              checked={selectedField.defaultValue === 'true'}
              onCheckedChange={(checked) =>
                handleUpdate({ defaultValue: checked ? 'true' : 'false' })
              }
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className='border-t p-4'>
        <Button variant='destructive' className='w-full' onClick={handleDelete}>
          <Icons.trash className='mr-2 h-4 w-4' />
          Delete Field
        </Button>
      </div>
    </div>
  );
}
