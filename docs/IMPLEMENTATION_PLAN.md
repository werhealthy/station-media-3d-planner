# Piano di implementazione — Station Media 3D Planner

Le fasi si implementano **una alla volta**. Dopo ogni fase: build, type-check, lint e test vengono eseguiti realmente e i risultati riportati; il progetto resta sempre avviabile; nessuna funzione richiesta viene sostituita con un placeholder silenzioso.

## Fase 0 — Analisi e documentazione (questa fase)

- Analisi della richiesta e del repository.
- `CLAUDE.md`, `README.md`, `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/VISIBILITY_MODEL.md`.

**Verifica**: documenti presenti e coerenti tra loro; nessun codice applicativo ancora scritto.

## Fase 1 — Fondamenta

- Setup Vite + React + TypeScript (strict mode).
- Layout applicativo: barra superiore, viewport centrale, pannello destro, pannello contestuale inferiore (contenuti segnaposto, non ancora funzionali).
- Scaffolding dei 4 store Zustand (`projectStore`, `viewerStore`, `playbackStore`, `uiStore`) con la struttura dati minima.
- Design system: Tailwind CSS + shadcn/ui, tema "strumento professionale".
- Configurazione ESLint, Prettier, Vitest, Playwright (scheletro, senza test applicativi ancora).

**Verifica**: `npm run dev` avvia l'app, layout visibile senza errori console; `npm run typecheck`, `npm run lint`, `npm run build` puliti.

## Fase 2 — Viewer 3D

- Canvas React Three Fiber, illuminazione base.
- Camere: overview (leggermente prospettica) e camera "umana" per hotspot/walkthrough.
- Controlli orbit/zoom/pan.
- `StationModelAdapter`: interfaccia + `proceduralAdapter` con la stazione dimostrativa (pavimentazione, strada, pensilina, 4 pompe, edificio, parcheggio, segnaletica, illuminazione semplice).
- `glbAdapter` predisposto (caricamento GLB, gestione errori/loading), anche se non ancora usato con un modello reale.

**Verifica**: la stazione demo è visibile e navigabile in 3D; stati di caricamento/errore gestiti; nessun errore console.

## Fase 3 — Banner e asset

- Punti pubblicitari come oggetti di scena indipendenti; creazione, selezione, duplicazione, eliminazione.
- Gizmo di trasformazione (`TransformControls`), pannello valori numerici, validazione dimensioni.
- Libreria asset: drag&drop immagini/video, anteprima, metadati, filtri.
- Assegnazione asset a banner, texture con aspect ratio corretto (`contain`/`cover`), video texture con play/pausa/loop/mute.

**Verifica**: un'immagine trascinata su un banner appare correttamente proporzionata; un video riproduce e si mette in pausa correttamente; nessuna risorsa WebGL non distrutta dopo sostituzione/rimozione asset.

## Fase 4 — Hotspot

- Creazione hotspot dalla posizione camera corrente; modifica, rinomina, eliminazione, spostamento, collegamento a un banner.
- Transizione camera animata (posizione, altezza occhi, target) alla selezione di un hotspot.
- Evidenziazione dei banner visibili da quell'hotspot; metriche statiche mostrate.

**Verifica**: selezionando un hotspot la camera si sposta dolcemente alla vista corretta; i valori sono modificabili e persistono nello store.

## Fase 5 — Walkthrough

- Editor waypoint, curva fluida di interpolazione.
- Timeline con play/pausa/stop/scrub, controllo velocità di riproduzione.
- Animazione camera lungo il percorso (posizione, altezza occhi, direzione sguardo secondo `lookMode`).
- Campionamento a intervalli per l'aggiornamento live dei banner visibili.

**Verifica**: avviando il percorso la camera cammina lungo la curva all'altezza configurata; la timeline è scrubbabile; nessun degrado di framerate percepibile su un portatile normale.

## Fase 6 — Analisi visibilità

- Implementazione di `core/visibility/`: distanza, angolo, frustum, occlusione (raycasting), dimensione proiettata, classificazione euristica configurabile, aggregazione in intervalli.
- Pannello Analisi con le metriche separate (non un punteggio unico), testo di avvertenza sui limiti del modello.

**Verifica**: un ostacolo posto davanti a un banner produce un'occlusione rilevata nel report; le metriche cambiano coerentemente durante il percorso; test unitari coprono tutte le funzioni di `core/visibility/`.

## Fase 7 — Persistenza e stazioni multiple

- Salvataggio automatico locale (IndexedDB), nuovo progetto, rinomina.
- Export/import JSON con validazione Zod e gestione di file corrotti/versioni incompatibili (catena di migrazione).
- Selettore stazione con almeno due configurazioni procedurali; reset corretto di camera/banner/hotspot/percorso al cambio.

**Verifica**: chiudere e riaprire il browser mantiene il progetto; export→import ripristina lo stato identico; cambiare stazione non lascia stato residuo della precedente.

## Fase 8 — Verifica e rifinitura

- Test end-to-end (Playwright) del flusso completo: apertura app → selezione banner → caricamento/selezione immagine → assegnazione → apertura hotspot → avvio walkthrough → visualizzazione metriche → esportazione progetto.
- Ottimizzazioni prestazioni: dispose risorse, pausa video non visibili, caricamento lazy stazioni, riduzione re-render React non necessari.
- Accessibilità: navigazione da tastiera, focus visibile, contrasto, conferme prima di eliminazioni, undo per le trasformazioni principali dove ragionevole.
- Guida iniziale (onboarding) in 5 passaggi: selezionare una stazione, caricare un asset, assegnarlo a un banner, aprire un hotspot, avviare un percorso.
- Documentazione finale, revisione README.

**Verifica**: suite Playwright verde; `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` tutti puliti, con risultati reali riportati; nessun errore bloccante in console.

## Ambito MVP (riepilogo)

**Incluso**: tutto quanto sopra, fasi 0-8.

**Escluso, documentato come fase futura, non implementato ora**:

- backend e autenticazione;
- libreria cloud degli asset;
- ruoli e organizzazioni;
- import IFC/BIM completo (l'adapter è predisposto come interfaccia e stub, non implementato);
- conversione automatica IFC in formato ottimizzato;
- editor dei percorsi più avanzato;
- simulazione di automobili;
- differenti altezze/profili degli osservatori (oltre al singolo valore configurabile per hotspot/percorso);
- illuminazione giorno/notte;
- analisi dell'illuminamento;
- heatmap di visibilità;
- confronto fra creatività differenti;
- esportazione PDF del report;
- condivisione tramite link;
- commenti e revisioni;
- modalità VR;
- analytics aggregati;
- modalità manuale in prima persona nel walkthrough (l'architettura la predispone, ma non è implementata nell'MVP).

## Come procedere fase per fase

Ogni fase viene proposta, implementata, verificata con i comandi reali (`typecheck`, `lint`, `test`, `build`, e `test:e2e` quando pertinente) e riportata con: risultato ottenuto, file principali modificati, test eseguiti, problemi ancora aperti, proposta per la fase successiva — prima di passare alla fase seguente.
