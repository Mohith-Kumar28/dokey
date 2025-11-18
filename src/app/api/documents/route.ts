import { NextResponse } from 'next/server';
import { auth, getSession } from '@/auth/server';
import { listDocuments, createDocument } from '@/server/documents/repo';
import { ensureCurrentUser } from '@/server/users/repo';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  docJson: z.any().optional()
});

export async function GET() {
  const { userId } = await auth();
  const session = await getSession();
  if (!userId)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const orgScope = (session.orgId as string | null) ?? `user:${userId}`;
  const items = await listDocuments(orgScope);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  const session = await getSession();
  if (!userId)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const orgScope = (session.orgId as string | null) ?? `user:${userId}`;
  const ownerId = await ensureCurrentUser();
  if (!ownerId)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const created = await createDocument({
    orgId: orgScope,
    ownerId,
    title: parsed.data.title,
    docJson: parsed.data.docJson
  });
  return NextResponse.json(created, { status: 201 });
}
