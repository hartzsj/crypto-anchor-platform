/*
  Warnings:

  - You are about to drop the column `address` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the column `frozenBalance` on the `Wallet` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OnchainOrderStatus" AS ENUM ('CREATED', 'FUNDED', 'RELEASED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isOnchain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "networkId" TEXT,
ADD COLUMN     "tokenId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "tokenId" TEXT,
ADD COLUMN     "txHash" TEXT;

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "address",
DROP COLUMN "balance",
DROP COLUMN "frozenBalance";

-- CreateTable
CREATE TABLE "BlockchainNetwork" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "chainId" TEXT,
    "rpcUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockchainNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractAddress" TEXT,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "isNative" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowContract" (
    "id" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "abi" TEXT NOT NULL,
    "deployTxHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotify" BOOLEAN NOT NULL DEFAULT true,
    "smsNotify" BOOLEAN NOT NULL DEFAULT false,
    "notifyEvents" TEXT[] DEFAULT ARRAY['order_paid', 'order_shipped', 'order_completed', 'deposit_received']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletBalance" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "balance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "frozenBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnchainOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "buyerAddress" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "status" "OnchainOrderStatus" NOT NULL DEFAULT 'CREATED',
    "fundedTxHash" TEXT,
    "releaseTxHash" TEXT,
    "refundTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnchainOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainNetwork_name_key" ON "BlockchainNetwork"("name");

-- CreateIndex
CREATE INDEX "BlockchainNetwork_name_idx" ON "BlockchainNetwork"("name");

-- CreateIndex
CREATE INDEX "BlockchainNetwork_isActive_idx" ON "BlockchainNetwork"("isActive");

-- CreateIndex
CREATE INDEX "Token_symbol_idx" ON "Token"("symbol");

-- CreateIndex
CREATE INDEX "Token_isActive_idx" ON "Token"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Token_networkId_symbol_key" ON "Token"("networkId", "symbol");

-- CreateIndex
CREATE INDEX "EscrowContract_isActive_idx" ON "EscrowContract"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowContract_networkId_address_key" ON "EscrowContract"("networkId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "WalletBalance_walletId_idx" ON "WalletBalance"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletBalance_walletId_tokenId_key" ON "WalletBalance"("walletId", "tokenId");

-- CreateIndex
CREATE INDEX "WalletAddress_address_idx" ON "WalletAddress"("address");

-- CreateIndex
CREATE UNIQUE INDEX "WalletAddress_userId_networkId_key" ON "WalletAddress"("userId", "networkId");

-- CreateIndex
CREATE UNIQUE INDEX "OnchainOrder_orderId_key" ON "OnchainOrder"("orderId");

-- CreateIndex
CREATE INDEX "OnchainOrder_orderId_idx" ON "OnchainOrder"("orderId");

-- CreateIndex
CREATE INDEX "OnchainOrder_escrowId_idx" ON "OnchainOrder"("escrowId");

-- CreateIndex
CREATE INDEX "OnchainOrder_status_idx" ON "OnchainOrder"("status");

-- CreateIndex
CREATE INDEX "Order_networkId_idx" ON "Order"("networkId");

-- CreateIndex
CREATE INDEX "Order_isOnchain_idx" ON "Order"("isOnchain");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

-- CreateIndex
CREATE INDEX "Transaction_txHash_idx" ON "Transaction"("txHash");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowContract" ADD CONSTRAINT "EscrowContract_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletBalance" ADD CONSTRAINT "WalletBalance_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletBalance" ADD CONSTRAINT "WalletBalance_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAddress" ADD CONSTRAINT "WalletAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAddress" ADD CONSTRAINT "WalletAddress_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnchainOrder" ADD CONSTRAINT "OnchainOrder_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnchainOrder" ADD CONSTRAINT "OnchainOrder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "EscrowContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
