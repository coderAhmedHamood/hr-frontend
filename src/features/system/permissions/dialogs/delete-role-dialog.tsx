import * as React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { RoleResponseDto } from '@/features/system/permissions/lib/api/roles';

type Props = {
  role: RoleResponseDto | null;
  isDeleting: boolean;
  onConfirm: (roleId: string) => void;
  onClose: () => void;
};

export function DeleteRoleDialog({ role, isDeleting, onConfirm, onClose }: Props) {
  return (
    <Dialog open={!!role} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> حذف الدور
          </DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            هل أنت متأكد من حذف دور{' '}
            <span className="font-semibold text-foreground">
              &quot;{role?.nameAr ?? role?.name}&quot;
            </span>
            ؟ سيفقد المستخدمون المرتبطون به صلاحياتهم. لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={() => role && onConfirm(role.id)}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'جاري الحذف…' : 'حذف الدور'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
