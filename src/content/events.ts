import type { MissionTrack } from '../save/types'
import { asset } from './assets'

/**
 * Eventkatalog (docs/01-gamedesign.md, Abschnitt „Events").
 *
 * Vier Events in einem Wochenzyklus: Jedes ist alle vier Wochen einmal
 * Hauptevent und einmal Nebenevent. Welches wann läuft, rechnet
 * `src/core/events.ts` aus der Wochennummer aus — ohne Zufall.
 *
 * Der Sommer Cup übernimmt die Zahlen des Mockups unverändert
 * (Fortschritt 3.250 / 10.000, Belohnung 1.000 Münzen + 100 Kristalle).
 */
export interface EventInfo {
  id: string
  title: string
  /** Werbezeile, wie sie im Mockup über dem Fortschrittsbalken steht */
  text: string
  image: string
  /** Die Mission, über die der Fortschritt des Events läuft */
  mission: {
    text: string
    goal: number
    rewardCoins: number
    rewardCrystals: number
    track: MissionTrack
  }
}

export const EVENT_CATALOG: EventInfo[] = [
  {
    id: 'sommer-cup',
    title: 'Sommer Cup',
    text: 'Kämpfe um den Sieg und gewinne großartige Preise!',
    image: asset('bg/sonnenwald.jpg'),
    mission: {
      text: 'Sammle 10.000 Münzen',
      goal: 10000,
      rewardCoins: 1000,
      rewardCrystals: 100,
      track: { type: 'collectCoins' },
    },
  },
  {
    id: 'kristalljagd',
    title: 'Kristalljagd',
    text: 'Die Höhlen leuchten! Bring so viele Kristalle heim wie möglich.',
    image: asset('bg/kristallhoehle.jpg'),
    mission: {
      text: 'Sammle 300 Kristalle in Kristallmix',
      goal: 300,
      rewardCoins: 500,
      rewardCrystals: 50,
      track: { type: 'custom', key: 'crystalsCollected', game: 'kristallmix' },
    },
  },
  {
    id: 'piratenfest',
    title: 'Piratenfest',
    text: 'Auf der Pirateninsel wird gefeiert — wer trifft am besten?',
    image: asset('bg/piratenbucht.jpg'),
    mission: {
      text: 'Loche 15 Bahnen ein',
      goal: 15,
      rewardCoins: 600,
      rewardCrystals: 60,
      track: { type: 'winRounds', game: 'minigolf' },
    },
  },
  {
    id: 'monsterjagd',
    title: 'Monsterjagd',
    text: 'Aus dem Lavatal steigen Blöcke auf. Räum sie weg!',
    image: asset('bg/lavatal.jpg'),
    mission: {
      text: 'Räume 200 Reihen',
      goal: 200,
      rewardCoins: 700,
      rewardCrystals: 70,
      track: { type: 'custom', key: 'rowsCleared' },
    },
  },
]

/**
 * Läuft immer und hat keine eigene Mission: Der „Tägliche Bonus" ist die
 * tägliche Belohnung vom Startbildschirm, hier nur zusätzlich verlinkt.
 */
export const DAILY_BONUS_EVENT = {
  id: 'taeglicher-bonus',
  title: 'Täglicher Bonus',
  text: 'Jeden Tag ein Geschenk — hol es dir ab, bevor der Tag um ist.',
  image: asset('bg/wolkeninsel.jpg'),
}
