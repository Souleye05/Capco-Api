import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Propriétaires
export interface ProprietaireDB {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  created_at: string;
  created_by: string | null;
}

export function useProprietaires() {
  return useQuery({
    queryKey: ['proprietaires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proprietaires')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      return data as ProprietaireDB[];
    },
  });
}

export function useCreateProprietaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (proprietaire: Omit<ProprietaireDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('proprietaires')
        .insert(proprietaire)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proprietaires'] });
      toast.success('Propriétaire créé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Immeubles
export interface ImmeubleDB {
  id: string;
  proprietaire_id: string;
  nom: string;
  reference: string;
  adresse: string;
  taux_commission_capco: number;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  proprietaires?: ProprietaireDB;
}

export function useImmeubles() {
  return useQuery({
    queryKey: ['immeubles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('immeubles')
        .select(`
          *,
          proprietaires (*)
        `)
        .order('nom');
      
      if (error) throw error;
      return data as ImmeubleDB[];
    },
  });
}

export function useImmeuble(id: string) {
  return useQuery({
    queryKey: ['immeubles', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('immeubles')
        .select(`
          *,
          proprietaires (*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ImmeubleDB | null;
    },
    enabled: !!id,
  });
}

export function useCreateImmeuble() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (immeuble: Omit<ImmeubleDB, 'id' | 'created_at' | 'proprietaires'>) => {
      const { data, error } = await supabase
        .from('immeubles')
        .insert(immeuble)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immeubles'] });
      toast.success('Immeuble créé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

export function useUpdateImmeuble() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImmeubleDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('immeubles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['immeubles'] });
      queryClient.invalidateQueries({ queryKey: ['immeubles', data.id] });
      toast.success('Immeuble mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Locataires
export interface LocataireDB {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  created_at: string;
  created_by: string | null;
}

export function useLocataires() {
  return useQuery({
    queryKey: ['locataires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locataires')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      return data as LocataireDB[];
    },
  });
}

export function useCreateLocataire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (locataire: Omit<LocataireDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('locataires')
        .insert(locataire)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locataires'] });
      toast.success('Locataire créé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Lots
export interface LotDB {
  id: string;
  immeuble_id: string;
  locataire_id: string | null;
  numero: string;
  etage: string | null;
  type: 'STUDIO' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'MAGASIN' | 'BUREAU' | 'AUTRE';
  loyer_mensuel_attendu: number;
  statut: 'LIBRE' | 'OCCUPE';
  created_at: string;
  created_by: string | null;
  immeubles?: ImmeubleDB;
  locataires?: LocataireDB;
}

export function useLots() {
  return useQuery({
    queryKey: ['lots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          immeubles (*),
          locataires (*)
        `)
        .order('numero');
      
      if (error) throw error;
      return data as LotDB[];
    },
  });
}

export function useLotsByImmeuble(immeubleId: string) {
  return useQuery({
    queryKey: ['lots', 'immeuble', immeubleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          locataires (*)
        `)
        .eq('immeuble_id', immeubleId)
        .order('numero');
      
      if (error) throw error;
      return data as LotDB[];
    },
    enabled: !!immeubleId,
  });
}

export function useCreateLot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lot: Omit<LotDB, 'id' | 'created_at' | 'immeubles' | 'locataires'>) => {
      const { data, error } = await supabase
        .from('lots')
        .insert(lot)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      toast.success('Lot créé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

export function useUpdateLot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LotDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('lots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      toast.success('Lot mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Encaissements Loyers
export interface EncaissementLoyerDB {
  id: string;
  lot_id: string;
  mois_concerne: string;
  date_encaissement: string;
  montant_encaisse: number;
  mode_paiement: 'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM';
  observation: string | null;
  commission_capco: number;
  net_proprietaire: number;
  created_at: string;
  created_by: string;
  lots?: LotDB;
}

export function useEncaissementsLoyers() {
  return useQuery({
    queryKey: ['encaissements-loyers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encaissements_loyers')
        .select(`
          *,
          lots (
            *,
            immeubles (*),
            locataires (*)
          )
        `)
        .order('date_encaissement', { ascending: false });
      
      if (error) throw error;
      return data as EncaissementLoyerDB[];
    },
  });
}

export function useCreateEncaissementLoyer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (encaissement: Omit<EncaissementLoyerDB, 'id' | 'created_at' | 'lots'>) => {
      const { data, error } = await supabase
        .from('encaissements_loyers')
        .insert(encaissement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encaissements-loyers'] });
      toast.success('Loyer encaissé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Dépenses Immeubles
export interface DepenseImmeubleDB {
  id: string;
  immeuble_id: string;
  date: string;
  nature: string;
  description: string | null;
  montant: number;
  type_depense: 'PLOMBERIE_ASSAINISSEMENT' | 'ELECTRICITE_ECLAIRAGE' | 'ENTRETIEN_MAINTENANCE' | 'SECURITE_GARDIENNAGE_ASSURANCE' | 'AUTRES_DEPENSES';
  justificatif: string | null;
  created_at: string;
  created_by: string;
}

export function useDepensesImmeubles(immeubleId?: string) {
  return useQuery({
    queryKey: ['depenses-immeubles', immeubleId],
    queryFn: async () => {
      let query = supabase
        .from('depenses_immeubles')
        .select('*')
        .order('date', { ascending: false });
      
      if (immeubleId) {
        query = query.eq('immeuble_id', immeubleId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as DepenseImmeubleDB[];
    },
  });
}

export function useCreateDepenseImmeuble() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (depense: Omit<DepenseImmeubleDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('depenses_immeubles')
        .insert([depense])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses-immeubles'] });
      toast.success('Dépense enregistrée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Rapports de gestion
export interface RapportGestionDB {
  id: string;
  immeuble_id: string;
  periode_debut: string;
  periode_fin: string;
  total_loyers: number;
  total_depenses: number;
  total_commissions: number;
  net_proprietaire: number;
  date_generation: string;
  generer_par: string;
  statut: string;
  immeubles?: ImmeubleDB;
}

export function useRapportsGestion(immeubleId?: string) {
  return useQuery({
    queryKey: ['rapports_gestion', immeubleId],
    queryFn: async () => {
      let query = supabase
        .from('rapports_gestion')
        .select(`
          *,
          immeubles (
            *,
            proprietaires (*)
          )
        `)
        .order('date_generation', { ascending: false });
      
      if (immeubleId) {
        query = query.eq('immeuble_id', immeubleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RapportGestionDB[];
    },
  });
}

export function useCreateRapportGestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rapport: Omit<RapportGestionDB, 'id' | 'date_generation' | 'immeubles'>) => {
      const { data, error } = await supabase
        .from('rapports_gestion')
        .insert(rapport)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapports_gestion'] });
      toast.success('Rapport généré avec succès');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}
