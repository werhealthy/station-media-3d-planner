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

Gli asset sostituibili sono attesi in `public/brand/q8/`, ma i file binari non sono versionati. Fornire localmente o tramite la pipeline i PNG mantenendo nome, trasparenza e proporzioni (`logo-q8.png`, `logo-svolta.png`, `totem-logo.png`, `pump-brand.png`, `placeholder-media.png`). Anche gli eventuali placeholder dei dieci supporti in `public/media-placeholders/` restano esterni al repository; il rendering e il workflow di upload non dipendono dalla loro presenza.
