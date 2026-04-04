'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bot, Key, Eye, EyeOff, Check, ExternalLink } from 'lucide-react'

interface AIProvider {
  id: string
  name: string
  description: string
  keyPlaceholder: string
  docsUrl: string
  icon: string
  category: 'llm' | 'image' | 'voice' | 'video' | 'local'
}

const AI_PROVIDERS: AIProvider[] = [
  { id: 'openrouter', name: 'OpenRouter', description: 'One API key for 200+ models — Claude, GPT-4o, DeepSeek, Llama, Mixtral. Recommended as your primary AI provider.', keyPlaceholder: 'sk-or-...', docsUrl: 'https://openrouter.ai/keys', icon: '🔀', category: 'llm' },
  { id: 'anthropic', name: 'Claude (Anthropic)', description: 'Direct Anthropic access — email drafting, lead scoring, meeting summaries, smart replies', keyPlaceholder: 'sk-ant-...', docsUrl: 'https://console.anthropic.com/', icon: '🧠', category: 'llm' },
  { id: 'openai', name: 'OpenAI', description: 'Direct OpenAI access — GPT-4o for bulk tasks and fallback', keyPlaceholder: 'sk-...', docsUrl: 'https://platform.openai.com/api-keys', icon: '⚡', category: 'llm' },
  { id: 'deepseek', name: 'DeepSeek', description: 'Budget AI for high-volume automation — email categorization, tagging', keyPlaceholder: 'sk-...', docsUrl: 'https://platform.deepseek.com/', icon: '🔍', category: 'llm' },
  { id: 'ollama', name: 'Ollama (Local)', description: 'Self-hosted AI for data privacy — runs on your machine, no data leaves', keyPlaceholder: 'http://localhost:11434', docsUrl: 'https://ollama.com/', icon: '🏠', category: 'local' },
  { id: 'gemini', name: 'Google Gemini', description: 'Image generation and editing — used by cinematic sites pipeline', keyPlaceholder: 'AIza...', docsUrl: 'https://aistudio.google.com/apikey', icon: '✨', category: 'image' },
  { id: 'minimax', name: 'MiniMax', description: 'Video and image generation for social media content creation', keyPlaceholder: 'eyJ...', docsUrl: 'https://www.minimaxi.com/', icon: '🎬', category: 'video' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'AI voice agents — manages voice concierge on cinematic sites', keyPlaceholder: 'sk_...', docsUrl: 'https://elevenlabs.io/', icon: '🎙️', category: 'voice' },
  { id: 'wavespeed', name: 'WaveSpeed', description: 'Kling v3 video animation — cinematic hero generation', keyPlaceholder: '...', docsUrl: 'https://wavespeed.ai/', icon: '🌊', category: 'video' },
]

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'llm', label: 'Language Models' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'voice', label: 'Voice' },
  { id: 'local', label: 'Local' },
]

export default function AIProvidersPage() {
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [visibility, setVisibility] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    // Load saved keys from org metadata (stored in organizations table or a settings table)
    // For MVP, we'll use localStorage as a simple store
    const stored = localStorage.getItem('viox-crm-ai-keys')
    if (stored) setKeys(JSON.parse(stored))
  }

  function updateKey(providerId: string, value: string) {
    setKeys(prev => ({ ...prev, [providerId]: value }))
    setSaved(prev => ({ ...prev, [providerId]: false }))
  }

  function saveKey(providerId: string) {
    const allKeys = { ...keys }
    localStorage.setItem('viox-crm-ai-keys', JSON.stringify(allKeys))
    setSaved(prev => ({ ...prev, [providerId]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [providerId]: false })), 2000)
  }

  function toggleVisibility(providerId: string) {
    setVisibility(prev => ({ ...prev, [providerId]: !prev[providerId] }))
  }

  const filtered = filter === 'all' ? AI_PROVIDERS : AI_PROVIDERS.filter(p => p.category === filter)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">AI Providers</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Configure AI model API keys to power CRM features — email drafting, lead scoring, content generation, and voice agents.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === cat.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Provider cards */}
      <div className="grid gap-4">
        {filtered.map(provider => (
          <div
            key={provider.id}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--accent)]/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <h3 className="font-medium text-[var(--text)]">{provider.name}</h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{provider.description}</p>
                </div>
              </div>
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type={visibility[provider.id] ? 'text' : 'password'}
                  value={keys[provider.id] || ''}
                  onChange={(e) => updateKey(provider.id, e.target.value)}
                  placeholder={provider.id === 'ollama' ? provider.keyPlaceholder : `Enter ${provider.name} API key`}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
                <button
                  onClick={() => toggleVisibility(provider.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
                >
                  {visibility[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                onClick={() => saveKey(provider.id)}
                disabled={!keys[provider.id]}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  saved[provider.id]
                    ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30'
                    : keys[provider.id]
                      ? 'bg-[var(--accent)] text-white hover:opacity-90'
                      : 'bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)] cursor-not-allowed'
                }`}
              >
                {saved[provider.id] ? <Check size={16} /> : 'Save'}
              </button>
            </div>

            {keys[provider.id] && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                <span className="text-xs text-[var(--success)]">Connected</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Bot size={20} className="text-[var(--accent)] mt-0.5" />
          <div>
            <h4 className="font-medium text-[var(--text)] text-sm">How AI is used in VioX CRM</h4>
            <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
              <li>• <strong>OpenRouter (recommended):</strong> One key for 200+ models — switch between Claude, GPT-4o, DeepSeek, Llama without managing separate keys</li>
              <li>• <strong>Claude/OpenAI/DeepSeek:</strong> Direct API access — use if you want to bypass OpenRouter for specific models</li>
              <li>• <strong>Ollama:</strong> Same features but running locally — your data never leaves your machine</li>
              <li>• <strong>Gemini:</strong> AI image generation for cinematic site assets and social media visuals</li>
              <li>• <strong>MiniMax:</strong> AI video generation for social media content</li>
              <li>• <strong>ElevenLabs:</strong> Voice agent management — update knowledge base, change voice, view call logs</li>
              <li>• <strong>WaveSpeed:</strong> Cinematic hero video animation (Kling v3 Pro)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
