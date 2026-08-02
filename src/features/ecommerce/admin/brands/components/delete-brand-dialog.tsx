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
import type { Brand } from '@/features/ecommerce/domain/types/brand';

type Props = {
  brand: Brand | null;
  isDeleting: boolean;
  onConfirm: (brand: Brand) => void;
  onClose: () => void;
};

export function DeleteBrandDialog({ brand, isDeleting, onConfirm, onClose }: Props) {
  return (
    <Dialog open={!!brand} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> حذف العلامة التجارية
          </DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            هل أنت متأكد من حذف علامة{' '}
            <span className="font-semibold text-foreground">&quot;{brand?.nameAr}&quot;</span>؟ لا يمكن التراجع
            عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="destructive" disabled={isDeleting} onClick={() => brand && onConfirm(brand)}>
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'جاري الحذف…' : 'حذف العلامة'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
