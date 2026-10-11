# Balance-Simulator

Spielt Micro Defense ohne Grafik mit Computer-Spielern durch und zeigt, wie oft welche Helfer-Kombination gewinnt und welche Waffe wie viel Schaden macht.

Einmalig einrichten (im Ordner `tools`):

    npm install playwright
    npx playwright install chromium

Starten (4 Runden je Kombination):

    node balance-sim.mjs "" 4 > ergebnis.json
    python auswertung.py ergebnis.json v

Werte zum Ausprobieren ändern, ohne das Spiel anzufassen (3. Wert):

    node balance-sim.mjs "" 4 "CFG.horden=1.4; BOGEN[0].dmg=3;" > ergebnis.json
