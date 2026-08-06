import { useEffect, useState } from 'react'
import type { StationModelAdapter, StationModelHandle } from '@/adapters/station-model/types'

interface StationModelProps {
  adapter: StationModelAdapter
}

export function StationModel({ adapter }: StationModelProps) {
  const [handle, setHandle] = useState<StationModelHandle | null>(null)

  useEffect(() => {
    let cancelled = false
    let loadedHandle: StationModelHandle | null = null

    adapter.load().then((result) => {
      if (cancelled) {
        adapter.dispose(result)
        return
      }
      loadedHandle = result
      setHandle(result)
    })

    return () => {
      cancelled = true
      if (loadedHandle) {
        adapter.dispose(loadedHandle)
      }
    }
  }, [adapter])

  if (!handle) {
    return null
  }

  return <primitive object={handle.root} />
}
