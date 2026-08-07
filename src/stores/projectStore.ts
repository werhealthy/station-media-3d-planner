import { create } from 'zustand'
import type { AdvertisingPoint } from '@/domain/schemas/banner'
import type { MediaAsset } from '@/domain/schemas/media'

interface ProjectState {
  projectName: string
  activeStationId: string | null

  // Fase 3: Asset e Banner
  mediaAssets: Map<string, MediaAsset>
  advertisingPoints: Map<string, AdvertisingPoint>

  // Actions
  setProjectName: (name: string) => void
  setActiveStationId: (id: string | null) => void

  // Asset actions
  addMediaAsset: (asset: MediaAsset) => void
  removeMediaAsset: (assetId: string) => void
  getMediaAsset: (assetId: string) => MediaAsset | undefined
  getAllMediaAssets: () => MediaAsset[]

  // Banner actions
  addAdvertisingPoint: (banner: AdvertisingPoint) => void
  updateAdvertisingPoint: (id: string, updates: Partial<AdvertisingPoint>) => void
  removeAdvertisingPoint: (id: string) => void
  getAdvertisingPoint: (id: string) => AdvertisingPoint | undefined
  getAllAdvertisingPoints: () => AdvertisingPoint[]
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'Nuovo progetto',
  activeStationId: null,
  mediaAssets: new Map(),
  advertisingPoints: new Map(),

  setProjectName: (name) => set({ projectName: name }),
  setActiveStationId: (id) => set({ activeStationId: id }),

  addMediaAsset: (asset) =>
    set((state) => {
      const newMap = new Map(state.mediaAssets)
      newMap.set(asset.id, asset)
      return { mediaAssets: newMap }
    }),

  removeMediaAsset: (assetId) =>
    set((state) => {
      const newMap = new Map(state.mediaAssets)
      newMap.delete(assetId)
      return { mediaAssets: newMap }
    }),

  getMediaAsset: (assetId) => get().mediaAssets.get(assetId),

  getAllMediaAssets: () => Array.from(get().mediaAssets.values()),

  addAdvertisingPoint: (banner) =>
    set((state) => {
      const newMap = new Map(state.advertisingPoints)
      newMap.set(banner.id, banner)
      return { advertisingPoints: newMap }
    }),

  updateAdvertisingPoint: (id, updates) =>
    set((state) => {
      const existing = state.advertisingPoints.get(id)
      if (!existing) return state
      const newMap = new Map(state.advertisingPoints)
      newMap.set(id, { ...existing, ...updates })
      return { advertisingPoints: newMap }
    }),

  removeAdvertisingPoint: (id) =>
    set((state) => {
      const newMap = new Map(state.advertisingPoints)
      newMap.delete(id)
      return { advertisingPoints: newMap }
    }),

  getAdvertisingPoint: (id) => get().advertisingPoints.get(id),

  getAllAdvertisingPoints: () => Array.from(get().advertisingPoints.values()),
}))
