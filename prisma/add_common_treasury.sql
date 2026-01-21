-- Migration pour ajouter la caisse commune à la table games
-- Ajouter les colonnes de caisse commune si elles n'existent pas déjà

-- Vérifier et ajouter commonTreasuryCrowns
ALTER TABLE games ADD COLUMN IF NOT EXISTS commonTreasuryCrowns INTEGER DEFAULT 0;

-- Vérifier et ajouter commonTreasuryOrbs
ALTER TABLE games ADD COLUMN IF NOT EXISTS commonTreasuryOrbs INTEGER DEFAULT 0;

-- Vérifier et ajouter commonTreasuryScepters
ALTER TABLE games ADD COLUMN IF NOT EXISTS commonTreasuryScepters INTEGER DEFAULT 0;

-- Vérifier et ajouter commonTreasuryKings
ALTER TABLE games ADD COLUMN IF NOT EXISTS commonTreasuryKings INTEGER DEFAULT 0;
