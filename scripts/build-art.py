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
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "docs", "referenzen")
PUB = os.path.join(ROOT, "public")
ART = os.path.join(PUB, "art")

for sub in ("chars", "bg", "games"):
    os.makedirs(os.path.join(ART, sub), exist_ok=True)


def ref(name):
    return Image.open(os.path.join(REF, name))


def save_jpg(im, path, size, quality=84):
    im.resize(size, Image.LANCZOS).convert("RGB").save(path, quality=quality, optimize=True)


gameplay = ref("gameplay-regeln-und-missionen.png")
dash = ref("dashboard-hauptansicht.png")
icon_src = ref("app-icon.png").convert("RGB")
charsheet = ref("charaktere-spiele-minigolf.png")
ansichten = ref("spiele-ansichten-und-charaktere.png")
flow = ref("handy-flow-start-bis-minigolf.png")

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

# Die Daemmerungsszene ist im Original sehr dunkel: mittlere Helligkeit 35 bei
# einer Streuung von 16. Auf der dunklen Ergebniskarte waere davon bei 56 px
# nichts mehr zu erkennen. Belichtung und Kontrast werden darum angehoben --
# hier im Skript, damit der Stand reproduzierbar bleibt. Das Motiv selbst wird
# nicht veraendert; es bleibt sichtbar gedaempfter als "fynnox-jubel".
still = flow.crop((500, 95, 630, 225))
still = ImageEnhance.Brightness(still).enhance(1.55)
still = ImageEnhance.Contrast(still).enhance(1.35)
save_jpg(still, os.path.join(ART, "chars", "fynnox-still.jpg"), (256, 256), 86)

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
# Minigolf-Bahnen aus dem Charakterblatt. y 790..910 laesst das Titelschild
# oben und das PAR-Schild unten weg.
WORLDS = {
    "sonnenwald": (20, 170),
    "piratenbucht": (175, 325),
    "kristallhoehle": (330, 465),
    "lavatal": (490, 600),
    "wolkeninsel": (605, 725),
    "wintergipfel": (730, 870),
}
for name, (x0, x1) in WORLDS.items():
    save_jpg(charsheet.crop((x0, 790, x1, 910)), os.path.join(ART, "bg", f"{name}.jpg"), (640, 512))

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
TILES = {
    "blockfall": (247, 410),
    "waldbloecke": (413, 577),
    "tempelpaare": (580, 744),
    "kristallmix": (747, 911),
    "solitaire": (914, 1078),
}
# y ab 476: Auf der Blockfall-Karte klebt oben links ein "NEU"-Fahnchen,
# das sonst angeschnitten als sinnloses "EU" auf der Kachel landet.
for name, (x0, x1) in TILES.items():
    save_jpg(dash.crop((x0, 476, x1, 640)), os.path.join(ART, "games", f"{name}.jpg"), (328, 380))

# Sudoku und Bubble Shooter gibt es auf keinem Mockup als Kachel —
# bis dahin dienen zwei Kulissen als Platzhalter.
save_jpg(charsheet.crop((730, 790, 870, 910)), os.path.join(ART, "games", "sudoku.jpg"), (328, 380))
save_jpg(
    charsheet.crop((330, 790, 465, 910)),
    os.path.join(ART, "games", "bubbleshooter.jpg"),
    (328, 380),
)

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
