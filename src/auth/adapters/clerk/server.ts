import { auth as clerkAuth } from '@clerk/nextjs/server';

export async function auth() {
  return clerkAuth();
}

export async function getSession() {
  const { userId, orgId, sessionClaims } = await clerkAuth();
  return { userId: userId ?? null, orgId: (orgId as string | null) ?? null, claims: sessionClaims } as any;
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