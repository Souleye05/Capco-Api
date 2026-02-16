-- ============================================
-- ENUM TYPES
-- ============================================

-- Module Contentieux
CREATE TYPE statut_affaire AS ENUM ('ACTIVE', 'CLOTUREE', 'RADIEE');
CREATE TYPE statut_audience AS ENUM ('A_VENIR', 'PASSEE_NON_RENSEIGNEE', 'RENSEIGNEE');
CREATE TYPE type_resultat AS ENUM ('RENVOI', 'RADIATION', 'DELIBERE');
CREATE TYPE objet_audience AS ENUM ('MISE_EN_ETAT', 'PLAIDOIRIE', 'REFERE', 'AUTRE');

-- Module Recouvrement
CREATE TYPE statut_recouvrement AS ENUM ('EN_COURS', 'CLOTURE');
CREATE TYPE type_action AS ENUM ('APPEL_TELEPHONIQUE', 'COURRIER', 'LETTRE_RELANCE', 'MISE_EN_DEMEURE', 'COMMANDEMENT_PAYER', 'ASSIGNATION', 'REQUETE', 'AUDIENCE_PROCEDURE', 'AUTRE');
CREATE TYPE type_honoraires AS ENUM ('FORFAIT', 'POURCENTAGE', 'MIXTE');
CREATE TYPE mode_paiement AS ENUM ('CASH', 'VIREMENT', 'CHEQUE');

-- Module Immobilier
CREATE TYPE type_lot AS ENUM ('STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'MAGASIN', 'BUREAU', 'AUTRE');
CREATE TYPE statut_lot AS ENUM ('LIBRE', 'OCCUPE');
CREATE TYPE statut_bail AS ENUM ('ACTIF', 'INACTIF');
CREATE TYPE type_depense_immeuble AS ENUM ('PLOMBERIE_ASSAINISSEMENT', 'ELECTRICITE_ECLAIRAGE', 'ENTRETIEN_MAINTENANCE', 'SECURITE_GARDIENNAGE_ASSURANCE', 'AUTRES_DEPENSES');
CREATE TYPE type_depense_dossier AS ENUM ('FRAIS_HUISSIER', 'FRAIS_GREFFE', 'TIMBRES_FISCAUX', 'FRAIS_COURRIER', 'FRAIS_DEPLACEMENT', 'FRAIS_EXPERTISE', 'AUTRES');

-- Module Conseil
CREATE TYPE statut_client_conseil AS ENUM ('ACTIF', 'SUSPENDU', 'RESILIE');
CREATE TYPE statut_facture AS ENUM ('BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE');
CREATE TYPE type_tache AS ENUM ('CONSULTATION', 'REDACTION', 'NEGOCIATION', 'RECHERCHE', 'REUNION', 'APPEL', 'EMAIL', 'AUTRE');

-- Alertes
CREATE TYPE type_alerte AS ENUM ('AUDIENCE_NON_RENSEIGNEE', 'DOSSIER_SANS_ACTION', 'LOYER_IMPAYE', 'ECHEANCE_PROCHE', 'FACTURE_IMPAYEE');
CREATE TYPE priorite_alerte AS ENUM ('HAUTE', 'MOYENNE', 'BASSE');

-- Common
CREATE TYPE type_partie AS ENUM ('physique', 'morale');
CREATE TYPE type_relation AS ENUM ('creancier', 'debiteur', 'proprietaire', 'locataire', 'adversaire', 'demandeur', 'defendeur');

-- ============================================
-- TABLE: parties (common contacts)
-- ============================================
CREATE TABLE public.parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type type_partie NOT NULL DEFAULT 'physique',
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  type_relation type_relation NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all parties" ON public.parties
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create parties" ON public.parties
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update parties" ON public.parties
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete parties" ON public.parties
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- MODULE CONTENTIEUX
-- ============================================

-- Table: affaires
CREATE TABLE public.affaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  intitule TEXT NOT NULL,
  demandeurs JSONB NOT NULL DEFAULT '[]',
  defendeurs JSONB NOT NULL DEFAULT '[]',
  juridiction TEXT NOT NULL,
  chambre TEXT NOT NULL,
  statut statut_affaire NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.affaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view affaires" ON public.affaires
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create affaires" ON public.affaires
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update affaires" ON public.affaires
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete affaires" ON public.affaires
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: audiences
CREATE TABLE public.audiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affaire_id UUID NOT NULL REFERENCES public.affaires(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure TIME,
  objet objet_audience NOT NULL DEFAULT 'MISE_EN_ETAT',
  statut statut_audience NOT NULL DEFAULT 'A_VENIR',
  notes_preparation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audiences" ON public.audiences
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create audiences" ON public.audiences
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update audiences" ON public.audiences
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete audiences" ON public.audiences
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: resultats_audiences
CREATE TABLE public.resultats_audiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audience_id UUID NOT NULL UNIQUE REFERENCES public.audiences(id) ON DELETE CASCADE,
  type type_resultat NOT NULL,
  nouvelle_date DATE,
  motif_renvoi TEXT,
  motif_radiation TEXT,
  texte_delibere TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.resultats_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view resultats" ON public.resultats_audiences
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create resultats" ON public.resultats_audiences
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update resultats" ON public.resultats_audiences
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table: honoraires_contentieux
CREATE TABLE public.honoraires_contentieux (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affaire_id UUID NOT NULL REFERENCES public.affaires(id) ON DELETE CASCADE,
  montant_facture DECIMAL(12,2) NOT NULL DEFAULT 0,
  montant_encaisse DECIMAL(12,2) NOT NULL DEFAULT 0,
  date_facturation DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.honoraires_contentieux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view honoraires" ON public.honoraires_contentieux
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create honoraires" ON public.honoraires_contentieux
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update honoraires" ON public.honoraires_contentieux
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- MODULE RECOUVREMENT
-- ============================================

-- Table: dossiers_recouvrement
CREATE TABLE public.dossiers_recouvrement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  creancier_id UUID REFERENCES public.parties(id),
  creancier_nom TEXT NOT NULL,
  creancier_telephone TEXT,
  creancier_email TEXT,
  debiteur_id UUID REFERENCES public.parties(id),
  debiteur_nom TEXT NOT NULL,
  debiteur_telephone TEXT,
  debiteur_email TEXT,
  debiteur_adresse TEXT,
  montant_principal DECIMAL(12,2) NOT NULL,
  penalites_interets DECIMAL(12,2) DEFAULT 0,
  total_a_recouvrer DECIMAL(12,2) NOT NULL,
  statut statut_recouvrement NOT NULL DEFAULT 'EN_COURS',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.dossiers_recouvrement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dossiers" ON public.dossiers_recouvrement
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create dossiers" ON public.dossiers_recouvrement
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update dossiers" ON public.dossiers_recouvrement
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete dossiers" ON public.dossiers_recouvrement
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: actions_recouvrement
CREATE TABLE public.actions_recouvrement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.dossiers_recouvrement(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type_action type_action NOT NULL,
  resume TEXT NOT NULL,
  prochaine_etape TEXT,
  echeance_prochaine_etape DATE,
  piece_jointe TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.actions_recouvrement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view actions" ON public.actions_recouvrement
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create actions" ON public.actions_recouvrement
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update actions" ON public.actions_recouvrement
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table: paiements_recouvrement
CREATE TABLE public.paiements_recouvrement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.dossiers_recouvrement(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  montant DECIMAL(12,2) NOT NULL,
  mode mode_paiement NOT NULL,
  reference TEXT,
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.paiements_recouvrement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view paiements" ON public.paiements_recouvrement
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create paiements" ON public.paiements_recouvrement
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update paiements" ON public.paiements_recouvrement
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table: honoraires_recouvrement
CREATE TABLE public.honoraires_recouvrement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.dossiers_recouvrement(id) ON DELETE CASCADE,
  type type_honoraires NOT NULL DEFAULT 'FORFAIT',
  montant_prevu DECIMAL(12,2) NOT NULL DEFAULT 0,
  pourcentage DECIMAL(5,2),
  montant_paye DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.honoraires_recouvrement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view honoraires_rec" ON public.honoraires_recouvrement
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create honoraires_rec" ON public.honoraires_recouvrement
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update honoraires_rec" ON public.honoraires_recouvrement
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table: depenses_dossier
CREATE TABLE public.depenses_dossier (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.dossiers_recouvrement(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  nature TEXT NOT NULL,
  type_depense type_depense_dossier NOT NULL DEFAULT 'AUTRES',
  montant DECIMAL(12,2) NOT NULL,
  justificatif TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.depenses_dossier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view depenses" ON public.depenses_dossier
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create depenses" ON public.depenses_dossier
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update depenses" ON public.depenses_dossier
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- MODULE GESTION IMMOBILIERE
-- ============================================

-- Table: proprietaires
CREATE TABLE public.proprietaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.proprietaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view proprietaires" ON public.proprietaires
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create proprietaires" ON public.proprietaires
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update proprietaires" ON public.proprietaires
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete proprietaires" ON public.proprietaires
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: immeubles
CREATE TABLE public.immeubles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proprietaire_id UUID NOT NULL REFERENCES public.proprietaires(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  adresse TEXT NOT NULL,
  taux_commission_capco DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.immeubles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view immeubles" ON public.immeubles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create immeubles" ON public.immeubles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update immeubles" ON public.immeubles
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete immeubles" ON public.immeubles
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: locataires
CREATE TABLE public.locataires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.locataires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view locataires" ON public.locataires
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create locataires" ON public.locataires
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update locataires" ON public.locataires
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete locataires" ON public.locataires
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: lots
CREATE TABLE public.lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  immeuble_id UUID NOT NULL REFERENCES public.immeubles(id) ON DELETE CASCADE,
  locataire_id UUID REFERENCES public.locataires(id),
  numero TEXT NOT NULL,
  etage TEXT,
  type type_lot NOT NULL DEFAULT 'AUTRE',
  loyer_mensuel_attendu DECIMAL(12,2) NOT NULL DEFAULT 0,
  statut statut_lot NOT NULL DEFAULT 'LIBRE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(immeuble_id, numero)
);

ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lots" ON public.lots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create lots" ON public.lots
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update lots" ON public.lots
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete lots" ON public.lots
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: baux
CREATE TABLE public.baux (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  locataire_id UUID NOT NULL REFERENCES public.locataires(id),
  date_debut DATE NOT NULL,
  date_fin DATE,
  montant_loyer DECIMAL(12,2) NOT NULL,
  jour_paiement_prevu INTEGER NOT NULL DEFAULT 5,
  statut statut_bail NOT NULL DEFAULT 'ACTIF',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.baux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view baux" ON public.baux
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create baux" ON public.baux
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update baux" ON public.baux
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete baux" ON public.baux
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: encaissements_loyers
CREATE TABLE public.encaissements_loyers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  mois_concerne TEXT NOT NULL,
  date_encaissement DATE NOT NULL,
  montant_encaisse DECIMAL(12,2) NOT NULL,
  mode_paiement mode_paiement NOT NULL,
  observation TEXT,
  commission_capco DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_proprietaire DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.encaissements_loyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view encaissements" ON public.encaissements_loyers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create encaissements" ON public.encaissements_loyers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update encaissements" ON public.encaissements_loyers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table: depenses_immeubles
CREATE TABLE public.depenses_immeubles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  immeuble_id UUID NOT NULL REFERENCES public.immeubles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  nature TEXT NOT NULL,
  description TEXT,
  montant DECIMAL(12,2) NOT NULL,
  type_depense type_depense_immeuble NOT NULL DEFAULT 'AUTRES_DEPENSES',
  justificatif TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.depenses_immeubles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view depenses_imm" ON public.depenses_immeubles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create depenses_imm" ON public.depenses_immeubles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update depenses_imm" ON public.depenses_immeubles
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table: rapports_gestion
CREATE TABLE public.rapports_gestion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  immeuble_id UUID NOT NULL REFERENCES public.immeubles(id) ON DELETE CASCADE,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  total_loyers DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_depenses DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_commissions DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_proprietaire DECIMAL(12,2) NOT NULL DEFAULT 0,
  date_generation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generer_par UUID NOT NULL REFERENCES auth.users(id),
  statut TEXT NOT NULL DEFAULT 'BROUILLON'
);

ALTER TABLE public.rapports_gestion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rapports" ON public.rapports_gestion
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create rapports" ON public.rapports_gestion
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = generer_par);

CREATE POLICY "Authenticated users can update rapports" ON public.rapports_gestion
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- MODULE CONSEILS / ASSISTANCE JURIDIQUE
-- ============================================

-- Table: clients_conseil
CREATE TABLE public.clients_conseil (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  type type_partie NOT NULL DEFAULT 'morale',
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  honoraire_mensuel DECIMAL(12,2) NOT NULL DEFAULT 0,
  jour_facturation INTEGER NOT NULL DEFAULT 1,
  statut statut_client_conseil NOT NULL DEFAULT 'ACTIF',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.clients_conseil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients" ON public.clients_conseil
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create clients" ON public.clients_conseil
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update clients" ON public.clients_conseil
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete clients" ON public.clients_conseil
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: taches_conseil
CREATE TABLE public.taches_conseil (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients_conseil(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type type_tache NOT NULL DEFAULT 'AUTRE',
  description TEXT NOT NULL,
  duree_minutes INTEGER,
  mois_concerne TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.taches_conseil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view taches" ON public.taches_conseil
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create taches" ON public.taches_conseil
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update taches" ON public.taches_conseil
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table: factures_conseil
CREATE TABLE public.factures_conseil (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients_conseil(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  mois_concerne TEXT NOT NULL,
  montant_ht DECIMAL(12,2) NOT NULL,
  tva DECIMAL(12,2) DEFAULT 0,
  montant_ttc DECIMAL(12,2) NOT NULL,
  date_emission DATE NOT NULL,
  date_echeance DATE NOT NULL,
  statut statut_facture NOT NULL DEFAULT 'BROUILLON',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.factures_conseil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view factures" ON public.factures_conseil
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create factures" ON public.factures_conseil
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update factures" ON public.factures_conseil
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table: paiements_conseil
CREATE TABLE public.paiements_conseil (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID NOT NULL REFERENCES public.factures_conseil(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  montant DECIMAL(12,2) NOT NULL,
  mode mode_paiement NOT NULL,
  reference TEXT,
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.paiements_conseil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view paiements_c" ON public.paiements_conseil
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create paiements_c" ON public.paiements_conseil
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update paiements_c" ON public.paiements_conseil
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE ALERTES
-- ============================================

CREATE TABLE public.alertes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type type_alerte NOT NULL,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  lien TEXT,
  priorite priorite_alerte NOT NULL DEFAULT 'MOYENNE',
  lu BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alertes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their alerts" ON public.alertes
  FOR SELECT USING (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "System can create alerts" ON public.alertes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their alerts" ON public.alertes
  FOR UPDATE USING (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_affaires_updated_at
  BEFORE UPDATE ON public.affaires
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dossiers_recouvrement_updated_at
  BEFORE UPDATE ON public.dossiers_recouvrement
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_conseil_updated_at
  BEFORE UPDATE ON public.clients_conseil
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEQUENCE FUNCTIONS FOR REFERENCES
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_affaire_reference()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COALESCE(MAX(SUBSTRING(reference FROM 10)::INTEGER), 0) + 1 INTO next_number
  FROM public.affaires
  WHERE reference LIKE 'AFF-' || current_year || '-%';
  RETURN 'AFF-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_dossier_reference()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COALESCE(MAX(SUBSTRING(reference FROM 10)::INTEGER), 0) + 1 INTO next_number
  FROM public.dossiers_recouvrement
  WHERE reference LIKE 'REC-' || current_year || '-%';
  RETURN 'REC-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_client_reference()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COALESCE(MAX(SUBSTRING(reference FROM 10)::INTEGER), 0) + 1 INTO next_number
  FROM public.clients_conseil
  WHERE reference LIKE 'CLI-' || current_year || '-%';
  RETURN 'CLI-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_facture_reference()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COALESCE(MAX(SUBSTRING(reference FROM 10)::INTEGER), 0) + 1 INTO next_number
  FROM public.factures_conseil
  WHERE reference LIKE 'FAC-' || current_year || '-%';
  RETURN 'FAC-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_immeuble_reference()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COALESCE(MAX(SUBSTRING(reference FROM 10)::INTEGER), 0) + 1 INTO next_number
  FROM public.immeubles
  WHERE reference LIKE 'IMM-' || current_year || '-%';
  RETURN 'IMM-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;