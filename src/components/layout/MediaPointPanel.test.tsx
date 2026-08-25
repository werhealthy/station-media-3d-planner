import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PROCEDURAL_STATION_CONFIG } from '@/domain/stationConfigDefaults'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { MediaPointPanel } from './MediaPointPanel'

describe('MediaPointPanel', () => {
  beforeEach(() => {
    useViewerStore.getState().resetForStation()
    useProjectStore.setState({ assignments: {}, fitModes: {} })
  })

  afterEach(() => {
    useViewerStore.getState().resetForStation()
    useProjectStore.setState({ assignments: {}, fitModes: {} })
  })

  it('segnala le proporzioni errate senza proporre stretching', async () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints[0]!
    useViewerStore.getState().selectMediaPoint(point.id)
    useProjectStore.setState({
      assignments: {
        [point.id]: {
          id: 'asset-1',
          name: 'creative-16x9.png',
          mimeType: 'image/png',
          size: 100,
          width: 1920,
          height: 1080,
          aspectRatio: 16 / 9,
          url: 'blob:test',
        },
      },
    })

    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    expect(screen.getByText('Proporzioni diverse dal supporto')).toBeVisible()
    expect(screen.getByText('Adattamento senza deformazione')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Riempi e ritaglia' }))
    expect(useProjectStore.getState().fitModes[point.id]).toBe('cover')
  })

  it('impedisce l’upload sul sagomato prezzo strutturale', () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints.find(
      (item) => item.supportTypeId === '8',
    )!
    useViewerStore.getState().selectMediaPoint(point.id)

    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    expect(
      screen.getByText(/non è configurabile come spazio pubblicitario/),
    ).toBeVisible()
    expect(screen.queryByText('Carica JPEG o PNG')).not.toBeInTheDocument()
  })
})
