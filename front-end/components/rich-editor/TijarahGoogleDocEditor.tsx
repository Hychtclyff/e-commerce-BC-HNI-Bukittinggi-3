"use client";

import React, { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Minus,
  Undo,
  Redo,
  RemoveFormatting,
  Sparkles,
} from "lucide-react";

export interface TijarahGoogleDocEditorProps {
  value: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  documentTitle?: string;
}

export const TijarahGoogleDocEditor: React.FC<TijarahGoogleDocEditorProps> = ({
  value,
  onChange,
  placeholder = "Ketik atau tempel dokumen di sini...",
  minHeight = "100%",
  className = "",
  documentTitle,
}) => {
  const [isLinkPromptOpen, setIsLinkPromptOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary-sage underline font-semibold hover:opacity-80 transition-opacity",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-xl border border-border-subtle max-w-full my-3 shadow-md",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none min-h-full h-full cursor-text prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed`,
      },
    },
    immediatelyRender: false,
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Masukkan URL tautan (https://...):", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Masukkan URL gambar (https://...):", "https://");
    if (url && url !== "https://") {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-canvas/40 border border-border-subtle rounded-2xl text-xs text-text-muted">
        Memuat editor dokumen...
      </div>
    );
  }

  // Word count & Char count
  const textContent = editor.getText();
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;

  return (
    <div className={`flex flex-col w-full h-full border border-border-subtle rounded-2xl overflow-hidden bg-surface mac-glass mac-shadow ${className}`}>
      {/* Google Docs-style Header Topbar */}
      {documentTitle && (
        <div className="flex items-center justify-between px-4 py-2 bg-canvas/80 border-b border-border-subtle text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-sage/20 text-primary-sage flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-text-primary truncate max-w-xs">{documentTitle}</span>
          </div>
          <span className="text-[10px] text-text-muted font-medium bg-canvas px-2 py-0.5 rounded border border-border-subtle">
            Google Docs Editor Mode
          </span>
        </div>
      )}

      {/* Ribbon Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-canvas/60 border-b border-border-subtle text-xs">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-border-subtle">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas disabled:opacity-30 transition-colors cursor-pointer"
            title="Urungkan (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas disabled:opacity-30 transition-colors cursor-pointer"
            title="Ulangi (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings / Style */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border-subtle">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("paragraph")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Teks Normal"
          >
            <Pilcrow className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("heading", { level: 1 })
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("heading", { level: 2 })
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("heading", { level: 3 })
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Formats: Bold, Italic, Underline, Strike, Code */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border-subtle">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("bold")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Tebal (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("italic")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Miring (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("underline")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Garis Bawah (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("strike")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Coret"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("code")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Kode Inline"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border-subtle">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive({ textAlign: "left" })
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Rata Kiri"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive({ textAlign: "center" })
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Rata Tengah"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive({ textAlign: "right" })
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Rata Kanan"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive({ textAlign: "justify" })
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Rata Kiri Kanan (Justify)"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border-subtle">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("bulletList")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Daftar Butir (Bullet)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("orderedList")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Daftar Nomor"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("blockquote")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Kutipan (Quote)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inserts: Link, Image, Divider */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border-subtle">
          <button
            type="button"
            onClick={setLink}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive("link")
                ? "bg-primary-sage text-white shadow-none"
                : "text-text-muted hover:text-text-primary hover:bg-canvas"
            }`}
            title="Sisipkan Tautan"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 rounded-lg text-status-danger hover:bg-status-danger/10 transition-colors cursor-pointer"
              title="Hapus Tautan"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={addImage}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors cursor-pointer"
            title="Sisipkan Gambar (URL)"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors cursor-pointer"
            title="Garis Pemisah (Divider)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clear formatting */}
        <div className="flex items-center gap-0.5 pl-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors cursor-pointer"
            title="Bersihkan Format"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Document Sheet Canvas (Seamless, no card-in-card, height follows parent with text cursor) */}
      <div
        onClick={() => editor.chain().focus().run()}
        className="flex-1 p-4 sm:p-6 bg-surface overflow-y-auto cursor-text min-h-[320px]"
      >
        <div className="mx-auto max-w-4xl min-h-full cursor-text">
          <EditorContent editor={editor} className="min-h-full cursor-text" />
        </div>
      </div>

      {/* Status Bar Bawah */}
      <div className="flex items-center justify-between px-4 py-2 bg-canvas/60 border-t border-border-subtle text-[11px] text-text-muted">
        <div className="flex items-center gap-3">
          <span>{wordCount} kata</span>
          <span>•</span>
          <span>{charCount} karakter</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-primary-sage">
          <span className="w-2 h-2 rounded-full bg-primary-sage animate-pulse" />
          <span>Sinkron otomatis</span>
        </div>
      </div>
    </div>
  );
};

export default TijarahGoogleDocEditor;
