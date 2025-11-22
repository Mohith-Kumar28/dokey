import { NextRequest, NextResponse } from 'next/server';
import { auth, getSession } from '@/auth/server';
import { prisma } from '@/server/db/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const session = await getSession();
    if (!userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session.orgId as string | null) ?? `user:${userId}`;
    const { id } = await params;

    const body = await req.json();
    const { pages } = body;

    if (!pages || !Array.isArray(pages)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

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

    // Process updates in a transaction
    await prisma.$transaction(async (tx) => {
      for (const page of pages) {
        // Ensure page exists (create if not)
        const dbPage = await tx.documentPage.upsert({
          where: {
            docId_pageNumber: {
              docId: id,
              pageNumber: page.pageNumber
            }
          },
          update: {
            width: page.width,
            height: page.height
          },
          create: {
            docId: id,
            pageNumber: page.pageNumber,
            imageUrl: '',
            width: page.width,
            height: page.height
          }
        });

        // Upsert fields
        for (const field of page.fields) {
          if (field.id.startsWith('temp_')) {
            // Create new field
            await tx.field.create({
              data: {
                pageId: dbPage.id,
                type: field.type,
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
                required: field.required || false,
                value: field.value,
                recipientId: field.recipientId || null,
                properties: {}
              }
            });
          } else {
            // Update existing field
            await tx.field.update({
              where: { id: field.id },
              data: {
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
                value: field.value,
                required: field.required,
                recipientId: field.recipientId || null
              }
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync changes' },
      { status: 500 }
    );
  }
}
