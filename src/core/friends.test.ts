import { describe, expect, it } from 'vitest'
import { COMPANIONS } from '../content/friends'
import { GAMES } from '../content/games'
import { createNewSave } from '../save/defaults'
import {
  companionEntry,
  friendList,
  leaderboard,
  playerEntry,
  playerRank,
  presenceOf,
  seedFromText,
  trophies,
} from './friends'

const NOW = new Date(2026, 7, 17, 12, 0, 0).getTime()

describe('trophies', () => {
  it('rechnet nach der Formel aus dem Gamedesign', () => {
    expect(trophies(1, 0, 0)).toBe(100)
    expect(trophies(15, 100, 200)).toBe(1500 + 2500 + 1000)
  })
})

describe('seedFromText', () => {
  it('liefert für denselben Text denselben Seed', () => {
    expect(seedFromText('Mira')).toBe(seedFromText('Mira'))
  })

  it('unterscheidet verschiedene Texte', () => {
    expect(seedFromText('Mira')).not.toBe(seedFromText('Lumo'))
  })
})

describe('companionEntry', () => {
  it('übernimmt die aus den Mockups belegten Level', () => {
    const byName = Object.fromEntries(COMPANIONS.map((c) => [c.name, companionEntry(c)]))
    expect(byName.Mira.level).toBe(15)
    expect(byName.Lumo.level).toBe(14)
    expect(byName.Borin.level).toBe(13)
    expect(byName.Pip.level).toBe(11)
  })

  it('ist gesät — zwei Aufrufe liefern dasselbe', () => {
    for (const c of COMPANIONS) {
      expect(companionEntry(c)).toEqual(companionEntry(c))
    }
  })

  it('hält jede Figur im Levelbereich 2 bis 16', () => {
    for (const c of COMPANIONS) {
      const e = companionEntry(c)
      expect(e.level).toBeGreaterThanOrEqual(2)
      expect(e.level).toBeLessThanOrEqual(16)
    }
  })

  it('gewinnt nie mehr Runden als gespielt wurden', () => {
    for (const c of COMPANIONS) {
      const e = companionEntry(c)
      expect(e.wins).toBeLessThanOrEqual(e.games)
      expect(e.wins).toBeGreaterThan(0)
    }
  })

  it('rechnet die Trophäen mit derselben Formel wie beim Spieler', () => {
    for (const c of COMPANIONS) {
      const e = companionEntry(c)
      expect(e.trophies).toBe(trophies(e.level, e.wins, e.games))
    }
  })

  it('lässt die schwächste Figur erreichbar bleiben', () => {
    const lowest = Math.min(...COMPANIONS.map((c) => companionEntry(c).trophies))
    // Ein Anfänger startet bei 100. Die unterste Figur darf nicht unerreichbar
    // weit weg sein — sonst ist die Rangliste eine Wand statt eines Ziels.
    expect(lowest).toBeLessThan(2000)
  })
})

describe('playerEntry', () => {
  it('nimmt ausschließlich echte Werte aus dem Spielstand', () => {
    const save = createNewSave(NOW)
    save.profile.level = 7
    save.stats.totalGames = 40
    save.stats.totalWins = 22

    const entry = playerEntry(save)
    expect(entry.isPlayer).toBe(true)
    expect(entry.level).toBe(7)
    expect(entry.games).toBe(40)
    expect(entry.wins).toBe(22)
    expect(entry.trophies).toBe(700 + 550 + 200)
  })

  it('fällt bei leerem Namen auf „Abenteurer" zurück', () => {
    const save = createNewSave(NOW)
    save.profile.name = ''
    expect(playerEntry(save).name).toBe('Abenteurer')
  })
})

describe('leaderboard', () => {
  it('enthält alle Figuren plus den Spieler', () => {
    const list = leaderboard(createNewSave(NOW))
    expect(list).toHaveLength(COMPANIONS.length + 1)
    expect(list.filter((e) => e.isPlayer)).toHaveLength(1)
  })

  it('sortiert absteigend nach Trophäen', () => {
    const list = leaderboard(createNewSave(NOW))
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].trophies).toBeGreaterThanOrEqual(list[i].trophies)
    }
  })

  it('setzt ein frisches Profil auf den letzten Platz', () => {
    expect(playerRank(createNewSave(NOW))).toBe(COMPANIONS.length + 1)
  })

  it('lässt den Spieler mit echtem Fortschritt aufsteigen', () => {
    const save = createNewSave(NOW)
    save.profile.level = 50
    save.stats.totalGames = 1000
    save.stats.totalWins = 800
    expect(playerRank(save)).toBe(1)
  })
})

describe('presenceOf', () => {
  it('bleibt innerhalb eines Tages gleich', () => {
    const morning = new Date(2026, 7, 17, 8, 0, 0).getTime()
    const evening = new Date(2026, 7, 17, 22, 30, 0).getTime()
    for (const c of COMPANIONS) {
      expect(presenceOf(c.name, morning)).toEqual(presenceOf(c.name, evening))
    }
  })

  it('nennt beim Online-Zustand ein echtes Spiel', () => {
    const ids = new Set(GAMES.map((g) => g.id))
    for (const c of COMPANIONS) {
      const p = presenceOf(c.name, NOW)
      if (p.online) expect(ids.has(p.playing!)).toBe(true)
      else expect(p.playing).toBeNull()
    }
  })

  it('nennt bei Abwesenheit eine Stundenzahl zwischen 1 und 22', () => {
    for (const c of COMPANIONS) {
      const p = presenceOf(c.name, NOW)
      if (!p.online) {
        expect(p.hoursAgo).toBeGreaterThanOrEqual(1)
        expect(p.hoursAgo).toBeLessThanOrEqual(22)
      }
    }
  })
})

describe('friendList', () => {
  it('führt alle zehn Begleiter, Online zuerst', () => {
    const list = friendList(NOW)
    expect(list).toHaveLength(COMPANIONS.length)
    const firstOffline = list.findIndex((f) => !f.presence.online)
    if (firstOffline >= 0) {
      expect(list.slice(firstOffline).every((f) => !f.presence.online)).toBe(true)
    }
  })
})
