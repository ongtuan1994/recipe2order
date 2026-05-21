-- Drop image-related columns. The app no longer renders or uploads images.

ALTER TABLE "User" DROP COLUMN IF EXISTS "image";

ALTER TABLE "Recipe"
  DROP COLUMN IF EXISTS "imageUrl",
  DROP COLUMN IF EXISTS "imageKey";

ALTER TABLE "Ingredient"
  DROP COLUMN IF EXISTS "imageUrl",
  DROP COLUMN IF EXISTS "imageKey";

ALTER TABLE "RecipeStep" DROP COLUMN IF EXISTS "imageUrl";
