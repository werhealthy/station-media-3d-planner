import { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import type {
  StationModelAdapter,
  StationModelHandle,
} from '@/adapters/station-model/types'

interface StationModelProps {
  adapter: StationModelAdapter
}

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; handle: StationModelHandle }
  | { status: 'error'; message: string }

export function StationModel({ adapter }: StationModelProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    let loadedHandle: StationModelHandle | null = null

    adapter
      .load()
      .then((result) => {
        if (cancelled) {
          adapter.dispose(result)
          return
        }
        loadedHandle = result
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
        adapter.dispose(loadedHandle)
      }
    }
  }, [adapter])

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
    return null
  }

  return <primitive object={state.handle.root} />
}
