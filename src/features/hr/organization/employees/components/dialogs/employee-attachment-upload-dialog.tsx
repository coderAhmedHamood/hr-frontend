'use client';

import * as React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES,
} from '@/features/hr/organization/employees/constants/employee-attachment-document-types';
import type { EmployeeAttachmentUploadInput } from '@/features/hr/organization/employees/lib/api/employee-attachments';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  onUpload: (input: Omit<EmployeeAttachmentUploadInput, 'companyId' | 'employeeId' | 'createdBy'>) => Promise<unknown>;
  onSuccess: () => void;
};

export function EmployeeAttachmentUploadDialog({
  open,
  onOpenChange,
  employeeName,
  onUpload,
  onSuccess,
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [documentType, setDocumentType] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setFile(null);
    setDocumentType('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  React.useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('يرجى اختيار ملف للرفع');
      return;
    }
    if (!documentType) {
      setError('يرجى اختيار نوع المستند');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await onUpload({
        file,
        // The backend requires a display name; use the selected filename.
        name: file.name,
        documentType,
      });
      toast.success('تم رفع المرفق بنجاح');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employee-attachments.upload');
      setError(displayMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-display">رفع مرفق جديد</DialogTitle>
          <DialogDescription className="text-xs">
            رفع ملف وربطه بملف الموظف — {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              الملف <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                className="h-9 cursor-pointer text-xs"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
            {file ? (
              <p className="text-[11px] text-muted-foreground" dir="ltr">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              نوع المستند <span className="text-destructive">*</span>
            </Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button variant="luxe" onClick={() => void handleSubmit()} disabled={uploading} className="gap-2">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            رفع المرفق
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
