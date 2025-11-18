import { NextResponse } from 'next/server';
import { auth } from '@/auth/server';
import { ensureCurrentUser } from '@/server/users/repo';

export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = await ensureCurrentUser();
  if (!id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ ok: true, id });
}
