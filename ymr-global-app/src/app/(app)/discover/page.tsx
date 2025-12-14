'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Video, 
  Calendar, 
  BookOpenText, 
  Users2, 
  Play,
  Music,
  Heart,
  ArrowRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { DailyInspiration } from '@/components/daily-inspiration'

// --- Types ---
interface Sermon {
  id: string
  title: string
  description: string | null
  media_url: string
  thumbnail_url: string | null
  published_at: string
  created_at: string
  is_live: boolean
}

// --- Static Data ---
const CATEGORIES = [
  { id: 'sermons', label: 'Sermons', icon: Video, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'worship', label: 'Worship', icon: Music, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'bible', label: 'Bible Study', icon: BookOpenText, color: 'text-green-400', bg: 'bg-green-400/10' },
  { id: 'events', label: 'Events', icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'groups', label: 'Groups', icon: Users2, color: 'text-pink-400', bg: 'bg-pink-400/10' },
]

const COMMUNITIES = [
  { id: 1, name: "Prayer Warriors", members: 1240, initials: "PW" },
  { id: 2, name: "Bible Study", members: 850, initials: "BS" },
  { id: 3, name: "Worship Team", members: 432, initials: "WT" },
]

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [sermonsLoading, setSermonsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.avatar_url) {
        setUserAvatar(user.user_metadata.avatar_url)
      }
    }
    getUser()
    fetchSermons()
  }, [])

  const fetchSermons = async () => {
    try {
      setSermonsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'sermon')
        .order('is_live', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(8)

      if (error) throw error
      setSermons(data || [])
    } catch (err) {
      console.error('Error fetching sermons:', err)
    } finally {
      setSermonsLoading(false)
    }
  }

  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/)?.[1]
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
  }


  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. Header Area */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9 bg-secondary/50 border-transparent focus-visible:bg-secondary focus-visible:ring-primary rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
                  ${cat.bg} hover:brightness-110 active:scale-95 border border-transparent hover:border-white/5
                `}
              >
                <cat.icon className={`h-4 w-4 ${cat.color}`} />
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8 p-4 pt-6">
        
        {/* 2. Daily Inspiration Hero */}
        <section>
          <DailyInspiration />
        </section>

        {/* 3. Trending Sermons (Netflix-style scroll) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Play className="h-5 w-5 text-primary fill-primary" />
              Latest Sermons
            </h2>
            <Link href="/sermons" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              View All
            </Link>
          </div>
          
          <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
            {sermonsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sermons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sermons available yet.</p>
              </div>
            ) : (
              <div className="flex gap-4">
                {sermons.map(sermon => {
                  const thumbnail = sermon.thumbnail_url || getYouTubeThumbnail(sermon.media_url)
                  const publishedDate = new Date(sermon.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })
                  
                  return (
                    <Link 
                      key={sermon.id} 
                      href={`/sermons/${sermon.id}`}
                      className="w-[280px] shrink-0 group cursor-pointer"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                        {thumbnail ? (
                          <Image 
                            src={thumbnail} 
                            alt={sermon.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Play className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Play className="h-5 w-5 text-white fill-white" />
                          </div>
                        </div>
                        
                        {/* Live Badge */}
                        {sermon.is_live && (
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              LIVE
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {sermon.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {publishedDate}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* 4. Community Hub Preview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users2 className="h-5 w-5 text-primary" />
              Community Hub
            </h2>
            <Link href="/community" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Find Group
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Link href="/hub">
              <div className="p-4 rounded-xl bg-linear-to-br from-primary/10 via-background to-secondary/10 border border-primary/10 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <Image
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                      alt="Member"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 object-cover border-primary"
                      style={{ zIndex: 3 }}
                    />
                    <Image
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                      alt="Member"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 object-cover border-primary"
                      style={{ zIndex: 2 }}
                    />
                    <Image
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                      alt="Member"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 object-cover border-primary"
                      style={{ zIndex: 1 }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Join the Conversation</h3>
                    <p className="text-xs text-muted-foreground">Check for new discussions around you</p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-3">
               {COMMUNITIES.slice(0, 2).map(group => (
                 <Card key={group.id} className="p-3 bg-secondary/20 border-none hover:bg-secondary/40 transition-colors flex items-center gap-3 cursor-pointer">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {group.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{group.name}</p>
                      <p className="text-[10px] text-muted-foreground">{group.members} members</p>
                    </div>
                 </Card>
               ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
