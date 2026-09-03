import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { bakeMeshWorldTransform } from './visualAssets'

describe('procedural visual assets', () => {
  it('bakes parent transforms before a plant mesh is instanced', () => {
    const root = new THREE.Group()
    root.position.set(4, 2, -3)
    root.scale.set(2, 3, 4)
    const source = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
    source.position.set(1, 0, 0)
    root.add(source)

    const baked = bakeMeshWorldTransform(source)
    const bounds = new THREE.Box3().setFromObject(baked)

    expect(bounds.min.toArray()).toEqual([5, 0.5, -5])
    expect(bounds.max.toArray()).toEqual([7, 3.5, -1])
  })
})
