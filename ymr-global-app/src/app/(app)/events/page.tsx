'use client'

import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, ChevronRight, InboxIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

export default function EventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true })
      
      if (error) throw error
      return data as Event[]
    }
  })

  // Group events
  const now = new Date()
  
  const featuredEvent = events.find(e => e.is_featured && new Date(e.end_time || e.start_time) >= now)
  
  const ongoingEvents = events.filter(e => {
    const start = new Date(e.start_time)
    const end = e.end_time ? new Date(e.end_time) : new Date(start.getTime() + 3600000) // Default 1 hour duration
    return start <= now && end >= now && e.id !== featuredEvent?.id
  })

  const upcomingEvents = events.filter(e => {
    const start = new Date(e.start_time)
    return start > now && e.id !== featuredEvent?.id
  })

  const pastEvents = events.filter(e => {
    const end = e.end_time ? new Date(e.end_time) : new Date(new Date(e.start_time).getTime() + 3600000)
    return end < now
  })

  // Format date helper
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      month: format(date, 'MMM').toUpperCase(),
      day: format(date, 'd')
    }
  }

  const formatTimeDisplay = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 p-6 space-y-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="aspect-video w-full bg-muted animate-pulse rounded-xl" />
        <div className="space-y-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-lg" />
           ))}
        </div>
      </div>
    )
  }

  // Empty State
  if (!isLoading && events.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <div className="bg-muted/50 p-6 rounded-full mb-4">
            <InboxIcon className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No Events Yet</h2>
        <p>Stay tuned for upcoming gatherings and services.</p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="p-6 bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-muted-foreground">Gather with the saints.</p>
      </div>

      <div className="p-4 space-y-8">
        {/* Featured Event */}
        {featuredEvent && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Featured</h2>
            <Link href={`/events/${featuredEvent.id}`}>
                <Card className="overflow-hidden border-primary/20 hover:border-primary/40 transition-all active:scale-[0.99] group p-0">
                <div className="relative aspect-video w-full rounded-lg">
                    {featuredEvent.image_url ? (
                        <Image
                        src={featuredEvent.image_url}
                        alt={featuredEvent.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                    )}
                    
                    <div className="absolute top-2 right-2">
                    <Badge className="bg-primary/90 text-white border-none backdrop-blur-sm shadow-sm">
                        {featuredEvent.status || 'Featured'}
                    </Badge>
                    </div>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-90" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold leading-tight mb-2 text-white">{featuredEvent.title}</h3>
                        <div className="flex items-center gap-3 text-white/90 text-sm">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{format(new Date(featuredEvent.start_time), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formatTimeDisplay(featuredEvent.start_time)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                </Card>
            </Link>
            </motion.section>
        )}

        {/* Ongoing Events */}
        {ongoingEvents.length > 0 && (
            <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Happening Now</h2>
            <motion.div 
               className="space-y-3"
               variants={container}
               initial="hidden"
               animate="show"
            >
                {ongoingEvents.map(event => (
                  <motion.div key={event.id} variants={item}>
                    <EventListItem event={event} formatDateDisplay={formatDateDisplay} formatTimeDisplay={formatTimeDisplay} />
                  </motion.div>
                ))}
            </motion.div>
            </section>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
            <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Upcoming</h2>
            <motion.div 
               className="space-y-3"
               variants={container}
               initial="hidden"
               animate="show"
            >
                {upcomingEvents.map(event => (
                  <motion.div key={event.id} variants={item}>
                    <EventListItem event={event} formatDateDisplay={formatDateDisplay} formatTimeDisplay={formatTimeDisplay} />
                  </motion.div>
                ))}
            </motion.div>
            </section>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
            <section className="opacity-70 grayscale-[0.5]">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Past Events</h2>
            <motion.div 
               className="space-y-3"
               variants={container}
               initial="hidden"
               animate="show"
            >
                {pastEvents.map(event => (
                  <motion.div key={event.id} variants={item}>
                    <EventListItem event={event} formatDateDisplay={formatDateDisplay} formatTimeDisplay={formatTimeDisplay} />
                  </motion.div>
                ))}
            </motion.div>
            </section>
        )}
        
        {!featuredEvent && upcomingEvents.length === 0 && ongoingEvents.length === 0 && pastEvents.length === 0 && (
            <div className="py-8 text-center">
                <p className="text-muted-foreground">No events found matching your criteria.</p>
            </div>
        )}
      </div>
    </div>
  )
}

function EventListItem({ event, formatDateDisplay, formatTimeDisplay }: { event: Event, formatDateDisplay: any, formatTimeDisplay: any }) {
    const dateDisplay = formatDateDisplay(event.start_time)
    const timeDisplay = formatTimeDisplay(event.start_time)
    
    return (
        <Link href={`/events/${event.id}`} className="block group">
            <Card className="flex flex-row items-center gap-4 p-3 border-border bg-card/50 hover:bg-accent/50 transition-all active:scale-[0.99]">
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex flex-col items-center justify-center overflow-hidden shrink-0 border border-primary/10 group-hover:border-primary/30 transition-colors">
                <span className="text-[10px] font-bold text-primary uppercase">{dateDisplay.month}</span>
                <span className="text-xl font-bold text-foreground">{dateDisplay.day}</span>
            </div>
            <div className="flex-1 min-w-0 py-1">
                <h3 className="font-semibold text-foreground truncate mb-1">{event.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {event.location && (
                        <>
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{event.location}</span>
                        </>
                    )}
                </div>
                 <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{timeDisplay}</span>
                </div>
            </div>
            <div className="flex items-center justify-center pl-1 pr-1">
                <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            </Card>
        </Link>
    )
}
