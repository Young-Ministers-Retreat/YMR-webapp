'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Calendar, Loader2, Share2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SermonDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [sermon, setSermon] = useState<Sermon | null>(null)
  const [otherSermons, setOtherSermons] = useState<Sermon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSermonData()
  }, [resolvedParams.id])

  const fetchSermonData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Fetch the current sermon
      const { data: sermonData, error: sermonError } = await supabase
        .from('content')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('type', 'sermon')
        .single()

      if (sermonError) throw sermonError
      setSermon(sermonData)

      // Fetch other sermons (excluding current one)
      const { data: othersData, error: othersError } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'sermon')
        .neq('id', resolvedParams.id)
        .order('is_live', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(10)

      if (othersError) throw othersError
      setOtherSermons(othersData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/)?.[1]
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null
  }

  const getYouTubeEmbedUrl = (url: string) => {
    // Extract video ID from various YouTube URL formats
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/)?.[1]
    
    if (videoId) {
      // Return embed URL with autoplay, mute, modest branding, no related videos, and hide annotations
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&modestbranding=1&rel=0&iv_load_policy=3&color=white&playsinline=1`
    }
    
    // If already an embed URL or other format, return as-is
    return url
  }

  const handleShare = async () => {
    if (navigator.share && sermon) {
      try {
        await navigator.share({
          title: sermon.title,
          text: sermon.description || 'Check out this sermon!',
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled or share failed
        console.log('Share failed:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading sermon...</p>
        </div>
      </div>
    )
  }

  if (error || !sermon) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || 'Sermon not found'}</p>
          <Button variant="outline" onClick={() => router.push('/sermons')}>
            Back to Sermons
          </Button>
        </div>
      </div>
    )
  }

  const thumbnail = sermon.thumbnail_url || getYouTubeThumbnail(sermon.media_url) || '/images/sermons.jpg'

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate max-w-[200px]">Sermon</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleShare}
            className="hover:bg-white/10"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Video Player */}
        <section>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black min-h-[250px] max-h-[500px]">
            <iframe
              src={getYouTubeEmbedUrl(sermon.media_url)}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              title={sermon.title}
            />
          </div>
        </section>

        {/* Title and Metadata */}
        <section className="space-y-3">
          {sermon.is_live && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold">LIVE NOW</span>
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-white leading-tight">
            {sermon.title}
          </h1>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{formatDate(sermon.published_at)}</span>
          </div>
        </section>


        {/* Divider */}
        <div className="border-t border-border/50 my-6" />

        {/* More Sermons */}
        {otherSermons.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Play className="h-5 w-5 text-primary fill-primary" />
                More Sermons
              </h2>
              {/* <Link href="/sermons" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                View All
              </Link> */}
            </div>
            
            <div className="space-y-3">
              {otherSermons.map(otherSermon => {
                const otherThumbnail = otherSermon.thumbnail_url || getYouTubeThumbnail(otherSermon.media_url)
                
                return (
                  <Link 
                    key={otherSermon.id}
                    href={`/sermons/${otherSermon.id}`}
                    className="block"
                  >
                    <div className="flex gap-3 p-0 hover:bg-white/5 transition-colors rounded-lg">
                      {/* Thumbnail */}
                      <div className="relative w-[140px] h-[100px] rounded-lg overflow-hidden shrink-0 bg-muted">
                        {otherThumbnail ? (
                          <Image
                            src={otherThumbnail}
                            alt={otherSermon.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-muted">
                            <Play className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Live Badge */}
                        {otherSermon.is_live && (
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
                          {otherSermon.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {formatDate(otherSermon.published_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
