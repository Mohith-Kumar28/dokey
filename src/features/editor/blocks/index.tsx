import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AnyBlock, BlockType, DocumentJson, PricingItem } from './types';
import * as React from 'react';

export function createBlock(type: BlockType): AnyBlock {
  const id = crypto.randomUUID();
  if (type === 'text') return { id, type, props: { text: '' } } as AnyBlock;
  if (type === 'image')
    return { id, type, props: { url: '', alt: '' } } as AnyBlock;
  return {
    id,
    type: 'pricing',
    props: { items: [], currency: 'USD' }
  } as AnyBlock;
}

export function BlockRenderer({ block }: { block: AnyBlock }) {
  if (block.type === 'text') {
    return (
      <div className='prose'>
        <p>{block.props.text}</p>
      </div>
    );
  }
  if (block.type === 'image') {
    return (
      <img
        src={(block as any).props.url}
        alt={(block as any).props.alt || ''}
        className='h-auto max-w-full'
      />
    );
  }
  const p = block.props as { items: PricingItem[]; currency?: string };
  return (
    <Card>
      <CardContent className='space-y-2 p-4'>
        {p.items.map((it, i) => (
          <div key={i} className='flex items-center justify-between'>
            <span>{it.label}</span>
            <span>
              {(it.qty ?? 1) * it.price} {p.currency}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BlockInspector({
  block,
  onChange
}: {
  block: AnyBlock;
  onChange: (b: AnyBlock) => void;
}) {
  if (block.type === 'text') {
    return (
      <Input
        value={(block as any).props.text}
        onChange={(e) =>
          onChange({ ...block, props: { text: e.target.value } })
        }
        placeholder='Text'
      />
    );
  }
  if (block.type === 'image') {
    return (
      <div className='space-y-2'>
        <Input
          value={(block as any).props.url}
          onChange={(e) =>
            onChange({
              ...block,
              props: { ...(block as any).props, url: e.target.value }
            })
          }
          placeholder='Image URL'
        />
        <Input
          value={(block as any).props.alt || ''}
          onChange={(e) =>
            onChange({
              ...block,
              props: { ...(block as any).props, alt: e.target.value }
            })
          }
          placeholder='Alt'
        />
      </div>
    );
  }
  const p = block.props as { items: PricingItem[]; currency?: string };
  return (
    <div className='space-y-2'>
      <Input
        value={p.currency || 'USD'}
        onChange={(e) =>
          onChange({ ...block, props: { ...p, currency: e.target.value } })
        }
        placeholder='Currency'
      />
      <Button
        variant='outline'
        onClick={() =>
          onChange({
            ...block,
            props: { ...p, items: [...p.items, { label: '', price: 0 }] }
          })
        }
      >
        Add Item
      </Button>
      <div className='space-y-2'>
        {p.items.map((it, i) => (
          <div key={i} className='grid grid-cols-3 gap-2'>
            <Input
              value={it.label}
              onChange={(e) => {
                const items = [...p.items];
                items[i] = { ...it, label: e.target.value };
                onChange({ ...block, props: { ...p, items } });
              }}
              placeholder='Label'
            />
            <Input
              type='number'
              value={String(it.price)}
              onChange={(e) => {
                const items = [...p.items];
                items[i] = { ...it, price: parseFloat(e.target.value) || 0 };
                onChange({ ...block, props: { ...p, items } });
              }}
              placeholder='Price'
            />
            <Input
              type='number'
              value={String(it.qty ?? 1)}
              onChange={(e) => {
                const items = [...p.items];
                items[i] = { ...it, qty: parseInt(e.target.value) || 1 };
                onChange({ ...block, props: { ...p, items } });
              }}
              placeholder='Qty'
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function evaluateVisibility(
  block: AnyBlock,
  variables?: Record<string, any>
) {
  if (!block.visible_if || block.visible_if.length === 0) return true;
  const v = variables || {};
  return block.visible_if.every((r) => {
    const val = v[r.field];
    if (r.op === 'eq') return val === r.value;
    if (r.op === 'neq') return val !== r.value;
    if (r.op === 'gt') return Number(val) > Number(r.value);
    if (r.op === 'lt') return Number(val) < Number(r.value);
    if (r.op === 'contains') return String(val)?.includes(String(r.value));
    return true;
  });
}
