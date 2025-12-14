import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { useGroups } from '@/hooks/community/useGroups';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  const { createGroup } = useGroups();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [imageUrl, setImageUrl] = useState(''); // Simplified for now, could be file upload
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createGroup.mutateAsync({
        name,
        description,
        is_private: isPrivate,
        image_url: imageUrl || undefined, // undefined if empty
      });
      toast.success('Group created! An admin will review and approve your group shortly.');
      onOpenChange(false);
      // Reset form
      setName('');
      setDescription('');
      setIsPrivate(false);
      setImageUrl('');
    } catch (error) {
      console.error('Failed to create group', error);
      toast.error('Failed to create group. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-150 w-[95%] sm:max-w-[500px] max-h-[85vh] bg-background border-border text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] duration-200 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Start a new community group. Your group will need approval before becoming visible.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Group Name</Label>
                <Input 
                    id="name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Prayer Warriors" 
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Textarea 
                    id="description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="What is this group about?" 
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-ring resize-none min-h-[100px]"
                />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                <div className="space-y-0.5">
                    <Label htmlFor="privacy" className="text-foreground text-base">Private Group</Label>
                    <p className="text-xs text-muted-foreground">Only members can see posts and content</p>
                </div>
                <Switch 
                    id="privacy" 
                    checked={isPrivate} 
                    onCheckedChange={setIsPrivate} 
                    className="data-[state=checked]:bg-primary"
                />
            </div>

            {/* Placeholder for real image upload integration later */}
            <div className="space-y-2">
                <Label htmlFor="image" className="text-foreground">Cover Image URL (Optional)</Label>
                <Input 
                    id="image" 
                    value={imageUrl} 
                    onChange={e => setImageUrl(e.target.value)} 
                    placeholder="https://..." 
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted">
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={createGroup.isPending || !name.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    {createGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Group
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>

    </Dialog>
  );
}
