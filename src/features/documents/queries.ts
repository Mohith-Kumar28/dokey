'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import http from '@/lib/http';

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; docJson?: unknown }) => {
      const res = await http.post('/api/documents', payload);
      return res.data as { id: string; title: string; status: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] })
  });
}

export function useDocument(id: string) {
  return useQuery<{ id: string; title: string; docJson: any }>({
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
