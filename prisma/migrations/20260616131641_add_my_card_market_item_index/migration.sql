-- CreateIndex
CREATE INDEX "market_items_my_card_id_status_idx" ON "market_items"("my_card_id", "status");

-- CreateIndex
CREATE INDEX "my_cards_owner_id_idx" ON "my_cards"("owner_id");
