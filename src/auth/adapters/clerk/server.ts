import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';

export async function auth() {
  return clerkAuth();
}

export async function getSession() {
  const { userId, orgId, sessionClaims } = await clerkAuth();
  return {
    userId: userId ?? null,
    orgId: (orgId as string | null) ?? null,
    claims: sessionClaims
  } as any;
}

export async function requireAuth() {
  const { userId } = await clerkAuth();
  if (!userId) throw new Error('unauthorized');
  return { userId };
}

export async function hasRole(roleKey: string) {
  const { sessionClaims } = await clerkAuth();
  const role = (sessionClaims as any)?.org_role as string | undefined;
  return role === roleKey;
}

export async function hasPermission(_permKey: string) {
  return true;
}

export async function getUser() {
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.emailAddresses?.[0]?.emailAddress ?? '',
    name: user.fullName ?? undefined,
    imageUrl: user.imageUrl ?? undefined
  };
}
