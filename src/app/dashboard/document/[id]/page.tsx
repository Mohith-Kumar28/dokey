import { redirect } from 'next/navigation';
import { auth } from '@/auth/server';
import PageContainer from '@/components/layout/page-container';
import { DocumentEditor } from '@/features/editor/document-editor';

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return redirect('/auth/sign-in');
  const { id } = await params;
  return (
    <PageContainer scrollable>
      <DocumentEditor id={id} />
    </PageContainer>
  );
}
