"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import { useRef } from "react";
import { Bold, Italic, List, ListOrdered, Link2, Heading2, ImageIcon, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";
import { useState } from "react";

interface Props {
  content: string;
  onChange: (html: string) => void;
  professionalId: string;
}

export function TipTapEditor({ content, onChange, professionalId }: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      ImageExt.configure({ inline: false, HTMLAttributes: { class: "max-w-full rounded-lg my-2" } }),
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, "portfolios", `newsletter/${professionalId}`);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  const toolbarBtn = (active: boolean) =>
    `p-1.5 rounded text-sm transition-colors ${
      active
        ? "bg-kelen-green-100 text-kelen-green-700"
        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    }`;

  return (
    <div className="rounded-lg border border-outline-variant overflow-hidden bg-surface">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-outline-variant bg-surface-container-low flex-wrap">
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={toolbarBtn(editor.isActive("heading", { level: 2 }))} title="Titre">
          <Heading2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={toolbarBtn(editor.isActive("bold"))} title="Gras">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toolbarBtn(editor.isActive("italic"))} title="Italique">
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-outline-variant mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarBtn(editor.isActive("bulletList"))} title="Liste à puces">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarBtn(editor.isActive("orderedList"))} title="Liste numérotée">
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-outline-variant mx-1" />
        <button type="button" onClick={addLink}
          className={toolbarBtn(editor.isActive("link"))} title="Ajouter un lien">
          <Link2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => imageInputRef.current?.click()}
          disabled={uploading}
          className={toolbarBtn(false) + " disabled:opacity-40"} title="Insérer une image">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </button>
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={handleImageUpload} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
