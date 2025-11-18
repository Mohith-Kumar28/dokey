import { redirect } from 'next/navigation';
import { auth } from '@/auth/server';
import PageContainer from '@/components/layout/page-container';
import DocumentListingPage from '@/features/documents/components/document-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

type PageProps = { searchParams: Promise<SearchParams> };

export default async function Page(props: PageProps) {
  const { userId } = await auth();
  if (!userId) return redirect('/auth/sign-in');

  const sp = await props.searchParams;
  searchParamsCache.parse(sp);

  return (
    <PageContainer scrollable={false}>
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={3} rowCount={8} filterCount={2} />
        }
      >
        {/* @ts-expect-error RSC */}
        <DocumentListingPage />
      </Suspense>
    </PageContainer>
  );
}
