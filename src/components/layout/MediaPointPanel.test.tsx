import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PROCEDURAL_STATION_CONFIG } from '@/domain/stationConfigDefaults'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { PUMP_LEADER_OPTIMIZED_ASSET_ID } from './CreativeWorkspace'
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
    vi.useRealTimers()
    useViewerStore.getState().resetForStation()
    useProjectStore.setState({
      assignments: {},
      hiddenMediaPointIds: [],
      creativeDisplay: {},
    })
  })

  it('segnala le proporzioni errate senza proporre stretching', async () => {
    vi.useFakeTimers()
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
    fireEvent.click(screen.getByRole('button', { name: 'Apri creatività' }))
    expect(screen.getByText('Sto analizzando la creatività…')).toBeVisible()
    await act(() => vi.advanceTimersByTimeAsync(950))

    expect(
      screen.getByText('Il formato non riempie correttamente il supporto'),
    ).toBeVisible()
    expect(screen.getByText(/ritaglio proporzionale ai margini/)).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Adatta e conferma' }),
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

  it('ordina l’inventario secondo la sequenza numerica della journey', () => {
    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    const inventoryItems = screen
      .getAllByRole('button', { name: /ID / })
      .map((button) => Number(button.textContent?.match(/^\s*(\d+)/)?.[1]))

    expect(inventoryItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('inquadra un supporto lasciando aperto l’inventario', async () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints.find(
      (item) => item.supportTypeId === '2',
    )!
    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    await userEvent.click(
      screen.getByRole('button', { name: `Inquadra ${point.name}` }),
    )

    expect(screen.getByText('9 supporti caricabili')).toBeVisible()
    expect(useViewerStore.getState()).toMatchObject({
      selectedMediaPointId: null,
      focusedMediaPointId: point.id,
    })
  })

  it('analizza anche una creatività caricata sulla Beach Flag', async () => {
    vi.useFakeTimers()
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
    fireEvent.click(screen.getByRole('button', { name: 'Apri creatività' }))
    expect(screen.getByText('Sto analizzando la creatività…')).toBeVisible()
    await act(() => vi.advanceTimersByTimeAsync(950))
    expect(
      screen.getByText('Il formato non riempie correttamente il supporto'),
    ).toBeVisible()
  })

  it('consente il caricamento di una creatività PDF', async () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints[0]!
    useViewerStore.getState().selectMediaPoint(point.id)

    const { container } = render(
      <MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />,
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Carica creatività' }),
    )

    expect(screen.getByText('Carica la creatività')).toBeVisible()
    expect(container.querySelector('input[type="file"]')).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,application/pdf,.pdf',
    )
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

  it('usa tutta l’area disponibile per il caricamento', async () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints.find(
      (item) => item.supportTypeId === '11',
    )!
    useViewerStore.getState().selectMediaPoint(point.id)

    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Carica creatività' }),
    )

    const upload = screen.getByText('Carica la creatività').closest('label')
    expect(upload).toHaveClass('flex-1')
    expect(upload).toHaveClass('justify-center')
  })

  it('non rianalizza lo stesso asset quando il workspace viene riaperto', async () => {
    vi.useFakeTimers()
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints[0]!
    useViewerStore.getState().selectMediaPoint(point.id)
    useProjectStore.setState({
      assignments: {
        [point.id]: {
          id: 'asset-reviewed',
          name: 'creative.png',
          mimeType: 'image/png',
          size: 100,
          width: Math.round(point.width * 1000),
          height: Math.round(point.height * 1000),
          aspectRatio: point.width / point.height,
          url: 'blob:reviewed',
        },
      },
    })
    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    fireEvent.click(screen.getByRole('button', { name: 'Apri creatività' }))
    await act(() => vi.advanceTimersByTimeAsync(950))
    expect(screen.getByText('La creatività è pronta')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Chiudi/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Apri creatività' }))

    expect(
      screen.queryByText('Sto analizzando la creatività…'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('La creatività è pronta')).toBeVisible()
  })

  it('integra il controllo contestuale e la variante del Pump Leader nello stesso flusso', async () => {
    vi.useFakeTimers()
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints.find(
      (item) => item.supportTypeId === '2',
    )!
    useViewerStore.getState().selectMediaPoint(point.id)
    useProjectStore.setState({
      assignments: {
        [point.id]: {
          id: 'pump-leader-review',
          name: 'pump-leader.png',
          mimeType: 'image/png',
          size: 100,
          width: 841,
          height: 1189,
          aspectRatio: 841 / 1189,
          url: 'blob:pump-leader',
        },
      },
    })
    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    fireEvent.click(screen.getByRole('button', { name: 'Apri creatività' }))
    await act(() => vi.advanceTimersByTimeAsync(950))
    expect(
      screen.getByText('Il messaggio non emerge nel tempo disponibile'),
    ).toBeVisible()
    expect(screen.getByText(/vista media circa 1-2 s/)).toBeVisible()

    fireEvent.click(
      screen.getByRole('button', { name: 'Genera versione ottimizzata' }),
    )
    expect(screen.getByText('Creo la versione ottimizzata…')).toBeVisible()
    await act(() => vi.advanceTimersByTimeAsync(900))
    fireEvent.click(
      screen.getByRole('button', { name: 'Usa questa versione nel 3D' }),
    )

    expect(useProjectStore.getState().assignments[point.id]?.id).toBe(
      PUMP_LEADER_OPTIMIZED_ASSET_ID,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
