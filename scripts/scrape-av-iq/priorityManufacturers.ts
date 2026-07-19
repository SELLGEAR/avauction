/**
 * CLAUDE.md's "Priority model list for scraping" names ~30 manufacturers across
 * LED video, audio, lighting, media servers, and projectors as the phase-1 seeding
 * target. Slugs below were verified against AV-iQ's own manufacturer directory
 * (https://www.av-iq.com/avcat/nomad/js/topnav/manufacturers-1642-{1,2}.json) on
 * 2026-07-16 — not guessed, since a wrong slug silently yields zero products.
 *
 * 14 of those ~30 names have NO entry on AV-iQ at all: ROE, Unilumin, Leyard, Aoto,
 * INFiLED, Brompton, Colorlight, MA Lighting, Avolites, ETC, Robe, Disguise,
 * Green Hippo, Resolume. AV-iQ's directory skews corporate/commercial AV
 * integration rather than touring/concert gear — those brands need a different
 * seeding source (manufacturer spec sheet sites directly, most likely).
 */
export const PRIORITY_MANUFACTURER_SLUGS = new Set<string>([
  'absen', // LED panels
  'novastar', // LED processors
  'yamaha-commercial-audio-systems', // Audio consoles
  'digico', // Audio consoles
  'solid-state-logic', // Audio consoles
  'ssl-dv-a-solid-state-logic-company', // Audio consoles (broadcast switcher line)
  'avid-technology', // Audio consoles
  'allen-heath', // Audio consoles
  'midas-consoles', // Audio consoles
  'd-b-audiotechnik-corporation', // Amplifiers / line arrays
  'l-acoustics', // Amplifiers / line arrays
  'meyer-sound-laboratories', // Amplifiers / line arrays
  'crown-international', // Amplifiers
  'labgruppen', // Amplifiers
  'martin-audio-limited', // Line arrays
  'adamson-systems-engineering', // Line arrays
  'martin-professional', // Lighting
  'barco', // Projectors
  'christie', // Projectors
  'panasonic', // Projectors
]);
