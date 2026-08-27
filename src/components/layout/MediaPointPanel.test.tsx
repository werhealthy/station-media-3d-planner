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
    useProjectStore.setState({
      assignments: {},
      hiddenMediaPointIds: [],
      creativeDisplay: {},
    })
  })

  afterEach(() => {
    useViewerStore.getState().resetForStation()
    useProjectStore.setState({
      assignments: {},
      hiddenMediaPointIds: [],
      creativeDisplay: {},
    })
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

  it('toglie il sagomato prezzo strutturale dall’inventario caricabile', () => {
    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    expect(
      PROCEDURAL_STATION_CONFIG.mediaPoints.some(
        (item) => item.supportTypeId === '8',
      ),
    ).toBe(false)
    expect(screen.getByText('9 supporti caricabili')).toBeVisible()
  })

  it('comunica la rotazione automatica di una creatività orizzontale sulla Beach Flag', () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints.find(
      (item) => item.supportShape === 'beach-flag',
    )!
    useViewerStore.getState().selectMediaPoint(point.id)
    useProjectStore.setState({
      assignments: {
        [point.id]: {
          id: 'flag-landscape',
          name: 'flag-landscape.png',
          mimeType: 'image/png',
          size: 100,
          width: 1920,
          height: 1080,
          aspectRatio: 16 / 9,
          url: 'blob:flag-landscape',
        },
      },
    })

    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    expect(screen.getByText(/ruotata automaticamente di 90°/)).toBeVisible()
  })

  it('consente il caricamento di una creatività PDF', () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints[0]!
    useViewerStore.getState().selectMediaPoint(point.id)

    const { container } = render(
      <MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />,
    )

    expect(screen.getByText('Carica JPEG, PNG o PDF')).toBeVisible()
    expect(container.querySelector('input[type="file"]')).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,application/pdf,.pdf',
    )
    expect(screen.getByText(/prima pagina/)).toBeVisible()
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

  it('mostra la schermata idle Q8 sul terminale smartOPT Maxi', () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints.find(
      (item) => item.supportTypeId === '11',
    )!
    useViewerStore.getState().selectMediaPoint(point.id)

    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    expect(
      screen.getByRole('img', {
        name: 'Schermata idle Q8 del terminale smartOPT Maxi',
      }),
    ).toHaveAttribute('src', '/brand/q8/screens/smartopt-idle.png')
    expect(screen.getByText('Schermata idle Q8 predefinita')).toBeVisible()
  })
})
