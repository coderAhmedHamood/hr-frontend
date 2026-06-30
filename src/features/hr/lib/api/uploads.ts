import { apiFormRequest } from '@/features/hr/lib/api/client';

export type UploadCategory = 'image' | 'pdf' | 'document' | 'other';

export type UploadResponseDto = {
  category: UploadCategory;
  fileName: string;
  originalName: string;
  path: string;
  url: string;
  absolutePath: string;
  mimeType: string;
  size: number;
};

export const uploadsApi = {
  upload(category: UploadCategory, file: File, signal?: AbortSignal) {
    const formData = new FormData();
    formData.append('file', file);
    return apiFormRequest<UploadResponseDto>(`/uploads/${category}`, formData, signal);
  },
};
