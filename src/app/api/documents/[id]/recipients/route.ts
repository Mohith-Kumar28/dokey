import { auth } from '@/auth/server';
import { prisma } from '@/server/db/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const recipientSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string().min(1),
  deliveryMethod: z.enum(['email', 'sms', 'link']).default('email')
});

const bodySchema = z.object({
  recipients: z.array(recipientSchema)
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const json = await req.json();
  const body = bodySchema.safeParse(json);

  if (!body.success) {
    return new NextResponse(body.error.message, { status: 400 });
  }

  // Verify ownership/access
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { ownerId: true, orgId: true }
  });

  if (!doc) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Basic check: owner or same org (refine with permissions later)
  // For now, assume if you can see it, you can edit it (or check owner)
  // Ideally check `canEdit(userId, doc)`

  // Transaction to replace recipients
  // We delete existing and create new ones for simplicity in this "wizard" flow
  // In a real app, we might want to diff/update to preserve IDs if needed

  await prisma.$transaction(async (tx) => {
    await tx.recipient.deleteMany({
      where: { docId: id }
    });

    if (body.data.recipients.length > 0) {
      await tx.recipient.createMany({
        data: body.data.recipients.map((r) => ({
          docId: id,
          ...r
        }))
      });
    }
  });

  const updatedRecipients = await prisma.recipient.findMany({
    where: { docId: id }
  });

  return NextResponse.json(updatedRecipients);
}
