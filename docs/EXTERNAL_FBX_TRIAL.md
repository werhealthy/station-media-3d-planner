# Prova tecnica: stazione FBX esterna

## Attivazione e confronto

- `/?stationModel=external` carica `public/models/q8-station/4002336.FBX`.
- Senza parametro (o con `?stationModel=procedural`) resta attiva la stazione procedurale.
- Se il caricamento FBX fallisce, il viewer mostra un avviso e monta automaticamente il modello procedurale.

L'adapter centra il footprint sull'origine, appoggia il punto più basso a `Y=0` e corregge
solo esportazioni chiaramente in centimetri o millimetri. Il file sorgente non viene modificato.
Overview, Orbit e limiti di camminata usano il bounding box normalizzato.

## Diagnostica e gerarchia

All'avvio, `[ExternalStationAdapter] FBX diagnostics` nella console riporta dimensioni grezze
e normalizzate, centro, scala applicata, conteggi di mesh/materiali, texture, risorse mancanti e
l'elenco dei nodi con profondità. Gli indizi semantici (`pump`, `shop`, `canopy`, `totem`,
`ground`) vengono segnalati solo quando supportati dal nome; nomi generici non vengono
interpretati come semantica affidabile.

Le texture relative vengono cercate sotto `/models/q8-station/Maps/`. Un errore di texture viene
registrato ma non interrompe il parsing: materiali e geometrie FBX restano renderizzati. Il report
osservato nel parser è riportato di seguito.

### Report del file `4002336.FBX`

- FBX binario 2019.2 esportato da 3ds Max 2020; parsing completato con `FBXLoader`.
- Bounding box grezzo: circa `105596 × 108082 × 102507`; la soglia prudente applica `0.001`,
  ottenendo circa `105.60 × 108.08 × 102.51` unità/metri prima della centratura.
- 210 mesh, 22 materiali distinti, profondità massima 4.
- I nodi principali sono quasi esclusivamente numerici (`10_obj(4002336)`,
  `11_obj(4002336)`, …, `251_obj(4002336)`), oltre a luci e camere V-Ray. Non esistono nomi
  affidabili per pompe, shop, canopy, totem o ground: la semantica del modello è quindi **scarsa**
  e l'associazione futura dovrà essere salvata nella configurazione esterna.
- Il file fa riferimento a 13 nomi, da `Maps/1_map(4002336).jpg` a
  `Maps/13_map(4002336).jpg`; la directory `public/models/q8-station/Maps/` non è presente nel
  repository, quindi tali file esterni sono mancanti. Il FBX contiene anche dati immagine embedded,
  ma `FBXLoader` segnala diversi filename non definiti/placeholder.
- Numerosi materiali sono V-Ray/3ds Max non supportati direttamente da Three.js (diffuse, bump,
  reflection e blend avanzati): `FBXLoader` mantiene le geometrie e degrada questi shader a
  `MeshPhongMaterial`. Di conseguenza il parsing è valido, ma la fedeltà dei materiali non può
  essere dichiarata equivalente al rendering originale senza una successiva conversione GLB/PBR.

## Limiti deliberati del walkthrough

Questa prova usa il rettangolo del bounding box come area percorribile e il suo piano minimo come
quota del terreno. Non esegue collisioni triangolari: è quindi possibile attraversare pareti o
oggetti. Lo spawn viene collocato fuori da un angolo del footprint e orientato verso il centro per
ridurre il rischio di partire dentro una mesh.

## Strategia consigliata per la fase setup

Per questa risorsa è preferibile una configurazione esterna `station-config.json`: mantiene il file
vendor intatto e può contenere `mediaPoints`, `hotspots` e `walkPath`, inclusi posizione, normale,
rotazione, dimensioni e riferimento alla mesh raccolti tramite raycast. Nodi speciali nel FBX/GLB
potranno restare un'importazione opzionale, non un requisito. `StationModelHandle` espone già root,
mesh e bounds runtime necessari a una futura modalità **Station Setup**, senza introdurre ora marker
o metadata hardcoded.
