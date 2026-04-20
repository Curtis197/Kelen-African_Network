"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, List, ListOrdered, Link2, Heading2 } from "lucide-react";

interface Props {
  content: string;
  onChange: (html: string) => void;
}

export function TipTapEditor({ content, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[200px] outline-none prose prose-sm max-w-none px-4 py-3 text-on-surface",
      },
    },
  });

  if (!editor) return null;

  function addLink() {
    const url = window.prompt("URL du lien");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }

  const toolbarBtn = (active: boolean) =>
    `p-1.5 rounded text-sm transition-colors ${
      active
        ? "bg-kelen-green-100 text-kelen-green-700"
        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    }`;

  return (
    <div className="rounded-lg border border-outline-variant overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-outline-variant bg-surface-container-low flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={toolbarBtn(editor.isActive("heading", { level: 2 }))}
          title="Titre"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={toolbarBtn(editor.isActive("bold"))}
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toolbarBtn(editor.isActive("italic"))}
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-outline-variant mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarBtn(editor.isActive("bulletList"))}
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarBtn(editor.isActive("orderedList"))}
          title="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-outline-variant mx-1" />
        <button
          type="button"
          onClick={addLink}
          className={toolbarBtn(editor.isActive("link"))}
          title="Ajouter un lien"
        >
          <Link2 className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
