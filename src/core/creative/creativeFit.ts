export type CreativeFitMode = 'contain' | 'cover'
export type CreativeFitStatus = 'exact' | 'warning' | 'mismatch'

export interface CreativeFitInput {
  assetWidth: number
  assetHeight: number
  surfaceWidth: number
  surfaceHeight: number
}

export interface CreativeFitAnalysis {
  assetRatio: number
  surfaceRatio: number
  differencePercent: number
  status: CreativeFitStatus
  containUnusedPercent: number
  coverCropPercent: number
}

export interface OrientedCreative {
  width: number
  height: number
  rotationRadians: number
}

export function orientCreativeToPortrait(
  width: number,
  height: number,
): OrientedCreative {
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    throw new Error('Le dimensioni della creativita devono essere positive.')
  return width > height
    ? { width: height, height: width, rotationRadians: -Math.PI / 2 }
    : { width, height, rotationRadians: 0 }
}

export function analyzeCreativeFit(
  input: CreativeFitInput,
): CreativeFitAnalysis {
  const values = [
    input.assetWidth,
    input.assetHeight,
    input.surfaceWidth,
    input.surfaceHeight,
  ]
  if (values.some((value) => !Number.isFinite(value) || value <= 0))
    throw new Error(
      'Le dimensioni della creativita e del supporto devono essere positive.',
    )

  const assetRatio = input.assetWidth / input.assetHeight
  const surfaceRatio = input.surfaceWidth / input.surfaceHeight
  const differencePercent =
    (Math.abs(assetRatio - surfaceRatio) / surfaceRatio) * 100
  const status: CreativeFitStatus =
    differencePercent <= 2
      ? 'exact'
      : differencePercent <= 10
        ? 'warning'
        : 'mismatch'

  const containCoverage =
    assetRatio > surfaceRatio
      ? surfaceRatio / assetRatio
      : assetRatio / surfaceRatio

  return {
    assetRatio,
    surfaceRatio,
    differencePercent,
    status,
    containUnusedPercent: (1 - containCoverage) * 100,
    coverCropPercent: (1 - containCoverage) * 100,
  }
}

export function containedSurfaceSize(
  surfaceWidth: number,
  surfaceHeight: number,
  assetWidth: number,
  assetHeight: number,
): [number, number] {
  const analysis = analyzeCreativeFit({
    assetWidth,
    assetHeight,
    surfaceWidth,
    surfaceHeight,
  })
  if (analysis.assetRatio >= analysis.surfaceRatio)
    return [surfaceWidth, surfaceWidth / analysis.assetRatio]
  return [surfaceHeight * analysis.assetRatio, surfaceHeight]
}
