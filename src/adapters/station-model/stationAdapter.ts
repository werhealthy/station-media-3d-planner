import { createFbxAdapter } from './fbxAdapter'
import { proceduralAdapter } from './proceduralAdapter'
import type { StationModelAdapter } from './types'
import type { StationDefinition } from '@/domain/stations'

export interface StationAdapterSelection {
  adapter: StationModelAdapter
  fallbackAdapter?: StationModelAdapter
}

export function selectStationAdapter(
  station: StationDefinition,
): StationAdapterSelection {
  if (station.modelType === 'procedural') return { adapter: proceduralAdapter }
  if (!station.modelPath || !station.textureBasePath) {
    throw new Error(
      `Configurazione FBX incompleta per la stazione "${station.id}".`,
    )
  }
  return {
    adapter: createFbxAdapter({
      url: station.modelPath,
      resourcePath: station.textureBasePath,
    }),
    fallbackAdapter: proceduralAdapter,
  }
}
