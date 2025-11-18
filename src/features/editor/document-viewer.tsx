'use client';
import * as React from 'react';
import { useDocument } from '@/features/documents/queries';
import { BlockRenderer } from './blocks';
import { AnyBlock, DocumentJson } from './blocks/types';

export function DocumentViewer({ id }: { id: string }) {
  const docQuery = useDocument(id);
  if (docQuery.isLoading) return <div>Loading</div>;
  if (docQuery.error) return <div>Error</div>;
  const blocks = (docQuery.data?.docJson?.blocks ?? []) as AnyBlock[];
  return (
    <div className='space-y-3'>
      {blocks.map((b) => (
        <div key={b.id}>
          <BlockRenderer block={b} />
        </div>
      ))}
    </div>
  );
}
