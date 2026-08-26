import { describe, expect, it } from 'vitest'
import { SUPPORT_CATALOG, getSupportType } from './supportCatalog'
import { STATION_LAYOUT } from './stationLayout'

describe('supportCatalog', () => {
  it('mantiene distinti i dieci tipi di supporto Q8', () => {
    expect(SUPPORT_CATALOG).toHaveLength(10)
    expect(new Set(SUPPORT_CATALOG.map((support) => support.id)).size).toBe(10)
  })

  it('usa la quota 550 x 450 mm della grafica per il sovrapompa', () => {
    const support = getSupportType('1')
    expect(support?.dimensions).toMatchObject({
      width: 0.55,
      height: 0.45,
      source: 'reference',
    })
  })

  it('non tratta il sagomato prezzo come spazio pubblicitario', () => {
    expect(getSupportType('8')?.assignable).toBe(false)
  })

  it('usa display ingrandito e quote documentate del Fortech smartOPT Maxi', () => {
    const terminal = getSupportType('11')
    expect(terminal?.name).toContain('Fortech smartOPT Maxi')
    expect(terminal?.dimensions).toMatchObject({ width: 0.31, height: 0.54 })
    expect(STATION_LAYOUT.terminal).toMatchObject({
      width: 0.507,
      depth: 0.606,
      height: 1.696,
    })
  })

  it('mantiene nel modello le misure delle grafiche ricevute', () => {
    expect(
      Object.fromEntries(
        ['2', '4', '10', '6', '7', '9', '8'].map((id) => {
          const support = getSupportType(id)
          return [id, [support?.dimensions.width, support?.dimensions.height]]
        }),
      ),
    ).toEqual({
      '2': [0.841, 1.189],
      '4': [0.42, 0.594],
      '6': [0.77, 1.385],
      '7': [0.98, 1.975],
      '8': [0.68, 1.28],
      '9': [0.8, 3.6],
      '10': [0.52, 0.72],
    })
    expect(getSupportType('5')?.dimensions).toMatchObject({
      width: 2.88,
      height: 1.38,
      source: 'reference',
    })
  })
})
