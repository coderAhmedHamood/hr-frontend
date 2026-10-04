'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Product } from '@/features/ecommerce/domain/types/product';

type Props = {
  product: Product | null;
  isDeleting: boolean;
  onConfirm: (product: Product) => void;
  onClose: () => void;
};

export function DeleteProductDialog({ product, isDeleting, onConfirm, onClose }: Props) {
  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> حذف المنتج
          </DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            هل أنت متأكد من حذف منتج{' '}
            <span className="font-semibold text-foreground">&quot;{product?.nameAr}&quot;</span>؟ لا يمكن
            التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={() => product && onConfirm(product)}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'جاري الحذف…' : 'حذف المنتج'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
