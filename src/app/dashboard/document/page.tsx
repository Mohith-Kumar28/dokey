import { redirect } from 'next/navigation';
import { auth } from '@/auth/server';
import PageContainer from '@/components/layout/page-container';
import { DocumentList } from '@/features/documents/components/document-list';

export default async function Page() {
  const { userId } = await auth();
  if (!userId) return redirect('/auth/sign-in');
  return (
    <PageContainer scrollable>
      <DocumentList />
    </PageContainer>
  );
}
