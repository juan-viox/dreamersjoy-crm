'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BrandedBookingsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/portal/bookings')
  }, [router])
  return null
}
