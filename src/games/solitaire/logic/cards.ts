/**
 * Kartenblatt für Fynnox Solitaire (docs/01-gamedesign.md, Abschnitt 5).
 *
 * Frei von React, ohne Uhr, mit Seed — dieselbe Startzahl ergibt dasselbe Blatt
 * (siehe CLAUDE.md).
 */

export const SUITS = ['hearts', 'diamonds', 'spades', 'clubs'] as const
export type Suit = (typeof SUITS)[number]

/** Ass = 1, Bube = 11, Dame = 12, König = 13 */
export const ACE = 1
export const KING = 13

export interface Card {
  /** 0 bis 51, stabil über die ganze Partie — Reihenfolge: Farbe × Wert */
  id: number
  suit: Suit
  rank: number
  faceUp: boolean
}

/** Herz und Karo sind rot, Pik und Kreuz schwarz. */
export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

/** Zwei Karten dürfen in einer Spalte übereinander, wenn die Farbe wechselt. */
export function alternates(a: Card, b: Card): boolean {
  return isRed(a.suit) !== isRed(b.suit)
}

export const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  spades: '♠',
  clubs: '♣',
}

/** Deutsche Kartennamen für Vorlesehilfen. */
export const SUIT_NAME: Record<Suit, string> = {
  hearts: 'Herz',
  diamonds: 'Karo',
  spades: 'Pik',
  clubs: 'Kreuz',
}

/** Aufdruck: A, 2 bis 10, B(ube), D(ame), K(önig) — deutsche Schreibweise. */
export function rankLabel(rank: number): string {
  if (rank === ACE) return 'A'
  if (rank === 11) return 'B'
  if (rank === 12) return 'D'
  if (rank === KING) return 'K'
  return String(rank)
}

export function rankName(rank: number): string {
  if (rank === ACE) return 'Ass'
  if (rank === 11) return 'Bube'
  if (rank === 12) return 'Dame'
  if (rank === KING) return 'König'
  return String(rank)
}

/** Deterministischer Zufall (Mulberry32) — wie in den anderen Spielen. */
export function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: t }
}

/** Ein vollständiges Blatt, verdeckt und in Reihenfolge. */
export function createDeck(): Card[] {
  const deck: Card[] = []
  for (let s = 0; s < SUITS.length; s++) {
    for (let rank = ACE; rank <= KING; rank++) {
      deck.push({ id: s * KING + (rank - ACE), suit: SUITS[s], rank, faceUp: false })
    }
  }
  return deck
}

/** Fisher-Yates rückwärts, damit jede Anordnung gleich wahrscheinlich ist. */
export function shuffleDeck(deck: readonly Card[], seed: number): { cards: Card[]; seed: number } {
  const cards = deck.map((c) => ({ ...c }))
  let s = seed
  for (let i = cards.length - 1; i > 0; i--) {
    const r = nextRandom(s)
    s = r.seed
    const j = Math.floor(r.value * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return { cards, seed: s }
}
