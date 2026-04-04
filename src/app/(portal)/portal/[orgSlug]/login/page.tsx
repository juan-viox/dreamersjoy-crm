'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BrandedPortalLoginRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/portal-login')
  }, [router])
  return null
}
