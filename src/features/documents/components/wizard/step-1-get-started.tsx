'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Template {
  id: string;
  title: string;
  description?: string;
  isSystem: boolean;
}

interface Step1Props {
  onNext: (data: {
    templateId?: string;
    mode: 'blank' | 'template' | 'upload';
    file?: File;
  }) => void;
  currentStep: number;
}

export function Step1GetStarted({ onNext, currentStep }: Step1Props) {
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await axios.get<Template[]>('/api/templates');
      return res.data;
    }
  });

  const filteredTemplates = templates?.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    onNext({ mode: 'upload', file });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className='flex h-full flex-col'>
      {/* Progress Stepper */}
      <div className='flex items-center justify-center gap-2 border-b px-8 py-4'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium'>
            1
          </div>
          <span className='text-sm font-medium'>Get started</span>
        </div>

        <Icons.chevronRight className='text-muted-foreground h-4 w-4' />

        <div className='flex items-center gap-2'>
          <div className='border-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs'>
            2
          </div>
          <span className='text-muted-foreground text-sm'>Add recipients</span>
        </div>

        <Icons.chevronRight className='text-muted-foreground h-4 w-4' />

        <div className='flex items-center gap-2'>
          <div className='border-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs'>
            3
          </div>
          <span className='text-muted-foreground text-sm'>Review content</span>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 space-y-6 overflow-y-auto p-8'>
        <div className='space-y-2'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Create a document
          </h1>
          <div className='relative max-w-md'>
            <Icons.search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search templates'
              className='pl-10'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Drag and Drop Upload Zone */}
        <Card
          className={cn(
            'cursor-pointer border-2 border-dashed transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className='p-8'>
            <div className='flex flex-col items-center justify-center space-y-3 text-center'>
              <div className='bg-muted rounded-lg p-3'>
                <Icons.upload className='text-muted-foreground h-6 w-6' />
              </div>
              <div className='space-y-1'>
                <p className='text-sm font-medium'>
                  Drag and drop your files here
                </p>
                <p className='text-muted-foreground text-xs'>
                  Supported files: PDF only (max 10MB)
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Icons.upload className='mr-2 h-4 w-4' />
                Select files
              </Button>
              <input
                ref={fileInputRef}
                type='file'
                accept='application/pdf'
                className='hidden'
                onChange={handleFileInputChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Templates Section */}
        <div className='space-y-4'>
          <h2 className='text-sm font-medium'>
            Create a document from a template, or start with a blank document
          </h2>

          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {/* Blank Document Card */}
            <Card
              className='group cursor-pointer border-dashed transition-shadow hover:shadow-md'
              onClick={() => onNext({ mode: 'blank' })}
            >
              <CardContent className='space-y-3 p-4'>
                <div className='bg-muted group-hover:bg-muted/80 flex aspect-[3/4] items-center justify-center rounded transition-colors'>
                  <Icons.add className='text-muted-foreground h-12 w-12' />
                </div>
                <p className='text-center text-sm font-medium'>
                  Blank document
                </p>
              </CardContent>
            </Card>

            {/* Template Cards */}
            {isLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className='space-y-3 p-4'>
                    <Skeleton className='aspect-[3/4] w-full' />
                    <Skeleton className='mx-auto h-4 w-3/4' />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {filteredTemplates?.map((template) => (
                  <Card
                    key={template.id}
                    className='group cursor-pointer transition-shadow hover:shadow-md'
                    onClick={() =>
                      onNext({ mode: 'template', templateId: template.id })
                    }
                  >
                    <CardContent className='space-y-3 p-4'>
                      <div className='flex aspect-[3/4] items-center justify-center rounded bg-gradient-to-br from-blue-50 to-indigo-50 transition-colors group-hover:from-blue-100 group-hover:to-indigo-100 dark:from-blue-950 dark:to-indigo-950 dark:group-hover:from-blue-900 dark:group-hover:to-indigo-900'>
                        <Icons.page className='h-12 w-12 text-blue-500' />
                      </div>
                      <p className='line-clamp-2 text-center text-sm font-medium'>
                        {template.title}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
