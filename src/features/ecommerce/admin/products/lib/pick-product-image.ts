import { toast } from 'sonner';
import { uploadsApi } from '@/features/hr/lib/api/uploads';
import { uploadResponseToStoredPath } from '@/shared/resolve-upload-url';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

async function uploadProductImage(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) {
    toast.error('يرجى اختيار ملف صورة');
    return null;
  }
  try {
    const uploaded = await uploadsApi.upload('products', file);
    return uploadResponseToStoredPath(uploaded);
  } catch (err) {
    const { displayMessage } = handleApiError(err, 'uploads.products');
    toast.error(displayMessage);
    return null;
  }
}

/** Opens a native file picker, uploads the chosen image to `/uploads/products`, and resolves its stored path. */
export function pickAndUploadProductImage(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      resolve(await uploadProductImage(file));
    };
    input.click();
  });
}

/** Opens a native file picker allowing multiple images, uploads each, and resolves their stored paths in order. */
export function pickAndUploadProductImages(): Promise<string[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      if (files.length === 0) {
        resolve([]);
        return;
      }
      const uploaded = await Promise.all(files.map(uploadProductImage));
      resolve(uploaded.filter((url): url is string => Boolean(url)));
    };
    input.click();
  });
}
