import { create } from 'zustand'
interface ViewerState {
  selectedMediaPointId: string | null
  hoveredMediaPointId: string | null
  selectMediaPoint: (id: string | null) => void
  hoverMediaPoint: (id: string | null) => void
}
export const useViewerStore = create<ViewerState>((set) => ({
  selectedMediaPointId: null,
  hoveredMediaPointId: null,
  selectMediaPoint: (id) => set({ selectedMediaPointId: id }),
  hoverMediaPoint: (id) => set({ hoveredMediaPointId: id }),
}))
