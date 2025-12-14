
import { useComments } from '@/hooks/community/useComments';
import { Comment } from '@/types/community';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Image as ImageIcon, Smile, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { CommentCard } from './CommentCard';
// import { CommentInput } from './CommentInput'; // Removed

interface CommentSectionProps {
    postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
    const { comments, isLoading, addComment } = useComments(postId);
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

    if (isLoading) {
        return <div className="py-4 flex justify-center"><Loader2 className="size-5 animate-spin text-neutral-400" /></div>;
    }

    const handleReply = (comment: Comment) => {
        setActiveReplyId(comment.id);
    };

    return (
        <div className="pt-4  mt-2 mb-6">
            <div className="space-y-6 mb-6">
                {(comments || []).map(comment => (
                    <Thread 
                        key={comment.id} 
                        comment={comment} 
                        postId={postId} 
                        activeReplyId={activeReplyId}
                        onReply={handleReply}
                        onCancelReply={() => setActiveReplyId(null)}
                    />
                ))}
            </div>
            
            {/* Main Comment Input Removed - moved to PostCard */}
        </div>
    );
}


// Helper for auto-resize textarea
function AutoResizeTextarea({ value, onChange, placeholder, autoFocus, onKeyDown }: any) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = ref.current.scrollHeight + 'px';
        }
    }, [value]);
    return (
        <textarea
            ref={ref}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            onKeyDown={onKeyDown}
            className="w-full resize-none bg-transparent outline-none text-sm placeholder:text-neutral-400 min-h-[40px] max-h-[200px] overflow-y-auto"
            rows={1}
        />
    );
}

// Thread Component to handle hierarchy
function Thread({ 
    comment, 
    postId, 
    activeReplyId, 
    onReply,
    onCancelReply
}: { 
    comment: Comment, 
    postId: string, 
    activeReplyId: string | null,
    onReply: (c: Comment) => void,
    onCancelReply: () => void
}) {
    const { addComment } = useComments(postId);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize reply text when this thread becomes active
    useEffect(() => {
        if (activeReplyId === comment.id) {
            setReplyText(`@${comment.author.full_name} `);
        }
    }, [activeReplyId, comment.id, comment.author.full_name]);

    const handleSubmit = async () => {
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            await addComment.mutateAsync({ content: replyText, parentId: comment.id });
            onCancelReply();
            setReplyText('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <CommentCard 
                comment={comment} 
                onReply={onReply} 
            />
            
            {/* Inline Reply Input */}
            {activeReplyId === comment.id && (
                <div className="ml-11 mt-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative w-full rounded-xl border border-neutral-200 bg-white shadow-sm transition-all focus-within:border-neutral-300 focus-within:ring-1 focus-within:ring-neutral-200">
                        <div className="p-3 pb-2">
                             <div className="text-xs text-neutral-400 mb-1">
                                Replying to <span className="text-blue-500 font-medium">@{comment.author.full_name}</span>
                            </div>
                            <AutoResizeTextarea
                                value={replyText}
                                onChange={(e: any) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                autoFocus
                                onKeyDown={(e: any) => {
                                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                        handleSubmit();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between border-t border-neutral-100 px-2 py-1.5 bg-neutral-50/50 rounded-b-xl">
                            <div className="flex gap-2 ml-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onCancelReply}
                                    className="h-7 text-xs hover:bg-neutral-100 text-neutral-600"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={!replyText.trim() || isSubmitting}
                                    className="h-7 text-xs bg-[#2A8427] hover:bg-[#226d20] text-white gap-1.5"
                                >
                                    {isSubmitting && <Loader2 className="size-3 animate-spin" />}
                                    Reply
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-4 pl-4 border-l-2 border-neutral-100 space-y-4 py-2">
                    {comment.replies.map(reply => (
                        <Thread 
                            key={reply.id} 
                            comment={reply} 
                            postId={postId}
                            activeReplyId={activeReplyId}
                            onReply={onReply}
                            onCancelReply={onCancelReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

