'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';

interface PostContentRendererProps {
  content: string;
  className?: string;
}

export function PostContentRenderer({ content, className }: PostContentRendererProps) {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none [&_img]:max-h-[500px] [&_img]:w-full [&_img]:object-contain [&_img]:rounded-lg',
      },
    },
    immediatelyRender: false, 
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return <EditorContent editor={editor} className={className} />;
}
