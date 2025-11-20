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

    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: { id, orgId },
      include: {
        pages: {
          orderBy: { pageNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const lastPageNumber = document.pages[0]?.pageNumber || 0;
    const newPageNumber = lastPageNumber + 1;

    // Create a new blank page
    const page = await prisma.documentPage.create({
      data: {
        docId: id,
        pageNumber: newPageNumber,
        imageUrl: '', // Blank page
        width: 800, // Default width
        height: 1100 // Default height (approx A4 at 96 DPI)
      }
    });

    // Update document page count
    await prisma.document.update({
      where: { id },
      data: { pageCount: { increment: 1 } }
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Add page error:', error);
    return NextResponse.json({ error: 'Failed to add page' }, { status: 500 });
  }
}
