# Station Media 3D Planner

MVP desktop-first per configurare creatività pubblicitarie in una stazione Q8 attraverso una singola scena 3D.

## Esperienza corrente

- scena prospettica controllata con pensilina brandizzata, erogatori, shop vetrato, totem e piazzale;
- 10 media point fissi, numerati e distinti tra digital e print;
- selezione dalla scena o dal pannello laterale;
- upload JPEG/PNG (massimo 15 MB), anteprima e applicazione immediata della texture al supporto 3D;
- lifecycle esplicito di object URL e texture Three.js.

Il progetto include navigazione orbit, cinque hotspot guidati e una modalità first-person leggera. Non include video, analytics, TransformControls o posizionamento libero dei supporti.

## Sviluppo

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

Le unità della scena sono metri. `src/domain/stationLayout.ts` contiene le quote della stazione, `src/domain/mediaPoints.ts` la configurazione dei media point e `StationModelAdapter` rimane il confine di accesso al modello 3D.

## Asset di brand Q8

I path degli asset sono centralizzati in `src/config/brandAssets.ts`. Il logo Q8 e il logo Svolta presenti in `public/brand/q8/` sono usati sia dalla UI sia dal modello procedurale.

## Passaggio futuro a un modello GLB

Il modello procedurale è il fallback leggero e modificabile, ma non può raggiungere da solo il fotorealismo di un asset texturizzato ad hoc. `StationModelAdapter` resta il boundary: per sostituire il fallback configurare `glbAdapter` con un GLB ottimizzato in metri, asse Y-up, origine al centro del piazzale, materiali PBR compressi e nomi nodo stabili. Il GLB deve preservare gli ingombri e le coordinate di `stationLayout.ts`, così gli ancoraggi dei media point e le viste hotspot non cambiano. Si raccomandano mesh separate per shop, pensilina, pompe e totem, UV non sovrapposte, texture 2K/4K selettive e collision volumes semplificati.
