'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// In standalone mode, orgSlug routes redirect to /portal
export default function BrandedPortalRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/portal')
  }, [router])
  return null
}
