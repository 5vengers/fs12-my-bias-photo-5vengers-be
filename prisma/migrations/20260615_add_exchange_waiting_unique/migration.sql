CREATE UNIQUE INDEX "exchange_proposals_waiting_unique"
ON "exchange_proposals" ("market_item_id", "proposer_id")
WHERE "status" = 'WAITING';