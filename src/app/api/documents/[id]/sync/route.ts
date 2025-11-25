// Force rebuild
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
    const fieldIdMappings: Record<string, string> = {};

    await prisma.$transaction(
      async (tx) => {
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

          // Delete fields that are no longer in the payload
          const currentFieldIds = page.fields
            .filter((f: any) => !f.id.startsWith('temp_'))
            .map((f: any) => f.id);

          await tx.field.deleteMany({
            where: {
              pageId: dbPage.id,
              id: {
                notIn: currentFieldIds
              }
            }
          });

          // Upsert fields
          for (const field of page.fields) {
            const fieldProperties = {
              placeholder: field.placeholder,
              defaultValue: field.defaultValue,
              options: field.options
            };

            /*
          console.log(`[Sync] Processing field ${field.id}:`, {
            type: field.type,
            label: field.label,
            required: field.required,
            properties: fieldProperties
          });
          */

            if (field.id.startsWith('temp_')) {
              // Create new field
              const newField = await tx.field.create({
                data: {
                  pageId: dbPage.id,
                  type: field.type,
                  x: field.x,
                  y: field.y,
                  width: field.width,
                  height: field.height,
                  required: field.required || false,
                  value: field.value,
                  label: field.label,
                  recipientId: field.recipientId || null,
                  properties: fieldProperties
                }
              });
              // Store the mapping of temp ID to real ID
              fieldIdMappings[field.id] = newField.id;
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
                  label: field.label,
                  recipientId: field.recipientId || null,
                  properties: fieldProperties
                }
              });
            }
          }
        }
      },
      {
        maxWait: 5000,
        timeout: 20000
      }
    );

    return NextResponse.json({ success: true, fieldIdMappings });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync changes' },
      { status: 500 }
    );
  }
}
