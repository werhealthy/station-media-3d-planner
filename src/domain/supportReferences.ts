export interface SupportReferencePhoto {
  src: string
  alt: string
}

const photo = (filename: string, alt: string): SupportReferencePhoto => ({
  src: `/reference-supports/${filename}`,
  alt,
})

const triad = photo(
  'triade-pompa-01.webp',
  'Vista reale della triade Sovrapompa, Pannello Colonna e Pump Ear',
)

/** Photographs extracted from DISTINABASE_ELEMENTIpV(2).docx. */
export const SUPPORT_REFERENCES: Record<string, SupportReferencePhoto[]> = {
  '1': [
    photo(
      'sovrapompa-01.webp',
      'Sovrapompa Q8 installata su un erogatore reale',
    ),
    triad,
  ],
  '2': [
    photo('pump-leader-01.webp', 'Pump Leader Q8 in testata di isola'),
    photo('pump-leader-02.webp', 'Dettaglio reale di un Pump Leader'),
    photo('pump-leader-03.webp', 'Pump Leader nel contesto della stazione'),
  ],
  '4': [
    photo(
      'pannello-colonna-01.webp',
      'Pannello Colonna Q8 in una stazione reale',
    ),
    triad,
  ],
  '5': [photo('fondostazione-01.webp', 'Fondostazione Q8 nel contesto reale')],
  '6': [
    photo('sagomato-standard-01.webp', 'Sagomato Standard Q8 autoportante'),
    photo(
      'sagomato-standard-02.webp',
      'Secondo esempio reale di Sagomato Standard',
    ),
  ],
  '7': [photo('stendardo-01.webp', 'Stendardo Q8 fissato al palo prezzi')],
  '8': [
    photo(
      'sagomato-cemento-01.webp',
      'Sagomato base in cemento vicino all’ingresso',
    ),
    photo('sagomato-cemento-02.webp', 'Dettaglio del Sagomato base in cemento'),
    photo(
      'sagomato-cemento-03.webp',
      'Sagomato cemento con differenziale prezzi',
    ),
  ],
  '9': [photo('beach-flag-01.webp', 'Beach Flag Q8 installata nel piazzale')],
  '10': [
    photo('pump-ear-01.webp', 'Pump Ear applicato all’erogatore'),
    photo('pump-ear-02.webp', 'Secondo esempio reale di Pump Ear'),
    triad,
  ],
  '11': [
    photo('terminale-21-01.webp', 'Accettatore digitale Q8 da 21 pollici'),
    photo('terminale-21-02.webp', 'Dettaglio del terminale digitale Q8'),
  ],
}
