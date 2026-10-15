'use client';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Uncontrolled TipTap editor: `value` is the initial HTML; changes are reported through onChange(html).
// Remount (change `key`) to load different content. Output is sanitised again on the server.
export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: 'noopener noreferrer' } },
        // Not offered by the public sanitiser/renderer:
        strike: false, code: false, codeBlock: false, horizontalRule: false,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? '' : ed.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => !ed ? {} : ({
      bold: ed.isActive('bold'), italic: ed.isActive('italic'), link: ed.isActive('link'),
      h2: ed.isActive('heading', { level: 2 }), h3: ed.isActive('heading', { level: 3 }), h4: ed.isActive('heading', { level: 4 }),
      ul: ed.isActive('bulletList'), ol: ed.isActive('orderedList'), quote: ed.isActive('blockquote'),
    }),
  }) || {};

  if (!editor) return <div className="cmsa-rte"><div className="cmsa-rte-bar" /><div style={{ minHeight: 120 }} /></div>;

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const href = window.prompt('Link URL (https://..., /page, mailto:, tel:). Leave empty to remove.', prev);
    if (href === null) return;
    const trimmed = href.trim();
    if (!trimmed) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    if (!/^(https?:\/\/|\/(?!\/)|mailto:|tel:)/i.test(trimmed)) { window.alert('Links must start with https://, /, mailto: or tel:'); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  };

  const Btn = ({ on, onClick, label, title }) => (
    <button type="button" className={on ? 'on' : ''} onClick={onClick} title={title || label} aria-pressed={!!on}>{label}</button>
  );

  return (
    <div className="cmsa-rte">
      <div className="cmsa-rte-bar" role="toolbar" aria-label="Formatting">
        <Btn on={state.bold} label="B" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} />
        <Btn on={state.italic} label="I" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} />
        <Btn on={state.link} label="Link" onClick={setLink} />
        <Btn on={state.h2} label="H2" title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <Btn on={state.h3} label="H3" title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <Btn on={state.h4} label="H4" title="Heading 4" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} />
        <Btn on={state.ul} label="• List" title="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <Btn on={state.ol} label="1. List" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <Btn on={state.quote} label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
