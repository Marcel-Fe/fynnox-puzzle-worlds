/**
 * Zugriff auf die Spielgrafik unter public/art/.
 *
 * Die Bilder sind aus den Konzeptbildern in docs/referenzen/ geschnitten;
 * die Skripte dazu liegen in scripts/. Wird ein Ausschnitt geändert, gehört
 * die neue Koordinate dorthin — nicht von Hand nachschneiden.
 *
 * Alles ist JPEG: Die Motive sind Illustrationen ohne Transparenz, und als PNG
 * wäre die App viermal so schwer zu laden.
 *
 * BASE_URL ist nötig, weil die App auf GitHub Pages unter
 * /fynnox-puzzle-worlds/ liegt, lokal aber unter /.
 */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}art/${path}`
}

/** Porträts der Begleitfiguren, Schlüssel = Name aus docs/02-charakterbibel.md */
export const PORTRAITS: Record<string, string> = {
  Fynnox: asset('chars/fynnox.jpg'),
  Lumo: asset('chars/lumo.jpg'),
  Mira: asset('chars/mira.jpg'),
  Borin: asset('chars/borin.jpg'),
  Pip: asset('chars/pip.jpg'),
  Elda: asset('chars/elda.jpg'),
  Juno: asset('chars/juno.jpg'),
  Kori: asset('chars/kori.jpg'),
  Finn: asset('chars/finn.jpg'),
  Bree: asset('chars/bree.jpg'),
}

/**
 * Begrüßungsbanner: Fynnox samt Landschaft als ganzer Bildausschnitt.
 * Eine freigestellte Figur ist aus einem KI-Bild nicht sauber zu gewinnen —
 * und auf den Mockups steht Fynnox ohnehin in der Landschaft.
 */
export const HERO_WIDE = asset('hero.jpg')
export const HERO_PORTRAIT = asset('hero-portrait.jpg')

/**
 * Einblendungen aus docs/01-gamedesign.md, Abschnitt „Rundenablauf und
 * Rückmeldungen". Anders als jedes andere Bild im Projekt tragen die ersten
 * drei ihre Beschriftung IM Bild — das ist hier zulässig, weil das Wort
 * feststeht und keinem echten Wert widersprechen kann. Wo eines dieser Bilder
 * steht, darf die Oberfläche denselben Text nicht ein zweites Mal schreiben.
 *
 * `truhe` ist dieselbe Truhe ohne Schild, für die Stellen, an denen gerade
 * nichts abzuholen ist.
 */
export const MOMENTS = {
  sieg: asset('moments/sieg.jpg'),
  fehler: asset('moments/fehler.jpg'),
  levelup: asset('moments/levelup.jpg'),
  belohnung: asset('moments/belohnung.jpg'),
  truhe: asset('moments/truhe.jpg'),
} as const
