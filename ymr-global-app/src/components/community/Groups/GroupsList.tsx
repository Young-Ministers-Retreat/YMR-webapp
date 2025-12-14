import { useGroups } from '@/hooks/community/useGroups';
import { GroupCard } from './GroupCard';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateGroupModal } from './CreateGroupModal';

export function GroupsList() {
    const { groups, isLoading, error } = useGroups();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-destructive">
                Failed to load groups.
            </div>
        );
    }

    return (
        <div className="space-y-6 py-4">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-semibold text-white">All Groups</h2>
                <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Create Group
                </Button>
            </div>

            {!groups || groups.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
                     No groups found. Be the first to create one!
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groups.map(group => (
                        <GroupCard key={group.id} group={group} />
                    ))}
                </div>
            )}
            
            <CreateGroupModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
        </div>
    );
}
