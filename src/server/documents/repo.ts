import { prisma } from '@/server/db/prisma';

export async function listDocuments(orgId: string) {
  return prisma.document.findMany({
    where: { orgId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, status: true, updatedAt: true }
  });
}

export async function getDocument(orgId: string, id: string) {
  return prisma.document.findFirst({
    where: { id, orgId },
    include: {
      pages: {
        include: {
          fields: true
        },
        orderBy: {
          pageNumber: 'asc'
        }
      },
      recipients: true
    }
  });
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

export async function listDocumentsPaged(
  orgId: string,
  opts: { page: number; limit: number; search?: string; status?: string }
) {
  const where: any = { orgId };
  if (opts.search) where.title = { contains: opts.search, mode: 'insensitive' };
  if (opts.status) where.status = opts.status;
  const total = await prisma.document.count({ where });
  const items = await prisma.document.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    skip: (opts.page - 1) * opts.limit,
    take: opts.limit,
    select: { id: true, title: true, status: true, updatedAt: true }
  });
  return { items, total };
}
