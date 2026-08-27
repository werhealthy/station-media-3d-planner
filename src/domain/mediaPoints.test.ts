import { describe, expect, it } from 'vitest'
import { MEDIA_POINTS } from './mediaPoints'
import { STATION_LAYOUT } from './stationLayout'

function point(id: string) {
  const result = MEDIA_POINTS.find((item) => item.id === id)
  if (!result) throw new Error(`Media point mancante: ${id}`)
  return result
}

describe('media point physical layout', () => {
  it('numera i supporti nell’ordine in cui vengono incontrati', () => {
    expect(
      [...MEDIA_POINTS]
        .sort((left, right) => left.number - right.number)
        .map((item) => item.supportTypeId),
    ).toEqual(['9', '7', '6', '2', '10', '4', '1', '11', '5'])
    expect(MEDIA_POINTS.some((item) => item.supportTypeId === '8')).toBe(false)
  })

  it('monta il Pump Leader sulla testata corta con due gambe', () => {
    expect(point('mp-02')).toMatchObject({
      position: [
        STATION_LAYOUT.islands.pumpX + 2.18,
        0.96,
        STATION_LAYOUT.islands.frontZ,
      ],
      rotation: [0, 90, 0],
      surface: 'Telaio bifacciale a due gambe',
    })
  })

  it('mantiene il Pump Ear esterno al corpo erogatore', () => {
    const pumpEar = point('mp-04')
    const pumpBodyMaxX = STATION_LAYOUT.islands.pumpX + 2.88 / 2
    expect(pumpEar.position[0] - pumpEar.width / 2).toBeGreaterThan(
      pumpBodyMaxX,
    )
  })

  it('usa una Beach Flag verticale e un Fondostazione rialzato', () => {
    expect(point('mp-09')).toMatchObject({
      width: 0.8,
      height: 3.6,
      position: [
        STATION_LAYOUT.entry.beachFlagX,
        1.8,
        STATION_LAYOUT.entry.beachFlagZ,
      ],
    })
    expect(point('mp-07')).toMatchObject({
      position: [-3.1, 2.49, -4.28],
      heightFromGround: 1.8,
    })
  })

  it('raggruppa Stendardo e Beach Flag sul lato destro e li orienta verso la strada', () => {
    expect(point('mp-08')).toMatchObject({
      position: [
        STATION_LAYOUT.entry.stendardoX,
        2.8875,
        STATION_LAYOUT.entry.stendardoZ,
      ],
      rotation: [0, STATION_LAYOUT.entry.stendardoYaw, 0],
    })
    expect(point('mp-09').rotation[1]).toBeGreaterThan(45)
    expect(point('mp-06').rotation[1]).toBeGreaterThan(25)
  })
})
