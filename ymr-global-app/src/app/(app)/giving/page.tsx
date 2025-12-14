'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function GivingPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-[#e9f6fb95] p-8 text-center space-y-2">
        <div className="flex items-center justify-center mx-auto mb-4">
          <Image src="/images/YMR_black_logo.png" alt="YMR" width={120} height={48} />
        </div>
        <h1 className="text-2xl font-bold text-black">YMR Global Partnership</h1>
        <p className="text-medium max-w-xs mx-auto text-gray-900">
          BY FYEI
        </p>
      </div>

      <div className="p-6 mt-6 container max-w-xl mx-auto">
        <Card className="p-10 space-y-8 shadow-xl border-border/50 flex flex-col items-center text-center">
          
          <div className="h-20 w-20 bg-[#0BA4DB]/10 rounded-full flex items-center justify-center mb-2 animate-in fade-in zoom-in duration-500">
             <Heart className="h-10 w-10 text-[#0BA4DB] fill-[#0BA4DB]/20" />
          </div>

          <div className="space-y-4">
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground/90 font-serif italic">
              Your giving will help us to push the frontiers of the kingdom. Until the kingdom of the world becomes the Kingdom of our God!
            </p>
          </div>

          <Button 
            asChild 
            className="w-full max-w-xs h-14 text-lg font-semibold bg-[#0BA4DB] hover:bg-[#0BA4DB]/90 text-white shadow-lg hover:shadow-xl transition-all rounded-full hover:scale-105 active:scale-95 duration-200"
          >
            <Link href="https://ymrglobal.org/partner/" target="_blank" rel="noopener noreferrer">
              Give
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
