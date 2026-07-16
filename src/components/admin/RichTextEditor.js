'use client';
import { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import MediaPicker from './MediaPicker';

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      className={`rte-btn ${active ? 'active' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange }) {
  const [picker, setPicker] = useState(null); // 'image' | 'link' | null

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit v3 bundles Link, Underline, lists, headings, blockquote, etc.
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Image.configure({ inline: false, HTMLAttributes: { class: 'cms-image' } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  const insertImage = useCallback((media) => {
    if (editor && media?.url) editor.chain().focus().setImage({ src: media.url, alt: media.original_name || '' }).run();
    setPicker(null);
  }, [editor]);

  const insertLink = useCallback((media) => {
    if (editor && media?.url) {
      const hasSelection = !editor.state.selection.empty;
      if (hasSelection) {
        editor.chain().focus().setLink({ href: media.url }).run();
      } else {
        editor.chain().focus()
          .insertContent(`<a href="${media.url}" target="_blank" rel="noopener noreferrer">${media.original_name || media.url}</a>`)
          .run();
      }
    }
    setPicker(null);
  }, [editor]);

  const setLinkByPrompt = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL (leave empty to remove):', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return <div className="rte-loading">Loading editor…</div>;

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolbarButton>
        <span className="rte-sep" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph">¶</ToolbarButton>
        <span className="rte-sep" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">• List</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">1. List</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">❝</ToolbarButton>
        <span className="rte-sep" />
        <ToolbarButton onClick={setLinkByPrompt} active={editor.isActive('link')} title="Link (URL)">🔗</ToolbarButton>
        <ToolbarButton onClick={() => setPicker('link')} title="Link to uploaded file">📎</ToolbarButton>
        <ToolbarButton onClick={() => setPicker('image')} title="Insert image">🖼</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table">▦</ToolbarButton>
        <span className="rte-sep" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">↺</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">↻</ToolbarButton>
      </div>

      <EditorContent editor={editor} className="rte-content cms-content" />

      {picker && (
        <MediaPicker
          filter={picker === 'image' ? 'image' : undefined}
          onSelect={picker === 'image' ? insertImage : insertLink}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
