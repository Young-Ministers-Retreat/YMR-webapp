'use client'

import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { EmblaCarouselType } from 'embla-carousel'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface FeaturedContent {
  id: string
  title: string
  thumbnail_url: string
  media_url: string
  is_live: boolean
  // We'll try to parse preacher from title if not available separately
  preacher_name?: string 
}

interface FeaturedCarouselProps {
  items: FeaturedContent[]
}

const DotButton = (props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
  const { children, className, ...restProps } = props

  return (
    <button
      type="button"
      className={cn("w-2 h-2 rounded-full transition-all duration-300", className)}
      {...restProps}
    >
      {children}
    </button>
  )
}

// Skeletal Loader Component
export function FeaturedCarouselSkeleton() {
  return (
    <Card className="relative overflow-hidden h-[240px] md:h-[320px] border-none shadow-lg bg-muted/20">
      <div className="absolute inset-0 bg-linear-to-r from-muted/10 via-muted/30 to-muted/10 animate-pulse">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      <div className="relative z-10 h-full flex flex-col justify-between p-6">
        {/* Bottom Section Skeleton */}
        <div className="flex justify-between items-end gap-4 mt-auto">
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-muted/40 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-muted/30 rounded w-1/2 animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-muted/40 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Dots Skeleton */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-white/30" />
        ))}
      </div>
    </Card>
  )
}

export function FeaturedCarousel({ items }: FeaturedCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ 
      delay: 5000, 
      stopOnInteraction: false, // Continue looping after interaction
      stopOnMouseEnter: true,   // Pause when hovering
      stopOnFocusIn: true        // Pause when focused
    })]
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList())
  }, [])

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onInit(emblaApi)
    onSelect(emblaApi)
    emblaApi.on('reInit', onInit)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onInit, onSelect])

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  )

  if (items.length === 0) {
    return null
  }

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {items.map((item) => {
            // Heuristic to split title and preacher if cleaner title is needed
            // Patterns: "Title - Preacher", "Title || Preacher", "Title by Preacher"
            let displayTitle = item.title
            let displayPreacher = item.preacher_name || "P. Daniel Olawande" // Default fallback or extracted

            if (!item.preacher_name) {
                const separators = [" - ", " || ", " by "]
                for (const sep of separators) {
                    if (displayTitle.includes(sep)) {
                        const parts = displayTitle.split(sep)
                        // Assume last part is preacher if reasonable length, or first part is title
                        // "Title - Preacher"
                        if (parts.length > 1) {
                            displayTitle = parts[0].trim()
                            // Clean up preacher name (remove tags like #fire)
                            displayPreacher = parts[1].split('#')[0].trim()
                        }
                        break
                    }
                }
            }

            return (
              <div className="relative flex-[0_0_100%] min-w-0" key={item.id}>
                <Card className="relative overflow-hidden h-[240px] md:h-[320px] border-none shadow-lg">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={item.thumbnail_url || '/placeholder-sermon.jpg'}
                      alt={item.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                  </div>

                  {/* Content Container */}
                  <div className="relative z-10 h-full flex flex-col justify-between p-6">
                    {/* Top Section */}
                    <div className="flex w-full">
                      {item.is_live && (
                         <div className="ml-auto flex items-center gap-2">
                             <span className="relative flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                             </span>
                             <span className="bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                               LIVE NOW
                             </span>
                         </div>
                      )}
                    </div>

                    {/* Bottom Section */}
                    <div className="flex justify-between items-end gap-4 mt-auto">
                        <div className="flex-1 min-w-0">
                           <h2 className="text-xl md:text-2xl font-bold text-white mb-1 line-clamp-2 leading-tight">
                             {displayTitle}
                           </h2>
                           <p className="text-sm md:text-base text-gray-300 font-medium truncate">
                             {displayPreacher}
                           </p>
                        </div>
                        
                        <Button
                          className="shrink-0 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all active:scale-95"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={item.media_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Play className="mr-2 h-4 w-4 fill-current" />
                            Watch Now
                          </a>
                        </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dots/Indicators */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
        {scrollSnaps.map((_, index) => (
          <DotButton
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "bg-white/50 hover:bg-white/80",
              index === selectedIndex ? "bg-white w-6" : "scale-90"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
