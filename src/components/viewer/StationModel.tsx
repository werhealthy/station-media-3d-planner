import { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import type {
  StationModelAdapter,
  StationModelHandle,
} from '@/adapters/station-model/types'

interface StationModelProps {
  adapter: StationModelAdapter
  fallbackAdapter?: StationModelAdapter
  onLoaded?: (handle: StationModelHandle) => void
  onError?: (message: string) => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; handle: StationModelHandle }
  | { status: 'error'; message: string }

export function StationModel({
  adapter,
  fallbackAdapter,
  onLoaded,
  onError,
}: StationModelProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    let loadedHandle: StationModelHandle | null = null

    let owner = adapter
    const loadWithFallback = async () => {
      try {
        return await adapter.load()
      } catch (error) {
        if (!fallbackAdapter) throw error
        const message = error instanceof Error ? error.message : String(error)
        console.error(
          'Modello esterno non disponibile; uso la stazione procedurale:',
          error,
        )
        onError?.(`${message} È stato attivato il fallback procedurale.`)
        owner = fallbackAdapter
        return fallbackAdapter.load()
      }
    }

    loadWithFallback()
      .then((result) => {
        if (cancelled) {
          owner.dispose(result)
          return
        }
        loadedHandle = result
        onLoaded?.(result)
        setState({ status: 'loaded', handle: result })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message =
          error instanceof Error
            ? error.message
            : 'Errore sconosciuto nel caricamento del modello.'
        console.error('Impossibile caricare il modello della stazione:', error)
        setState({ status: 'error', message })
      })

    return () => {
      cancelled = true
      if (loadedHandle) {
        owner.dispose(loadedHandle)
      }
    }
  }, [adapter, fallbackAdapter, onError, onLoaded])

  if (state.status === 'error') {
    return (
      <Html center>
        <div className="max-w-xs rounded bg-red-600 px-3 py-2 text-center text-sm text-white shadow-lg">
          Errore nel caricamento della stazione: {state.message}
        </div>
      </Html>
    )
  }

  if (state.status !== 'loaded') {
    return (
      <Html center>
        <div
          role="status"
          className="whitespace-nowrap rounded-lg bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          Caricamento stazione…
        </div>
      </Html>
    )
  }

  return <primitive object={state.handle.root} />
}
