import { prisma } from '@/server/db/prisma';
import { getUser, auth } from '@/auth/server';

export async function ensureCurrentUser() {
  const u = await getUser();
  if (u) {
    const existing = await prisma.user.findUnique({
      where: { externalProviderId: u.id }
    });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: u.email,
          name: u.name,
          imageUrl: u.imageUrl,
          lastActiveAt: new Date()
        }
      });
      return existing.id;
    }
    const created = await prisma.user.create({
      data: {
        externalProviderId: u.id,
        email: u.email,
        name: u.name,
        imageUrl: u.imageUrl,
        lastActiveAt: new Date()
      }
    });
    return created.id;
  }

  const { userId } = await auth();
  if (!userId) return null;
  const placeholderEmail = `${userId}@invalid.local`;
  const existing = await prisma.user.findUnique({
    where: { externalProviderId: userId }
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { lastActiveAt: new Date() }
    });
    return existing.id;
  }
  const created = await prisma.user.create({
    data: {
      externalProviderId: userId,
      email: placeholderEmail,
      lastActiveAt: new Date()
    }
  });
  return created.id;
}
