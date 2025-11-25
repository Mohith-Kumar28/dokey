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

    const { pageNumber, type, x, y, width, height, pageWidth, pageHeight } =
      body;

    if (!pageNumber || !type) {
      console.error('Missing required fields:', { pageNumber, type });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: { id, orgId }
    });

    if (!document) {
      console.error('Document not found:', { id, orgId });
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Find or create DocumentPage
    let page = await prisma.documentPage.findUnique({
      where: {
        docId_pageNumber: {
          docId: id,
          pageNumber: parseInt(pageNumber)
        }
      }
    });

    if (!page) {
      try {
        page = await prisma.documentPage.create({
          data: {
            docId: id,
            pageNumber: parseInt(pageNumber),
            imageUrl: '', // TODO: Generate image
            width: parseFloat(pageWidth) || 800,
            height: parseFloat(pageHeight) || 1100
          }
        });
      } catch (e) {
        console.error('Failed to create page:', e);
        return NextResponse.json(
          { error: 'Failed to create page' },
          { status: 500 }
        );
      }
    }

    // Create Field

    try {
      const field = await prisma.field.create({
        data: {
          pageId: page.id,
          type,
          x: parseFloat(x),
          y: parseFloat(y),
          width: parseFloat(width),
          height: parseFloat(height),
          required: false,
          properties: {}
        }
      });
      return NextResponse.json(field);
    } catch (e) {
      console.error('Failed to create field:', e);
      return NextResponse.json(
        { error: 'Failed to create field database record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create field error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create field'
      },
      { status: 500 }
    );
  }
}
