import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function useUploadPDF(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `/api/documents/${documentId}/upload-pdf`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    },
    onSuccess: () => {
      // Invalidate document query to refetch with new PDF URL
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });
}
