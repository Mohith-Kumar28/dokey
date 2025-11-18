'use client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Text } from 'lucide-react';

export type DocumentRow = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
};

export const columns: ColumnDef<DocumentRow>[] = [
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<DocumentRow, unknown> }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/document/${row.original.id}`}
        className='hover:underline'
      >
        {row.getValue('title')}
      </Link>
    ),
    meta: {
      label: 'Title',
      placeholder: 'Search documents...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<DocumentRow, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => (
      <Badge variant='outline'>{cell.getValue<string>()}</Badge>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Approved', value: 'approved' }
      ]
    }
  },
  {
    id: 'updatedAt',
    accessorKey: 'updatedAt',
    header: 'Updated'
  }
];
