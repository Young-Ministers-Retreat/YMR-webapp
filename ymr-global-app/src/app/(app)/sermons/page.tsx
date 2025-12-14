'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Play, Download, Calendar, Search, Filter, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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

export default function SermonsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSermons()

    // Set up real-time subscription for sermon changes
    const supabase = createClient()
    const channel = supabase
      .channel('sermons-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: 'type=eq.sermon'
        },
        (payload) => {
          console.log('Sermon content changed:', payload)
          // Reload sermons when changes occur (especially live status)
          fetchSermons()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchSermons = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'sermon')
        .order('is_live', { ascending: false }) // Live sermons first
        .order('published_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setSermons(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredSermons = sermons.filter(sermon => {
    const matchesSearch = sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sermon.description?.toLowerCase().includes(searchQuery.toLowerCase())
    // Category filtering can be enhanced when you add category field to content table
    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getYouTubeThumbnail = (url: string) => {
    // Extract video ID from YouTube URL
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading sermons...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Search */}
      <div className="sticky top-0 z-10 bg-[#2A3A3A] backdrop-blur-md border-b border-border/20 px-4 py-3">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search videos..." 
              className="pl-9 bg-[#1E2A2A] border-border/30 text-white placeholder:text-gray-400 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Filter className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {error && (
          <div className="text-center py-8 text-destructive">
            <p>Error loading sermons: {error}</p>
            <Button variant="outline" onClick={fetchSermons} className="mt-4">
              Retry
            </Button>
          </div>
        )}

        {!error && filteredSermons.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No sermons found.</p>
            <p className="text-sm mt-2">Check back soon for new content!</p>
          </div>
        )}

        {filteredSermons.map((sermon, index) => {
          const thumbnail = sermon.thumbnail_url || getYouTubeThumbnail(sermon.media_url)
          
          return (
            <Link 
              key={sermon.id}
              href={`/sermons/${sermon.id}`}
              className="block animate-sermon-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex gap-3 p-0 hover:bg-white/5 transition-colors rounded-lg">
                {/* Thumbnail */}
                <div className="relative w-[140px] h-[100px] rounded-lg overflow-hidden shrink-0 bg-muted">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={sermon.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
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
                
                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="font-medium text-white leading-tight line-clamp-2 mb-2">
                    {sermon.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {formatDate(sermon.published_at)}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
