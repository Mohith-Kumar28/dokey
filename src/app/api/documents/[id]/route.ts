import { NextResponse } from 'next/server';
import { auth, getSession } from '@/auth/server';
import {
  getDocument,
  updateDocument,
  deleteDocument
} from '@/server/documents/repo';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.string().optional(),
  docJson: z.any().optional()
});

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    const session = await getSession();
    if (!userId)
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const orgScope = (session.orgId as string | null) ?? `user:${userId}`;
    const doc = await getDocument(orgScope, params.id);
    if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    const session = await getSession();
    if (!userId)
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const orgScope = (session.orgId as string | null) ?? `user:${userId}`;
    const updated = await updateDocument({
      orgId: orgScope,
      id: params.id,
      ...parsed.data
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    const session = await getSession();
    if (!userId)
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const orgScope = (session.orgId as string | null) ?? `user:${userId}`;
    const res = await deleteDocument(orgScope, params.id);
    if (!res) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
