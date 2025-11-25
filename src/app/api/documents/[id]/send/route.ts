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

    const { title, deliveryMethod } = await req.json();

    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: { id, orgId },
      include: { recipients: true }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update status to SENT and update title if provided
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        status: 'SENT',
        ...(title && { title })
      }
    });

    let links: Record<string, string> = {};
    if (deliveryMethod === 'link') {
      const origin = req.headers.get('origin') || 'http://localhost:3000';
      document.recipients.forEach((recipient) => {
        // Generate unique link for each recipient
        // In a real app, this should be a secure, signed token
        links[recipient.id] =
          `${origin}/sign/${id}?recipientId=${recipient.id}`;
      });
    }

    // TODO: Integrate actual email sending service (Resend, SendGrid, etc.)
    console.log(`[Send] Document ${id} sent via ${deliveryMethod}`);

    return NextResponse.json({ ...updatedDoc, links });
  } catch (error) {
    console.error('[Send] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send document' },
      { status: 500 }
    );
  }
}
