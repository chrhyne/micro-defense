-- Gemeinsame Bestenliste von Micro Defense (wird bei jedem Deploy ausgeführt, ändert vorhandene Daten nicht)
CREATE TABLE IF NOT EXISTS scores (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT    NOT NULL,
  pts     INTEGER NOT NULL,
  map     TEXT    NOT NULL,
  stufe   TEXT    NOT NULL,
  won     INTEGER NOT NULL DEFAULT 0,
  wave    INTEGER NOT NULL DEFAULT 0,
  waves   INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL,   -- wann gespielt (Zeit vom Gerät)
  recv    INTEGER NOT NULL DEFAULT 0,   -- wann beim Server angekommen
  ver     TEXT,                         -- Spiel-Version (Build-Nummer), mit der gespielt wurde
  regel   INTEGER NOT NULL DEFAULT 1,   -- Version der Punkte-Zählung; ändert sie sich, zeigt die Liste nur noch neue Einträge
  ip      TEXT
);
CREATE INDEX IF NOT EXISTS scores_pts ON scores (pts DESC);
CREATE INDEX IF NOT EXISTS scores_ip_recv ON scores (ip, recv);
-- derselbe Eintrag (gleicher Name, Punkte, Zeitpunkt) wird nur einmal gespeichert – so können Geräte alles gefahrlos nochmal schicken
CREATE UNIQUE INDEX IF NOT EXISTS scores_uniq ON scores (name, pts, created);
