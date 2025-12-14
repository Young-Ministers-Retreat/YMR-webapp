import { createClient } from '@/lib/supabase/client';
import { Group } from '@/types/community';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MOCK_GROUPS } from '@/lib/mockData/community';

const USE_MOCK_DATA = true;

export function useGroups() {
  const supabase = createClient();

  const { data: groups, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_GROUPS;
      }

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('member_count', { ascending: false });
      
      if (error) throw error;
      return data as Group[];
    },
  });

  const queryClient = useQueryClient();

  const createGroup = useMutation({
    mutationFn: async (newGroup: { name: string; description: string; is_private: boolean; image_url?: string }) => {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { id: 'new-group', ...newGroup, member_count: 1 };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Create Group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          is_private: newGroup.is_private,
          image_url: newGroup.image_url,
          leader_id: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Add Creator as Admin Member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
          status: 'approved'
        });

      if (memberError) {
          // Log error but group is created. 
          console.error('Failed to add creator as member', memberError);
      }

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  return { groups, isLoading, error, createGroup };
}
