ALTER TABLE "PetSpecies"
ADD COLUMN "summaryZh" TEXT NOT NULL DEFAULT '',
ADD COLUMN "coverImageUrl" TEXT,
ADD COLUMN "modelGlbUrl" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "PetSpecies_isActive_sortOrder_createdAt_idx"
ON "PetSpecies"("isActive", "sortOrder", "createdAt");
