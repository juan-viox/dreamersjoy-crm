'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BrandedGalleryRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/portal/gallery')
  }, [router])
  return null
}
