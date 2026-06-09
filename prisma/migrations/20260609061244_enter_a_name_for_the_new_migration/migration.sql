/*
  Warnings:

  - The values [DELETE] on the enum `OperationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "MarketStatus" ADD VALUE 'DELETED';

-- AlterEnum
BEGIN;
CREATE TYPE "OperationType_new" AS ENUM ('INSERT', 'UPDATE', 'DELETED');
ALTER TABLE "history" ALTER COLUMN "operation_type" TYPE "OperationType_new" USING ("operation_type"::text::"OperationType_new");
ALTER TYPE "OperationType" RENAME TO "OperationType_old";
ALTER TYPE "OperationType_new" RENAME TO "OperationType";
DROP TYPE "public"."OperationType_old";
COMMIT;
