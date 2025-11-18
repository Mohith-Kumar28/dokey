'use client';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { Button } from '@/components/ui/button';
import { useCreateDocument } from '@/features/documents/queries';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

interface DocumentTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

export function DocumentTable<TData, TValue>({
  data,
  totalItems,
  columns
}: DocumentTableParams<TData, TValue>) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const pageCount = Math.ceil(totalItems / pageSize);
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500
  });
  const createMutation = useCreateDocument();
  const router = useRouter();
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <Button
          size='sm'
          disabled={createMutation.isPending}
          onClick={async () => {
            const doc = await createMutation.mutateAsync({
              title: 'Untitled Document'
            });
            router.push(`/dashboard/document/${doc.id}`);
          }}
        >
          <Icons.add /> Create Document
        </Button>
      </DataTableToolbar>
    </DataTable>
  );
}
