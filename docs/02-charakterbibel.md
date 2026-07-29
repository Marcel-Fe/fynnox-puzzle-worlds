# Charakterbibel

Aussehen und Rollen stammen aus [den Konzeptbildern](referenzen/) und dem
[Masterprompt](00-masterprompt.md). **Nichts hier wird aus dem Gedächtnis ergänzt** —
wenn eine Figur unklar ist, steht das als **OFFEN** dabei.

---

## Fynnox — Hauptfigur

Ein kleiner Fuchs, das Maskottchen des ganzen Spiels.

**Aussehen** (verbindlich aus dem Masterprompt):

| Merkmal | Wert |
|---|---|
| Fell | orange |
| Schnauze und Schwanzspitze | weiß |
| Augen | groß, blau |
| Kopf | Fliegerbrille |
| Hals | blauer Schal |
| Kleidung | grün |
| Handschuhe und Schuhe | braun |

**Wesen**: freundlich, mutig, hilfsbereit, neugierig.

**Wo er auftaucht** — laut Masterprompt in Menü, Dashboard, Ladebildschirm, Tutorial,
Missionen, Level, Shop, Events, Belohnungen und Story. Praktische Regel für die Umsetzung:
**Auf jedem Hauptbildschirm ist Fynnox sichtbar**, meist links neben einer Sprechblase.
In den Spielen steht er am Rand und erklärt die Regel.

**Sprechstil**: begeistert, direkt, immer in der Wir-Form, wenn es ums Spielen geht.
Belegte Zeilen aus den Mockups:

> „Willkommen zurück! Schön, dass du wieder da bist!"
> „Es gibt so viele Abenteuer zu erleben! Welches Spiel wählen wir heute?"
> „Gemeinsam sind wir stark!"

---

## Die Begleiter

Alle Figuren sind Waldtiere im selben Stil: aufrecht gehend, in Stoffkleidung mit
Lederdetails, große freundliche Augen. Jede hat **eine** klare Aufgabe im Spiel —
das ist wichtiger als ihr Aussehen, weil daran später Bildschirme hängen.

| Name | Tier | Rolle | Sprechstil | Belegte Zeile |
|---|---|---|---|---|
| **Lumo** | Eule, grau-weiß, blaue Robe, Stab mit leuchtendem Kristall | **Mentor** — erklärt Regeln, führt durchs Tutorial | ruhig, weise, spricht den Spieler als „junger Freund" an | „Weise Entscheidungen führen dich zum Sieg, junger Freund." |
| **Mira** | Häsin, hellbraun, Blumen im Haar, grünes Kleid | **Heilerin** — gibt Missionen aus | warmherzig, ermutigend | „Ich habe neue Missionen für dich, Fynnox!" |
| **Borin** | Dachs, schwarz-weiß, braune Lederschürze | **Schmied** — verbessert Booster und Ausrüstung | knapp, handwerklich, stolz auf seine Werkstatt | „In meiner Werkstatt kann ich deine Booster verbessern!" |
| **Pip** | Eichhörnchen, orange-braun, grüne Kleidung mit Hut | **Entdecker** — findet Geheimnisse und Schätze | aufgedreht, schnell, neugierig | „Ich habe einen Geheimweg entdeckt! Lass uns nachsehen!" |
| **Elda** | Schildkröte, runde Brille, brauner Umhang | **Dorfälteste** — Story und Hintergrundwissen | bedächtig, erzählend | *(OFFEN)* |
| **Juno** | Frosch, grün, Hut, Laute | **Musiker** — Stimmung, Musik, Events | fröhlich, leichtherzig | „Musik macht jede Herausforderung leichter!" |
| **Kori** | Hirsch, großes Geweih, Speer, grüne Kleidung | **Wächter** — beschützt den Wald, Herausforderungen | ernst, naturverbunden, motivierend | „Die Natur steht hinter dir, wenn du dein Bestes gibst!" |
| **Nara** | Igel, Blume im Haar, Gießkanne | **Gärtnerin** *(aus dem Bild abgeleitet, nicht beschriftet)* | *(OFFEN)* | *(OFFEN)* |
| **Finn** | kleiner Bär, braun | **Fischer** | *(OFFEN)* | *(OFFEN)* |
| **Bree** | Maus, helles Fell, rötlich-lila Haar | **Schneiderin** — Outfits im Shop | *(OFFEN)* | *(OFFEN)* |
| **Tao** | beige-braunes Nagetier in schlichtem Gewand *(Art nicht sicher bestimmbar)* | **OFFEN** | *(OFFEN)* | — |
| **Revi** | **OFFEN** | **OFFEN** | *(OFFEN)* | — |

**Zu Revi**: Im Masterprompt genannt, aber auf **keinem** der sechs Konzeptbilder
identifizierbar. Bevor Revi irgendwo auftaucht, muss geklärt werden, welches Tier und
welche Rolle gemeint ist. Nicht erfinden.

**Zu Tao**: Auf dem Charakterblatt abgebildet, aber ohne Rollenbeschriftung —
im Gegensatz zu den neun Figuren in der Charakterleiste, die alle eine Rolle tragen.

---

## Freunde-Liste und Rangliste

Solange es kein Backend gibt, treten die Begleiter als Platzhalter-Freunde auf.
Aus den Mockups belegt: Mira Level 15, Lumo Level 14, Borin Level 13, Pip Level 11;
Rangliste Mira 24.580 → Lumo 18.320 → Borin 16.870 → der Spieler selbst 12.580.
Diese Zahlen sind Beispielwerte aus dem Mockup, keine Vorgabe.

---

## Regeln für Dialoge

1. Sprechblasen sind **kurz** — ein bis zwei Sätze, wie auf den Mockups.
2. Jede Figur bleibt bei ihrem Sprechstil; wer Regeln erklärt, ist Lumo, nicht Fynnox.
3. Alle Dialoge liegen zentral in `src/content/` und **nie** direkt im JSX —
   sonst sind sie später weder auffindbar noch änderbar.
4. Der Spieler wird geduzt.
5. Nichts hinzuerfinden: eine neue Figur oder eine neue Rolle kommt erst in dieses
   Dokument und dann in den Code.
