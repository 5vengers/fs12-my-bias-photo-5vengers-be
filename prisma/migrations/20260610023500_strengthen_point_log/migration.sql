/*
  Warnings:

  - Added the required column `balance_after` to the `point_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PointReferenceType" AS ENUM ('ORDER', 'POINT_BOX', 'SALE');

-- AlterTable
ALTER TABLE "point_logs" ADD COLUMN     "balance_after" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "reference_id" INTEGER,
ADD COLUMN     "reference_type" "PointReferenceType";

-- CreateIndex
CREATE INDEX "point_logs_user_id_created_at_idx" ON "point_logs"("user_id", "created_at");
