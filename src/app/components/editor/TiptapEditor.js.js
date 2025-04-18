// components/TiptapEditor.js
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import { Bold, Italic, Underline as UnderlineIcon, List } from "lucide-react"; // optional icons

export default function TiptapEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-md p-2 space-y-2">
      {/* Toolbar */}
      <div className="flex gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${
            editor.isActive("bold") ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${
            editor.isActive("italic") ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          <Italic size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded ${
            editor.isActive("underline") ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          <UnderlineIcon size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded ${
            editor.isActive("bulletList")
              ? "bg-black text-white"
              : "bg-gray-100"
          }`}
        >
          <List size={16} />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="min-h-[150px]" />
    </div>
  );
}
