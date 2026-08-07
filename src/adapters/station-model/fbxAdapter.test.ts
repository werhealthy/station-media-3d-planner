import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { inferMeterScale } from './fbxAdapter'

describe('inferMeterScale', () => {
  it('mantiene i modelli già espressi in metri', () => {
    expect(inferMeterScale(new THREE.Vector3(60, 8, 45))).toBe(1)
  })

  it('converte esportazioni comuni in centimetri e millimetri', () => {
    expect(inferMeterScale(new THREE.Vector3(6_000, 800, 4_500))).toBe(0.01)
    expect(inferMeterScale(new THREE.Vector3(60_000, 8_000, 45_000))).toBe(0.001)
  })
})
