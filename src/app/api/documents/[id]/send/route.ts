import { NextResponse } from 'next/server';
import { auth, getSession } from '@/auth/server';
import { prisma } from '@/server/db/prisma';
import { getEmailService } from '@/lib/email';

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
      include: { recipients: true, owner: true }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients added to document' },
        { status: 400 }
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

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const links: Record<string, string> = {};
    const emailResults: Array<{
      recipient: string;
      success: boolean;
      error?: string;
    }> = [];

    // Generate unique links for each recipient
    for (const recipient of document.recipients) {
      const signingLink = `${origin}/sign/${id}?recipientId=${recipient.id}`;
      links[recipient.id] = signingLink;

      // Send email if delivery method is email
      if (deliveryMethod === 'email') {
        try {
          const emailService = getEmailService();
          const result = await emailService.sendDocumentInvitation({
            to: recipient.email,
            recipientName: recipient.name,
            documentTitle: title || document.title,
            signingLink,
            senderName: document.owner?.name || undefined
          });

          emailResults.push({
            recipient: recipient.email,
            success: result.success,
            error: result.error
          });

          if (!result.success) {
            console.error(
              `[Send] Failed to send email to ${recipient.email}:`,
              result.error
            );
          }
        } catch (error) {
          console.error(
            `[Send] Exception sending email to ${recipient.email}:`,
            error
          );
          emailResults.push({
            recipient: recipient.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    console.log(`[Send] Document ${id} sent via ${deliveryMethod}`);

    // Check if all emails were sent successfully
    const allEmailsSent = emailResults.every((r) => r.success);
    const someEmailsFailed = emailResults.some((r) => !r.success);

    return NextResponse.json({
      ...updatedDoc,
      links,
      emailResults: deliveryMethod === 'email' ? emailResults : undefined,
      warning:
        someEmailsFailed && !allEmailsSent
          ? 'Some emails failed to send'
          : undefined
    });
  } catch (error) {
    console.error('[Send] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send document' },
      { status: 500 }
    );
  }
}
