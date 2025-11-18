import { searchParamsCache } from '@/lib/searchparams';
import { DocumentTable } from './document-tables';
import { columns, DocumentRow } from './document-tables/columns';
import { listDocumentsPaged } from '@/server/documents/repo';
import { auth, getSession } from '@/auth/server';

export default async function DocumentListingPage() {
  const { userId } = await auth();
  const session = await getSession();
  if (!userId) return null;
  const page = searchParamsCache.get('page');
  const limit = searchParamsCache.get('perPage');
  const search = searchParamsCache.get('name');
  const status = searchParamsCache.get('status');
  const orgScope = (session.orgId as string | null) ?? `user:${userId}`;
  const { items, total } = await listDocumentsPaged(orgScope, {
    page,
    limit,
    search: search ?? undefined,
    status: status ?? undefined
  });
  const rows: DocumentRow[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    status: i.status,
    updatedAt: String(i.updatedAt)
  }));
  return <DocumentTable data={rows} totalItems={total} columns={columns} />;
}
