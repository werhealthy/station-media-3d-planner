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
  // With the tour approaching from the Italian right-hand lane, the roadside
  // sequence lives on the driver's right before the turn into the forecourt.
  totem: { x: 22.4, z: 10.1, width: 2.8, height: 7.2 },
  terminal: {
    x: -9,
    z: 0.3,
    width: 0.507,
    depth: 0.606,
    height: 1.696,
    screenWidth: 0.31,
    screenHeight: 0.54,
    screenCenterY: 1.365,
  },
  entry: {
    beachFlagX: 20.7,
    beachFlagZ: 7.2,
    concreteSignX: 13.4,
    concreteSignZ: 13.15,
  },
} as const
