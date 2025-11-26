import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const recipientId = searchParams.get('recipientId');

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    // Fetch document with pages, fields, and recipients
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        pages: {
          include: {
            fields: true
          },
          orderBy: { pageNumber: 'asc' }
        },
        recipients: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify recipient has access to this document
    const recipient = document.recipients.find((r) => r.id === recipientId);

    if (!recipient) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Filter fields to only show those assigned to this recipient
    const pagesWithRecipientFields = document.pages.map((page) => ({
      ...page,
      fields: page.fields.filter((field) => field.recipientId === recipientId)
    }));

    return NextResponse.json({
      id: document.id,
      title: document.title,
      pdfUrl: document.pdfUrl,
      status: document.status,
      recipient: {
        id: recipient.id,
        name: recipient.name,
        email: recipient.email,
        role: recipient.role
      },
      pages: pagesWithRecipientFields
    });
  } catch (error) {
    console.error('[Sign/GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
