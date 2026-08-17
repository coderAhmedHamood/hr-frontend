'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeRichHtml } from '@/shared/lib/sanitize-rich-html';
import { cn } from '@/shared/utils';

const TEXT_COLORS = [
  { label: 'افتراضي', value: '' },
  { label: 'أسود', value: '#111827' },
  { label: 'رمادي', value: '#6b7280' },
  { label: 'أخضر', value: '#0f766e' },
  { label: 'أزرق', value: '#1d4ed8' },
  { label: 'أحمر', value: '#b91c1c' },
  { label: 'برتقالي', value: '#c2410c' },
  { label: 'بنفسجي', value: '#7e22ce' },
];

const FONT_SIZES = [
  { label: 'عادي', value: '' },
  { label: 'صغير', value: '14px' },
  { label: 'متوسط', value: '16px' },
  { label: 'كبير', value: '20px' },
  { label: 'أكبر', value: '24px' },
  { label: 'عنوان', value: '28px' },
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? 'secondary' : 'ghost'}
      className="h-8 w-8 shrink-0"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'اكتب المحتوى هنا…',
  className,
  minHeightClassName = 'min-h-rich-editor',
}: Props) {
  const lastEmitted = React.useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: normalizeRichHtml(value),
    editorProps: {
      attributes: {
        class: cn(
          'prose-editor max-w-none px-3 py-2 text-sm outline-none focus:outline-none',
          minHeightClassName,
          '[&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold',
          '[&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold',
          '[&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold',
          '[&_p]:mb-2 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5',
        ),
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.isEmpty ? '' : current.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const next = normalizeRichHtml(value);
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (next === lastEmitted.current || next === current) return;
    editor.commands.setContent(next || '', { emitUpdate: false });
    lastEmitted.current = next;
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground',
          minHeightClassName,
          className,
        )}
      >
        …
      </div>
    );
  }

  const currentColor = (editor.getAttributes('textStyle').color as string | undefined) ?? '';
  const currentSize = (editor.getAttributes('textStyle').fontSize as string | undefined) ?? '';

  return (
    <div className={cn('overflow-hidden rounded-md border border-input bg-background', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/70 bg-muted/30 px-1.5 py-1">
        <ToolbarButton
          label="تراجع"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="إعادة"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="عريض"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="مائل"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="تسطير"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="عنوان 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="عنوان 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="عنوان 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="قائمة نقطية"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="قائمة رقمية"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="محاذاة يمين"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="توسيط"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="محاذاة يسار"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <label className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">لون</span>
          <select
            className="h-8 max-w-[7.5rem] rounded-md border border-input bg-background px-1.5 text-xs text-foreground"
            value={TEXT_COLORS.some((c) => c.value === currentColor) ? currentColor : currentColor ? '__custom__' : ''}
            onChange={(event) => {
              const next = event.target.value;
              if (!next || next === '__custom__') {
                editor.chain().focus().unsetColor().run();
                return;
              }
              editor.chain().focus().setColor(next).run();
            }}
            aria-label="لون النص"
          >
            {TEXT_COLORS.map((color) => (
              <option key={color.label} value={color.value}>
                {color.label}
              </option>
            ))}
            {currentColor && !TEXT_COLORS.some((c) => c.value === currentColor) ? (
              <option value="__custom__">مخصص</option>
            ) : null}
          </select>
          <input
            type="color"
            className="h-7 w-7 cursor-pointer rounded border border-input bg-background p-0.5"
            value={/^#[0-9a-fA-F]{6}$/.test(currentColor) ? currentColor : '#111827'}
            onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
            aria-label="اختيار لون مخصص"
            title="لون مخصص"
          />
        </label>

        <label className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">حجم</span>
          <select
            className="h-8 max-w-[7rem] rounded-md border border-input bg-background px-1.5 text-xs text-foreground"
            value={FONT_SIZES.some((s) => s.value === currentSize) ? currentSize : ''}
            onChange={(event) => {
              const next = event.target.value;
              if (!next) {
                editor.chain().focus().unsetFontSize().run();
                return;
              }
              editor.chain().focus().setFontSize(next).run();
            }}
            aria-label="حجم الخط"
          >
            {FONT_SIZES.map((size) => (
              <option key={size.label} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
