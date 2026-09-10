import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PROCEDURAL_STATION_CONFIG } from '@/domain/stationConfigDefaults'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { PUMP_LEADER_OPTIMIZED_ASSET_ID } from './CreativeWorkspace'
import { MediaPointPanel } from './MediaPointPanel'

const { readCreativeAssetMock } = vi.hoisted(() => ({
  readCreativeAssetMock: vi.fn(),
}))

vi.mock('@/domain/schemas/media', async () => {
  const actual = await vi.importActual<typeof import('@/domain/schemas/media')>(
    '@/domain/schemas/media',
  )
  return { ...actual, readCreativeAsset: readCreativeAssetMock }
})

describe('MediaPointPanel', () => {
  beforeEach(() => {
    readCreativeAssetMock.mockReset()
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
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
    await act(() => vi.advanceTimersByTimeAsync(1450))

    expect(
      screen.getByText('Il formato lascia margini sul supporto'),
    ).toBeVisible()
    expect(screen.getByText(/Usa “Riempi”/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Riempi' })).toBeVisible()
    expect(
      screen.queryByRole('slider', { name: 'Dimensione creatività' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Manuale' }))
    expect(
      screen.getByRole('slider', { name: 'Dimensione creatività' }),
    ).toBeVisible()
  })

  it('toglie il sagomato prezzo strutturale dall’inventario caricabile', () => {
    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    expect(
      PROCEDURAL_STATION_CONFIG.mediaPoints.some(
        (item) => item.supportTypeId === '8',
      ),
    ).toBe(false)
    expect(screen.getByText('9 supporti media disponibili')).toBeVisible()
  })

  it('non mostra il box quota dal riferimento nei dettagli', () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints[0]!
    useViewerStore.getState().selectMediaPoint(point.id)

    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)

    expect(screen.queryByText('Quota dal riferimento')).not.toBeInTheDocument()
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

    expect(screen.getByText('9 supporti media disponibili')).toBeVisible()
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
    await act(() => vi.advanceTimersByTimeAsync(1450))
    expect(
      screen.getByText('Il formato lascia margini sul supporto'),
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

  it('usa una modale ampia lasciando visibile il contesto dell’app', async () => {
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
    expect(screen.getByRole('dialog')).toHaveClass('max-w-[1180px]')
    expect(screen.getByRole('dialog')).not.toHaveClass('w-screen')
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
    await act(() => vi.advanceTimersByTimeAsync(1450))
    expect(screen.getByText('La creatività è pronta')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Riempi' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Manuale' }))
    expect(screen.getByLabelText('Colore di sfondo')).toBeVisible()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Torna ai dettagli del supporto',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Apri creatività' }))

    expect(
      screen.queryByText('Sto analizzando la creatività…'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('La creatività è pronta')).toBeVisible()
  })

  it('azzera inquadratura e sfondo quando si sostituisce l’immagine', async () => {
    vi.useFakeTimers()
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints[0]!
    const original = {
      id: 'asset-original',
      name: 'original.png',
      mimeType: 'image/png' as const,
      size: 100,
      width: Math.round(point.width * 1000),
      height: Math.round(point.height * 1000),
      aspectRatio: point.width / point.height,
      url: 'blob:original',
    }
    const replacement = {
      ...original,
      id: 'asset-replacement',
      name: 'replacement.png',
      url: 'blob:replacement',
    }
    useViewerStore.getState().selectMediaPoint(point.id)
    useProjectStore.setState({
      assignments: { [point.id]: original },
      creativeDisplay: {
        [point.id]: {
          fitMode: 'contain',
          backgroundColor: '#123456',
          rotation: 90,
          zoom: 0.75,
          offsetX: 0.2,
          offsetY: -0.1,
        },
      },
    })
    readCreativeAssetMock.mockResolvedValue(replacement)

    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)
    fireEvent.click(screen.getByRole('button', { name: 'Apri creatività' }))
    await act(() => vi.advanceTimersByTimeAsync(1450))
    expect(
      screen.getByRole('slider', { name: 'Rotazione creatività' }),
    ).toHaveValue('90')

    await act(async () => {
      fireEvent.change(
        within(screen.getByRole('dialog')).getByLabelText(
          'Sostituisci immagine',
        ),
        {
          target: { files: [new File(['new'], 'replacement.png')] },
        },
      )
      await Promise.resolve()
    })
    expect(readCreativeAssetMock).toHaveBeenCalledOnce()
    expect(screen.getByText('Sto analizzando la creatività…')).toBeVisible()
    await act(() => vi.advanceTimersByTimeAsync(1450))
    fireEvent.click(screen.getByRole('button', { name: 'Manuale' }))

    expect(
      screen.getByRole('slider', { name: 'Dimensione creatività' }),
    ).toHaveValue('1')
    expect(
      screen.getByRole('slider', { name: 'Rotazione creatività' }),
    ).toHaveValue('0')
    expect(screen.getByLabelText('Colore di sfondo')).toHaveValue('#ffffff')

    fireEvent.change(screen.getByLabelText('Colore di sfondo'), {
      target: { value: '#173f8f' },
    })
    fireEvent.change(
      screen.getByRole('slider', { name: 'Rotazione creatività' }),
      { target: { value: '90' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Conferma' }))

    expect(useProjectStore.getState().assignments[point.id]).toEqual(
      replacement,
    )
    expect(useProjectStore.getState().creativeDisplay[point.id]).toMatchObject({
      backgroundColor: '#173f8f',
      rotation: 90,
      zoom: 1,
    })
  })

  it('annulla un nuovo caricamento se la modale viene chiusa senza conferma', async () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints[0]!
    const draft = {
      id: 'asset-draft',
      name: 'draft.png',
      mimeType: 'image/png' as const,
      size: 100,
      width: 740,
      height: 500,
      aspectRatio: 740 / 500,
      url: 'blob:draft',
    }
    useViewerStore.getState().selectMediaPoint(point.id)
    readCreativeAssetMock.mockResolvedValue(draft)

    render(<MediaPointPanel points={PROCEDURAL_STATION_CONFIG.mediaPoints} />)
    fireEvent.click(screen.getByRole('button', { name: 'Carica creatività' }))
    const uploadInput = screen
      .getByRole('dialog')
      .querySelector<HTMLInputElement>('input[type="file"]')!
    await act(async () => {
      fireEvent.change(uploadInput, {
        target: { files: [new File(['draft'], 'draft.png')] },
      })
      await Promise.resolve()
    })
    expect(readCreativeAssetMock).toHaveBeenCalledOnce()
    fireEvent.click(
      screen.getByRole('button', { name: 'Torna ai dettagli del supporto' }),
    )

    expect(useProjectStore.getState().assignments[point.id]).toBeUndefined()
    expect(screen.getByText('Nessun asset caricato')).toBeVisible()
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
    await act(() => vi.advanceTimersByTimeAsync(1450))
    expect(screen.getByText('Il messaggio non emerge abbastanza')).toBeVisible()
    expect(screen.getByText(/deve funzionare anche da lontano/)).toBeVisible()
    expect(screen.getByText(/Manca la sfumatura blu/)).toBeVisible()

    fireEvent.click(
      screen.getByRole('button', { name: 'Genera versione ottimizzata' }),
    )
    expect(
      screen.getByText(
        'Sto creando i suggerimenti e le possibili ottimizzazioni…',
      ),
    ).toBeVisible()
    await act(() => vi.advanceTimersByTimeAsync(1950))
    expect(screen.getByText('Suggerimenti pronti')).toBeVisible()
    expect(
      screen.getByText("MESSAGGIO OTTIMIZZATO PER LA LETTURA DELL'UTENTE"),
    ).toBeVisible()
    expect(
      screen.queryByText('Sostituisci immagine'),
    ).not.toBeInTheDocument()

    const comparisonSlider = screen.getByRole('slider', {
      name: 'Confronta originale e versione ottimizzata',
    })
    expect(comparisonSlider).toHaveAttribute('min', '0')
    expect(comparisonSlider).toHaveAttribute('max', '100')

    fireEvent.change(comparisonSlider, { target: { value: '0' } })
    expect(screen.getByText('Ottimizzata').parentElement).toHaveStyle({
      clipPath: 'inset(0 100% 0 0)',
    })
    fireEvent.change(comparisonSlider, { target: { value: '100' } })
    expect(screen.getByText('Ottimizzata').parentElement).toHaveStyle({
      clipPath: 'inset(0 0% 0 0)',
    })
    expect(
      screen.getByRole('button', { name: 'Genera nuova variante' }),
    ).toBeVisible()
    expect(screen.getByText(/Sfumatura blu ripristinata/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Conferma' }))

    expect(useProjectStore.getState().assignments[point.id]?.id).toBe(
      PUMP_LEADER_OPTIMIZED_ASSET_ID,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
