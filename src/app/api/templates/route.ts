import { auth, getSession } from '@/auth/server';
import { prisma } from '@/server/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const session = await getSession();
  const orgId = session.orgId;

  // Fetch system templates and org-specific templates
  const templates = await prisma.template.findMany({
    where: {
      OR: [{ isSystem: true }, { orgId: orgId || `user:${userId}` }]
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(templates);
}
