import * as THREE from 'three'

export function createBeachFlagShape(width: number, height: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-width * 0.42, -height / 2)
  shape.lineTo(-width / 2, height * 0.38)
  shape.quadraticCurveTo(-width * 0.18, height * 0.56, width / 2, height * 0.38)
  shape.quadraticCurveTo(
    width * 0.36,
    -height * 0.08,
    -width * 0.42,
    -height / 2,
  )
  shape.closePath()
  return shape
}

/**
 * ShapeGeometry uses world-space UVs by default. Normalising them to the
 * support bounds makes the creative behave like a clipped Figma frame: the
 * artwork can move, scale and rotate, while pixels outside the flag disappear.
 */
export function createBeachFlagGeometry(width: number, height: number) {
  const geometry = new THREE.ShapeGeometry(
    createBeachFlagShape(width, height),
    18,
  )
  const position = geometry.getAttribute('position')
  const uv = new Float32Array(position.count * 2)
  for (let index = 0; index < position.count; index += 1) {
    uv[index * 2] = THREE.MathUtils.clamp(
      position.getX(index) / width + 0.5,
      0,
      1,
    )
    uv[index * 2 + 1] = THREE.MathUtils.clamp(
      position.getY(index) / height + 0.5,
      0,
      1,
    )
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geometry
}
