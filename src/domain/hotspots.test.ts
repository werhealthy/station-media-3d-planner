import { describe, expect, it } from 'vitest'
import { HOTSPOTS } from './hotspots'
import { STATION_LAYOUT } from './stationLayout'

describe('curated station hotspots', () => {
  it('mantiene solo le tre viste utili richieste', () => {
    expect(HOTSPOTS.map((hotspot) => hotspot.name)).toEqual([
      'Ingresso strada',
      'Fronte pompe',
      'Da Svolta',
    ])
  })

  it('posiziona la vista Da Svolta dentro lo store e la orienta sul piazzale', () => {
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
    expect(hotspot!.target[2]).toBeGreaterThan(hotspot!.position[2])
  })
})
