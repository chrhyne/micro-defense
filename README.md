# Micro Defense

Ein kleines Tower-Defense-Spiel von und für Kinder – erfunden von Adrian und Papa, programmiert mit Claude.

**Spielen:** https://micro-defense.christian-hein.de/

- Läuft im Browser, am besten auf dem iPad quer.
- Auf dem iPad in Safari: Teilen → „Zum Home-Bildschirm“ – dann startet es wie eine App im Vollbild.
- Die Zahlen zum Ausprobieren (Monster, Waffen, Wellen) stehen oben in `index.html` bei EINSTELLUNGEN, MONSTER, WELLEN und WAFFEN.
- `tools/` enthält einen Balance-Simulator (siehe `tools/LIESMICH.md`).
- **Karten (2D):** Grüne Wiese, Wüste, Eisland, Herbstwald, Blütental und Dschungel – jede neue Karte wird mit einem Sieg auf der Karte davor frei.
- **3D-Modus (Beta):** `3d.html` – eigenes Spiel mit Klötzchen-Welt (Three.js liegt in `vendor/`): 6 Karten mit großen Kacheln (die sechste, der Dschungel, ist ein großes J mit Sumpf und Krokodil Kroko Knut), alle Monster und Helfer aus 2D, Sterne, Freispielen, eigene 3D-Bestenliste (Punkte-Regel 301). Erreichbar über „🧊 3D-Modus“ im Hauptmenü. Zahlen zum Ausprobieren stehen oben im Skript bei EINSTELLUNGEN.
