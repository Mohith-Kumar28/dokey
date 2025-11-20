import { NextRequest, NextResponse } from 'next/server';
import { auth, getSession } from '@/auth/server';
import { prisma } from '@/server/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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
      where: { id, orgId }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'pdfs');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save PDF file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${id}-${Date.now()}.pdf`;
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const pdfUrl = `/uploads/pdfs/${filename}`;

    // Update document with PDF info
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        pdfUrl,
        pdfPath: filepath,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      pdfUrl,
      document: updatedDoc
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload PDF' },
      { status: 500 }
    );
  }
}
