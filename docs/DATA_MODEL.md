# Modello dati — Station Media 3D Planner

Ogni entità qui descritta corrisponde a uno schema Zod in `src/domain/schemas/` (da cui deriva il tipo TypeScript) e, dove pertinente, a una parte del JSON esportabile/importabile del progetto. Questo documento descrive **campi e convenzioni**, non il codice.

## Convenzioni geometriche (da rispettare ovunque nel progetto)

Queste convenzioni sono decisioni architetturali fisse (vedi `CLAUDE.md`): cambiarle a metà progetto invaliderebbe tutti i dati salvati.

- **Unità di misura**: 1 unità di scena Three.js = **1 metro**. Tutte le distanze, dimensioni fisiche e altezze nello schema dati sono in metri.
- **Asse verticale**: **Y** (standard Three.js/glTF). "Su" è sempre +Y.
- **Direzione frontale di un banner**: l'asse locale **+Z** del banner, dopo aver applicato la sua rotazione. In pratica: se un banner non è ruotato, il suo "davanti" (il lato che un passante guarda) punta verso +Z globale. Ruotandolo, il davanti ruota con lui. Questo evita ambiguità quando si calcola se un osservatore sta guardando il banner di fronte o di lato/dietro.
- **Rotazioni**: salvate nello schema dati come **angoli di Euler in gradi** (es. `{ x: 0, y: 90, z: 0 }`), perché sono leggibili e modificabili da una persona nel pannello laterale. Internamente, per i calcoli 3D (per evitare il "gimbal lock", un problema noto degli angoli di Euler in certe combinazioni), vengono convertiti in quaternioni — ma questa conversione è un dettaglio implementativo che l'utente non vede mai.
- **Angoli di visibilità** (es. "angolo massimo consigliato" di un banner): sempre in **gradi**, sia nello schema dati sia nell'interfaccia.
- **Coordinate locali vs. globali**: ogni stazione ha un proprio sistema di coordinate locale (l'origine è definita dal modello 3D o dalla configurazione procedurale); banner, hotspot e waypoint sono salvati in coordinate locali alla stazione a cui appartengono, così che una stazione possa essere spostata/riposizionata senza dover ricalcolare tutti i suoi contenuti.

## Versionamento dello schema

Ogni progetto esportato include un campo `schemaVersion` (numero intero). Quando lo schema dati cambia in modo incompatibile, si aggiunge una funzione di migrazione in `src/domain/migrations/` che sa trasformare un progetto dalla versione N alla versione N+1. All'importazione, se `schemaVersion` è inferiore alla versione corrente, si applica la catena di migrazioni necessaria prima di validare i dati con Zod; se la versione è superiore a quella supportata (progetto esportato da una versione più recente dell'app), l'importazione viene rifiutata con un messaggio chiaro, non con un errore tecnico criptico.

## Entità

### Project

Il contenitore di primo livello, ciò che viene salvato/esportato come un progetto.

| Campo | Tipo | Note |
|---|---|---|
| `id` | stringa | identificativo univoco |
| `schemaVersion` | intero | versione dello schema dati |
| `name` | stringa | nome del progetto, modificabile |
| `stations` | `Station[]` | le stazioni configurate in questo progetto |
| `activeStationId` | stringa | quale stazione è attualmente aperta |
| `preferences` | `UserPreferences` | preferenze non legate a una singola stazione |
| `createdAt` / `updatedAt` | data/ora | metadati |

### Station

Una singola stazione di servizio configurata.

| Campo | Tipo | Note |
|---|---|---|
| `id`, `name` | stringa | |
| `model` | `StationModel` | riferimento al modello 3D (procedurale o GLB) |
| `scale` | numero | fattore di scala rispetto al metro, se il modello sorgente non è già in metri |
| `initialCamera` | `CameraConfiguration` | inquadratura iniziale della modalità Overview |
| `advertisingPoints` | `AdvertisingPoint[]` | i banner della stazione |
| `hotspots` | `Hotspot[]` | i punti di osservazione predefiniti |
| `routes` | `WalkingRoute[]` | i percorsi di walkthrough |

### StationModel

Descrive **come** caricare la geometria 3D della stazione.

| Campo | Tipo | Note |
|---|---|---|
| `adapterType` | `'procedural' \| 'glb' \| 'ifc'` | quale `StationModelAdapter` usare (`'ifc'` non implementato nell'MVP) |
| `source` | stringa/oggetto | percorso del file GLB, oppure configurazione parametrica per il generatore procedurale |
| `metadata` | oggetto | informazioni descrittive (autore, note, thumbnail) |

### MediaAsset

Un'immagine o un video caricato nella libreria asset.

| Campo | Tipo | Note |
|---|---|---|
| `id`, `name` | stringa | |
| `kind` | `'image' \| 'video'` | |
| `mimeType` | stringa | es. `image/png`, `video/mp4` |
| `blobRef` | stringa | riferimento al blob in `AssetBlobStore` (non il file stesso nello schema JSON) |
| `width`, `height` | numero | dimensioni originali in pixel |
| `aspectRatio` | numero | calcolato da width/height |
| `fileSizeBytes` | numero | |
| `durationSeconds` | numero, opzionale | solo per i video |

### AdvertisingPoint (banner)

Come da requisiti di prodotto, ogni banner ha almeno:

| Campo | Tipo | Note |
|---|---|---|
| `id`, `name`, `stationId` | stringa | |
| `type` | `'digital' \| 'print'` | |
| `position` | `{x,y,z}` metri | coordinate locali alla stazione |
| `rotation` | `{x,y,z}` gradi | Euler, vedi convenzioni sopra |
| `size` | `{width, height}` metri | dimensioni fisiche; mai negative o nulle |
| `aspectRatio` | numero | derivato da `size`, usato per l'adattamento degli asset |
| `frontDirection` | derivato | asse locale +Z dopo rotazione (non un campo indipendente, per evitare inconsistenze) |
| `assignedAssetId` | stringa, opzionale | riferimento a un `MediaAsset` |
| `fitMode` | `'contain' \| 'cover'` | come l'asset riempie il banner |
| `maxAnalysisDistance` | numero, metri | oltre questa distanza il banner è considerato "non visibile" nell'analisi |
| `maxRecommendedAngle` | numero, gradi | angolo oltre il quale la leggibilità è considerata compromessa |
| `visible` | booleano | mostra/nascondi nella scena |
| `notes` | stringa, opzionale | |

### Hotspot

| Campo | Tipo | Note |
|---|---|---|
| `id`, `name` | stringa | |
| `cameraPosition` | `{x,y,z}` metri | |
| `target` | `{x,y,z}` metri | punto osservato |
| `eyeHeight` | numero, metri | default 1,65, modificabile |
| `fov` | numero, gradi | field of view |
| `linkedAdvertisingPointId` | stringa, opzionale | banner associato |
| `suggestedViewDurationSeconds` | numero, opzionale | |

### WalkingRoute

| Campo | Tipo | Note |
|---|---|---|
| `id`, `name` | stringa | |
| `waypoints` | `RouteWaypoint[]` | ordinati |
| `speedMetersPerSecond` | numero | default 1,4 |
| `eyeHeight` | numero, metri | |
| `lookMode` | `'alongPath' \| 'fixedTarget'` | direzione dello sguardo |
| `lookTarget` | `{x,y,z}`, opzionale | usato se `lookMode === 'fixedTarget'` |
| `fov` | numero, gradi | |
| `loop` | booleano | |
| `computedDurationSeconds` | numero | derivato da lunghezza percorso e velocità |

### RouteWaypoint

| Campo | Tipo | Note |
|---|---|---|
| `position` | `{x,y,z}` metri | |
| `pauseSeconds` | numero, opzionale | pausa a quel waypoint |

### VisibilitySample

Un campione puntuale calcolato dal modulo di analisi (vedi `VISIBILITY_MODEL.md`).

| Campo | Tipo | Note |
|---|---|---|
| `timestampSeconds` | numero | istante nel percorso |
| `advertisingPointId` | stringa | |
| `distanceMeters` | numero | |
| `angleDegrees` | numero | tra normale frontale del banner e direzione verso l'osservatore |
| `inFrustum` | booleano | |
| `occluded` | booleano | |
| `visiblePercentage` | numero, 0-100 | stima approssimativa |
| `projectedWidthPx`, `projectedHeightPx` | numero | dimensione apparente sullo schermo |

### VisibilityInterval

Un intervallo continuo di tempo con una classificazione unica (run-length encoding dei campioni).

| Campo | Tipo | Note |
|---|---|---|
| `advertisingPointId` | stringa | |
| `startSeconds`, `endSeconds` | numero | |
| `classification` | `'not_visible' \| 'visible' \| 'potentially_readable' \| 'high_visibility'` | |

### VisibilityReport

Aggregato per banner su un intero percorso, ciò che viene mostrato nel pannello Analisi.

| Campo | Tipo | Note |
|---|---|---|
| `advertisingPointId` | stringa | |
| `totalVisibleSeconds` | numero | |
| `totalPotentiallyReadableSeconds` | numero | |
| `minDistanceMeters`, `avgDistanceMeters` | numero | |
| `bestAngleDegrees` | numero | |
| `maxApparentSizePx` | numero | |
| `hadOcclusion` | booleano | |

### CameraConfiguration

Stato camera riutilizzabile (vista iniziale, reset, hotspot).

| Campo | Tipo | Note |
|---|---|---|
| `position` | `{x,y,z}` metri | |
| `target` | `{x,y,z}` metri | |
| `fov` | numero, gradi | |

### UserPreferences

Impostazioni non legate a un singolo progetto/stazione, es. soglie euristiche personalizzate per la classificazione di visibilità (vedi `VISIBILITY_MODEL.md`), unità di misura preferite per la visualizzazione (l'archiviazione resta sempre in metri/gradi).

## Relazioni (sintesi)

```
Project
 └─ Station (1..N)
     ├─ StationModel (1)
     ├─ AdvertisingPoint (0..N) ── assignedAssetId ──> MediaAsset (nella libreria del progetto)
     ├─ Hotspot (0..N) ── linkedAdvertisingPointId ──> AdvertisingPoint (opzionale)
     └─ WalkingRoute (0..N)
         └─ RouteWaypoint (2..N, ordinati)

VisibilityReport / VisibilityInterval / VisibilitySample
 sono calcolati (non salvati come parte permanente del progetto,
 salvo eventualmente l'ultimo report generato, per comodità)
 a partire da una coppia (WalkingRoute, insieme di AdvertisingPoint)
```
