import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function SortableItem({ id, index, label }: { id: string; index: number; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/5 ${
        isDragging ? 'opacity-70' : ''
      }`}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-100">
        {index}
      </div>
      <div className="flex-1 font-semibold">{label}</div>
      <button
        {...attributes}
        {...listeners}
        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
      >
        Drag
      </button>
    </div>
  )
}

