import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  JourneyDecision,
  JourneyId,
} from '@/domain/journeys'

export type ServiceChoice = 'self' | 'servito'
export type PaymentChoice = 'acceptor' | 'svolta'

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
  pendingDecision: JourneyDecision | null
  serviceChoice: ServiceChoice | null
  paymentChoice: PaymentChoice | null

  setActiveRouteId: (id: string | null) => void
  play: () => void
  pause: () => void
  stop: () => void
  setProgress: (progress: number) => void
  setPlaybackSpeed: (speed: number) => void
  setActiveStep: (index: number, mediaPointId: string | null) => void
  seekTo: (progress: number) => void
  openDecision: (decision: JourneyDecision) => void
  continueOnRoute: (options: {
    routeId: JourneyId
    progress: number
    activeStepIndex: number
    serviceChoice?: ServiceChoice
    paymentChoice?: PaymentChoice
  }) => void
  resetInteractiveJourney: () => void
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
    pendingDecision: null,
    serviceChoice: null,
    paymentChoice: null,

    setActiveRouteId: (id) =>
      set({
        activeRouteId: id,
        progress: 0,
        pendingDecision: null,
        serviceChoice: null,
        paymentChoice: null,
      }),
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    stop: () =>
      set({
        isPlaying: false,
        progress: 0,
        activeStepIndex: 0,
        activeMediaPointId: null,
        pendingDecision: null,
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
    openDecision: (pendingDecision) =>
      set({ pendingDecision, isPlaying: false }),
    continueOnRoute: ({
      routeId,
      progress,
      activeStepIndex,
      serviceChoice,
      paymentChoice,
    }) =>
      set((state) => ({
        activeRouteId: routeId,
        progress: Math.min(1, Math.max(0, progress)),
        activeStepIndex,
        activeMediaPointId: null,
        pendingDecision: null,
        serviceChoice: serviceChoice ?? state.serviceChoice,
        paymentChoice: paymentChoice ?? state.paymentChoice,
        isPlaying: true,
        seekToken: state.seekToken + 1,
      })),
    resetInteractiveJourney: () =>
      set((state) => ({
        activeRouteId: 'self-service',
        isPlaying: true,
        progress: 0,
        activeStepIndex: 0,
        activeMediaPointId: null,
        pendingDecision: null,
        serviceChoice: null,
        paymentChoice: null,
        seekToken: state.seekToken + 1,
      })),
  })),
)
