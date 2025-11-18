'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { BlockRenderer, BlockInspector, createBlock } from './blocks';
import { AnyBlock, DocumentJson } from './blocks/types';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useDocument, useUpdateDocument } from '@/features/documents/queries';

function SortableItem({
  id,
  children
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div data-id={id} className='bg-card rounded-md border p-3'>
      {children}
    </div>
  );
}

export function DocumentEditor({ id }: { id: string }) {
  const docQuery = useDocument(id);
  const saveMutation = useUpdateDocument(id);

  const [selected, setSelected] = React.useState<string | null>(null);
  if (docQuery.isLoading) return <div>Loading</div>;
  if (docQuery.error) return <div>Error</div>;
  const doc = docQuery.data!;
  const blocks = (doc.docJson?.blocks ?? []) as AnyBlock[];

  function updateBlock(next: AnyBlock) {
    const idx = blocks.findIndex((b) => b.id === next.id);
    if (idx >= 0) {
      const updated = [...blocks];
      updated[idx] = next;
      saveMutation.mutate({
        docJson: { ...(doc.docJson || { blocks: [] }), blocks: updated }
      });
    }
  }

  function addBlock(type: 'text' | 'image' | 'pricing') {
    const b = createBlock(type);
    saveMutation.mutate({
      docJson: { ...(doc.docJson || { blocks: [] }), blocks: [...blocks, b] }
    });
  }

  function removeBlock(id: string) {
    const updated = blocks.filter((b) => b.id !== id);
    saveMutation.mutate({
      docJson: { ...(doc.docJson || { blocks: [] }), blocks: updated }
    });
  }

  function onDragEnd(e: any) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(blocks, oldIdx, newIdx);
    saveMutation.mutate({
      docJson: { ...(doc.docJson || { blocks: [] }), blocks: reordered }
    });
  }

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
      <div className='space-y-3 md:col-span-2'>
        <Card>
          <CardHeader>
            <CardTitle>{doc.title}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => addBlock('text')}>
                Add Text
              </Button>
              <Button variant='outline' onClick={() => addBlock('image')}>
                Add Image
              </Button>
              <Button variant='outline' onClick={() => addBlock('pricing')}>
                Add Pricing
              </Button>
            </div>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='space-y-3'>
                  {blocks.map((b) => (
                    <SortableItem key={b.id} id={b.id}>
                      <div className='space-y-2'>
                        <BlockRenderer block={b} />
                        <div className='flex gap-2'>
                          <Button
                            variant='secondary'
                            onClick={() => setSelected(b.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant='destructive'
                            onClick={() => removeBlock(b.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Inspector</CardTitle>
          </CardHeader>
          <CardContent>
            {selected ? (
              <BlockInspector
                block={blocks.find((b) => b.id === selected)!}
                onChange={(nb) => updateBlock(nb)}
              />
            ) : (
              <div>Select a block</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
