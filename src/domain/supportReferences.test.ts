import { describe, expect, it } from 'vitest'
import { SUPPORT_CATALOG } from './supportCatalog'
import { SUPPORT_REFERENCES } from './supportReferences'

describe('support photographic references', () => {
  it('associa almeno una fotografia reale a ogni supporto del catalogo', () => {
    for (const support of SUPPORT_CATALOG) {
      expect(
        SUPPORT_REFERENCES[support.id]?.length,
        `Riferimenti mancanti per ${support.name}`,
      ).toBeGreaterThan(0)
    }
  })
})
