import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadStationConfig } from './stationConfigLoader'
import type { StationDefinition } from '@/domain/stations'

const station: StationDefinition = {
  id: 'external',
  name: 'External',
  description: 'Test station',
  modelType: 'fbx',
  modelPath: '/station.FBX',
  configPath: '/station-config.json',
  mediaPointsConfigured: false,
}

describe('loadStationConfig', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('treats a missing configuration as a normal empty state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>missing</html>', {
      status: 404,
      headers: { 'content-type': 'text/html' },
    })))

    await expect(loadStationConfig(station)).resolves.toBeNull()
  })

  it('does not attempt to parse an HTML success response as JSON', async () => {
    const json = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      json,
    }))

    await expect(loadStationConfig(station)).rejects.toThrow('Content-Type non valido')
    expect(json).not.toHaveBeenCalled()
  })

  it('checks the HTTP status before parsing the body', async () => {
    const json = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      json,
    }))

    await expect(loadStationConfig(station)).rejects.toThrow('(500)')
    expect(json).not.toHaveBeenCalled()
  })
})
