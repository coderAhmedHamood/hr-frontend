import { sanitizeRichHtml } from '@/shared/lib/sanitize-rich-html';
import { cn } from '@/shared/utils';

type Props = {
  html: string;
  className?: string;
};

/** Renders stored rich HTML the same way it was authored in the editor. */
export function RichTextHtml({ html, className }: Props) {
  const safe = sanitizeRichHtml(html);
  if (!safe) return null;

  return (
    <div
      className={cn(
        'rich-text-content max-w-none text-sm leading-relaxed text-muted-foreground',
        '[&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground',
        '[&_h2]:mb-2.5 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground',
        '[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground',
        '[&_h4]:mb-2 [&_h4]:mt-3 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground',
        '[&_p]:mb-3 [&_p:last-child]:mb-0',
        '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:ps-5',
        '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:ps-5',
        '[&_li]:mb-1',
        '[&_a]:text-primary [&_a]:underline',
        '[&_blockquote]:my-3 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3 [&_blockquote]:italic',
        '[&_strong]:font-semibold [&_strong]:text-foreground',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
