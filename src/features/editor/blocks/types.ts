export type BlockType = 'text' | 'image' | 'pricing';

export type VisibleRule = {
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
  value: any;
};

export type BlockBase = {
  id: string;
  type: BlockType;
  bindings?: Record<string, string>;
  visible_if?: VisibleRule[];
};

export type TextBlock = BlockBase & {
  type: 'text';
  props: { text: string };
};

export type ImageBlock = BlockBase & {
  type: 'image';
  props: { url: string; alt?: string };
};

export type PricingItem = { label: string; price: number; qty?: number };
export type PricingBlock = BlockBase & {
  type: 'pricing';
  props: { items: PricingItem[]; currency?: string };
};

export type AnyBlock = TextBlock | ImageBlock | PricingBlock;

export type DocumentJson = {
  blocks: AnyBlock[];
  variables?: Record<string, any>;
};
