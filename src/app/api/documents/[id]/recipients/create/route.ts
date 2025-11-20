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
  const body = recipientSchema.safeParse(json);

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

  // Create single recipient
  const recipient = await prisma.recipient.create({
    data: {
      docId: id,
      ...body.data,
      // Generate a random color for the recipient
      color:
        '#' +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')
    }
  });

  return NextResponse.json(recipient);
}
