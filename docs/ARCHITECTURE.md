# Architettura — Station Media 3D Planner

## Principio guida

Separare nettamente quattro categorie di stato, che hanno vincoli e cicli di vita molto diversi:

1. **Dati di dominio serializzabili** — tutto ciò che descrive il progetto e va salvato/esportato (progetto, stazione, banner, hotspot, percorsi, metadati asset). Vive in `domain/` + `stores/projectStore.ts`. Non contiene mai un riferimento a un oggetto `THREE.*`.
2. **Riferimenti runtime a oggetti Three.js** — mesh, camere, curve calcolate a runtime. Vivono in `ref` locali ai componenti o in `three/`, mai nello store del progetto.
3. **Risorse WebGL** — texture, elementi `<video>`, materiali. Create e distrutte esplicitamente, con un proprietario chiaro (un hook), mai lasciate al garbage collector implicito.
4. **Stato UI transitorio** — selezione, pannelli aperti, modalità attiva. Vive in `viewerStore`/`uiStore`, non persistito.

Il motivo di questa separazione: senza di essa, salvare/esportare il progetto richiederebbe di "spogliare" oggetti Three.js dai dati (fragile, facile da rompere), e le animazioni per-frame finirebbero per scrivere nello store globale 60 volte al secondo, degradando le prestazioni e riempiendo un'eventuale cronologia undo di rumore.

## Struttura delle cartelle

```
src/
  domain/                    # schemi Zod + tipi TS puri, zero import da React/Three
    schemas/                 # project.schema.ts, station.schema.ts, advertisingPoint.schema.ts,
                              # hotspot.schema.ts, route.schema.ts, visibility.schema.ts,
                              # mediaAsset.schema.ts, preferences.schema.ts
    types.ts                 # re-export dei tipi (z.infer<...>)
    migrations/               # funzioni di migrazione schemaVersion N -> N+1

  core/                      # logica pura, testabile in Vitest senza contesto grafico
    math/                    # operazioni vettoriali/geometriche su tipi semplici {x,y,z}
    visibility/               # distance.ts, angle.ts, frustum.ts, occlusion.ts,
                              # screenSize.ts, classify.ts, aggregate.ts, analyze.ts (orchestratore)
    route/                    # interpolazione waypoint, easing

  adapters/
    station-model/            # interfaccia StationModelAdapter + implementazioni
      types.ts
      proceduralAdapter.ts     # stazione dimostrativa generata a runtime
      glbAdapter.ts            # caricamento GLB/glTF
      ifcAdapter.stub.ts       # stub documentato, non implementato nell'MVP
    persistence/
      ProjectRepository.ts     # interfaccia
      indexedDbRepository.ts   # implementazione IndexedDB
      assetBlobStore.ts        # CRUD blob binari (immagini/video)

  three/                      # collante imperativo verso Three.js
    textures/                 # creazione/dispose texture immagine e video
    raycast/                  # raycaster riutilizzabile, filtro occlusori
    camera/                   # estrazione frustum da una THREE.Camera reale

  stores/                     # Zustand
    projectStore.ts
    viewerStore.ts
    playbackStore.ts
    uiStore.ts

  components/
    viewer/                   # Canvas R3F, StationModel, BannerMesh, HotspotMarker, RouteCurve
    panels/                    # BannerInspector, HotspotInspector, RouteEditor, AssetLibrary, VisibilityReportPanel
    common/                     # componenti UI condivisi (shadcn/ui based)

  hooks/                       # hook useFrame (animazione camera, ciclo vita texture video)
  test/                        # setup Vitest, fixture condivise

e2e/                          # specifiche Playwright
docs/                         # questa documentazione
```

## Stato applicativo: quattro store Zustand

La separazione è per **frequenza di aggiornamento e tipo di consumatore**, non solo per feature.

1. **`projectStore`** — il grafo dati serializzabile (progetto attivo, banner, hotspot, percorsi, metadati asset). Persistito tramite il repository layer. I componenti si abbonano con selettori mirati (es. un solo banner) per evitare ri-render dell'intero albero a ogni modifica.
2. **`viewerStore`** — selezione corrente, modalità del gizmo, oggetto in hover, strumento attivo. Cambia solo su interazione utente: è sicuro farci ri-renderizzare React.
3. **`playbackStore`** — riproduzione di un percorso: `isPlaying`, percorso attivo, e un progresso "grezzo" (es. arrotondato allo 0,5%) aggiornato a bassa frequenza per alimentare la barra della timeline. Il tempo reale per-frame vive in un `ref` locale al componente di animazione (dentro `useFrame`) e muove l'oggetto camera direttamente — **non** passa da React a ogni frame. Le metriche di visibilità live vengono scritte in un ref (ring buffer) e pubblicate verso la UI a frequenza ridotta (~10 volte al secondo).
4. **`uiStore`** — pannelli aperti, toast, modali, stato puramente ephemeral, mai persistito.

Regola scritta anche in `CLAUDE.md`: *se un valore cambia a ogni frame di animazione, vive in un ref e muove l'oggetto 3D direttamente; se cambia per un'azione dell'utente, vive in uno store Zustand.*

## Modulo di analisi della visibilità (`core/visibility/`)

Pipeline di funzioni per lo più pure, con un solo confine esplicito verso Three.js:

- `computeDistance`, `computeAngleToNormal`, `computeProjectedScreenSize`, `classifyVisibility`, `aggregateSamples` — matematica pura su tipi semplici, testabile in Vitest senza alcun contesto grafico.
- `checkFrustumContainment` — pura una volta ricevuti i piani del frustum come dati; l'estrazione dei piani da una `THREE.Camera` reale (`extractFrustumPlanes`, in `three/camera/`) è l'unico punto che richiede un oggetto Three.js vero.
- `computeOcclusion` — usa `THREE.Raycaster` contro le mesh occludenti reali. **Punto importante**: il raycasting in Three.js è calcolo CPU puro e funziona anche nei test automatici senza una scheda grafica reale o un canvas visibile — solo il *disegno* dei pixel a schermo richiede un vero contesto WebGL, non il calcolo geometrico. Questo permette di testare l'occlusione con mesh sintetiche (box semplici) dentro Vitest.
- `analyzeSample` — orchestratore che combina le funzioni sopra per un singolo campione temporale (una posizione dell'osservatore + lo stato di un banner).

**Uso durante il walkthrough live**: `analyzeSample` viene invocato a intervalli regolari (es. ogni 100-150 ms tramite un accumulatore su `ref`, non a ogni frame) dentro `useFrame`, usando la camera reale e la lista (pre-filtrata) di mesh occludenti.

**Generazione di un report su un intero percorso**: `sampleRoute` (in `core/route/`) pre-calcola N pose lungo il tragitto; `analyzeSample` viene eseguito per ciascuna in batch. Se le prestazioni lo richiedessero su percorsi molto lunghi, questo calcolo potrà essere spostato in un Web Worker — non necessario per l'MVP, documentato come possibile ottimizzazione futura.

## `StationModelAdapter`

Interfaccia comune con quattro operazioni: caricare una stazione, ottenere le mesh da usare per l'occlusione, ottenere il bounding box (per inquadrare la camera iniziale), liberare le risorse quando la stazione viene cambiata.

- **`proceduralAdapter`** — genera la stazione dimostrativa da una configurazione parametrica (numero pompe, dimensioni pensilina, ecc.), usato nel primo MVP.
- **`glbAdapter`** — carica un file GLB/glTF (`GLTFLoader`, con supporto Draco se necessario), normalizza scala/orientamento secondo le convenzioni in `DATA_MODEL.md`; le mesh occludenti sono determinate genericamente (tutte le mesh, o una lista di esclusione configurabile), **mai** per nome hardcoded — questo è il motivo per cui i banner non sono mai legati a una mesh specifica di un modello.
- **`ifcAdapter`** — stub documentato per una fase futura: stessa interfaccia, con un punto di estensione per metadati semantici BIM (`getSemanticMetadata`). Non implementato nell'MVP, escluso dal registro di adapter di default.

## Persistenza

```
ProjectRepository:
  list() / load(id) / save(project) / delete(id) / exportJson(id) / importJson(file)

AssetBlobStore:
  put(assetId, blob) / get(assetId) / delete(assetId) / getObjectUrl(assetId)
```

Implementazione MVP: **IndexedDB** (tramite una libreria leggera come `idb`), con il JSON del progetto in un object store e i blob binari (immagini/video) in un altro, gestiti da `AssetBlobStore`. I video (potenzialmente decine di MB) non possono stare in `localStorage` (limite pratico ~5-10 MB): per questo si usa IndexedDB, che non ha un limite pratico fisso ma va monitorato con `navigator.storage.estimate()`, con avviso nell'interfaccia in caso di spazio ridotto.

`importJson` esegue sempre la validazione Zod e, se necessario, la catena di migrazione registrata in `domain/migrations/` prima di accettare i dati.

Una futura implementazione `HttpRepository` potrà sostituire `indexedDbRepository` implementando le stesse interfacce: nessun componente UI o di dominio deve mai chiamare direttamente le API di IndexedDB, sempre tramite l'interfaccia astratta.

## Rischi tecnici e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Memory leak da texture immagine/video non distrutte | Hook dedicati (`useImageTexture`, `useVideoTextureLifecycle`) unici responsabili di creazione **e** `dispose()`; contatore in modalità sviluppo per individuare fughe. |
| Gizmo di trasformazione che scrive nello store a ogni frame di drag | Durante il trascinamento si muove solo l'oggetto 3D; commit nello store solo al rilascio. |
| Animazione camera che causa troppi ri-render React | Tempo per-frame in `ref`, store aggiornato a bassa frequenza (throttled). |
| Costo del raycasting con molti banner/occlusori | Pre-filtro bounding box/sphere prima del raycast preciso; un solo `Raycaster` riutilizzato; campionamento a intervalli durante il live. |
| Limiti di storage del browser per video grandi | IndexedDB (non `localStorage`) per i blob; controllo `navigator.storage.estimate()`; avviso preventivo nell'interfaccia. |
| Compatibilità formati video (WebM non ovunque) | Rilevamento e messaggio chiaro nell'interfaccia quando un formato non è riproducibile, senza bloccare il resto dell'app. |
| Stazione demo troppo pesante per un portatile normale | Geometrie primitive (box/piani/cilindri) invece di mesh complesse; nessun asset binario pesante nel repo prima che sia realmente necessario. |

## Cosa NON fare (violazioni da evitare)

- Salvare un oggetto `THREE.Object3D`, `THREE.Texture` o simile dentro `projectStore` o in qualsiasi dato esportato come JSON.
- Aggiornare lo stato Zustand del progetto o della UI a ogni frame di un'animazione.
- Riferirsi a un nome di mesh specifico di un modello GLB nella logica dei banner o dei percorsi.
- Chiamare direttamente le API di IndexedDB fuori da `adapters/persistence/`.
- Introdurre un punteggio di visibilità unico e opaco, senza mostrare le metriche che lo compongono.
