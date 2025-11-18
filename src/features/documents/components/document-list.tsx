'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { IconTrash, IconEdit } from '@tabler/icons-react';

type Doc = { id: string; title: string; status: string };

export function DocumentList() {
  const qc = useQueryClient();
  const docsQuery = useQuery<Doc[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const r = await fetch('/api/documents');
      if (!r.ok) throw new Error('error');
      return r.json();
    }
  });
  const createMutation = useMutation({
    mutationFn: async (payload: { title: string }) => {
      const r = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error('error');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] })
  });
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; title: string }) => {
      const r = await fetch(`/api/documents/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: payload.title })
      });
      if (!r.ok) throw new Error('error');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] })
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('error');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] })
  });

  const form = useForm<{ title: string }>({ defaultValues: { title: '' } });
  function onSubmit(values: { title: string }) {
    createMutation.mutate({ title: values.title });
    form.reset();
  }

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>New Document</CardTitle>
        </CardHeader>
        <CardContent>
          <Form
            form={form}
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex gap-2'
          >
            <Input
              placeholder='Title'
              {...form.register('title', { required: true })}
            />
            <Button type='submit'>Create</Button>
          </Form>
        </CardContent>
      </Card>
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {docsQuery.isLoading ? (
            <div>Loading</div>
          ) : docsQuery.error ? (
            <div>Error</div>
          ) : (
            <ul className='space-y-2'>
              {docsQuery.data?.map((d) => (
                <li
                  key={d.id}
                  className='flex items-center justify-between gap-2'
                >
                  <span className='truncate'>{d.title}</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs'>{d.status}</span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const title =
                          window.prompt('Rename document', d.title) ?? d.title;
                        if (title && title !== d.title)
                          updateMutation.mutate({ id: d.id, title });
                      }}
                    >
                      <IconEdit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => deleteMutation.mutate(d.id)}
                    >
                      <IconTrash className='h-4 w-4' />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
