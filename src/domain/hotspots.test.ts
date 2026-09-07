import { describe, expect, it } from 'vitest'
import { HOTSPOTS } from './hotspots'
import { STATION_LAYOUT } from './stationLayout'

describe('curated station hotspots', () => {
  it('mantiene solo le tre viste utili richieste', () => {
    expect(HOTSPOTS.map((hotspot) => hotspot.name)).toEqual([
      'Vista esterna',
      'Fronte pompe',
      'Ingresso e fondale',
    ])
  })

  it('riusa come prima vista l’inquadratura iniziale della stazione', () => {
    const hotspot = HOTSPOTS.find((item) => item.id === 'station-overview')
    expect(hotspot).toMatchObject({
      position: [30, 16, 31],
      target: [0, 2.2, -2],
      fov: 43,
    })
  })

  it('offre una terza vista dall’ingresso verso pompe e fondale', () => {
    const hotspot = HOTSPOTS.find((item) => item.id === 'entrance-forecourt')
    expect(hotspot).toBeDefined()
    expect(hotspot!.associatedMediaPointId).toBe('mp-07')
    expect(hotspot!.position[0]).toBeLessThan(STATION_LAYOUT.totem.x)
    expect(hotspot!.position[2]).toBeLessThan(STATION_LAYOUT.totem.z)
    expect(hotspot!.target[0]).toBeLessThan(STATION_LAYOUT.islands.pumpX)
    expect(hotspot!.target[2]).toBeLessThan(0)
  })
})
