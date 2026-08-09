'use client';

import * as React from 'react';
import { Camera, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { pickAndUploadProductImages } from '@/features/ecommerce/admin/products/lib/pick-product-image';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';

const MAX_VARIANT_IMAGES = 20;

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
};

/** Gallery editor for a variant's images — first image is the cover shown in the storefront. */
export function ProductVariantImageGallery({ images, onChange }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const cover = images[0];

  async function addImages() {
    if (images.length >= MAX_VARIANT_IMAGES) return;
    setUploading(true);
    const urls = await pickAndUploadProductImages();
    setUploading(false);
    if (urls.length === 0) return;
    const remaining = MAX_VARIANT_IMAGES - images.length;
    onChange([...images, ...urls.slice(0, remaining)]);
  }

  /** Clears the gallery and immediately opens the picker so the user can upload a fresh set. */
  async function replaceAllImages() {
    setUploading(true);
    const urls = await pickAndUploadProductImages();
    setUploading(false);
    if (urls.length === 0) return;
    onChange(urls.slice(0, MAX_VARIANT_IMAGES));
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="relative h-12 w-12 overflow-hidden p-0"
            aria-label="صور المتغير"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveUploadUrl(cover)} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-4 w-4 text-muted-foreground" />
            )}
            {images.length > 1 ? (
              <span className="absolute bottom-0 end-0 rounded-tl-md bg-foreground/80 px-1 text-[10px] font-medium text-background">
                {images.length}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                صور المتغير ({images.length}/{MAX_VARIANT_IMAGES})
              </p>
              {images.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void replaceAllImages()}
                  disabled={uploading}
                  className="flex items-center gap-1 text-[11px] font-medium text-destructive hover:underline disabled:opacity-60"
                >
                  <Trash2 className="h-3 w-3" />
                  إزالة الكل واستبدال
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {images.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-md border border-border"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(url)}
                    className="block h-full w-full"
                    aria-label="معاينة الصورة"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveUploadUrl(url)} alt="" className="h-full w-full object-cover" />
                  </button>
                  {index === 0 ? (
                    <span className="pointer-events-none absolute inset-x-0 top-0 bg-primary/90 text-center text-[9px] font-medium text-primary-foreground">
                      غلاف
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute end-0.5 top-0.5 rounded-full bg-foreground/70 p-0.5 text-background opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="إزالة الصورة"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < MAX_VARIANT_IMAGES ? (
                <button
                  type="button"
                  onClick={() => void addImages()}
                  disabled={uploading}
                  className="flex aspect-square items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:border-primary/50 disabled:opacity-60"
                  aria-label="إضافة صور"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              ) : null}
            </div>
            {images.length > 1 ? (
              <p className="text-[11px] text-muted-foreground">
                الصورة الأولى هي صورة الغلاف الظاهرة في القائمة والمتجر. اضغط على أي صورة لمعاينتها.
              </p>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={previewUrl != null} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          <VisuallyHidden.Root>
            <DialogTitle>معاينة صورة المتغير</DialogTitle>
          </VisuallyHidden.Root>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveUploadUrl(previewUrl)} alt="" className="h-auto w-full object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
