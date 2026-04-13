-- CreateTable
CREATE TABLE "InfoText" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "contentDe" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "InfoText_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InfoText_key_key" ON "InfoText"("key");
CREATE INDEX "InfoText_key_idx" ON "InfoText"("key");

-- AddForeignKey
ALTER TABLE "InfoText" ADD CONSTRAINT "InfoText_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed initial info texts
INSERT INTO "InfoText" ("id", "key", "contentDe", "contentEn", "updatedAt") VALUES
  (gen_random_uuid()::text, 'battle.create.winCondition', '**Gewinnlogik** bestimmt, wie der Gewinner ermittelt wird.\n\n- **Höchster Wert**: Der Spieler mit dem höchsten Gesamtkartenwert gewinnt\n- **Niedrigster Wert**: Der Spieler mit dem niedrigsten Gesamtkartenwert gewinnt\n- **Teilen**: Karten werden gleichmäßig unter allen Spielern aufgeteilt', '**Win Condition** determines how the winner is decided.\n\n- **Highest Value**: The player with the highest total card value wins\n- **Lowest Value**: The player with the lowest total card value wins\n- **Share**: Cards are split equally among all players', NOW()),
  (gen_random_uuid()::text, 'battle.create.rewardMode', '**Belohnungsmodus** bestimmt, welche Karten der Gewinner erhält.\n\n- **Niedrigste Karte**: Gewinner erhält die niedrigste Karte jedes Verlierers\n- **Höchste Karte**: Gewinner erhält die höchste Karte jedes Verlierers', '**Reward Mode** determines which cards the winner receives.\n\n- **Lowest Card**: Winner receives the lowest card from each loser\n- **Highest Card**: Winner receives the highest card from each loser', NOW()),
  (gen_random_uuid()::text, 'battle.create.rounds', 'Jede Runde wird eine Box geöffnet. Jeder Spieler zieht eine Karte pro Runde. Mehr Runden = größerer Einsatz, aber auch mehr Chancen auf wertvolle Karten.', 'Each round opens a box. Every player draws one card per round. More rounds = higher entry fee, but also more chances for valuable cards.', NOW()),
  (gen_random_uuid()::text, 'battle.create.entryFee', 'Der Einsatz entspricht der Summe aller ausgewählten Box-Preise. Jeder Spieler zahlt denselben Betrag. Bei keinem Gegner innerhalb von 15 Minuten wird der Einsatz erstattet.', 'The entry fee equals the sum of all selected box prices. Every player pays the same amount. If no opponent joins within 15 minutes, the fee is refunded.', NOW()),
  (gen_random_uuid()::text, 'battle.create.players', 'Wähle die Anzahl der Spieler für dein Battle. 1v1 ist der Klassiker, aber du kannst auch mit bis zu 4 Spielern antreten.', 'Choose the number of players for your battle. 1v1 is the classic, but you can compete with up to 4 players.', NOW()),
  (gen_random_uuid()::text, 'battle.create.visibility', '**Öffentliche** Battles erscheinen in der Battle-Lobby und jeder kann beitreten.\n\n**Private** Battles sind nur über den direkten Link erreichbar.', '**Public** battles appear in the battle lobby and anyone can join.\n\n**Private** battles are only accessible via direct link.', NOW()),
  (gen_random_uuid()::text, 'pack.open.dropRates', 'Jede Karte hat eine individuelle Ziehungswahrscheinlichkeit. Seltenere Karten haben niedrigere Wahrscheinlichkeiten, sind aber deutlich mehr wert.', 'Each card has an individual pull rate. Rarer cards have lower probabilities but are worth significantly more.', NOW()),
  (gen_random_uuid()::text, 'pack.open.cost', 'Der Preis pro Pack wird in Coins berechnet. Du kannst mehrere Packs gleichzeitig öffnen, um Zeit zu sparen.', 'The price per pack is charged in Coins. You can open multiple packs at once to save time.', NOW()),
  (gen_random_uuid()::text, 'pack.open.autoOpen', 'Auto-Öffnen zieht automatisch Packs hintereinander, bis deine Coins aufgebraucht sind oder du ein Limit setzt. Ideal für schnelles Sammeln.', 'Auto Open pulls packs automatically one after another until your coins run out or you set a limit. Ideal for quick collecting.', NOW()),
  (gen_random_uuid()::text, 'dashboard.stats', 'Deine persönliche Statistik zeigt einen Überblick über all deine Aktivitäten auf PullForge.', 'Your personal stats show an overview of all your activities on PullForge.', NOW()),
  (gen_random_uuid()::text, 'dashboard.coinBalance', 'Dein Coin-Guthaben wird für das Öffnen von Packs, Battle-Einsätze und Versandkosten verwendet. Du verdienst Coins durch Kartenverkäufe und Level-Belohnungen.', 'Your coin balance is used for opening packs, battle entry fees, and shipping costs. You earn coins through card sales and level rewards.', NOW()),
  (gen_random_uuid()::text, 'dashboard.achievements', 'Erfolge werden automatisch freigeschaltet, wenn du bestimmte Meilensteine erreichst. Jeder Erfolg bringt eine Coin-Belohnung!', 'Achievements unlock automatically when you reach certain milestones. Each achievement comes with a coin reward!', NOW()),
  (gen_random_uuid()::text, 'leaderboard.rankings', 'Die Bestenliste zeigt die besten Spieler basierend auf Battle-Ergebnissen. Die Top 10 jedes Monats erhalten Coin-Preise!', 'The leaderboard ranks players based on battle results. The top 10 each month receive coin prizes!', NOW()),
  (gen_random_uuid()::text, 'collection.overview', 'Deine Sammlung enthält alle Karten, die du gezogen hast. Du kannst Karten für Coins verkaufen oder sie als echte physische Karten bestellen.', 'Your collection contains all cards you have pulled. You can sell cards for coins or order them as real physical cards.', NOW()),
  (gen_random_uuid()::text, 'collection.sellForCoins', 'Beim Verkauf einer Karte erhältst du den angezeigten Coin-Wert sofort gutgeschrieben. Verkaufte Karten können nicht zurückgeholt werden.', 'When selling a card, you receive the displayed coin value instantly. Sold cards cannot be recovered.', NOW()),
  (gen_random_uuid()::text, 'card.detail.coinValue', 'Der Coin-Wert einer Karte basiert auf der Seltenheit und dem Marktpreis. Seltenere Karten sind deutlich mehr wert.', 'The coin value of a card is based on its rarity and market price. Rarer cards are worth significantly more.', NOW()),
  (gen_random_uuid()::text, 'shop.overview', 'Im Shop findest du echte Trading Cards von verifizierten Händlern. Alle Produkte werden direkt an dich versendet.', 'In the shop you can find real trading cards from verified sellers. All products are shipped directly to you.', NOW()),
  (gen_random_uuid()::text, 'boxes.overview', 'Jede Box enthält eine Auswahl an Karten mit unterschiedlichen Seltenheiten. Die Karten werden nach den Ziehungswahrscheinlichkeiten verteilt.', 'Each box contains a selection of cards with different rarities. Cards are distributed according to their pull rates.', NOW());
