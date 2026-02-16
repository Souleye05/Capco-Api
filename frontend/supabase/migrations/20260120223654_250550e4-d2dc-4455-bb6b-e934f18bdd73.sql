-- Add new payment modes WAVE and OM to mode_paiement enum
ALTER TYPE mode_paiement ADD VALUE IF NOT EXISTS 'WAVE';
ALTER TYPE mode_paiement ADD VALUE IF NOT EXISTS 'OM';