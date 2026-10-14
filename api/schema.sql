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
  created INTEGER NOT NULL,
  ip      TEXT
);
CREATE INDEX IF NOT EXISTS scores_pts ON scores (pts DESC);
CREATE INDEX IF NOT EXISTS scores_ip_time ON scores (ip, created);
