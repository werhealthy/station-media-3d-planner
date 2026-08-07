import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface PlaybackState {
  activeRouteId: string | null
  isPlaying: boolean
  /**
   * Progresso "grezzo" del percorso, tra 0 e 1, aggiornato a bassa
   * frequenza per alimentare la timeline nell'interfaccia. Il tempo
   * reale per-frame durante l'animazione vive in un ref locale al
   * componente che muove la camera (useFrame), non qui: vedi
   * docs/ARCHITECTURE.md, sezione sullo store playbackStore.
   */
  progress: number
  playbackSpeed: number

  setActiveRouteId: (id: string | null) => void
  play: () => void
  pause: () => void
  stop: () => void
  setProgress: (progress: number) => void
  setPlaybackSpeed: (speed: number) => void
}

export const usePlaybackStore = create<PlaybackState>()(
  subscribeWithSelector((set) => ({
    activeRouteId: null,
    isPlaying: false,
    progress: 0,
    playbackSpeed: 1,

    setActiveRouteId: (id) => set({ activeRouteId: id, progress: 0 }),
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    stop: () => set({ isPlaying: false, progress: 0 }),
    setProgress: (progress) => set({ progress: Math.min(1, Math.max(0, progress)) }),
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  })),
)
