import { create } from 'zustand'
import { stationIdFromQuery, type StationId } from '@/domain/stations'

interface StationState {
  selectedStationId: StationId
  selectStation: (id: StationId) => void
}

const initialStation =
  typeof window === 'undefined'
    ? 'low-poly'
    : stationIdFromQuery(window.location.search)

export const useStationStore = create<StationState>((set) => ({
  selectedStationId: initialStation,
  selectStation: (selectedStationId) => set({ selectedStationId }),
}))
