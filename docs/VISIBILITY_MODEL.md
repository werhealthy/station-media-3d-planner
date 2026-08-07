# Modello di visibilità — Station Media 3D Planner

## Cosa fa, e soprattutto cosa NON fa

Questo modulo calcola una **stima geometrica approssimativa** di quanto un banner sia visibile e potenzialmente leggibile da un osservatore in una determinata posizione. Serve a confrontare rapidamente posizioni diverse e a individuare problemi evidenti (banner troppo lontano, troppo di taglio, coperto da un ostacolo).

**Non è**, e non deve mai essere presentato come:

- una misurazione di eye-tracking reale;
- un sostituto di test con utenti reali;
- un'analisi dell'illuminazione della scena (il modulo non considera luce, contrasto, riflessi);
- una valutazione normativa (codice della strada, distanze minime regolamentari, ecc.);
- un'analisi del contenuto grafico del banner (testo troppo piccolo, colori poco leggibili, ecc.).

Questo limite viene comunicato esplicitamente nell'interfaccia utente ovunque vengano mostrate metriche di visibilità (non solo qui nella documentazione).

## Cosa viene calcolato, per ogni banner e per ogni campione temporale

1. **Distanza** tra l'osservatore (posizione camera) e il centro del banner, in metri.
2. **Angolo** tra la direzione frontale del banner (asse locale +Z ruotato, vedi `DATA_MODEL.md`) e la direzione dall'osservatore verso il banner, in gradi. Un angolo vicino a 0° significa "il banner è visto quasi di fronte"; vicino a 90° significa "quasi di taglio".
3. **Presenza nel frustum** della camera: se il banner rientra nel volume visivo della camera in quel momento (fuori dal frustum = non visibile, indipendentemente da distanza/angolo).
4. **Occlusione**: tramite raycasting tra osservatore e banner, si verifica se un altro oggetto della scena si frappone (es. un'auto, un pilastro, un'altra struttura).
5. **Percentuale visibile stimata**: una stima approssimativa di quanta parte del banner non è occlusa (basata su più raggi campionati sulla superficie del banner, non su un singolo punto centrale).
6. **Dimensione proiettata sullo schermo**: larghezza e altezza approssimative in pixel che il banner occuperebbe nel campo visivo dell'osservatore, calcolata da dimensione fisica, distanza e field of view.
7. **Durata di visibilità consecutiva** e **durata totale** lungo un percorso: aggregando i campioni nel tempo.

## Classificazione (euristica configurabile, non un punteggio unico)

I campioni vengono classificati in una di quattro categorie, calcolate da soglie **documentate e modificabili** (non nascoste in un punteggio opaco):

| Classificazione | Significato indicativo |
|---|---|
| `not_visible` | fuori dal frustum, oppure occluso, oppure oltre la distanza massima di analisi del banner |
| `visible` | nel campo visivo, non occluso, ma distanza/angolo/dimensione non ottimali |
| `potentially_readable` | distanza e angolo entro soglie ragionevoli, dimensione proiettata sufficiente a ipotizzare la leggibilità di un contenuto semplice |
| `high_visibility` | condizioni favorevoli su tutti i fattori (vicino, frontale, di dimensione ampia, per una durata significativa) |

### Soglie di default (proposta iniziale, tutte configurabili per progetto)

- **Distanza**: usa `maxAnalysisDistance` del singolo banner come limite oltre cui è `not_visible`; entro il 40% di quella distanza si considera "vicino" ai fini di `high_visibility`.
- **Angolo**: usa `maxRecommendedAngle` del banner come limite oltre cui la leggibilità è compromessa; entro 20° si considera "frontale" ai fini di `high_visibility`.
- **Dimensione proiettata**: una soglia minima di pixel (es. 40px di altezza) sotto la quale un banner è troppo piccolo per essere considerato `potentially_readable`, indipendentemente da distanza/angolo.
- **Durata**: un banner visto per meno di ~0,5 secondi consecutivi non viene considerato `potentially_readable` anche se geometricamente lo sarebbe, perché un tempo troppo breve non permette una lettura reale.

Queste soglie vivono in un oggetto di configurazione esplicito (`VisibilityHeuristicConfig`), con valori di default documentati qui e sovrascrivibili dall'utente nel pannello Impostazioni — non sono valori "magici" nascosti nel codice.

## Come viene mostrato il risultato

Mai come un singolo numero/punteggio. Il pannello Analisi mostra sempre, separatamente:

- tempo visibile totale;
- tempo potenzialmente leggibile;
- distanza minima e distanza media durante il percorso;
- angolo migliore raggiunto;
- dimensione apparente massima;
- presenza o assenza di occlusioni rilevate.

Accanto a queste metriche, un testo fisso ricorda i limiti del modello (vedi sezione "Cosa NON fa" sopra).

## Confine tecnico: cosa richiede Three.js e cosa è calcolo puro

Rilevante per chi implementerà/testerà il modulo (dettagli in `ARCHITECTURE.md`):

- Distanza, angolo, dimensione proiettata, classificazione, aggregazione degli intervalli: **matematica pura**, nessuna dipendenza da Three.js, testabile con Vitest su semplici oggetti `{x,y,z}`.
- Verifica del frustum: pura una volta ricevuti i piani del frustum come dati; l'estrazione dei piani da una camera reale richiede un oggetto `THREE.Camera`.
- Occlusione: richiede `THREE.Raycaster` contro le mesh della scena — è comunque puro calcolo geometrico (CPU), eseguibile anche nei test automatici senza una vera scheda grafica, perché non richiede il disegno di alcun pixel.

## Quando viene calcolato

- **Durante un walkthrough live**: a intervalli regolari (non a ogni singolo frame, per non appesantire l'interfaccia), usando la posizione corrente della camera.
- **Per generare un report completo** su un percorso: l'intero percorso viene pre-campionato in N pose e ciascuna viene analizzata, producendo il `VisibilityReport` aggregato per banner. Se necessario per le prestazioni su percorsi molto lunghi, questo calcolo potrà essere spostato in un Web Worker (ottimizzazione futura, non richiesta nell'MVP).
