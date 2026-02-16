-- Créer l'enum pour les rôles utilisateurs
CREATE TYPE public.app_role AS ENUM ('admin', 'collaborateur', 'compta');

-- Table des rôles utilisateurs
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Activer RLS sur la table des rôles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction sécurisée pour vérifier les rôles (évite la récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction pour obtenir le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Politique: Les admins peuvent tout voir
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politique: Les utilisateurs peuvent voir leur propre rôle
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Politique: Seuls les admins peuvent gérer les rôles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table du journal d'audit pour suivre toutes les actions
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL, -- 'contentieux', 'recouvrement', 'immobilier', 'conseil'
  entity_type TEXT NOT NULL, -- 'affaire', 'audience', 'dossier', 'immeuble', etc.
  entity_id TEXT,
  entity_reference TEXT, -- Référence lisible (ex: AFF-2026-0001)
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur le journal d'audit
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_module ON public.audit_log(module);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

-- Politique: Les admins peuvent voir tout le journal
CREATE POLICY "Admins can view all audit logs"
ON public.audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politique: Les utilisateurs peuvent voir leurs propres actions
CREATE POLICY "Users can view own audit logs"
ON public.audit_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Politique: Tout utilisateur authentifié peut créer une entrée de journal
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fonction pour enregistrer une action dans le journal
CREATE OR REPLACE FUNCTION public.log_action(
  _action TEXT,
  _module TEXT,
  _entity_type TEXT,
  _entity_id TEXT DEFAULT NULL,
  _entity_reference TEXT DEFAULT NULL,
  _details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _user_email TEXT;
BEGIN
  -- Récupérer l'email de l'utilisateur
  SELECT email INTO _user_email
  FROM auth.users
  WHERE id = auth.uid();

  INSERT INTO public.audit_log (user_id, user_email, action, module, entity_type, entity_id, entity_reference, details)
  VALUES (auth.uid(), _user_email, _action, _module, _entity_type, _entity_id, _entity_reference, _details)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Fonction pour assigner automatiquement le rôle 'collaborateur' aux nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'collaborateur');
  RETURN NEW;
END;
$$;

-- Trigger pour assigner automatiquement le rôle lors de l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();