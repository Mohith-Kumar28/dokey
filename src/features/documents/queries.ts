'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import http from '@/lib/http';

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      docJson?: unknown;
      templateId?: string;
    }) => {
      const res = await http.post('/api/documents', payload);
      return res.data as { id: string; title: string; status: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] })
  });
}

export function useDocument(id: string) {
  return useQuery<{
    id: string;
    title: string;
    docJson: any;
    pdfUrl?: string | null;
    pages: Array<{
      id: string;
      pageNumber: number;
      width: number;
      height: number;
      fields: Array<{
        id: string;
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
        value?: string | null;
        required: boolean;
        recipientId?: string | null;
        label?: string | null;
        properties?: any;
      }>;
    }>;
    recipients: Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      color: string;
    }>;
  }>({
    queryKey: ['document', id],
    queryFn: async () => {
      const res = await http.get(`/api/documents/${id}`);
      return res.data;
    }
  });
}

export function useUpdateDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<{ title: string; docJson: any }>) => {
      const res = await http.put(`/api/documents/${id}`, payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document', id] })
  });
}

export function useDeleteDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await http.delete(`/api/documents/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
    }
  });
}

export function useCreateField(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      pageNumber: number;
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
      pageWidth?: number;
      pageHeight?: number;
    }) => {
      const res = await http.post(`/api/documents/${docId}/fields`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document', docId] });
    }
  });
}

export function useAddPage(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await http.post(`/api/documents/${docId}/pages`, {});
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document', docId] });
    }
  });
}

export function useSyncDocument(docId: string) {
  return useMutation({
    mutationFn: async (payload: { pages: any[] }) => {
      const res = await http.post(`/api/documents/${docId}/sync`, payload);
      return res.data;
    }
  });
}

export function useCreateRecipient(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      name: string;
      role: string;
      deliveryMethod?: 'email' | 'sms' | 'link';
    }) => {
      const res = await http.post(
        `/api/documents/${docId}/recipients/create`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document', docId] });
    }
  });
}

export function useSendDocument(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title?: string;
      deliveryMethod: 'email' | 'link';
    }) => {
      const res = await http.post(`/api/documents/${docId}/send`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document', docId] });
      qc.invalidateQueries({ queryKey: ['documents'] });
    }
  });
}
