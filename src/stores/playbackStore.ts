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
  activeStepIndex: number
  activeMediaPointId: string | null
  seekToken: number

  setActiveRouteId: (id: string | null) => void
  play: () => void
  pause: () => void
  stop: () => void
  setProgress: (progress: number) => void
  setPlaybackSpeed: (speed: number) => void
  setActiveStep: (index: number, mediaPointId: string | null) => void
  seekTo: (progress: number) => void
}

export const usePlaybackStore = create<PlaybackState>()(
  subscribeWithSelector((set) => ({
    activeRouteId: null,
    isPlaying: false,
    progress: 0,
    playbackSpeed: 1,
    activeStepIndex: 0,
    activeMediaPointId: null,
    seekToken: 0,

    setActiveRouteId: (id) => set({ activeRouteId: id, progress: 0 }),
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    stop: () =>
      set({
        isPlaying: false,
        progress: 0,
        activeStepIndex: 0,
        activeMediaPointId: null,
      }),
    setProgress: (progress) =>
      set({ progress: Math.min(1, Math.max(0, progress)) }),
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
    setActiveStep: (activeStepIndex, activeMediaPointId) =>
      set({ activeStepIndex, activeMediaPointId }),
    seekTo: (progress) =>
      set((state) => ({
        progress: Math.min(1, Math.max(0, progress)),
        seekToken: state.seekToken + 1,
      })),
  })),
)
