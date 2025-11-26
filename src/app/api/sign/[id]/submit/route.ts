import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { recipientId, fieldValues } = await req.json();

    if (!recipientId || !fieldValues) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify recipient has access
    const document = await prisma.document.findUnique({
      where: { id },
      include: { recipients: true, pages: { include: { fields: true } } }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const recipient = document.recipients.find((r) => r.id === recipientId);
    if (!recipient) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Update field values
    const updatePromises = Object.entries(fieldValues).map(
      ([fieldId, value]) => {
        return prisma.field.update({
          where: { id: fieldId },
          data: { value: value as string }
        });
      }
    );

    await Promise.all(updatePromises);

    // Check if all required fields for this recipient are filled
    const recipientFields = document.pages.flatMap((page) =>
      page.fields.filter((f) => f.recipientId === recipientId)
    );

    const allRequiredFilled = recipientFields
      .filter((f) => f.required)
      .every((f) => {
        const newValue = fieldValues[f.id];
        return newValue && newValue.trim() !== '';
      });

    if (!allRequiredFilled) {
      return NextResponse.json({
        success: true,
        message: 'Fields saved, but some required fields are still empty',
        allComplete: false
      });
    }

    // TODO: Check if all recipients have completed their fields
    // If yes, update document status to 'COMPLETED'

    return NextResponse.json({
      success: true,
      message: 'Document signed successfully',
      allComplete: true
    });
  } catch (error) {
    console.error('[Sign/Submit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit signature' },
      { status: 500 }
    );
  }
}
