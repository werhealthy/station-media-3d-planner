import { describe, expect, it } from 'vitest'
import { HOTSPOTS } from './hotspots'
import { STATION_LAYOUT } from './stationLayout'

describe('curated station hotspots', () => {
  it('mantiene solo le tre viste utili richieste', () => {
    expect(HOTSPOTS.map((hotspot) => hotspot.name)).toEqual([
      'Ingresso strada',
      'Fronte pompe',
      'Interno Svolta',
    ])
  })

  it('posiziona Interno Svolta davanti alla cassa e lo orienta verso la stazione', () => {
    const hotspot = HOTSPOTS.find((item) => item.id === 'inside-svolta')
    expect(hotspot).toBeDefined()
    expect(hotspot!.position[0]).toBeGreaterThan(
      STATION_LAYOUT.shop.x - STATION_LAYOUT.shop.width / 2,
    )
    expect(hotspot!.position[0]).toBeLessThan(
      STATION_LAYOUT.shop.x + STATION_LAYOUT.shop.width / 2,
    )
    expect(hotspot!.position[2]).toBeLessThan(
      STATION_LAYOUT.shop.z + STATION_LAYOUT.shop.depth / 2,
    )
    expect(hotspot!.target[0]).toBeLessThan(hotspot!.position[0])
    expect(hotspot!.target[2]).toBeGreaterThan(hotspot!.position[2])
  })

  it('sposta l’hotspot di ingresso sul lato destro della strada', () => {
    const hotspot = HOTSPOTS.find((item) => item.id === 'road-entry')
    expect(hotspot!.position[0]).toBeGreaterThan(STATION_LAYOUT.road.entryX)
    expect(hotspot!.position[2]).toBeGreaterThan(STATION_LAYOUT.road.nearLaneZ)
  })
})
