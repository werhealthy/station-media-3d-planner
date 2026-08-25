# Product Specification — Station Media 3D Planner

Questo documento descrive **cosa** costruiamo e **perché**, dal punto di vista del prodotto. Per il **come** tecnico vedi `ARCHITECTURE.md`, `DATA_MODEL.md` e `VISIBILITY_MODEL.md`.

## 1. Obiettivo

Permettere a chi progetta gli spazi pubblicitari di una stazione di servizio (digital signage e cartellonistica cartacea) di:

1. visualizzare la stazione in 3D;
2. posizionare e configurare gli spazi pubblicitari ("banner");
3. assegnare contenuti reali (immagini/video) a ciascun banner;
4. simulare come una persona reale percepirebbe quei banner, camminando nello spazio o osservandoli da punti fissi;
5. ottenere una stima — dichiaratamente approssimativa — di quanto ogni banner sia visibile e leggibile.

Non è un motore di rendering fotorealistico né uno strumento di eye-tracking: è uno strumento di **pianificazione geometrica**, pensato per prendere decisioni informate su dove posizionare un banner, prima di installarlo fisicamente.

## 2. Utente tipo

Un professionista (designer, media planner, gestore di rete di stazioni) con buona comprensione del prodotto pubblicitario ma non necessariamente competenze tecniche 3D. L'interfaccia deve quindi:

- usare linguaggio chiaro, non gergo tecnico non necessario;
- mostrare tooltip e label comprensibili;
- avere un aspetto da **strumento di progettazione professionale**, non da videogioco;
- gestire esplicitamente stati vuoti, di caricamento e di errore;
- offrire una breve guida iniziale (onboarding) ai flussi principali.

## 3. Modalità principali

### 3.1 Overview

Vista d'insieme della stazione, inizialmente dall'alto (con una leggera prospettiva, non ortogonale rigida — l'ortogonale è prevista come opzione futura), con orbita/zoom/pan liberi.

- Mostra tutti i punti pubblicitari, con marker visivamente distinti per tipo (`digital` vs `print`).
- Permette di selezionare un punto cliccando sul marker o sul banner stesso.
- Evidenzia il punto selezionato.
- Permette di nascondere/mostrare marker, hotspot e percorsi (per non affollare la vista).
- Pulsante "reset vista" per tornare all'inquadratura iniziale.

### 3.2 Hotspot

Un hotspot rappresenta **il punto di vista di una persona ferma** che osserva uno o più banner: posizione della camera, altezza occhi (default 1,65 m, modificabile), target osservato, field of view, banner collegato (opzionale), durata suggerita di osservazione.

Selezionando un hotspot:

- la camera si sposta con una transizione morbida alla posizione dell'hotspot;
- si imposta all'altezza occhi configurata;
- si orienta verso il target;
- i banner visibili da quel punto vengono evidenziati;
- le metriche del banner collegato (se presente) vengono mostrate.

L'utente può creare un hotspot dalla posizione corrente della camera, modificarlo, rinominarlo, eliminarlo, spostarlo, collegarlo a un banner.

### 3.3 Walkthrough

Simula una persona che **cammina** lungo un percorso composto da waypoint ordinati, con velocità configurabile (default 1,4 m/s — passo medio umano), altezza occhi, direzione dello sguardo (lungo il percorso, oppure fissa verso un target), field of view, modalità loop, pause.

Durante la simulazione:

- la camera si muove lungo una curva fluida tra i waypoint;
- una timeline mostra il tempo trascorso, con play/pausa/stop/scrub;
- i banner visibili si aggiornano in tempo reale;
- per ogni banner si registrano gli intervalli in cui è visibile, con distanza/angolo/dimensione apparente;
- la velocità di riproduzione della simulazione può essere accelerata o rallentata (non la velocità di camminata simulata, che resta un dato del percorso).

L'architettura predispone (senza implementarla nell'MVP) una futura modalità di navigazione manuale in prima persona.

### 3.4 Analisi visibilità

Modulo indipendente (vedi `VISIBILITY_MODEL.md`) che per ogni banner, a ogni campione temporale, calcola distanza, angolo di osservazione, presenza nel frustum della camera, occlusione (raycasting), percentuale visibile stimata, dimensione proiettata in pixel, e le aggrega in intervalli classificati (`not visible` / `visible` / `potentially readable` / `high visibility`).

**Va sempre comunicato chiaramente nell'interfaccia** che si tratta di una stima geometrica, non di una misurazione scientifica: non sostituisce eye tracking, test con utenti reali, analisi dell'illuminazione, valutazioni normative o analisi del contenuto grafico del banner.

## 4. Aree funzionali dell'interfaccia

- **Barra superiore**: nome progetto, selettore stazione, modalità (Overview/Hotspot/Walkthrough), play/pausa, reset camera, import/export progetto.
- **Viewport 3D centrale**: la scena, con i controlli di navigazione.
- **Pannello laterale destro**, con sezioni: Asset, Banner, Hotspot, Percorsi, Impostazioni, Analisi.
- **Pannello contestuale inferiore**: metriche durante hotspot/walkthrough.

## 5. Gestione asset

Upload via drag&drop di immagini (PNG/JPEG/WebP) e video (MP4, WebM dove supportato dal browser). Per ogni asset: anteprima, nome, tipo, dimensioni, aspect ratio, peso file, durata (video). L'utente può selezionare, assegnare a un banner, sostituire, rimuovere da un banner, eliminare dalla libreria, filtrare per tipo.

Gli asset mantengono il proprio aspect ratio sul banner, con due modalità di adattamento: `contain` (tutto visibile, eventuali bande) e `cover` (riempie il banner, eventuale ritaglio). I video supportano play/pausa/loop/mute/riavvio.

Prima dell'assegnazione l'app confronta il rapporto della creatività con quello
fisico del supporto. La creatività non viene mai deformata: l'interfaccia mostra
la differenza percentuale e rende esplicite le aree libere (`contain`) oppure la
percentuale di ritaglio (`cover`).

## 6. Punti pubblicitari (banner)

Ogni banner è un oggetto indipendente, posizionabile con un gizmo di trasformazione (posizione/rotazione/dimensioni), duplicabile ed eliminabile, con valori numerici modificabili anche da pannello. Dimensioni non valide (negative o nulle) sono impedite. Ogni banner ha tipo (`digital`/`print`), stato visibile/nascosto e note libere.

Le stazioni Q8 possono inoltre usare il catalogo tipizzato dei supporti della
distinta: Sovrapompa, Pump Leader, Pannello Colonna, Pump Ear, DSP 21 pollici,
Sagomato Standard, Fondostazione, Stendardo, Beach Flag e Sagomato prezzo. Tipo
di supporto e istanza fisica nella stazione restano entità distinte.

## 7. Stazione dimostrativa

In assenza di un modello 3D reale fornito dal committente, l'applicazione genera proceduralmente una stazione dimostrativa completa (pavimentazione, strada d'accesso, pensilina, quattro pompe, edificio del punto vendita, parcheggio, segnaletica essenziale, illuminazione semplice) con almeno sei punti pubblicitari rappresentativi (due display digitali vicino alle pompe, un banner sulla pensilina, un poster vicino all'ingresso, un totem, un banner più lontano/difficile da osservare), almeno quattro hotspot e un percorso completo. Nessun marchio reale o materiale protetto viene utilizzato.

## 8. Persistenza e multi-stazione

Salvataggio automatico locale nel browser, creazione/rinomina progetto, export/import JSON (con validazione dello schema e gestione di file corrotti o versioni incompatibili). L'utente può cambiare stazione tra almeno due configurazioni dimostrative; il cambio resetta correttamente camera, banner, hotspot e percorso attivi. Il README documenta come aggiungere una nuova stazione (file GLB, configurazione JSON, thumbnail, metadati).

## 9. Ambito del primo MVP

**Incluso**: tutto quanto descritto sopra — scena 3D, stazione procedurale, Overview, banner digitali/cartacei, upload immagini/video, assegnazione asset, trasformazione banner, hotspot, walkthrough animato, metriche di visibilità, salvataggio locale, import/export JSON, seconda stazione, test della logica di visibilità, documentazione.

**Escluso** (rimandato, documentato in `IMPLEMENTATION_PLAN.md`): autenticazione, collaborazione multiutente, pagamenti, backend cloud completo, editing del modello architettonico, import IFC completo, rendering fotorealistico, simulazione fisica avanzata, eye tracking, app mobile, realtà virtuale.

## 10. Criteri di accettazione dell'MVP

- si avvia seguendo le istruzioni del README, senza errori TypeScript;
- la build di produzione termina correttamente;
- la stazione dimostrativa è visibile e navigabile in orbita;
- sono presenti banner digitali e cartacei distinguibili;
- un'immagine può essere caricata e visualizzata su un banner; un video può essere visualizzato su un banner digitale;
- gli hotspot spostano correttamente la camera;
- il percorso muove la camera all'altezza configurata, con timeline pausabile;
- il tempo di visibilità viene calcolato e distanza/angolo cambiano durante il percorso;
- un oggetto che copre un banner produce un'occlusione rilevata;
- il progetto può essere esportato e reimportato correttamente;
- il cambio stazione funziona senza stato residuo;
- le funzioni principali sono documentate;
- nessun errore bloccante in console.
