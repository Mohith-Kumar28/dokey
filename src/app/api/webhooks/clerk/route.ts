import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { Webhook } from 'svix';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json({ error: 'missing_secret' }, { status: 500 });

  const payload = await req.text();
  const headers = Object.fromEntries((req.headers as any).entries());
  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'missing_headers' }, { status: 400 });
  }

  const wh = new Webhook(secret);
  let evt: any;
  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    });
  } catch (e) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const { type, data } = evt as { type: string; data: any };

  if (type === 'user.created' || type === 'user.updated') {
    const id = data.id as string;
    const email = (data.email_addresses?.[0]?.email_address as string) ?? '';
    const imageUrl = (data.image_url as string) ?? undefined;
    const name =
      (data.first_name || '') + (data.last_name ? ` ${data.last_name}` : '');

    await prisma.user.upsert({
      where: { externalProviderId: id },
      update: { email, name: name || undefined, imageUrl },
      create: {
        externalProviderId: id,
        email,
        name: name || undefined,
        imageUrl
      }
    });
  }

  return NextResponse.json({ ok: true });
}
