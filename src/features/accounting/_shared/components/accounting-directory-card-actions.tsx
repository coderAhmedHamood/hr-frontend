import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DirectoryGridCardFooter } from '@/components/ui/directory-grid-card';

export function AccountingDirectoryCardActions({
  onOpen,
  onDelete,
  openLabel,
  deleteLabel,
}: {
  onOpen: () => void;
  onDelete: () => void;
  openLabel: string;
  deleteLabel: string;
}) {
  return (
    <DirectoryGridCardFooter>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title={openLabel}
        aria-label={openLabel}
        onClick={onOpen}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        title={deleteLabel}
        aria-label={deleteLabel}
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </DirectoryGridCardFooter>
  );
}
