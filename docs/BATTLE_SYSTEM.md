# Battle System — Neue Logik (v2)

## Übersicht

Das neue Battle-System ersetzt das alte Multi-Player-Box-Opening-Modell durch ein rundenbasiertes PvP-System mit echtem Kartentransfer.

## Kernänderungen gegenüber v1

| Feature | Alt (v1) | Neu (v2) |
|---------|----------|----------|
| Spieler | 2–8 | 2–4 |
| Runden | 1–10 (frei wählbar) | 3, 5 oder 7 (fest) |
| Modi | Normal, Upside-Down, Jackpot, Share | Niedrigste Karte, Höchste Karte, Alle Karten |
| Gewinn | Coins | Echte Karten (Pull-Ownership-Transfer) |
| Lobby-Timer | Keiner | 15 Minuten |
| Auto-Start | 5 Min nach Voll | 3 Min nach Voll |
| Einsatz | Vom Ersteller festgelegt | Automatisch: Box-Preis × Runden |

## Status-Flow

```
OPEN → FULL → READY → ACTIVE → FINISHED_WIN | FINISHED_DRAW
OPEN → CANCELLED (15-Min-Timeout)
FULL/READY → Auto-Start nach 3 Min
```

## Spielmodi

### Modus 1: Niedrigste Karte (`LOWEST_CARD`)
Der Gewinner erhält die Karte mit dem **niedrigsten Wert** aus dem Inventar jedes Verlierers.
- Bei Gleichstand: Die zuerst gezogene Karte wird übertragen (deterministisch).

### Modus 2: Höchste Karte (`HIGHEST_CARD`)
Der Gewinner erhält die Karte mit dem **höchsten Wert** aus dem Inventar jedes Verlierers.
- Bei Gleichstand: Die zuerst gezogene Karte wird übertragen (deterministisch).

### Modus 3: Alle Karten (`ALL_CARDS`)
Der Gewinner erhält **alle** im Battle gezogenen Karten jedes Verlierers.

## Gewinnlogik (`winCondition`)

Der Ersteller legt bei der Battle-Erstellung fest, wie der Gewinner bestimmt wird:

| Wert | Beschreibung |
|------|-------------|
| `HIGHEST` | Der Spieler mit dem **höchsten** Gesamtkartenwert gewinnt |
| `LOWEST` | Der Spieler mit dem **niedrigsten** Gesamtkartenwert gewinnt |

- **Immer** basierend auf dem **Gesamtwert aller Karten** nach allen Runden
- **Niemals** basierend auf einzelnen Rundensiegen
- Bei Gleichstand: `FINISHED_DRAW` — keine Karten werden übertragen

## Kartentransfer

Der Transfer ist **real**: `Pull`-Records wechseln den Besitzer (`userId`).
- `BattlePull.transferredToUserId` markiert übertragene Karten
- Übertragene Karten erscheinen in der Sammlung des Gewinners

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| GET | `/api/battles` | Alle Battles auflisten |
| POST | `/api/battles` | Neues Battle erstellen |
| GET | `/api/battles/[id]` | Battle-Details |
| DELETE | `/api/battles/[id]` | Battle löschen (Admin) |
| POST | `/api/battles/[id]/join` | Battle beitreten |
| POST | `/api/battles/[id]/ready` | Bereit markieren |
| DELETE | `/api/battles/[id]/ready` | Bereit aufheben |
| POST | `/api/battles/[id]/start` | Battle starten (Ersteller/Admin) |
| GET | `/api/battles/[id]/status` | Status-Polling |
| POST | `/api/battles/[id]/bots` | Bots hinzufügen (Admin) |
| POST | `/api/battles/[id]/auto-start` | Client-Auto-Start |
| POST | `/api/battles/auto-start` | Cron: Lobby-Ablauf + Auto-Start |

## Datenbank-Schema

### Enums

```prisma
enum BattleStatus {
  OPEN
  FULL
  READY
  ACTIVE
  FINISHED_WIN
  FINISHED_DRAW
  CANCELLED
}

enum BattleMode {
  LOWEST_CARD
  HIGHEST_CARD
  ALL_CARDS
}

enum WinCondition {
  HIGHEST
  LOWEST
}
```

### Neue Felder

- `Battle.winCondition` — `HIGHEST` oder `LOWEST` (Gewinnlogik)
- `Battle.lobbyExpiresAt` — 15 Min nach Erstellung
- `Battle.autoStartAt` — 3 Min nach Voll
- `BattlePull.transferredToUserId` — Empfänger bei Kartentransfer

### Entfernte Felder

- `Battle.shareMode`
- `Battle.isDraw`
- `Battle.totalPrize`
- `Battle.fullAt`

## Frontend (Deutsch)

Alle UI-Texte sind auf Deutsch:
- Battle-Erstellung: 6-Schritt-Wizard (Box → Spieler → Runden → Belohnungsmodus → Gewinnlogik → Zusammenfassung)
- Lobby: Countdown-Timer, Bereit-Markierung, Auto-Start-Anzeige
- Spiel: Runde-für-Runde Kartenaufdeckung mit Animation
- Ergebnis: Gewinner/Unentschieden-Banner, übertragene Karten hervorgehoben

## Cron-Job

Der Scheduler (`battle-auto-start-scheduler.ts`) läuft jede Minute und:
1. Storniert OPEN-Battles nach 15 Min (mit Rückerstattung)
2. Startet FULL/READY-Battles nach 3 Min automatisch
