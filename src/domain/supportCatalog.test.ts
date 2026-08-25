import { describe, expect, it } from 'vitest'
import { SUPPORT_CATALOG, getSupportType } from './supportCatalog'

describe('supportCatalog', () => {
  it('mantiene distinti i dieci tipi di supporto Q8', () => {
    expect(SUPPORT_CATALOG).toHaveLength(10)
    expect(new Set(SUPPORT_CATALOG.map((support) => support.id)).size).toBe(10)
  })

  it('usa la quota 1600 x 400 mm del riferimento per il sovrapompa', () => {
    const support = getSupportType('1')
    expect(support?.dimensions).toMatchObject({
      width: 1.6,
      height: 0.4,
      source: 'reference',
    })
  })

  it('non tratta il sagomato prezzo come spazio pubblicitario', () => {
    expect(getSupportType('8')?.assignable).toBe(false)
  })

  it('usa il display verticale 9:16 del Fortech smartOPT Maxi', () => {
    const terminal = getSupportType('11')
    expect(terminal?.name).toContain('Fortech smartOPT Maxi')
    expect(terminal?.dimensions.width).toBeLessThan(
      terminal?.dimensions.height ?? 0,
    )
    expect(
      (terminal?.dimensions.width ?? 0) / (terminal?.dimensions.height ?? 1),
    ).toBeCloseTo(9 / 16, 2)
  })
})
