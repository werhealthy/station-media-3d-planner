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
    useProjectStore.setState({ assignments: {}, hiddenMediaPointIds: [] })
  })

  afterEach(() => {
    useViewerStore.getState().resetForStation()
    useProjectStore.setState({ assignments: {}, hiddenMediaPointIds: [] })
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
    expect(
      screen.getByText(/non viene mai ritagliata o deformata/),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Riempi e ritaglia' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Supporti consigliati per questo formato'),
    ).toBeVisible()
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

  it('permette di nascondere e ripristinare un supporto', async () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints[0]!
    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    await userEvent.click(
      screen.getByRole('button', { name: `Nascondi ${point.name}` }),
    )
    expect(useProjectStore.getState().hiddenMediaPointIds).toContain(point.id)
    expect(
      screen.getByRole('button', { name: `Mostra ${point.name}` }),
    ).toBeVisible()
  })
})
