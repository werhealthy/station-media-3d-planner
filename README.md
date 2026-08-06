# Station Media 3D Planner

Piattaforma web desktop-first per visualizzare in 3D una stazione di servizio, configurare i suoi spazi pubblicitari (digitali e cartacei), assegnare immagini/video e simulare quanto ogni banner è visibile e leggibile da una persona che osserva o attraversa lo spazio.

> Nota: si tratta di uno strumento di **pianificazione geometrica**, non di un motore di rendering fotorealistico né di eye-tracking. Le metriche di visibilità sono stime approssimative — dettagli in `docs/VISIBILITY_MODEL.md`.

## Documentazione

- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — cosa fa il prodotto e perché.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — come è organizzato il codice.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — le entità dati e le convenzioni geometriche (unità, assi, rotazioni).
- [`docs/VISIBILITY_MODEL.md`](docs/VISIBILITY_MODEL.md) — come viene calcolata la stima di visibilità e quali sono i suoi limiti.
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — le fasi di sviluppo, dall'MVP alle evoluzioni future.
- [`CLAUDE.md`](CLAUDE.md) — convenzioni tecniche e decisioni architetturali per chi contribuisce al codice.

## Stato del progetto

Il progetto è in fase di sviluppo iniziale. Le fasi sono descritte in `docs/IMPLEMENTATION_PLAN.md` e vengono implementate una alla volta, con verifica (build, type-check, lint, test) dopo ciascuna.

**Completate**: 
- Fase 0 (documentazione)
- Fase 1 (fondamenta — progetto avviabile, layout applicativo con barra superiore/viewport/pannello laterale, i 4 store Zustand, design system Tailwind/shadcn-style, lint/test/build configurati e verificati)
- Fase 2 (viewer 3D con stazione dimostrativa procedurale, telecamera vincolata dall'alto, controlli tastiera per la navigazione)

**In corso/da fare**: Fase 3 (gestione asset e banner pubblicitari) in poi — vedi `docs/IMPLEMENTATION_PLAN.md` per il dettaglio.

## Requisiti

- [Node.js](https://nodejs.org/) versione LTS corrente
- npm (incluso con Node.js)

## Avvio del progetto

```bash
npm install
npm run dev
```

L'app sarà disponibile su `http://localhost:5173` (porta di default di Vite).

### Controlli della telecamera 3D

La vista principale offre una telecamera vincolata dall'alto (isometrica) per una migliore navigazione dello spazio pubblicitario:

- **W** — sposta la telecamera in avanti (allontanamento dal centro)
- **S** — sposta la telecamera indietro (avvicinamento al centro)
- **A** — sposta la telecamera a sinistra
- **D** — sposta la telecamera a destra
- **Q** — zoom out (aumenta l'altezza di visualizzazione)
- **E** — zoom in (diminuisce l'altezza di visualizzazione)

La telecamera non può andare sotto il livello del pavimento ed è sempre orientata verso il centro della scena.

Altri comandi disponibili:

```bash
npm run build       # build di produzione
npm run typecheck    # controllo tipi TypeScript
npm run lint          # controllo qualità del codice
npm run test            # test unitari (Vitest)
npm run test:e2e         # test end-to-end (Playwright)
```

## Nessun servizio esterno richiesto

Il primo MVP non richiede backend, account, chiavi API o servizi a pagamento: tutto funziona in locale nel browser. I progetti si salvano automaticamente nel browser (IndexedDB) e possono essere esportati/importati come file JSON per essere condivisi o salvati altrove.

## Aggiungere una nuova stazione

Nel primo MVP sono incluse due configurazioni dimostrative generate proceduralmente (nessun modello 3D reale è necessario per iniziare a usare l'app). Per aggiungere in futuro una stazione basata su un modello 3D reale servono:

1. un file **GLB** del modello 3D (formato consigliato: `glTF`/`.glb`);
2. un file di **configurazione JSON** della stazione (camera iniziale, scala, punti pubblicitari, hotspot, percorsi — struttura descritta in `docs/DATA_MODEL.md`);
3. una **thumbnail** per il selettore stazione;
4. eventuali **metadati** descrittivi (nome, note).

La procedura dettagliata (dove posizionare i file, come registrare la nuova stazione nell'app) verrà completata e documentata qui man mano che l'adapter GLB viene implementato (Fase 2 del piano).

## Limiti noti della persistenza locale

I progetti e gli asset caricati (in particolare i video) sono salvati nel browser tramite IndexedDB. Questo significa che:

- i dati **non sono sincronizzati** tra browser o dispositivi diversi: per condividerli, usare l'esportazione JSON;
- svuotare i dati di navigazione del browser cancella i progetti salvati localmente;
- video di grandi dimensioni occupano spazio nel browser: il browser stesso può imporre limiti di spazio disponibile, con un avviso mostrato dall'app quando lo spazio è ridotto;
- l'esportazione JSON dell'MVP contiene i riferimenti agli asset, non necessariamente i file binari incorporati — dettagli in `docs/ARCHITECTURE.md`.

## Come contribuire al codice

Prima di modificare il codice, leggere `CLAUDE.md`: contiene le convenzioni tecniche e le decisioni architetturali da non cambiare senza una motivazione esplicita documentata.
