# Station Media 3D Planner

MVP desktop-first per configurare creatività pubblicitarie in una stazione Q8 attraverso una singola scena 3D.

## Esperienza corrente

- scena prospettica controllata con pensilina brandizzata, erogatori, shop vetrato, totem e piazzale;
- 10 media point fissi, numerati e distinti tra digital e print;
- selezione dalla scena o dal pannello laterale;
- upload JPEG/PNG (massimo 15 MB), anteprima e applicazione immediata della texture al supporto 3D;
- lifecycle esplicito di object URL e texture Three.js.

Il progetto non include modalità first-person/walkthrough, video, analytics, TransformControls o posizionamento libero dei supporti.

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
