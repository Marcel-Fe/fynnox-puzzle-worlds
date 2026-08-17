/** Texte des Profilbildschirms, insbesondere der 3D-Ansicht von Fynnox. */
export const FYNNOX_3D_TEXT = {
  open: 'In 3D ansehen',
  close: 'Schließen',
  loading: 'Fynnox wird geladen …',
  size: 'Das Modell ist 2,4 MB groß.',
  noWebGL: 'Dein Gerät unterstützt keine 3D-Darstellung.',
  /**
   * Das Modell liegt bewusst nicht im Vorab-Cache (vite.config.ts). Wer es zum
   * ersten Mal ohne Netz öffnet, bekommt diesen Satz statt eines leeren Kastens.
   */
  offline: 'Fynnox in 3D braucht beim ersten Mal eine Internetverbindung. Danach ist er auch ohne Netz da.',
  retry: 'Nochmal versuchen',
} as const
