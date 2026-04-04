'use client'

import { getInitials } from '@/lib/utils'

const colors = [
  '#6c5ce7', '#a29bfe', '#00b894', '#e17055', '#fdcb6e',
  '#74b9ff', '#fd79a8', '#55efc4', '#fab1a0', '#81ecec',
]

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

export default function Avatar({
  name,
  size = 'md',
  src,
  status,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  src?: string
  status?: 'online' | 'offline' | 'away'
}) {
  const avatar = src ? (
    <img
      src={src}
      alt={name}
      className={`${sizes[size]} rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ background: getColor(name) }}
      title={name}
    >
      {getInitials(name)}
    </div>
  )

  if (status) {
    return (
      <div className={`avatar-ring ${status}`}>
        {avatar}
      </div>
    )
  }

  return avatar
}
