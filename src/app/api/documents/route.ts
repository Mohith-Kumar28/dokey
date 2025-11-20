import { NextResponse } from 'next/server';
import { auth, getSession } from '@/auth/server';
import { listDocuments, createDocument } from '@/server/documents/repo';
import { ensureCurrentUser } from '@/server/users/repo';
import { z } from 'zod';

import { prisma } from '@/server/db/prisma';

const createSchema = z.object({
  title: z.string().min(1),
  docJson: z.any().optional(),
  templateId: z.string().optional()
});

export async function GET() {
  try {
    const { userId } = await auth();
    const session = await getSession();
    if (!userId)
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const orgScope = (session.orgId as string | null) ?? `user:${userId}`;
    const items = await listDocuments(orgScope);
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const session = await getSession();
    if (!userId)
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const orgScope = (session.orgId as string | null) ?? `user:${userId}`;
    const ownerId = await ensureCurrentUser();
    if (!ownerId)
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    let initialDocJson = parsed.data.docJson;

    if (parsed.data.templateId) {
      const template = await prisma.template.findUnique({
        where: { id: parsed.data.templateId }
      });
      if (template) {
        initialDocJson = template.docJson;
      }
    }

    const created = await createDocument({
      orgId: orgScope,
      ownerId,
      title: parsed.data.title,
      docJson: initialDocJson
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
