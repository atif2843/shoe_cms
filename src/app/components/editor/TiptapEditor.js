// components/TiptapEditor.js
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered,
  Heading1, 
  Heading2, 
  Link as LinkIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Code,
  Quote,
  Strikethrough
} from "lucide-react"; // optional icons

export default function TiptapEditor({ value, onChange, className }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-6',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-6',
          },
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className={`border rounded-md p-2 space-y-2 ${className || ''}`}>
      {/* Toolbar */}
      <div className="tiptap-toolbar">
        {/* Text Style */}
        <div className="flex gap-1 border-r pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1 rounded ${
              editor.isActive('heading', { level: 1 }) ? 'is-active' : 'bg-gray-100'
            }`}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1 rounded ${
              editor.isActive('heading', { level: 2 }) ? 'is-active' : 'bg-gray-100'
            }`}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </button>
        </div>

        {/* Text Formatting */}
        <div className="flex gap-1 border-r pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded ${
              editor.isActive('bold') ? 'is-active' : 'bg-gray-100'
            }`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded ${
              editor.isActive('italic') ? 'is-active' : 'bg-gray-100'
            }`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded ${
              editor.isActive('underline') ? 'is-active' : 'bg-gray-100'
            }`}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1 rounded ${
              editor.isActive('strike') ? 'is-active' : 'bg-gray-100'
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
        </div>

        {/* Lists and Quotes */}
        <div className="flex gap-1 border-r pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded ${
              editor.isActive('bulletList') ? 'is-active' : 'bg-gray-100'
            }`}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1 rounded ${
              editor.isActive('orderedList') ? 'is-active' : 'bg-gray-100'
            }`}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1 rounded ${
              editor.isActive('blockquote') ? 'is-active' : 'bg-gray-100'
            }`}
            title="Quote"
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1 rounded ${
              editor.isActive('codeBlock') ? 'is-active' : 'bg-gray-100'
            }`}
            title="Code Block"
          >
            <Code size={16} />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1 rounded ${
              editor.isActive({ textAlign: 'left' }) ? 'is-active' : 'bg-gray-100'
            }`}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1 rounded ${
              editor.isActive({ textAlign: 'center' }) ? 'is-active' : 'bg-gray-100'
            }`}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1 rounded ${
              editor.isActive({ textAlign: 'right' }) ? 'is-active' : 'bg-gray-100'
            }`}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1 rounded ${
              editor.isActive({ textAlign: 'justify' }) ? 'is-active' : 'bg-gray-100'
            }`}
            title="Justify"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        {/* Links */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={addLink}
            className={`p-1 rounded ${
              editor.isActive('link') ? 'is-active' : 'bg-gray-100'
            }`}
            title="Add Link"
          >
            <LinkIcon size={16} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="tiptap-content-wrapper">
        <EditorContent editor={editor} className="tiptap-content prose max-w-none" />
      </div>
    </div>
  );
}
