import { describe, expect, it } from 'vitest'
import { HOTSPOTS } from './hotspots'
import { STATION_LAYOUT } from './stationLayout'

describe('curated station hotspots', () => {
  it('mantiene solo le tre viste utili richieste', () => {
    expect(HOTSPOTS.map((hotspot) => hotspot.name)).toEqual([
      'Vista esterna',
      'Fronte pompe',
      'Vista dall’alto',
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

  it('offre una terza vista realmente aerea dell’intero impianto', () => {
    const hotspot = HOTSPOTS.find((item) => item.id === 'station-aerial')
    expect(hotspot).toBeDefined()
    expect(hotspot!.position[1]).toBeGreaterThan(25)
    expect(hotspot!.target[1]).toBeLessThan(STATION_LAYOUT.canopy.height)
  })
})
