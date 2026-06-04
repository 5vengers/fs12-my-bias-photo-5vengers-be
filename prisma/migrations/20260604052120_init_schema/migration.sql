-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "CardGrade" AS ENUM ('COMMON', 'RARE', 'SUPER_RARE', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('ALBUM', 'BENEFIT', 'FANSIGN', 'SEASON_GREETING', 'FAN_MEETING', 'CONCERT', 'MD', 'COLLAB', 'FAN_CLUB', 'ETC');

-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('SELLING', 'SOLD_OUT');

-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('WAITING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PointLogType" AS ENUM ('EARN', 'SPEND', 'BOX');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRADE_REQUEST', 'TRADE_ACCEPTED', 'TRADE_REJECTED', 'CARD_PURCHASED', 'CARD_SOLD', 'CARD_SOLD_OUT');

-- CreateEnum
CREATE TYPE "RouteType" AS ENUM ('MARKET_ITEM', 'EXCHANGE_PROPOSAL', 'MY_GALLERY', 'MY_SELL_CARDS');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nickname" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "provider_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_points" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "point" INTEGER NOT NULL DEFAULT 0,
    "last_spin_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_cards" (
    "id" SERIAL NOT NULL,
    "creator_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "genre" "Genre" NOT NULL,
    "grade" "CardGrade" NOT NULL,
    "price" INTEGER NOT NULL,
    "total_quantity" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_cards" (
    "id" SERIAL NOT NULL,
    "owner_id" UUID NOT NULL,
    "photo_card_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "my_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_items" (
    "id" SERIAL NOT NULL,
    "seller_id" UUID NOT NULL,
    "my_card_id" INTEGER NOT NULL,
    "grade" "CardGrade" NOT NULL,
    "genre" "Genre" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sold_quantity" INTEGER NOT NULL DEFAULT 0,
    "price_per_card" INTEGER NOT NULL,
    "wanted_grade" "CardGrade",
    "wanted_genre" "Genre",
    "wanted_description" TEXT,
    "status" "MarketStatus" NOT NULL DEFAULT 'SELLING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_proposals" (
    "id" SERIAL NOT NULL,
    "market_item_id" INTEGER NOT NULL,
    "proposer_id" UUID NOT NULL,
    "offered_card_id" INTEGER NOT NULL,
    "status" "ExchangeStatus" NOT NULL DEFAULT 'WAITING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "buyer_id" UUID NOT NULL,
    "market_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_logs" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "PointLogType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "route_type" "RouteType" NOT NULL,
    "target_id" INTEGER,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_creation_logs" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "card_creation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "history" (
    "id" BIGSERIAL NOT NULL,
    "record_id" BIGINT NOT NULL,
    "table_name" VARCHAR(50) NOT NULL,
    "operation_type" "OperationType" NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "changed_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_provider_id_key" ON "users"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_points_user_id_key" ON "user_points"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_creation_logs_user_id_year_month_key" ON "card_creation_logs"("user_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "history_table_name_idx" ON "history"("table_name");

-- CreateIndex
CREATE INDEX "history_record_id_idx" ON "history"("record_id");

-- CreateIndex
CREATE INDEX "history_changed_by_idx" ON "history"("changed_by");

-- CreateIndex
CREATE INDEX "history_created_at_idx" ON "history"("created_at");

-- CreateIndex
CREATE INDEX "history_table_name_record_id_idx" ON "history"("table_name", "record_id");

-- AddForeignKey
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_cards" ADD CONSTRAINT "photo_cards_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_cards" ADD CONSTRAINT "my_cards_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_cards" ADD CONSTRAINT "my_cards_photo_card_id_fkey" FOREIGN KEY ("photo_card_id") REFERENCES "photo_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_items" ADD CONSTRAINT "market_items_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_items" ADD CONSTRAINT "market_items_my_card_id_fkey" FOREIGN KEY ("my_card_id") REFERENCES "my_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_proposals" ADD CONSTRAINT "exchange_proposals_market_item_id_fkey" FOREIGN KEY ("market_item_id") REFERENCES "market_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_proposals" ADD CONSTRAINT "exchange_proposals_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_proposals" ADD CONSTRAINT "exchange_proposals_offered_card_id_fkey" FOREIGN KEY ("offered_card_id") REFERENCES "my_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_market_item_id_fkey" FOREIGN KEY ("market_item_id") REFERENCES "market_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_logs" ADD CONSTRAINT "point_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_creation_logs" ADD CONSTRAINT "card_creation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
