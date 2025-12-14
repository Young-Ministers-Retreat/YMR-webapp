import { Button } from '@/components/ui/button';
import { Loader2, Send, Image as ImageIcon, Smile, X } from 'lucide-react';
import { useState, useRef } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CommentInputProps {
    onSubmit: (text: string, file: File | null) => Promise<void>;
    placeholder?: string;
    initialContent?: string;
    isReply?: boolean;
    autoFocus?: boolean;
    onCancel?: () => void;
    minimal?: boolean; // New prop for PostCard view if we want it to look like a pill initially?
}

export function CommentInput({ 
    onSubmit, 
    placeholder, 
    initialContent = '',
    isReply = false,
    autoFocus = false,
    onCancel,
    minimal = false
}: CommentInputProps) {
    const [content, setContent] = useState(initialContent);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !selectedFile) return;

        setIsSubmitting(true);
        try {
            await onSubmit(content, selectedFile);
            setContent('');
            setSelectedFile(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };
    
    const onEmojiClick = (emojiData: EmojiClickData) => {
        setContent(prev => prev + emojiData.emoji);
    };

    return (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-2 bg-black/20 p-2 rounded-2xl border border-white/10 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all ${isReply ? 'ml-0' : ''}`}>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent border-none focus:outline-none resize-none px-2 py-1 text-sm min-h-[40px] max-h-[120px] text-neutral-200 placeholder:text-neutral-500"
                rows={isReply ? 2 : 1}
                autoFocus={autoFocus}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                }}
            />
            
            {selectedFile && (
                <div className="relative w-fit mx-2 mb-2 group">
                    <div className="h-16 w-16 rounded-lg border border-white/10 overflow-hidden bg-white/5">
                        <img src={URL.createObjectURL(selectedFile)} className="h-full w-full object-cover opacity-80" alt="Preview" />
                    </div>
                    <button 
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    >
                        <X className="size-3" />
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center px-1">
                <div className="flex gap-1 text-neutral-500">
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 hover:bg-white/10 hover:text-neutral-300 rounded-full transition-colors"
                    >
                        <ImageIcon className="size-4" />
                    </button>
                    
                    <Popover>
                        <PopoverTrigger asChild>
                            <button type="button" className="p-1.5 hover:bg-white/10 hover:text-neutral-300 rounded-full transition-colors">
                                <Smile className="size-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 border-none shadow-none bg-transparent w-auto" side="top" align="start">
                            <EmojiPicker onEmojiClick={onEmojiClick} theme={'dark' as any} />
                        </PopoverContent>
                    </Popover>

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>
                
                <div className="flex gap-2">
                     {onCancel && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={onCancel}
                            className="text-neutral-500 hover:text-neutral-300 hover:bg-white/5 h-8 text-xs"
                        >
                            Cancel
                        </Button>
                     )}
                     <Button 
                        type="submit" 
                        size="sm" 
                        disabled={!content.trim() && !selectedFile || isSubmitting} 
                        className="rounded-full h-8 px-4 text-xs bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="size-3 animate-spin" /> : (isReply ? 'Reply' : 'Post')}
                    </Button>
                </div>
            </div>
        </form>
    );
}
