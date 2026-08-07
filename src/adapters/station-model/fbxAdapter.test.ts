import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { inferMeterScale, resolveTextureUrl } from './fbxAdapter'

describe('inferMeterScale', () => {
  it('mantiene i modelli già espressi in metri', () => {
    expect(inferMeterScale(new THREE.Vector3(60, 8, 45))).toBe(1)
  })

  it('converte esportazioni comuni in centimetri e millimetri', () => {
    expect(inferMeterScale(new THREE.Vector3(6_000, 800, 4_500))).toBe(0.01)
    expect(inferMeterScale(new THREE.Vector3(60_000, 8_000, 45_000))).toBe(
      0.001,
    )
  })
})

describe('resolveTextureUrl', () => {
  it('rimuove i path locali Windows e conserva parentesi e casing', () => {
    expect(
      resolveTextureUrl(
        String.raw`C:\Users\artist\3ds Max\Maps\13_map(4002336).jpg`,
        '/models/q8-station/Maps/',
      ),
    ).toBe('/models/q8-station/Maps/13_map(4002336).jpg')
  })

  it('normalizza slash, case, query e URL encoding per le 13 mappe note', () => {
    expect(
      resolveTextureUrl(
        '/AUTHOR/Maps/1_MAP%284002336%29.JPG?cache=old',
        '/models/q8-station/Maps',
      ),
    ).toBe('/models/q8-station/Maps/1_map(4002336).jpg')
  })
})
