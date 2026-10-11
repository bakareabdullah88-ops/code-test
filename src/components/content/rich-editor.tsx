import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Quotes, TextB, TextItalic, ListBullets, TextHThree } from '@phosphor-icons/react';
import type { RichDoc } from '@/types';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';

export interface RichEditorProps {
  value: RichDoc;
  onChange: (doc: RichDoc) => void;
  placeholder?: string;
  label: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  minHeight?: 'sm' | 'md' | 'lg';
}

const heights = { sm: 'min-h-32', md: 'min-h-48', lg: 'min-h-72' } as const;

/** Tiptap editor limited to the schema the API accepts: paragraphs, one heading level, bold, italic, bullets, quotes. */
export function RichEditor({ value, onChange, placeholder, label, autoFocus, disabled, className, minHeight = 'md' }: RichEditorProps) {
  const t = useT();
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [3] }, code: false, codeBlock: false, horizontalRule: false, strike: false, link: false, underline: false, orderedList: false }), Placeholder.configure({ placeholder: placeholder ?? '' })],
    content: value,
    editable: !disabled,
    autofocus: autoFocus ? 'end' : false,
    shouldRerenderOnTransaction: true,
    immediatelyRender: true,
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as RichDoc),
    editorProps: { attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': label, class: cn('prose-reading max-w-none px-4 py-3 outline-none', heights[minHeight]) } },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) return <div className={cn('skeleton', heights[minHeight])} aria-hidden="true" />;
  const btn = (active: boolean, name: string, onClick: () => void, icon: React.ReactNode) => (
    <button type="button" aria-label={name} aria-pressed={active} disabled={disabled} onClick={onClick} className={cn('inline-flex size-11 items-center justify-center rounded-sm text-muted transition-colors motion-fast hover:bg-sunken hover:text-ink md:size-9 coarse:size-11', active && 'bg-accent-soft text-accent-soft-ink')}>
      {icon}
    </button>
  );
  return (
    <div className={cn('overflow-hidden rounded-md border border-line-strong bg-sunken focus-within:border-accent', className)}>
      <div role="toolbar" aria-label={t('editor.toolbar')} className="flex flex-wrap gap-0.5 border-b border-line bg-surface px-1.5 py-1">
        {btn(editor.isActive('bold'), t('editor.bold'), () => editor.chain().focus().toggleBold().run(), <TextB size={18} weight="bold" />)}
        {btn(editor.isActive('italic'), t('editor.italic'), () => editor.chain().focus().toggleItalic().run(), <TextItalic size={18} />)}
        {btn(editor.isActive('heading', { level: 3 }), t('editor.heading'), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <TextHThree size={18} />)}
        {btn(editor.isActive('bulletList'), t('editor.list'), () => editor.chain().focus().toggleBulletList().run(), <ListBullets size={18} />)}
        {btn(editor.isActive('blockquote'), t('editor.quote'), () => editor.chain().focus().toggleBlockquote().run(), <Quotes size={18} />)}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
