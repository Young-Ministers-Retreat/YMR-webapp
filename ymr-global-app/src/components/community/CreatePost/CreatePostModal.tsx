import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePosts } from "@/hooks/community/usePosts";
import {
  ComposerRoot,
  ComposerTitle,
  ComposerEditor,
  ComposerToolbar,
  ComposerSubmitButton,
} from "./Composer";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useGroups } from "@/hooks/community/useGroups";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Users, ChevronDown, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/useUser";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  initialAction?: "text" | "photo" | "video" | null;
}

interface UserProfile {
  full_name: string | null;
  image_url: string | null;
}

export function CreatePostModal({
  open,
  onOpenChange,
  groupId,
  initialAction,
}: CreatePostModalProps) {
  /* const [profile, setProfile] = useState<UserProfile | null>(null); -> Derived from hook now */
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    groupId
  );
  const [visibility, setVisibility] = useState<"public" | "group">(
    groupId ? "group" : "public"
  );
  const [alsoPostToFeed, setAlsoPostToFeed] = useState(false);

  const { createPost } = usePosts(selectedGroupId);
  const { groups } = useGroups(); // Fetches all groups. Ideally filter for "my groups" if API supported it.

  // Logic to determine effective group ID for posting
  // If public, group_id is null. If group, group_id is selectedGroupId.
  // Exception: "Also post to feed" might require backend support to tag both or create two posts.
  // For now, if "group" is selected, we post to that group.

  /* REPLACE MANUAL FETCHING WITH USEUSER */
  const { user } = useUser();
  
  // Backwards compatibility for existing render logic
  const profile = user ? { full_name: user?.full_name || 'Friend', image_url: user?.image_url } : null;

  /* REMOVE MANUAL EFFECT */
  /* useEffect(() => { ... }, [open, supabase]); */

  // Update internal state when props change
  useEffect(() => {
    if (groupId) {
      setSelectedGroupId(groupId);
      setVisibility("group");
    } else {
      setVisibility("public");
    }
  }, [groupId]);

  const handlePostSubmit = async (data: {
    title: string;
    htmlContent: string;
    plainText: string;
    media: File[];
    attachments: File[];
  }) => {
    const targetGroupId = visibility === "group" ? selectedGroupId : undefined;

    await createPost.mutateAsync({
      content: data.htmlContent, // Map htmlContent to content
      content_text: data.plainText, // Map plainText to content_text
      mediaFiles: data.media, // Map media to mediaFiles
      groupId: targetGroupId,
    });
    
    // If "alsoPostToFeed" is true and we posted to a group...
    if (visibility === "group" && alsoPostToFeed && targetGroupId) {
       await createPost.mutateAsync({
        content: data.htmlContent,
        content_text: data.plainText,
        mediaFiles: data.media,
        groupId: undefined,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-150 w-[95%] sm:max-w-[600px] max-h-[85vh] p-0 gap-0 overflow-hidden bg-background border border-border shadow-xl rounded-xl flex flex-col text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] duration-200">

        <DialogHeader className="p-4 px-6 border-b border-border flex flex-row items-center gap-3 space-y-0 shrink-0 bg-background">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={profile?.image_url || undefined} />
            <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
              {profile?.full_name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start gap-1">
            <span className="font-semibold text-sm text-foreground">
              {profile?.full_name || "Loading..."}
            </span>

            {/* Visibility Selector */}
            <div className="flex items-center gap-2">
              <Select
                value={visibility}
                onValueChange={(v: "public" | "group") => {
                  setVisibility(v);
                  if (v === "public") setSelectedGroupId(undefined);
                }}
              >
                <SelectTrigger className="h-7 text-xs px-2 gap-1 border border-border shadow-sm bg-muted/50 hover:bg-muted text-foreground w-auto min-w-[110px] focus:ring-1 focus:ring-ring">
                  {visibility === "public" ? (
                    <Globe className="size-3 text-muted-foreground" />
                  ) : (
                    <Users className="size-3 text-muted-foreground" />
                  )}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem
                    value="public"
                    className="text-foreground focus:bg-muted"
                  >
                    Public Community
                  </SelectItem>
                  <SelectItem
                    value="group"
                    className="text-foreground focus:bg-muted"
                  >
                    Specific Group
                  </SelectItem>
                </SelectContent>
              </Select>

              {visibility === "group" && (
                <Select
                  value={selectedGroupId || ""}
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger className="h-7 text-xs px-2 gap-1 border border-border shadow-sm bg-muted/50 hover:bg-muted text-foreground w-auto max-w-[150px] focus:ring-1 focus:ring-ring">
                    <span className="text-muted-foreground">in</span>
                    <span className="truncate max-w-[80px] block text-left font-medium">
                      {groups?.find((g) => g.id === selectedGroupId)?.name ||
                        "Select Group"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {groups?.map((g) => (
                      <SelectItem
                        key={g.id}
                        value={g.id}
                        className="text-foreground focus:bg-muted"
                      >
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogTitle className="sr-only">Create Post</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new post.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-background">
          <ComposerRoot
            onSubmit={handlePostSubmit}
            className="gap-2 h-full flex flex-col"
            initialAction={initialAction}
          >
            <ComposerTitle />

            {/* Editor Area with visual 'inline' media feel */}
            <div className="flex-1 flex flex-col min-h-[150px]">
              <ComposerEditor />
            </div>

            <div className="mt-auto pt-2 shrink-0">
              {visibility === "group" && (
                <div className="flex items-center space-x-2 mb-3 p-2 bg-muted/50 rounded-lg border border-border">
                  <Switch
                    id="post-to-feed"
                    checked={alsoPostToFeed}
                    onCheckedChange={setAlsoPostToFeed}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label
                    htmlFor="post-to-feed"
                    className="cursor-pointer text-xs font-medium text-muted-foreground"
                  >
                    Also share to Community Feed
                  </Label>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <ComposerToolbar />
                <ComposerSubmitButton />
              </div>
            </div>
          </ComposerRoot>
        </div>
      </DialogContent>
    </Dialog>
  );
}
