export const STATION_LAYOUT = {
  forecourt: { width: 46, depth: 32 },
  road: { centerZ: 19, depth: 12, entryMinX: 6, entryMaxX: 21 },
  canopy: {
    width: 23,
    depth: 12,
    height: 5.8,
    fasciaHeight: 0.82,
    columnX: 6.4,
    columnZ: -1.25,
  },
  islands: { pumpX: 4.6, frontZ: 1.6, width: 13 },
  shop: { x: 9.5, z: -7.3, width: 14.5, depth: 6.2, height: 4.7 },
  totem: { x: -18, z: 10.4, width: 2.8, height: 7.2 },
  terminal: { x: -9, z: 0.3 },
  entry: {
    beachFlagX: -14.5,
    beachFlagZ: 10.6,
    concreteSignX: 12.8,
    concreteSignZ: 10.4,
  },
} as const
