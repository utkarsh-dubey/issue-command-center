"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapLink from "@tiptap/extension-link";
import { Bold, Code, Italic, List } from "lucide-react";
import { useImperativeHandle, forwardRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RichTextEditorHandle {
  clearContent: () => void;
  getHTML: () => string;
  isEmpty: () => boolean;
}

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  {
    content?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
    className?: string;
  }
>(function RichTextEditor({ content = "", onChange, placeholder = "Write something...", className }, ref) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TiptapLink.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[80px] p-3",
      },
    },
  });

  useImperativeHandle(ref, () => ({
    clearContent: () => {
      editor?.commands.clearContent(true);
    },
    getHTML: () => editor?.getHTML() ?? "",
    isEmpty: () => editor?.isEmpty ?? true,
  }));

  if (!editor) return null;

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor.isActive("bold") && "bg-muted")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor.isActive("italic") && "bg-muted")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor.isActive("bulletList") && "bg-muted")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor.isActive("code") && "bg-muted")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-3.5 w-3.5" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});
