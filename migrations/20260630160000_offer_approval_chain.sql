-- Per-offer configurable approval chain (L1, L2, …)
ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "approvalChainJson" TEXT NOT NULL DEFAULT '[]';
