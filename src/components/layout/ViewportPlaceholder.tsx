import { Box } from 'lucide-react'

export function ViewportPlaceholder() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <Box size={32} aria-hidden="true" />
        <p className="text-sm font-medium">Viewer 3D</p>
        <p className="max-w-xs text-center text-xs">
          La scena 3D (stazione dimostrativa, camere, controlli di
          navigazione) sara' introdotta nella Fase 2 del piano di
          implementazione.
        </p>
      </div>
    </div>
  )
}
