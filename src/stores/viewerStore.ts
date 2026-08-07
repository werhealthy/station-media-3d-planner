import { create } from 'zustand'

export type TransformMode = 'translate' | 'rotate' | 'scale'

interface ViewerState {
  selectedObjectId: string | null
  setSelectedObjectId: (id: string | null) => void

  hoveredObjectId: string | null
  setHoveredObjectId: (id: string | null) => void

  transformMode: TransformMode
  setTransformMode: (mode: TransformMode) => void

  showMarkers: boolean
  showHotspots: boolean
  showRoutes: boolean
  setShowMarkers: (value: boolean) => void
  setShowHotspots: (value: boolean) => void
  setShowRoutes: (value: boolean) => void
}

/**
 * Stato di selezione/interazione con la scena 3D.
 * Cambia solo su azione utente (click, hover, cambio strumento):
 * NON va aggiornato ad ogni frame di animazione (vedi CLAUDE.md).
 */
export const useViewerStore = create<ViewerState>((set) => ({
  selectedObjectId: null,
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  hoveredObjectId: null,
  setHoveredObjectId: (id) => set({ hoveredObjectId: id }),

  transformMode: 'translate',
  setTransformMode: (mode) => set({ transformMode: mode }),

  showMarkers: true,
  showHotspots: true,
  showRoutes: true,
  setShowMarkers: (value) => set({ showMarkers: value }),
  setShowHotspots: (value) => set({ showHotspots: value }),
  setShowRoutes: (value) => set({ showRoutes: value }),
}))
