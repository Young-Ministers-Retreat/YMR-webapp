'use client';

import { ReactNode, useState, useCallback, useRef, createContext, useContext, useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { VideoExtension } from './extensions/VideoExtension';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import EmojiPicker, { EmojiClickData, EmojiStyle } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, X, Image as ImageIcon, Video, Link as LinkIcon, Bold, Italic, List, ListOrdered, Smile } from 'lucide-react';
import { toast } from 'sonner';

export type UploadedFile = {
  id: string;
  file: File;
  previewUrl?: string;
  type: 'image' | 'video' | 'document';
};

interface ComposerContextType {
  editor: Editor | null;
  title: string;
  setTitle: (t: string) => void;
  submit: () => void;
  isSubmitting: boolean;
  openPicker: (type: 'photo' | 'video' | 'file') => void;
  fileInputRefs: {
    photo: React.RefObject<HTMLInputElement | null>;
    video: React.RefObject<HTMLInputElement | null>;
    file: React.RefObject<HTMLInputElement | null>;
  };
  mediaFiles: UploadedFile[];
}

const ComposerContext = createContext<ComposerContextType>({} as any);

export const useComposer = () => useContext(ComposerContext);

interface ComposerRootProps {
  children: ReactNode;
  onSubmit: (data: { title: string; htmlContent: string; plainText: string; media: File[]; attachments: File[] }) => Promise<void>;
  className?: string;
  initialAction?: 'text' | 'photo' | 'video' | null;
  initialTitle?: string;
  initialContent?: string;
}

function Root({
  children,
  onSubmit,
  initialTitle = '',
  initialContent = '',
  initialAction,
  className,
}: ComposerRootProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>([]);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
        },
      }),
      ImageExtension,
      VideoExtension,
      Placeholder.configure({
        placeholder: "Share something...",
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'tiptap prose prose-sm max-w-none focus:outline-none min-h-[150px] font-normal p-0 text-foreground',
      },
    },
  });

  // Handle initial actions
  useEffect(() => {
    if (initialAction) {
      setTimeout(() => {
        if (initialAction === 'photo') photoInputRef.current?.click();
        else if (initialAction === 'video') videoInputRef.current?.click();
      }, 100);
    }
  }, [initialAction]);

  const openPicker = useCallback((type: 'photo' | 'video' | 'file') => {
    if (type === 'photo') photoInputRef.current?.click();
    else if (type === 'video') videoInputRef.current?.click();
    else if (type === 'file') fileInputRef.current?.click();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!editor) return;

    const htmlContent = editor.getHTML();
    const plainText = editor.getText();

    if (!title.trim() && !plainText.trim() && mediaFiles.length === 0) {
      toast.error('Please add some content');
      return;
    }

    setIsSubmitting(true);
    try {
        const finalMedia = mediaFiles.map(f => f.file);
        
        await onSubmit({
            title: title.trim(),
            htmlContent,
            plainText,
            media: finalMedia,
            attachments: [] 
        });
        
        setTitle('');
        setMediaFiles([]);
        editor.commands.setContent('');
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [editor, title, onSubmit, mediaFiles]);

  // Insert Inline
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const url = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: url }).run();
      setMediaFiles(prev => [...prev, { id: `img-${Date.now()}`, file, previewUrl: url, type: 'image' }]);
    }
    if (e.target) e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
        const url = URL.createObjectURL(file);
        editor.chain().focus().setVideo({ src: url }).run();
        setMediaFiles(prev => [...prev, { id: `vid-${Date.now()}`, file, previewUrl: url, type: 'video' }]);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <ComposerContext.Provider
      value={{
        editor,
        title,
        setTitle,
        submit: handleSubmit,
        isSubmitting,
        openPicker,
        fileInputRefs: {
          photo: photoInputRef,
          video: videoInputRef,
          file: fileInputRef,
        },
        mediaFiles,
      }}
    >
      <div className={cn("flex flex-col gap-4", className)}>
        {children}
        <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
        <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoSelect} />
      </div>
    </ComposerContext.Provider>
  );
}

function Title() {
  const { title, setTitle } = useComposer();
  return (
    <div className="px-0 mb-2">
      <Textarea
        placeholder="Add Title (Optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        rows={1}
        maxLength={120}
        className="min-h-[40px] resize-none border-0 p-0 text-lg font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground bg-transparent text-foreground"
      />
    </div>
  );
}

function EditorComponent() {
  const { editor } = useComposer();
  return (
    <div className="flex-1 overflow-y-auto min-h-[100px] cursor-text" onClick={() => editor?.commands.focus()}>
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar() {
    // Simplified toolbar using the context's openPicker
    const { editor, openPicker } = useComposer();
    if (!editor) return null;

    const onEmojiClick = (emojiData: EmojiClickData) => {
        editor.commands.insertContent(emojiData.emoji);
    };

    return (
        <div className="flex items-center gap-1">
             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => openPicker('photo')}>
                <ImageIcon className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => openPicker('video')}>
                <Video className="size-4" />
            </Button>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Smile className="size-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="z-200 w-auto p-0 border-none bg-transparent shadow-none" align="start">
                    <EmojiPicker 
                        onEmojiClick={onEmojiClick} 
                        emojiStyle={EmojiStyle.NATIVE}
                        theme={undefined} // Auto detect or pass 'dark'/'light' based on context if needed
                    />
                </PopoverContent>
            </Popover>

            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`} onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold className="size-4" />
            </Button>
             <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic className="size-4" />
            </Button>
        </div>
    );
}

function SubmitButton() {
    const { submit, isSubmitting } = useComposer();
    return (
        <Button onClick={submit} disabled={isSubmitting} size="sm" className="bg-[#2A8427] hover:bg-[#226d20] text-white">
            {isSubmitting ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
            Post
        </Button>
    );
}

export { 
    Root as ComposerRoot, 
    Title as ComposerTitle, 
    EditorComponent as ComposerEditor, 
    Toolbar as ComposerToolbar, 
    SubmitButton as ComposerSubmitButton
};
