'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import PortalNav from '@/components/portal/PortalNav'
import { Image, Camera, Loader2 } from 'lucide-react'

export default function PortalGalleryPage() {
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal-login')
        return
      }

      const { data: contacts } = await supabase
        .from('contacts')
        .select('first_name, last_name')
        .eq('email', user.email)
        .limit(1)

      if (contacts && contacts.length > 0) {
        setUserName(`${contacts[0].first_name} ${contacts[0].last_name}`)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <>
        <PortalNav userName="" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin" size={32} style={{ color: '#8B7355' }} />
        </div>
      </>
    )
  }

  return (
    <>
      <PortalNav userName={userName} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1
            className="portal-heading"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '2rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '0.375rem',
            }}
          >
            Your Gallery
          </h1>
          <p
            style={{
              fontFamily: "'Jost', system-ui, sans-serif",
              fontSize: '1rem',
              color: '#8B7355',
            }}
          >
            Photos from your workshop experiences.
          </p>
        </div>

        {/* Placeholder — MVP */}
        <div
          className="portal-card text-center py-20"
          style={{ maxWidth: 540, margin: '0 auto' }}
        >
          <div
            className="inline-flex items-center justify-center rounded-full mb-6"
            style={{
              width: 80,
              height: 80,
              background: 'rgba(212, 184, 160, 0.15)',
              color: '#C9B8A8',
            }}
          >
            <Camera size={36} />
          </div>

          <h2
            className="portal-heading"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '0.75rem',
            }}
          >
            Coming Soon
          </h2>

          <p
            style={{
              fontFamily: "'Jost', system-ui, sans-serif",
              fontSize: '0.9375rem',
              color: '#8B7355',
              lineHeight: 1.7,
              maxWidth: 360,
              margin: '0 auto',
            }}
          >
            Your photos from recent workshops will appear here. We are working on making your memories accessible in this gallery.
          </p>

          {/* Placeholder masonry grid preview */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-10"
            style={{ opacity: 0.4 }}
          >
            {[140, 180, 160, 200, 150, 170].map((h, i) => (
              <div
                key={i}
                className="rounded-lg flex items-center justify-center"
                style={{
                  background: '#F5F0EB',
                  height: h,
                  border: '1px dashed #E8E0D8',
                }}
              >
                <Image size={24} style={{ color: '#E8E0D8' }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
