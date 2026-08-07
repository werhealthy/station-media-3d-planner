import { parseStationConfig, type StationConfig } from '@/domain/stationConfig'
import type { StationDefinition } from '@/domain/stations'

export async function loadStationConfig(
  station: StationDefinition,
  signal?: AbortSignal,
): Promise<StationConfig | null> {
  if (!station.configPath) return null
  const response = await fetch(station.configPath, { signal })
  if (response.status === 404) return null
  if (!response.ok)
    throw new Error(`Configurazione stazione non disponibile (${response.status}).`)

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Content-Type non valido per la configurazione: ${contentType || 'assente'}.`,
    )
  }

  return parseStationConfig(await response.json())
}
