-- Folder category: drives the filter chips on the Investors hub. Idempotent.
ALTER TABLE document_folders ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Other';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'document_folders_category_check' AND conrelid = 'document_folders'::regclass
  ) THEN
    ALTER TABLE document_folders ADD CONSTRAINT document_folders_category_check
      CHECK (category IN ('Regulatory', 'Financial', 'Governance', 'Other'));
  END IF;
END $$;

-- Backfill by slug (the design's mapping). Only rows still at the default, so a later admin choice survives a re-run.
UPDATE document_folders SET category = 'Regulatory'
 WHERE category = 'Other' AND slug IN ('sebi-lodr', 'board-meetings', 'closing-trading-window', 'misc-sebi-disclosure');
UPDATE document_folders SET category = 'Financial'
 WHERE category = 'Other' AND slug IN ('annual-general-meeting', 'extra-ordinary-general-meetings', 'audited-financial-statements', 'unpaid-dividend');
UPDATE document_folders SET category = 'Governance'
 WHERE category = 'Other' AND slug IN ('company-policies', 'moa-aoa', 'merger-and-amalgamation', 'migration-to-main-board');
