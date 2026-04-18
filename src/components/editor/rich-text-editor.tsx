import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import {
  Bold, Italic, Underline as UIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, Pilcrow, Eraser,
} from "lucide-react";
import { FontSize } from "./font-size";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (html: string) => void;
  uploadFolder?: string;
  placeholder?: string;
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px"];
const COLORS = [
  "#ffffff", "#cbd5e1", "#94a3b8", "#000000",
  "#d4af37", "#b8860b", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
  "#8b5cf6", "#ec4899",
];

export function RichTextEditor({ value, onChange, uploadFolder = "editor", placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      FontSize,
      Color.configure({ types: ["textStyle"] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ inline: false, HTMLAttributes: { class: "rounded-sm" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Write your essay…" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose-luxury min-h-[400px] max-w-none px-4 py-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (e.g. when loading a post)
  useEffect(() => {
    if (!editor) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="h-[500px] animate-pulse rounded-sm border border-border bg-muted" />;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${uploadFolder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    editor.chain().focus().setImage({ src: data.publicUrl }).run();
    if (fileRef.current) fileRef.current.value = "";
  }

  function setLink() {
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL (leave empty to remove)", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="rounded-sm border border-border bg-background">
      <Toolbar editor={editor}
        onPickImage={() => fileRef.current?.click()}
        onSetLink={setLink}
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, onPickImage, onSetLink }: { editor: Editor; onPickImage: () => void; onSetLink: () => void }) {
  const btn = (active: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors ${
      active ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const currentSize = (editor.getAttributes("fontSize").size as string | undefined) ?? "";
  const currentColor = (editor.getAttributes("textStyle").color as string | undefined) ?? "";

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-card/95 p-2 backdrop-blur">
      <Group>
        <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="h-4 w-4" /></button>
        <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="h-4 w-4" /></button>
      </Group>

      <Group>
        <select
          value={
            editor.isActive("heading", { level: 1 }) ? "h1" :
            editor.isActive("heading", { level: 2 }) ? "h2" :
            editor.isActive("heading", { level: 3 }) ? "h3" : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 }).run();
          }}
          className="h-8 rounded-sm border border-border bg-background px-2 text-xs"
          title="Block style"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <select
          value={currentSize}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) (editor.chain().focus() as any).unsetFontSize().run();
            else (editor.chain().focus() as any).setFontSize(v).run();
          }}
          className="h-8 rounded-sm border border-border bg-background px-2 text-xs"
          title="Font size"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Group>

      <Group>
        <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UIcon className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("code"))} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code"><Code className="h-4 w-4" /></button>
      </Group>

      {/* Color picker */}
      <Group>
        <label className="relative inline-flex h-8 cursor-pointer items-center gap-1 rounded-sm border border-border bg-background px-2 text-xs" title="Text color">
          <span className="h-3 w-3 rounded-full border border-border" style={{ background: currentColor || "transparent" }} />
          <span>Color</span>
          <input
            type="color"
            value={currentColor || "#ffffff"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <div className="hidden md:flex items-center gap-0.5">
          {COLORS.map((c) => (
            <button key={c} type="button" title={c}
              onClick={() => editor.chain().focus().setColor(c).run()}
              className="h-5 w-5 rounded-full border border-border"
              style={{ background: c }}
            />
          ))}
        </div>
        <button type="button" className={btn(false)} onClick={() => editor.chain().focus().unsetColor().run()} title="Clear color"><Eraser className="h-4 w-4" /></button>
      </Group>

      <Group>
        <button type="button" className={btn(editor.isActive({ textAlign: "left" }))} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left"><AlignLeft className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive({ textAlign: "center" }))} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center"><AlignCenter className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive({ textAlign: "right" }))} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right"><AlignRight className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive({ textAlign: "justify" }))} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify"><AlignJustify className="h-4 w-4" /></button>
      </Group>

      <Group>
        <button type="button" className={btn(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1"><Heading1 className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2"><Heading2 className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3"><Heading3 className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("paragraph"))} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph"><Pilcrow className="h-4 w-4" /></button>
      </Group>

      <Group>
        <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="h-4 w-4" /></button>
      </Group>

      <Group>
        <button type="button" className={btn(editor.isActive("link"))} onClick={onSetLink} title="Link"><LinkIcon className="h-4 w-4" /></button>
        <button type="button" className={btn(false)} onClick={onPickImage} title="Insert image"><ImageIcon className="h-4 w-4" /></button>
      </Group>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5 border-r border-border pr-1 last:border-0 last:pr-0">{children}</div>;
}
