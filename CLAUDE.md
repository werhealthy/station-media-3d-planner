# CLAUDE.md

Guida per chi (umano o AI) lavora su questo repository. Riporta le decisioni architetturali prese e i vincoli da rispettare quando si aggiunge o modifica codice.

## Cos'è questo progetto

**Station Media 3D Planner**: piattaforma web desktop-first per visualizzare in 3D una stazione di servizio, posizionare spazi pubblicitari (digitali e cartacei), assegnare immagini/video e simulare quanto sono visibili e leggibili da una persona che cammina nello spazio. Dettagli di prodotto in `docs/PRODUCT_SPEC.md`, architettura in `docs/ARCHITECTURE.md`, modello dati in `docs/DATA_MODEL.md`, modello di visibilità in `docs/VISIBILITY_MODEL.md`, piano di implementazione in `docs/IMPLEMENTATION_PLAN.md`.

## Stack tecnologico

- **React 18** + **TypeScript** (strict mode, nessun `any` non giustificato)
- **Vite** come build tool e dev server
- **Three.js** + **React Three Fiber** (`@react-three/fiber`) + **Drei** (`@react-three/drei`) per la scena 3D
- **Zustand** per lo stato applicativo (4 store separati, vedi sotto)
- **Tailwind CSS** per lo stile
- **shadcn/ui** (componenti su base Radix UI) per i componenti UI accessibili
- **Zod** per la validazione dei dati (schemi di dominio + validazione import JSON)
- **Vitest** per i test di logica pura
- **Playwright** per i test end-to-end dei flussi principali
- **npm** come package manager

Nessun servizio a pagamento o API esterna obbligatoria nel primo MVP. Nessun backend: persistenza locale (IndexedDB per progetto e asset binari) con export/import JSON.

## Struttura del progetto

```
src/
  domain/        # schemi Zod + tipi TS puri (Project, Station, AdvertisingPoint, ...). Zero import da React/Three.
  core/          # logica pura testabile senza contesto grafico: math/, visibility/, route/
  adapters/
    station-model/   # StationModelAdapter: proceduralAdapter, glbAdapter, ifcAdapter (stub)
    persistence/      # ProjectRepository, AssetBlobStore (implementazione IndexedDB)
  three/         # collante imperativo verso Three.js: texture, raycasting, frustum da camera reale
  stores/        # projectStore, viewerStore, playbackStore, uiStore (Zustand)
  components/
    viewer/      # Canvas R3F, stazione, banner, marker hotspot, curva percorso
    panels/      # Asset, Banner, Hotspot, Percorsi, Impostazioni, Analisi
    common/      # componenti UI condivisi
  hooks/         # hook useFrame (animazione camera, ciclo di vita texture video)
  test/          # setup Vitest, fixture condivise
e2e/             # specifiche Playwright
docs/            # documentazione di prodotto/architettura/dati/visibilità/piano
```

Ogni cartella di primo livello sotto `src/` ha una responsabilità unica. `domain/` e `core/` non devono mai importare React o Three.js: devono restare testabili in isolamento.

## Convenzioni TypeScript

- `strict: true` nel `tsconfig.json`, nessuna eccezione senza commento che ne spieghi il motivo.
- Ogni entità di dominio (vedi `docs/DATA_MODEL.md`) ha uno schema Zod in `domain/schemas/` e il tipo TS è derivato con `z.infer<typeof Schema>` (non tipi duplicati a mano).
- Funzioni di calcolo geometrico/visibilità: pure, senza side effect, senza dipendenza diretta da oggetti `THREE.*` quando il calcolo è puramente matematico (vedi `docs/ARCHITECTURE.md` per i confini esatti).
- Niente `any` implicito o esplicito senza giustificazione in commento. Preferire `unknown` + narrowing dove il tipo non è noto (es. dati importati da file esterni, prima della validazione Zod).
- Nomi di file e cartelle in inglese, `camelCase` per funzioni/variabili, `PascalCase` per componenti React e tipi.

## Regole per i componenti 3D

- **Separare sempre**: dati serializzabili (stato di dominio) vs. riferimenti runtime a oggetti Three.js vs. risorse WebGL (texture, elementi `<video>`) vs. stato UI transitorio. Non salvare mai un oggetto `THREE.*` dentro `projectStore`.
- **Animazioni per-frame** (camera lungo un percorso, camera verso un hotspot): muovere l'oggetto Three.js direttamente dentro `useFrame` usando un `ref`, **mai** scrivere nello store Zustand a ogni frame. Lo store riceve solo aggiornamenti "grezzi" a bassa frequenza (throttled) per alimentare la UI (timeline, pannello metriche).
- **Gizmo di trasformazione** (`TransformControls` di Drei): durante il trascinamento si muove solo l'oggetto 3D; il commit nello store (e nell'eventuale cronologia undo) avviene solo al rilascio (`onDragEnd`/`onMouseUp`), non ad ogni evento di drag.
- **Texture e risorse video**: creazione e distruzione (`dispose()`) centralizzate in hook dedicati (es. `useImageTexture`, `useVideoTextureLifecycle`); ogni texture/elemento video creato deve essere esplicitamente distrutto quando non più usato, per evitare memory leak.
- **Banner indipendenti dalle mesh della stazione**: la logica dei punti pubblicitari non deve mai riferirsi a nomi di mesh specifici di un modello GLB. I banner sono oggetti di scena indipendenti, posizionati con coordinate proprie nello spazio della stazione.
- **Raycasting**: riutilizzare un'unica istanza di `Raycaster` per l'occlusione, applicare un pre-filtro (bounding box/sphere) prima del test preciso, campionare a intervalli regolari durante il walkthrough live (non ad ogni frame).

## Convenzioni sulle unità di misura

- 1 unità di scena Three.js = **1 metro**.
- Asse verticale = **Y** (standard Three.js/glTF).
- Direzione frontale di un banner = asse locale **+Z**, dopo applicazione della rotazione del banner (il "davanti" è il lato rivolto verso l'osservatore).
- Rotazioni salvate nello schema dati come angoli di Euler in **gradi** (leggibili/modificabili da un utente nel pannello laterale); convertite in radianti/quaternioni solo internamente per i calcoli 3D, mai esposte in radianti nell'interfaccia utente.
- Angoli di visibilità (angolo massimo consigliato, angolo di osservazione) sempre espressi in gradi nello schema dati e nell'interfaccia.
- Distanze, dimensioni fisiche dei banner, altezza occhi: sempre in metri.

Dettagli completi e diagrammi testuali in `docs/DATA_MODEL.md`.

## Comandi di sviluppo e test

Verranno attivi a partire dalla Fase 1 (setup progetto):

```
npm install       # installa le dipendenze
npm run dev        # avvia il dev server (Vite)
npm run build       # build di produzione
npm run typecheck   # controllo tipi TypeScript senza emettere output
npm run lint         # ESLint
npm run test          # test unitari (Vitest)
npm run test:e2e       # test end-to-end (Playwright)
```

Dopo ogni fase di implementazione, tutti e cinque i comandi (`build`, `typecheck`, `lint`, `test`, `test:e2e` dove applicabile) vanno eseguiti realmente e i risultati riportati, non solo dichiarati.

## Criteri di completamento

Una funzionalità è considerata completa solo quando:

- non introduce errori TypeScript né warning di lint;
- ha test unitari per la logica pura coinvolta (in particolare tutto ciò che sta in `core/`);
- è stata verificata manualmente nell'interfaccia (non solo "il codice sembra corretto");
- gestisce esplicitamente stati vuoti, di caricamento e di errore, quando pertinente;
- non lascia risorse WebGL non distrutte (texture, elementi video) dopo lo smontaggio del componente;
- è documentata dove la logica non è immediatamente comprensibile leggendo il codice.

Nessuna funzione richiesta va sostituita con un placeholder silenzioso: se qualcosa non può essere completato, va segnalato esplicitamente, non finto.

## Decisioni architetturali da non cambiare senza motivazione esplicita

1. **Separazione dominio/runtime/UI** (vedi sopra) — è il vincolo più importante del progetto: violarlo rende impossibile la persistenza pulita e introduce memory leak.
2. **4 store Zustand separati per frequenza di aggiornamento** (`projectStore`, `viewerStore`, `playbackStore`, `uiStore`) — non accorpare per "semplicità": la separazione esiste per evitare re-render costosi durante le animazioni 3D.
3. **`StationModelAdapter` come unico punto di accesso ai modelli 3D** — nessun componente deve caricare un GLB o generare la stazione procedurale direttamente; deve sempre passare dall'adapter, per permettere in futuro adapter IFC/BIM senza toccare il resto dell'app.
4. **`ProjectRepository`/`AssetBlobStore` come interfacce astratte** — l'implementazione IndexedDB è sostituibile da un backend HTTP futuro senza modifiche a UI o dominio; nessun componente deve chiamare direttamente le API di IndexedDB.
5. **Coordinate in metri, rotazioni in gradi nello schema dati** — cambiare questa convenzione a metà progetto invaliderebbe tutti i dati salvati e la documentazione.
6. **L'analisi di visibilità è un'euristica geometrica dichiarata, non una misurazione scientifica** — l'interfaccia deve sempre comunicarlo chiaramente (vedi `docs/VISIBILITY_MODEL.md`); non introdurre un punteggio unico opaco che nasconda questo limite.
7. **Nessun backend/autenticazione/multiutente nel primo MVP** — qualsiasi funzionalità che li richieda va documentata in `docs/IMPLEMENTATION_PLAN.md` come fase futura, non implementata ora.

Se una di queste decisioni va cambiata, la motivazione tecnica va scritta prima nel documento di architettura pertinente, non solo nel codice.
