-- Création du schéma auth pour compatibilité Supabase
CREATE SCHEMA IF NOT EXISTS auth;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    phone VARCHAR(15),
    phone_confirmed_at TIMESTAMPTZ,
    phone_change VARCHAR(15),
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current VARCHAR(255) DEFAULT '',
    email_change_confirm_status SMALLINT DEFAULT 0,
    banned_until TIMESTAMPTZ,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMPTZ,
    is_sso_user BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON auth.users (phone);

-- Insérer les utilisateurs de base pour les données CAPCO
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES
('5e01a3d3-cacf-4004-a5ee-20983d49b004', 'collaborateur@capco.sn', '$2a$10$dummy.hash.for.collaborateur', NOW(), NOW(), NOW()),
('f5f5e4a3-8f1c-4462-a5aa-c53297a5316c', 'admin@capco.sn', '$2a$10$dummy.hash.for.admin', NOW(), NOW(), NOW()),
('9aa7f986-a54a-440e-9b89-b230c7806c75', 'compta@capco.sn', '$2a$10$dummy.hash.for.compta', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;