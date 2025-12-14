import { createClient } from '@/lib/supabase/client';
import { Post, CreatePostData } from '@/types/community';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MOCK_POSTS, getPostsForGroup } from '@/lib/mockData/community';
import { useState } from 'react';

// Toggle this to switch between mock and real data
const USE_MOCK_DATA = true;

export function usePosts(groupId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts', groupId],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return getPostsForGroup(groupId);
      }

      // Real Supabase query
      let query = supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(id, full_name, avatar_url)
        `)
        .order('is_pinned', { ascending: false, nullsFirst: false }) // Pinned posts first
        .order('created_at', { ascending: false });

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      
      // Transform data to match Post interface
      return (data || []).map((post: any) => ({
        ...post,
        author: post.users ? {
          id: post.users.id,
          full_name: post.users.full_name,
          image_url: post.users.avatar_url // Map avatar_url to image_url
        } : { id: post.user_id, full_name: 'Unknown', image_url: null },
        media: post.media_urls ? post.media_urls.map((url: string, idx: number) => ({
          id: `${post.id}-${idx}`,
          url,
          media_type: 'image', // Assume image for now
        })) : [],
        has_liked: false, // TODO: Check if current user liked
        likes_count: post.likes_count || 0,
      })) as Post[];
    },
  });

  const createPost = useMutation({
    mutationFn: async ({ content, content_text, title, mediaFiles, groupId: targetGroupId }: { content: string, content_text: string, title?: string, mediaFiles: File[], groupId?: string }) => {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Create mock post
        const newPost: Post = {
          id: `post-${Date.now()}`,
          user_id: 'current-user',
          author_id: 'current-user',
          author: {
            id: 'current-user',
            full_name: 'You',
            image_url: null,
          },
          content,
          content_text,
          title: title || null,
          group_id: targetGroupId || groupId || null,
          media: mediaFiles.map((file, idx) => ({
            id: `media-${Date.now()}-${idx}`,
            url: URL.createObjectURL(file),
            media_type: file.type.startsWith('video') ? 'video' : 'image',
          })),
          likes_count: 0,
          comments_count: 0,
          has_liked: false,
          is_pinned: false,
          views_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Add to mock data
        MOCK_POSTS.unshift(newPost);
        return newPost;
      }

      // Real Supabase logic
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload Media first if any
      const mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('media') // Ensure this bucket exists!
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);

          return publicUrl;
        });

        const urls = await Promise.all(uploadPromises);
        mediaUrls.push(...urls);
      }

      // 2. Create Post with media_urls
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          content,
          content_text,
          title,
          user_id: user.id,
          author_id: user.id, // Also set author_id
          group_id: targetGroupId || groupId,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null
        })
        .select()
        .single();

      if (postError) throw postError;

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', groupId] });
      toast.success('Post created successfully');
    },
    onError: (err) => {
        toast.error('Failed to create post');
        console.error(err);
    }
  });

  return {
    posts,
    isLoading,
    error,
    createPost
  };
}
