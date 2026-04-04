'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BrandedProfileRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/portal/profile')
  }, [router])
  return null
}
