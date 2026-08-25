import { z } from 'zod'

export const SupportShapeSchema = z.enum([
  'pump-topper',
  'pump-leader',
  'column-panel',
  'pump-ear',
  'digital-screen',
  'freestanding',
  'fondostazione',
  'stendardo',
  'beach-flag',
  'structural-sign',
])

export type SupportShape = z.infer<typeof SupportShapeSchema>

const SupportCatalogEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  family: z.string().min(1),
  journeyPhase: z.string().min(1),
  function: z.string().min(1),
  shape: SupportShapeSchema,
  type: z.enum(['digital', 'print', 'structural']),
  assignable: z.boolean(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    source: z.enum(['documented', 'reference', 'derived', 'estimated']),
    note: z.string().min(1),
  }),
  targetDistance: z.string().min(1),
  eyesOn: z.string().min(1),
  maxWords: z.string().min(1),
  qrPolicy: z.enum(['prohibited', 'conditional', 'allowed', 'not-applicable']),
  qrNote: z.string().min(1),
})

export type SupportCatalogEntry = z.infer<typeof SupportCatalogEntrySchema>

/**
 * Q8 support rules transcribed from DISTINABASE_ELEMENTIpV.docx.
 *
 * Only the Fondostazione document supplies a complete physical format. The
 * pump-topper dimensions come from the supplied UI reference. The SmartOPT
 * body follows the supplied 507 x 606 x 1696 mm technical drawing; its touch
 * area is derived proportionally from that front view.
 * The remaining formats are calibrated from the document photographs against
 * known station objects (dispenser, column and price pylon). They preserve the
 * visible aspect and relative scale, but are still not production drawings.
 */
export const SUPPORT_CATALOG: SupportCatalogEntry[] = z
  .array(SupportCatalogEntrySchema)
  .parse([
    {
      id: '1',
      name: 'Sovrapompa / Cappuccio',
      family: 'Area erogatore',
      journeyPhase: 'Rifornimento e dwell time',
      function: 'Messaggio di prossimita durante il rifornimento.',
      shape: 'pump-topper',
      type: 'print',
      assignable: true,
      dimensions: {
        width: 1.6,
        height: 0.4,
        source: 'reference',
        note: 'Quota 1600 x 400 mm mostrata nel riferimento UI fornito.',
      },
      targetDistance: '1,5-3 m',
      eyesOn: 'Variabile, nel dwell time di 60-90 s',
      maxWords: '8-12 parole',
      qrPolicy: 'prohibited',
      qrNote: 'Da evitare durante il rifornimento Self.',
    },
    {
      id: '2',
      name: 'Pump Leader',
      family: 'Area erogatore',
      journeyPhase: 'Avvicinamento e posizionamento',
      function: 'Hook promozionale prima della manovra di rifornimento.',
      shape: 'pump-leader',
      type: 'print',
      assignable: true,
      dimensions: {
        width: 0.72,
        height: 1.35,
        source: 'derived',
        note: 'Formato verticale calibrato sulle fotografie: circa 720 x 1350 mm.',
      },
      targetDistance: '1,5-3 m',
      eyesOn: '2-3 s',
      maxWords: '6-8 parole',
      qrPolicy: 'prohibited',
      qrNote: 'Non adatto a una lettura prolungata durante la manovra.',
    },
    {
      id: '4',
      name: 'Pannello Colonna',
      family: 'Area erogatore',
      journeyPhase: 'Rifornimento e dwell time',
      function: 'Supporto verticale leggibile anche dal posto guida.',
      shape: 'column-panel',
      type: 'print',
      assignable: true,
      dimensions: {
        width: 0.46,
        height: 0.78,
        source: 'derived',
        note: 'Proporzione ricavata dal pannello montato sulla colonna: circa 460 x 780 mm.',
      },
      targetDistance: '1,5-3 m',
      eyesOn: '5-10 s',
      maxWords: '8-12 parole',
      qrPolicy: 'conditional',
      qrNote: "Da validare solo per fruizione sicura dall'abitacolo.",
    },
    {
      id: '10',
      name: 'Mini / Maxi Pump Ear',
      family: 'Area erogatore',
      journeyPhase: 'Rifornimento e transazione',
      function: 'Contenuto ravvicinato applicato a erogatore o accettatore.',
      shape: 'pump-ear',
      type: 'print',
      assignable: true,
      dimensions: {
        width: 0.42,
        height: 0.72,
        source: 'derived',
        note: 'Formato Maxi ricavato dal confronto con erogatore e SmartOPT: circa 420 x 720 mm.',
      },
      targetDistance: '0,5-1 m',
      eyesOn: '10-15 s',
      maxWords: '10-15 parole',
      qrPolicy: 'conditional',
      qrNote: 'QR minimo 3 x 3 cm, subordinato alle regole safety Q8.',
    },
    {
      id: '11',
      name: 'Totem pagamento Fortech smartOPT Maxi',
      family: 'Terminale digitale',
      journeyPhase: 'Decisione, transazione e chiusura',
      function: 'Terminale elettronico di pagamento con contenuti contestuali.',
      shape: 'digital-screen',
      type: 'digital',
      assignable: true,
      dimensions: {
        width: 0.31,
        height: 0.54,
        source: 'derived',
        note: 'Area display derivata dal disegno quotato del corpo 507 x 606 x 1696 mm; il supporto completo usa le quote documentate.',
      },
      targetDistance: '0,5-2 m',
      eyesOn: '15-60 s; idle loop 3-5 s',
      maxWords: 'Dipende dallo stato della UI',
      qrPolicy: 'conditional',
      qrNote: 'Ammesso solo se non interferisce con pagamento e sicurezza.',
    },
    {
      id: '6',
      name: 'Sagomato Standard',
      family: 'Pedonale e store',
      journeyPhase: 'Cammino, store e ripartenza',
      function: 'Drive-to-store e promozione di servizi non-oil.',
      shape: 'freestanding',
      type: 'print',
      assignable: true,
      dimensions: {
        width: 0.72,
        height: 1.55,
        source: 'derived',
        note: 'Sagoma verticale su base acqua/cemento ricavata dalle fotografie: circa 720 x 1550 mm.',
      },
      targetDistance: '1-3 m',
      eyesOn: '4-8 s (stima)',
      maxWords: '8-15 parole',
      qrPolicy: 'allowed',
      qrNote: 'Ammesso soprattutto in prossimita dello store.',
    },
    {
      id: '5',
      name: 'Fondostazione',
      family: 'Pedonale e store',
      journeyPhase: 'Cammino, store e ripartenza',
      function: 'Grande richiamo visivo e ponte verso i servizi.',
      shape: 'fondostazione',
      type: 'print',
      assignable: true,
      dimensions: {
        width: 4,
        height: 3,
        source: 'documented',
        note: 'Formato fisico 3 x 4 m indicato nel documento.',
      },
      targetDistance: '5-15 m',
      eyesOn: '5-8 s (stima)',
      maxWords: '6-10 parole',
      qrPolicy: 'prohibited',
      qrNote: 'Distanza e ruolo di sfondo non favoriscono la scansione.',
    },
    {
      id: '7',
      name: 'Stendardo',
      family: 'Supporti veicolari veloci',
      journeyPhase: 'Approccio e avvicinamento',
      function: 'Hook di campagna sotto logo e prezzi del palo bandiera.',
      shape: 'stendardo',
      type: 'print',
      assignable: true,
      dimensions: {
        width: 0.62,
        height: 1.18,
        source: 'derived',
        note: 'Pannello sospeso sotto il palo prezzi ricavato dalle fotografie: circa 620 x 1180 mm.',
      },
      targetDistance: '20-40 m',
      eyesOn: 'Circa 1 s',
      maxWords: '3-5 parole',
      qrPolicy: 'prohibited',
      qrNote: "Non leggibile in sicurezza durante l'approccio.",
    },
    {
      id: '9',
      name: 'Beach Flag',
      family: 'Supporti veicolari veloci',
      journeyPhase: 'Approccio e avvicinamento',
      function: 'Primo aggancio visivo e hook sintetico di campagna.',
      shape: 'beach-flag',
      type: 'print',
      assignable: true,
      dimensions: {
        width: 0.7,
        height: 2.35,
        source: 'derived',
        note: 'Vela e asta calibrate sulle fotografie: telo circa 700 x 2350 mm.',
      },
      targetDistance: '20-40 m',
      eyesOn: 'Circa 1 s',
      maxWords: '3-5 parole',
      qrPolicy: 'prohibited',
      qrNote: 'Non adatto a QR, note legali o meccaniche complesse.',
    },
    {
      id: '8',
      name: 'Sagomato base in cemento',
      family: 'Supporti veicolari veloci',
      journeyPhase: 'Approccio e avvicinamento',
      function: 'Differenziale obbligatorio tra prezzo Self e Servito.',
      shape: 'structural-sign',
      type: 'structural',
      assignable: false,
      dimensions: {
        width: 0.68,
        height: 1.28,
        source: 'derived',
        note: 'Ingombro del corpo ricavato dalle fotografie: circa 680 x 1280 mm; quota da validare in produzione.',
      },
      targetDistance: '20-40 m',
      eyesOn: 'Circa 1 s',
      maxWords: 'Non applicabile',
      qrPolicy: 'not-applicable',
      qrNote: 'Non e un supporto pubblicitario configurabile.',
    },
  ])

const SUPPORTS_BY_ID = new Map(
  SUPPORT_CATALOG.map((support) => [support.id, support]),
)

export function getSupportType(id?: string): SupportCatalogEntry | undefined {
  return id ? SUPPORTS_BY_ID.get(id) : undefined
}
