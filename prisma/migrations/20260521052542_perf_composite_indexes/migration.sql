-- DropIndex
DROP INDEX "Ingredient_type_idx";

-- DropIndex
DROP INDEX "Ingredient_userId_idx";

-- DropIndex
DROP INDEX "Recipe_recipeType_idx";

-- DropIndex
DROP INDEX "Recipe_userId_idx";

-- DropIndex
DROP INDEX "Sale_saleDate_idx";

-- DropIndex
DROP INDEX "Sale_userId_idx";

-- DropIndex
DROP INDEX "StockBatch_expiresAt_idx";

-- DropIndex
DROP INDEX "StockBatch_ingredientId_idx";

-- DropIndex
DROP INDEX "StockBatch_status_idx";

-- CreateIndex
CREATE INDEX "Ingredient_userId_isDeleted_type_idx" ON "Ingredient"("userId", "isDeleted", "type");

-- CreateIndex
CREATE INDEX "Recipe_userId_recipeType_isDeleted_idx" ON "Recipe"("userId", "recipeType", "isDeleted");

-- CreateIndex
CREATE INDEX "Sale_userId_saleDate_idx" ON "Sale"("userId", "saleDate");

-- CreateIndex
CREATE INDEX "StockBatch_ingredientId_status_expiresAt_idx" ON "StockBatch"("ingredientId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "StockBatch_status_expiresAt_idx" ON "StockBatch"("status", "expiresAt");
