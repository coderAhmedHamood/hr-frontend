'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import type { CatalogUom } from '@/features/ecommerce/admin/catalog-uoms/lib/api/catalog-uoms';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  uom: CatalogUom | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (uom: CatalogUom) => void;
  isDeleting?: boolean;
};

export function DeleteCatalogUomDialog({ uom, open, onOpenChange, onConfirm, isDeleting }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            حذف وحدة القياس
          </DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            {uom ? (
              <>
                سيتم أرشفة «<span className="font-semibold text-foreground">{uom.nameAr}</span>». المنتجات المرتبطة
                تحتفظ بأسماء خطوط الوحدات الحالية.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting || !uom}
            onClick={() => uom && onConfirm(uom)}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'جاري الحذف…' : 'حذف'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
