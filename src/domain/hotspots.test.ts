import { describe, expect, it } from 'vitest'
import { HOTSPOTS } from './hotspots'
import { STATION_LAYOUT } from './stationLayout'

describe('curated station hotspots', () => {
  it('mantiene solo le tre viste utili richieste', () => {
    expect(HOTSPOTS.map((hotspot) => hotspot.name)).toEqual([
      'Vista esterna',
      'Fronte pompe',
      'Accettatore self',
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

  it('offre una terza vista ravvicinata davanti all’accettatore self', () => {
    const hotspot = HOTSPOTS.find((item) => item.id === 'self-terminal-closeup')
    expect(hotspot).toBeDefined()
    expect(hotspot!.associatedMediaPointId).toBe('mp-05')
    expect(hotspot!.position[0]).toBeCloseTo(STATION_LAYOUT.terminal.x)
    expect(hotspot!.position[2]).toBeGreaterThan(STATION_LAYOUT.terminal.z)
    expect(hotspot!.target).toEqual([
      STATION_LAYOUT.terminal.x,
      1.38,
      STATION_LAYOUT.terminal.z,
    ])
  })
})
