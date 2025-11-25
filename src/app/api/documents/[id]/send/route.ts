import { NextResponse } from 'next/server';
import { auth, getSession } from '@/auth/server';
import { prisma } from '@/server/db/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const session = await getSession();
    if (!userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session.orgId as string | null) ?? `user:${userId}`;
    const { id } = await params;

    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: { id, orgId }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update status to SENT
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        status: 'SENT'
      }
    });

    // TODO: Integrate actual email sending service (Resend, SendGrid, etc.)
    console.log(`[Send] Document ${id} sent to recipients`);

    return NextResponse.json(updatedDoc);
  } catch (error) {
    console.error('[Send] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send document' },
      { status: 500 }
    );
  }
}
