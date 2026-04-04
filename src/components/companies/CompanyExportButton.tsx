'use client'

import { Download } from 'lucide-react'

interface CompanyData {
  id: string
  name: string
  domain?: string
  industry?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
}

export default function CompanyExportButton({ companies }: { companies: CompanyData[] }) {
  function exportCSV() {
    const headers = ['Name', 'Domain', 'Industry', 'Phone', 'Address', 'City', 'State', 'Zip']
    const rows = companies.map(c => [
      c.name,
      c.domain ?? '',
      c.industry ?? '',
      c.phone ?? '',
      c.address ?? '',
      c.city ?? '',
      c.state ?? '',
      c.zip ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `companies-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={exportCSV} className="btn btn-secondary">
      <Download className="w-4 h-4" /> Export
    </button>
  )
}
