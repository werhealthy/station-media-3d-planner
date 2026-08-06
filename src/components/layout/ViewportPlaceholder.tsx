import { Canvas } from '../viewer/Canvas'

export function ViewportPlaceholder() {
  return (
    <div className="flex-1 bg-slate-900">
      <Canvas />
    </div>
  )
}
