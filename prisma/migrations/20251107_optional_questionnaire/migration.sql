-- Make questionnaireId optional on books
ALTER TABLE "books" DROP CONSTRAINT IF EXISTS "books_questionnaireId_fkey";
ALTER TABLE "books" ALTER COLUMN "questionnaireId" DROP NOT NULL;
ALTER TABLE "books" ADD CONSTRAINT "books_questionnaireId_fkey"
  FOREIGN KEY ("questionnaireId") REFERENCES "questionnaires"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
