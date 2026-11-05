'use client';

import Link from '@tiptap/extension-link';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

interface Props {
  /** Form field name; the HTML is submitted in a hidden input. */
  name?: string;
  defaultValue: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  /** Applies the page's own text styles inside the editor (e.g. 'essay'). */
  variant?: 'default' | 'essay';
}

/** A small, safe rich-text editor: paragraphs, bold, italic, links and lists. */
export function RichEditor({ name, defaultValue, onChange, placeholder, minHeight = 160, variant = 'default' }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, code: false, blockquote: false, horizontalRule: false, strike: false, link: false }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null } }),
    ],
    content: defaultValue,
    editorProps: { attributes: { class: `rich-editor__area rich-editor__area--${variant}`, 'data-placeholder': placeholder ?? '' } },
    onUpdate: ({ editor }) => {
      const next = editor.isEmpty ? '' : editor.getHTML();
      setHtml(next);
      onChange?.(next);
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            link: e.isActive('link'),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link to (leave empty to remove):', prev ?? 'https://');
    if (url === null) return;
    if (url === '' || url === 'https://') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="rich-editor" style={{ '--min-h': `${minHeight}px` } as React.CSSProperties}>
      <div className="rich-editor__bar" role="toolbar" aria-label="Formatting">
        <Btn on={state?.bold} title="Bold" label={<strong>B</strong>} run={() => editor?.chain().focus().toggleBold().run()} />
        <Btn on={state?.italic} title="Italic" label={<em>I</em>} run={() => editor?.chain().focus().toggleItalic().run()} />
        <Btn on={state?.link} title="Link" label="Link" run={setLink} />
        <span className="rich-editor__sep" />
        <Btn on={state?.bullet} title="Bulleted list" label="• List" run={() => editor?.chain().focus().toggleBulletList().run()} />
        <Btn on={state?.ordered} title="Numbered list" label="1. List" run={() => editor?.chain().focus().toggleOrderedList().run()} />
        <span className="rich-editor__sep" />
        <Btn title="Undo" label="↶" run={() => editor?.chain().focus().undo().run()} disabled={!state?.canUndo} />
        <Btn title="Redo" label="↷" run={() => editor?.chain().focus().redo().run()} disabled={!state?.canRedo} />
      </div>
      {editor ? <EditorContent editor={editor} /> : <div className={`rich-editor__area rich-editor__area--${variant}`} dangerouslySetInnerHTML={{ __html: defaultValue }} />}
      {name && <input type="hidden" name={name} value={html} />}
    </div>
  );
}

function Btn({ on, label, title, run, disabled }: { on?: boolean; label: React.ReactNode; title: string; run: () => void; disabled?: boolean }) {
  return (
    // mousedown is cancelled so clicking a button doesn't take focus (and the selection) out of the text.
    <button type="button" className={`rich-editor__btn${on ? ' is-on' : ''}`} title={title} aria-label={title} aria-pressed={on} onMouseDown={(e) => e.preventDefault()} onClick={run} disabled={disabled}>
      {label}
    </button>
  );
}
