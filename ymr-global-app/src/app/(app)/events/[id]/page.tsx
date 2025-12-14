'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, Share2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

interface Event {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location: string | null
  image_url: string | null
  status: string | null
  is_featured: boolean
  category: string | null
  registration_link: string | null
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      
      if (error) throw error
      return data as Event
    },
    enabled: !!eventId
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-full max-w-2xl aspect-video bg-muted animate-pulse rounded-xl" />
        <div className="w-full max-w-2xl h-32 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
        <h1 className="text-2xl font-bold">Event Not Found</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const startDate = new Date(event.start_time)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-6 bg-card border-b border-border sticky top-0 z-10">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Button>
        <h1 className="text-2xl font-bold leading-tight">{event.title}</h1>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Banner Image */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-white/10">
          {event.image_url ? (
             <Image
             src={event.image_url}
             alt={event.title}
             fill
             className="object-cover"
             priority
           />
          ) : (
             <div className="w-full h-full bg-secondary flex items-center justify-center">
                <Calendar className="h-16 w-16 text-muted-foreground/50" />
             </div>
          )}
         
          {event.status && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary hover:bg-primary text-white border-none shadow-md backdrop-blur-sm">
                {event.status}
              </Badge>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-6">
            <div className="space-y-4 bg-card rounded-xl p-5 border border-border">
              <div>
                <h2 className="text-lg font-semibold mb-2 text-foreground">About the Event</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-full bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Date</p>
                    <p className="text-sm text-muted-foreground">{format(startDate, 'EEEE, MMMM do, yyyy')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-full bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Time</p>
                    <p className="text-sm text-muted-foreground">{format(startDate, 'h:mm a')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">{event.location || 'Location to be announced'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {event.registration_link && (
                  <Button 
                    size="lg" 
                    className="flex-1 font-semibold text-base shadow-lg animate-in fade-in transition-all active:scale-[0.98]"
                    onClick={() => window.open(event.registration_link!, '_blank')}
                  >
                    Join / Register
                  </Button>
              )}
               {!event.registration_link && (
                  <Button 
                    size="lg" 
                    disabled
                    className="flex-1 font-semibold text-base shadow-lg opacity-50 cursor-not-allowed"
                  >
                    Registration Closed
                  </Button>
              )}

              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 border-white/20 bg-white/5 hover:bg-white/10">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
        </div>
      </div>
    </div>
  )
}

