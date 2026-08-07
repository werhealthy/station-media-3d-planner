import { describe, expect, it } from 'vitest'
import { getStation } from '@/domain/stations'
import { proceduralAdapter } from './proceduralAdapter'
import { selectStationAdapter } from './stationAdapter'

describe('selectStationAdapter', () => {
  it('sceglie direttamente il procedural per la demo', () => {
    expect(selectStationAdapter(getStation('low-poly'))).toEqual({
      adapter: proceduralAdapter,
    })
  })

  it('crea l’adapter FBX con fallback procedurale', () => {
    const selection = selectStationAdapter(getStation('random-textured'))
    expect(selection.adapter).not.toBe(proceduralAdapter)
    expect(selection.fallbackAdapter).toBe(proceduralAdapter)
  })
})
