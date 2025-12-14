import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string | null;
  image_url?: string | null;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
           // Try to get from profile table if exists, or fallback to metadata
           // For now, consistent with Header.tsx, use metadata
           setUser({
             id: authUser.id,
             email: authUser.email,
             full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
             image_url: authUser.user_metadata?.avatar_url
           });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
