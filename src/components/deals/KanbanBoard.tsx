'use client'

import { useState, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Avatar from '@/components/shared/Avatar'
import type { DealStage, Deal } from '@/types'

function KanbanCard({
  deal,
  stageColor,
  isDragOverlay,
}: {
  deal: Deal
  stageColor?: string
  isDragOverlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: { type: 'deal', deal },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const contactName = deal.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name}`
    : null

  const probability = deal.probability ?? 0

  const cardStyle = {
    ...(isDragOverlay ? {} : style),
    borderLeftColor: stageColor || 'var(--accent)',
  }

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={cardStyle}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      className={`kanban-card mb-2 ${isDragOverlay ? 'dragging' : ''}`}
    >
      <Link
        href={`/deals/${deal.id}`}
        className="block"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium mb-1.5">{deal.title}</p>
        <p
          className="text-lg font-bold"
          style={{ color: 'var(--accent-light)' }}
        >
          {formatCurrency(deal.amount ?? 0)}
        </p>

        {/* Probability bar */}
        {probability > 0 && (
          <div className="mt-2">
            <div className="probability-bar">
              <div
                className="probability-bar-fill"
                style={{
                  width: `${probability}%`,
                  background: stageColor || 'var(--accent)',
                }}
              />
            </div>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: 'var(--muted)' }}
            >
              {probability}%
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5">
          {contactName ? (
            <div className="flex items-center gap-1.5">
              <Avatar name={contactName} size="sm" />
              <span
                className="text-xs truncate max-w-[100px]"
                style={{ color: 'var(--muted)' }}
              >
                {contactName}
              </span>
            </div>
          ) : (
            <span />
          )}
          {deal.close_date && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--muted)' }}
            >
              <Calendar className="w-3 h-3" />
              {formatDate(deal.close_date)}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}

function KanbanColumn({
  stage,
  deals,
}: {
  stage: DealStage
  deals: Deal[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const columnRef = useRef<HTMLDivElement>(null)

  const totalAmount = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0)

  useGSAP(() => {
    if (!columnRef.current) return
    gsap.from(columnRef.current.querySelectorAll('.kanban-card'), {
      y: 12,
      opacity: 0,
      duration: 0.3,
      stagger: 0.05,
      ease: 'power2.out',
    })
  }, [])

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
    >
      {/* Colored top border */}
      <div
        className="h-1 rounded-t-lg"
        style={{ background: stage.color }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{stage.name}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: `${stage.color}20`,
              color: stage.color,
            }}
          >
            {deals.length}
          </span>
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--muted)' }}
        >
          {formatCurrency(totalAmount)}
        </span>
      </div>

      {/* Cards */}
      <div ref={columnRef} className="flex-1 p-2 space-y-0 min-h-[100px] overflow-y-auto">
        {deals.map((deal) => (
          <KanbanCard
            key={deal.id}
            deal={deal}
            stageColor={stage.color}
          />
        ))}
      </div>

      {/* Add deal button */}
      <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <Link
          href="/deals/new"
          className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium w-full transition-colors"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-2)'
            e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--muted)'
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Deal
        </Link>
      </div>
    </div>
  )
}

export default function KanbanBoard({
  stages,
  deals: initialDeals,
}: {
  stages: DealStage[]
  deals: Deal[]
}) {
  const [deals, setDeals] = useState(initialDeals)
  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDealId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDealId(null)
      const { active, over } = event
      if (!over) return

      const dealId = active.id as string
      const newStageId = over.id as string

      const isStage = stages.some((s) => s.id === newStageId)
      if (!isStage) return

      const deal = deals.find((d) => d.id === dealId)
      if (!deal || deal.stage_id === newStageId) return

      // Optimistic update
      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId ? { ...d, stage_id: newStageId } : d
        )
      )

      // Persist
      await supabase
        .from('deals')
        .update({ stage_id: newStageId })
        .eq('id', dealId)
    },
    [deals, stages, supabase]
  )

  const activeDeal = activeDealId
    ? deals.find((d) => d.id === activeDealId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div ref={containerRef} className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals.filter((d) => d.stage_id === stage.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <KanbanCard
            deal={activeDeal}
            stageColor={
              stages.find((s) => s.id === activeDeal.stage_id)?.color
            }
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
