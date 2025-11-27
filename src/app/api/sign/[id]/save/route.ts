import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { z } from 'zod';

const saveSchema = z.object({
  recipientId: z.string(),
  fieldValues: z.record(z.string(), z.string())
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const body = await req.json();
    const { recipientId, fieldValues } = saveSchema.parse(body);

    // Verify document and recipient exist
    const recipient = await prisma.recipient.findUnique({
      where: { id: recipientId },
      include: { document: true }
    });

    if (!recipient || recipient.docId !== documentId) {
      return NextResponse.json(
        { error: 'Invalid recipient or document' },
        { status: 404 }
      );
    }

    // Update fields in a transaction
    await prisma.$transaction(
      Object.entries(fieldValues).map(([fieldId, value]) =>
        prisma.field.updateMany({
          where: {
            id: fieldId,
            recipientId: recipientId,
            page: {
              docId: documentId
            }
          },
          data: {
            // Empty string means clear the field (set to null)
            value: value === '' ? null : (value as string)
          }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auto-save error:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}
