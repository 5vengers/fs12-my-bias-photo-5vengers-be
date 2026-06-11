/*
  Warnings:

  - A unique constraint covering the columns `[owner_id,photo_card_id]` on the table `my_cards` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "my_cards_owner_id_photo_card_id_key" ON "my_cards"("owner_id", "photo_card_id");
