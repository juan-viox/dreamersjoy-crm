'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

interface ThemeToggleProps {
  /** Render a compact icon-only button (for sidebar collapsed state or topbar) */
  compact?: boolean
  /** Show the label text next to the icon */
  showLabel?: boolean
}

export default function ThemeToggle({ compact = false, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg transition-colors"
        style={{
          color: 'var(--muted)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-2)'
          e.currentTarget.style.color = 'var(--text)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--muted)'
        }}
        title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        <div className="relative w-4 h-4">
          <Sun
            className="w-4 h-4 absolute inset-0 transition-all duration-300"
            style={{
              opacity: isLight ? 1 : 0,
              transform: isLight ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
            }}
          />
          <Moon
            className="w-4 h-4 absolute inset-0 transition-all duration-300"
            style={{
              opacity: isLight ? 0 : 1,
              transform: isLight ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
            }}
          />
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="sidebar-item w-full"
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <div className="relative w-[1.125rem] h-[1.125rem] shrink-0">
        <Sun
          className="w-[1.125rem] h-[1.125rem] absolute inset-0 transition-all duration-300"
          style={{
            opacity: isLight ? 1 : 0,
            transform: isLight ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
          }}
        />
        <Moon
          className="w-[1.125rem] h-[1.125rem] absolute inset-0 transition-all duration-300"
          style={{
            opacity: isLight ? 0 : 1,
            transform: isLight ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-[13px]">{isLight ? 'Dark Mode' : 'Light Mode'}</span>
      )}
    </button>
  )
}
