import { prisma } from '@/server/db/prisma';

export async function listDocuments(orgId: string) {
  return prisma.document.findMany({
    where: { orgId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, status: true, updatedAt: true }
  });
}

export async function getDocument(orgId: string, id: string) {
  return prisma.document.findFirst({ where: { id, orgId } });
}

export async function createDocument(params: {
  orgId: string;
  ownerId: string;
  title: string;
  docJson?: unknown;
}) {
  return prisma.document.create({
    data: {
      orgId: params.orgId,
      ownerId: params.ownerId,
      title: params.title,
      docJson: (params.docJson ?? { blocks: [] }) as any
    },
    select: { id: true, title: true, status: true }
  });
}

export async function updateDocument(params: {
  orgId: string;
  id: string;
  title?: string;
  status?: string;
  docJson?: unknown;
}) {
  return prisma.document.update({
    where: { id: params.id },
    data: {
      title: params.title,
      status: params.status,
      docJson: (params.docJson as any) ?? undefined
    }
  });
}

export async function deleteDocument(orgId: string, id: string) {
  const existing = await prisma.document.findFirst({ where: { id, orgId } });
  if (!existing) return null;
  await prisma.document.delete({ where: { id } });
  return { id };
}
