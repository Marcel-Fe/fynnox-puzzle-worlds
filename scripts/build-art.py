"""Erzeugt die gesamte Spielgrafik aus den Konzeptbildern in docs/referenzen/.

Aufruf aus dem Projektordner:   python scripts/build-art.py
Benoetigt Pillow:               pip install pillow

Alles unter public/art/ und die App-Icons werden dabei neu geschrieben.
Soll ein Bildausschnitt anders sitzen, gehoert die neue Koordinate hierher —
nicht von Hand nachschneiden, sonst ist der Stand nicht reproduzierbar.

Warum JPEG: Die Motive sind Illustrationen ohne Transparenz. Als PNG waere
die App rund viermal so schwer zu laden.
"""

import os
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "docs", "referenzen")
PUB = os.path.join(ROOT, "public")
ART = os.path.join(PUB, "art")

for sub in ("chars", "bg", "games", "shop", "moments", "ui"):
    os.makedirs(os.path.join(ART, sub), exist_ok=True)


def ref(name):
    return Image.open(os.path.join(REF, name))


def save_icon_png(box, path, size=96, lo=72, hi=100):
    """Schneidet ein UI-Symbol aus der Waehrungsleiste frei.

    Einziger Fall im Projekt, in dem PNG statt JPEG entsteht und in dem
    freigestellt wird — beides sonst ausgeschlossen (docs/03-art-ui-guide.md,
    Regeln 2 und 4). Es geht hier aber weder um Transparenz aus Bequemlichkeit
    noch um eine Figur in einer Landschaft: Die Symbole liegen auf einer nahezu
    einfarbigen, sehr dunklen Pille, und ein Icon MUSS transparent sein, sonst
    klebt ein Kaestchen um jede Muenze.

    Die Maske ist die Helligkeit des hellsten Kanals — nicht die Luminanz.
    Violett faellt in der Luminanz durch (der Kristall kaeme auf 89 statt 192)
    und waere halb weggeschnitten.
    """
    c = dash.crop(box)
    side = max(c.size)
    square = Image.new("RGB", (side, side), (13, 21, 32))
    square.paste(c, ((side - c.width) // 2, (side - c.height) // 2))
    square = square.resize((size, size), Image.LANCZOS)

    r, g, b = square.split()
    brightest = ImageChops.lighter(ImageChops.lighter(r, g), b)
    alpha = brightest.point(lambda v: 0 if v <= lo else (255 if v >= hi else int((v - lo) * 255 / (hi - lo))))
    square.putalpha(alpha)
    square.save(path, optimize=True)


def save_mask_png(crop, path, size=96, lo=60, hi=110):
    """Erzeugt aus einem Piktogramm eine weisse Maske mit Alphakanal.

    Anders als save_icon_png bleibt hier keine Farbe uebrig — nur die Form.
    Eingefaerbt wird im Stylesheet ueber `mask-image` und `currentColor`, damit
    dasselbe Symbol aktiv golden und inaktiv grau erscheinen kann.
    """
    side = max(crop.size)
    square = Image.new("RGB", (side, side), (8, 16, 28))
    square.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    square = square.resize((size, size), Image.LANCZOS)

    r, g, b = square.split()
    brightest = ImageChops.lighter(ImageChops.lighter(r, g), b)
    alpha = brightest.point(lambda v: 0 if v <= lo else (255 if v >= hi else int((v - lo) * 255 / (hi - lo))))
    white = Image.new("RGB", (size, size), (255, 255, 255))
    white.putalpha(alpha)
    white.save(path, optimize=True)


def save_jpg(im, path, size, quality=84):
    im.resize(size, Image.LANCZOS).convert("RGB").save(path, quality=quality, optimize=True)


gameplay = ref("gameplay-regeln-und-missionen.png")
dash = ref("dashboard-hauptansicht.png")
icon_src = ref("app-icon.png").convert("RGB")
charsheet = ref("charaktere-spiele-minigolf.png")
ansichten = ref("spiele-ansichten-und-charaktere.png")
flow = ref("handy-flow-start-bis-minigolf.png")
lade = ref("handy-ladebildschirm-und-hauptbereiche.png")
handy = ref("handy-app-10-bildschirme.png")
dash_uebersicht = ref("dashboard-uebersicht-alle-bereiche.png")
# Nachlieferung des Auftraggebers vom 18.08.2026: ein Blatt mit genau den vier
# Motiven, fuer die in den urspruenglichen Konzeptbildern nichts vorhanden war —
# Wolkeninsel, ein enttaeuschter Fynnox, die neun Shop-Waren ohne Vorlage und
# eine Missionstafel. Es liegt eine zweite Fassung daneben
# (nachlieferung-variante-mit-nummern.png); die traegt Ziffern im Bild und wird
# darum nicht geschnitten.
neu = ref("nachlieferung-wolkeninsel-trauer-waren-missionen.png")

# --- Charakterportraets --------------------------------------------------
# Neun beschriftete Karten in der Leiste unten im Gameplay-Blatt.
NAMES = ["lumo", "mira", "borin", "pip", "elda", "juno", "kori", "finn", "bree"]
X0, X1, Y0, Y1 = 176, 1068, 912, 988
w = (X1 - X0) / len(NAMES)
for i, name in enumerate(NAMES):
    left = int(X0 + i * w)
    crop = gameplay.crop((left, Y0, int(left + w), Y1))
    side = min(crop.size)
    cx, cy = crop.size[0] // 2, crop.size[1] // 2
    crop = crop.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2))
    save_jpg(crop, os.path.join(ART, "chars", f"{name}.jpg"), (192, 192), 86)

# Fynnox aus dem App-Icon — mit Abstand die hoechste Aufloesung
save_jpg(icon_src.crop((330, 40, 950, 660)), os.path.join(ART, "chars", "fynnox.jpg"), (256, 256), 86)

# --- Fynnox in zwei Stimmungen ------------------------------------------
# Fuer die Rueckmeldung nach einer Runde. Beide Ausschnitte stammen aus dem
# Flow-Blatt und sind komplett textfrei.
#
# WICHTIG, damit spaeter niemand mehr sucht: In KEINEM der elf Konzeptbilder
# gibt es einen traurigen oder enttaeuschten Fynnox — er laechelt auf jedem
# einzelnen. "fynnox-still" ist darum dieselbe Figur in der Daemmerungsszene
# des Uebergangsbildschirms: geduempftes Licht, ruhige Haltung. Die Enttaeuschung
# traegt der Text, nicht das Gesicht. Ein echtes trauriges Gesicht braucht ein
# neues Konzeptbild, kein Nachbearbeiten dieses hier.
save_jpg(flow.crop((45, 85, 175, 215)), os.path.join(ART, "chars", "fynnox-jubel.jpg"), (256, 256), 86)

# Enttaeuschter Fynnox — aus der Nachlieferung vom 18.08.2026.
#
# Vorher stand hier eine Notloesung, und der Kommentar sagte auch warum: In
# keinem der urspruenglichen Konzeptbilder gibt es einen traurigen Fynnox, er
# laechelt auf jedem einzelnen. "fynnox-still" war deshalb dieselbe Figur in
# einer Daemmerungsszene, im Skript um 55 Prozent aufgehellt — die
# Enttaeuschung trug allein der Text. Jetzt ist sie im Gesicht zu sehen, und
# die Bildbearbeitung faellt weg.
save_jpg(neu.crop((1090, 28, 1350, 288)), os.path.join(ART, "chars", "fynnox-still.jpg"), (256, 256), 86)

# --- Begruessungsbanner --------------------------------------------------
# Fynnox samt Landschaft als ganzer Ausschnitt. Eine freigestellte Figur ist
# aus einem KI-Bild nicht sauber zu gewinnen — und auf den Mockups steht
# Fynnox ohnehin mitten in der Landschaft.
#
# Der Ausschnitt liegt eng um die Figur, weil ringsum Mockup-Text steht:
#   links (bis x=590) der Schriftzug "Willkommen zurueck, FYNNOX!",
#   rechts (ab x=955) die Karte "LEVEL 12 / 2.450 XP".
# Beides waere als Bildinhalt fatal — der Schriftzug doppelt die Ueberschrift,
# die Level-Karte widerspricht den echten Werten des Spielers.
save_jpg(dash.crop((604, 78, 936, 434)), os.path.join(ART, "hero.jpg"), (664, 712))
save_jpg(dash.crop((604, 78, 936, 434)), os.path.join(ART, "hero-portrait.jpg"), (498, 534))

# --- Weltkulissen --------------------------------------------------------
#
# Bis zum 18.08.2026 waren das die sechs MINIGOLF-BAHNEN aus dem Charakterblatt.
# Damit trug jede Welt eine Fahne, ein Loch und eine gestrichelte Bahnlinie —
# ein Spiel, das seit dem 17.08.2026 gar nicht mehr zum Umfang gehoert, war
# dadurch auf dem Startbildschirm, im Abenteuerpfad und hinter jedem Spielfeld
# weiter zu sehen. Dazu lief jeder Ausschnitt ueber den Kachelrand der Vorlage
# hinaus und hatte rechts einen schwarzen Balken.
#
# Vier Welten liegen als echte Illustration im Abenteuerpfad-Block von
# "dashboard-uebersicht-alle-bereiche.png" (SUNFOREST, KRISTALLHOEHEN, LAVAWELT,
# PIRATENINSEL). Der Ausschnitt endet oberhalb der Beschriftung, wo im Mockup
# der Weltname und der Levelbereich ("1-20") stehen.
WORLDS = {
    "sonnenwald": (921, 67, 1022, 148),
    "kristallhoehle": (1040, 67, 1140, 148),
    "lavatal": (1162, 67, 1259, 148),
    "piratenbucht": (1287, 67, 1377, 148),
}
for name, box in WORLDS.items():
    save_jpg(dash_uebersicht.crop(box), os.path.join(ART, "bg", f"{name}.jpg"), (640, 512))

# Wintergipfel: Fuer die Schneewelt gibt es keine eigene Weltkachel. Die
# Minigolf-Bahn hat aber einen Bereich ganz ohne Golf — die Eiskuppel mit
# Wolken und Himmel oberhalb der blauen Bahn, die erst bei y=855 anfaengt.
save_jpg(charsheet.crop((736, 792, 854, 850)), os.path.join(ART, "bg", "wintergipfel.jpg"), (640, 314))

# Wolkeninsel — aus der Nachlieferung. Bis zum 18.08.2026 gab es dafuer kein
# Bild: Auf der Minigolf-Bahn stand die Fahne mitten im Himmelsstreifen, und
# ein Ersatz aus der Kachel "NEUES LEVEL!" war eine Wald- statt einer
# Wolkenlandschaft. Jetzt steht dort, was das Kapitel verspricht — schwebende
# Inseln ueber einem Wolkenmeer, und Fynnox blickt hinaus ("Von hier sieht man
# alle Welten auf einmal").
save_jpg(neu.crop((12, 12, 986, 488)), os.path.join(ART, "bg", "wolkeninsel.jpg"), (640, 313))

# Missionen — zwei Ausschnitte derselben Tafel, weil sie sehr unterschiedlich
# gross gezeigt werden: der ganze Streifen als Kopfbereich des
# Missionsbildschirms, die Zielscheibe allein fuer die Kachel auf dem
# Startbildschirm. Dort ist die Flaeche rund 110x95 Pixel gross; von einem
# 5:1-Streifen bliebe darin nur leeres Pergament uebrig.
save_jpg(neu.crop((12, 736, 1524, 1016)), os.path.join(ART, "bg", "missionen.jpg"), (640, 119))
save_jpg(neu.crop((1120, 745, 1450, 1015)), os.path.join(ART, "bg", "missionen-ziel.jpg"), (400, 328))

# Tempelinneres aus der 3D-Ansicht von Tempelpaare, ab y 322 ohne Beschriftung
save_jpg(ansichten.crop((390, 322, 545, 420)), os.path.join(ART, "bg", "tempel.jpg"), (640, 404))

# Unterwasserwelt — einzige Kulisse, die NICHT aus den Puzzle-Worlds-Mockups
# stammt, sondern aus dem Bildmaterial von fynnox-adventure (uebernommen am
# 17.08.2026, siehe docs/03-art-ui-guide.md). Grund: Die elf Konzeptbilder
# zeigen keine Unterwasserwelt, und erfunden wird hier keine.
#
# Der Ausschnitt laesst zwei Dinge bewusst weg:
#   oben (bis y=170) die HUD-Leisten des fremden Spiels — links drei Herzen
#     und "x 127", rechts "x 09" und "x 03". Solche Zahlen wuerden den
#     echten Werten des Spielers widersprechen.
#   rechts (ab x=820) die eingesammelten Muenzen und die Schatztruhe. Beides
#     sind Spielobjekte, keine Kulisse — auf einem Kapitelkopf sahen sie aus
#     wie etwas, das man antippen kann.
# Bleibt: Steg, Boot, Palmen, Wasserlinie, tauchender Fynnox, Fische, Korallen.
unterwasser = ref("fynnox-adventure-unterwasser.png")
save_jpg(unterwasser.crop((0, 200, 820, 856)), os.path.join(ART, "bg", "unterwasser.jpg"), (640, 512))

# Stadt — zweite uebernommene Kulisse, diesmal aus fynnox-city (17.08.2026).
# Anders als beim Unterwasserbild wird hier NICHT zugeschnitten: Die Vorlage ist
# eine reine Konzeptansicht ohne fremde Anzeigen und mit 1672x941 bereits genau
# 16:9. Jeder Ausschnitt wuerde nur etwas wegnehmen — links laeuft Fynnox ueber
# die Promenade, rechts stehen Leuchtturm und Skyline.
#
# 640x360 statt der 640x512 der uebrigen Kulissen: Das Seitenverhaeltnis der
# Vorlage bleibt damit erhalten. Der Kapitelkopf zeigt das Bild ohnehin als
# `object-cover`, also entscheidet nicht die Datei ueber den Bildausschnitt.
stadt = ref("fynnox-city-hafenpromenade.png")
save_jpg(stadt, os.path.join(ART, "bg", "stadt.jpg"), (640, 360))

# --- Vorschaubilder der Spielkacheln -------------------------------------
#
# Aus "spiele-ansichten-und-charaktere.png", nicht aus dem Dashboard-Streifen:
# Dort zeigte jede Kachel dieselbe Fynnox-Illustration, wodurch alle Spiele in
# der Liste gleich aussahen. Hier steht fuer jedes Spiel eine echte Ansicht
# seines Spielfelds.
#
# Die Ausschnitte lassen die HUD-Zeilen der Vorlage bewusst weg ("PUNKTE 18.450",
# "ZEIT 03:20", "ZUEGE 18"). Solche Zahlen wuerden spaeter den echten Werten im
# Spiel widersprechen (CLAUDE.md, Abschnitt "Grafik").
TILES = {
    "blockfall": (22, 68, 128, 228),
    "waldbloecke": (722, 100, 858, 248),
    "tempelpaare": (22, 352, 152, 480),
    "kristallmix": (722, 352, 858, 480),
    "solitaire": (22, 578, 152, 690),
}
for name, box in TILES.items():
    save_jpg(ansichten.crop(box), os.path.join(ART, "games", f"{name}.jpg"), (328, 380))

# Sudoku und Bubble Shooter haben keine ausgearbeitete Spielansicht wie die
# fuenf oben — wohl aber ein eigenes Symbol: In der Spieleauswahl des
# Ladebildschirm-Blattes steht fuer Sudoku ein 3x3-Gitter und fuer Bubble
# Shooter eine Traube farbiger Blasen. Vorher stand hier ein Charakterausschnitt
# aus dem Minigolf-Blatt, wodurch beide Spiele in der Liste ein Fuchsgesicht
# zeigten statt ihres Spielfelds.
#
# Der Ausschnitt liegt innerhalb der Mockup-Kachel, damit deren abgerundeter
# Rahmen nicht mitkommt, und endet oberhalb der Beschriftung "SUDOKU" bzw.
# "BUBBLE SHOOTER" (y = 877).
#
# Beide behalten ihr Seitenverhaeltnis, statt wie die fuenf oben auf 328x380
# gezogen zu werden: Ein gezerrtes 3x3-Gitter faellt sofort auf. Die Kachel
# zeigt das Bild ohnehin als `object-cover`.
save_jpg(lade.crop((353, 801, 421, 873)), os.path.join(ART, "games", "sudoku.jpg"), (328, 347))
save_jpg(
    lade.crop((436, 801, 506, 873)),
    os.path.join(ART, "games", "bubbleshooter.jpg"),
    (328, 337),
)

# --- Waehrungssymbole ----------------------------------------------------
#
# Muenze, Kristall und Energie standen bis zum 18.08.2026 als System-Emoji in
# der Leiste, die auf JEDEM Bildschirm oben klebt. Zwischen gemalten Kulissen
# und Warenbildern fielen die bunten Systemzeichen sofort auf — und sie sehen
# auf jedem Geraet anders aus.
#
# Die Vorlage ist die Kopfleiste von "dashboard-hauptansicht.png". Sterne
# bleiben bewusst typografisch (das Zeichen "★"): Der groesste gemalte Stern in
# allen Referenzbildern misst 21x19 Pixel und waere im Ergebnisbildschirm bei
# 36 px weich — ein Schriftzeichen ist dort schaerfer und laesst sich einfaerben.
save_icon_png((901, 32, 927, 69), os.path.join(ART, "ui", "energie.png"))
save_icon_png((1015, 33, 1053, 68), os.path.join(ART, "ui", "muenze.png"))
save_icon_png((1168, 32, 1214, 69), os.path.join(ART, "ui", "kristall.png"))

# --- Navigationssymbole --------------------------------------------------
#
# Zehn Piktogramme aus der Seitenleiste von "dashboard-uebersicht-alle-bereiche.png".
# Sie werden NICHT als Bild gezeigt, sondern als CSS-Maske: Die Datei liefert
# nur die Silhouette, die Farbe kommt aus dem Stylesheet (`currentColor`).
#
# Das loest zwei Probleme auf einmal. Erstens die Groesse: Das groesste
# Navigationssymbol im gesamten Material misst 21x20 Pixel und waere als Bild
# bei 24 px matschig — als Maske zaehlt nur die Silhouette, und die traegt.
# Zweitens den Zustand: Die Leiste braucht jedes Symbol in Gold (aktiv) und in
# Grau (inaktiv). Als Bild waeren das zwanzig Dateien, als Maske zehn.
#
# "Mehr" und "Profil" bleiben Schriftzeichen. Im Mockup ist "Mehr" eine
# Personensilhouette von 14 px — zu klein, und "☰" ist ohnehin das erwartete
# Zeichen. Fuer das Profil gibt es gar kein Piktogramm; dort steht der Fuchs.
# "start" kommt aus einer anderen Vorlage: In der Seitenleiste ist Dashboard der
# AKTIVE Punkt und sitzt auf einer goldenen Pille, die heller ist als die
# Maskenschwelle — das Haus haette dadurch einen Kasten mitgebracht. Auf der
# Tab-Leiste von Bildschirm 2 in "handy-app-10-bildschirme.png" ist Start
# inaktiv und steht grau auf dunklem Grund.
save_mask_png(handy.crop((245, 661, 267, 683)), os.path.join(ART, "ui", "nav-start.png"), lo=45, hi=95)

NAV_MASKS = {
    "spiele": 135,
    "abenteuer": 165,
    "missionen": 196,
    "events": 226,
    "shop": 256,
    "freunde": 286,
    "rangliste": 316,
    "erfolge": 346,
    "einstellungen": 376,
}
for name, y0 in NAV_MASKS.items():
    save_mask_png(dash_uebersicht.crop((26, y0, 47, y0 + 21)), os.path.join(ART, "ui", f"nav-{name}.png"))

# --- Einblendungen -------------------------------------------------------
#
# docs/01-gamedesign.md legt sechs Einblendungen fest, die in jedem Spiel gleich
# aussehen sollen. Vier davon liegen als fertige Kachel im Block "SPIEL MOMENTE"
# unten rechts auf dem Ansichten-Blatt.
#
# Diese Ausschnitte tragen ihre Beschriftung IM Bild — anders als ueberall sonst
# ist das hier erwuenscht, weil das Wort feststeht: "SIEG!" ist immer "SIEG!"
# und kann keinem echten Wert widersprechen. Die Oberflaeche darf denselben Text
# dann aber kein zweites Mal danebenschreiben.
#
# Seit dem 18.08.2026 sind alle sechs geschnitten. PAUSE und NEUES LEVEL!
# fehlten anfangs, weil es im Code keinen Ort dafuer gab — die Pause war nur
# ein Knopf ohne Schicht darueber, und ein neues Spiellevel stand allein in der
# Beschriftung des "Nochmal"-Knopfes. Beides ist jetzt gebaut.
MOMENTS = {
    "sieg": (1141, 850, 1256, 935),
    "fehler": (1141, 938, 1256, 1022),
    "levelup": (1261, 850, 1382, 935),
    "belohnung": (1386, 850, 1509, 935),
    "pause": (1261, 938, 1382, 1022),
    "neues-level": (1386, 938, 1509, 1020),
}
for name, box in MOMENTS.items():
    save_jpg(ansichten.crop(box), os.path.join(ART, "moments", f"{name}.jpg"), (460, 340), 86)

# Dieselbe Truhe ohne das Schild "BELOHNUNG!": Im Abenteuerpfad und bei der
# Tagesbelohnung steht sie auch dann da, wenn gerade nichts abzuholen ist.
save_jpg(
    ansichten.crop((1387, 872, 1508, 934)),
    os.path.join(ART, "moments", "truhe.jpg"),
    (320, 164),
    86,
)

# --- Shop ----------------------------------------------------------------
#
# Alle Warenbilder stammen aus dem Shop-Bildschirm von
# "handy-ladebildschirm-und-hauptbereiche.png" bzw. aus dem Shop von
# "handy-app-10-bildschirme.png". Beide Mockups zeigen genau die Waren, die
# auch in src/content/shop.ts stehen — der Katalog wurde daraus abgeleitet.
#
# Jeder Ausschnitt endet OBERHALB der Beschriftung der Mockup-Karte: Dort steht
# der Warenname und darunter ein Preisschild ("4,99 EUR", "1.200"). Beides gehoert
# in die Oberflaeche, nicht ins Bild — sonst stuende der Preis zweimal da und
# liesse sich nie wieder aendern.
SHOP_LADE = {
    # Empfohlen fuer dich, Shop-Bildschirm rechts aussen
    "kristallpaket": (1215, 758, 1296, 852),
    "muenzpaket": (1307, 758, 1391, 852),
    "boosterpack": (1401, 758, 1486, 852),
}
for name, box in SHOP_LADE.items():
    save_jpg(lade.crop(box), os.path.join(ART, "shop", f"{name}.jpg"), (200, 225), 86)

SHOP_HANDY = {
    # Bildschirm 6 "SHOP", Reihe "Empfohlen fuer dich"
    "pirat": (13, 1093, 65, 1174),
    "kristallhaustier": (71, 1093, 125, 1174),
    "megabooster": (131, 1093, 184, 1174),
}
for name, box in SHOP_HANDY.items():
    save_jpg(handy.crop(box), os.path.join(ART, "shop", f"{name}.jpg"), (200, 300), 86)

# Warenbilder liegen bei 200 px Breite statt 256: Sie werden auf einer 64-px-
# Kachel gezeigt, also selbst bei dreifacher Pixeldichte nur mit 192 px. Die
# groessere Fassung kostete 80 KB im Vorab-Cache, ohne sichtbar zu werden.
#
# Die neun Waren, fuer die es auf keinem Mockup eine Abbildung gab. Sie kamen
# am 18.08.2026 nachgeliefert und stehen dort in genau der Reihenfolge von
# SHOP_ITEMS. Raster: erste Kachel bei x=10, Abstand 168, Breite 150.
SHOP_NEU = [
    "winter",
    "forscher",
    "schal",
    "laterne",
    "kompass",
    "eule",
    "sanduhr",
    "hinweis",
    "glueck",
]
for i, name in enumerate(SHOP_NEU):
    x0 = 10 + i * 168
    # Die letzte Kachel braucht vier Pixel mehr Abstand, sonst kommt links
    # der weisse Rand der Blattkante mit.
    if name == "glueck":
        x0 += 4
    save_jpg(neu.crop((x0, 505, x0 + 150, 720)), os.path.join(ART, "shop", f"{name}.jpg"), (200, 283), 86)

# Kopfbild des Shop-Bildschirms: Fynnox vor Kristallen und einer offenen Truhe.
# Der Ausschnitt beginnt erst bei y=616, weil darueber der Schriftzug
# "Sonderangebot!" und die Marke "16h 45m" stehen — eine Restzeit, die es im
# Spiel nicht gibt.
save_jpg(lade.crop((1214, 616, 1488, 716)), os.path.join(ART, "shop", "hero.jpg"), (548, 200))

# --- App-Icons -----------------------------------------------------------
def save_icon(size, path, pad=1.0):
    canvas = Image.new("RGB", (size, size), (2, 12, 23))
    inner = int(size * pad)
    off = (size - inner) // 2
    canvas.paste(icon_src.resize((inner, inner), Image.LANCZOS), (off, off))
    # 256 Farben reichen fuer ein Icon und sparen den Grossteil der Bytes.
    canvas.convert("P", palette=Image.ADAPTIVE, colors=256).save(path, optimize=True)


save_icon(192, os.path.join(PUB, "pwa-192x192.png"))
save_icon(512, os.path.join(PUB, "pwa-512x512.png"))
# Android beschneidet die Ecken -> Motiv auf 78 Prozent verkleinern
save_icon(512, os.path.join(PUB, "maskable-512x512.png"), pad=0.78)
save_icon(180, os.path.join(PUB, "apple-touch-icon.png"))
save_icon(32, os.path.join(PUB, "favicon.png"))

total = sum(
    os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(PUB) for f in fs
)
print(f"public/ neu erzeugt: {total / 1024:.0f} KB")
