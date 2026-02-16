import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Clients Conseil
export interface ClientConseilDB {
  id: string;
  reference: string;
  nom: string;
  type: 'physique' | 'morale';
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  honoraire_mensuel: number;
  jour_facturation: number;
  statut: 'ACTIF' | 'SUSPENDU' | 'RESILIE';
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useClientsConseil() {
  return useQuery({
    queryKey: ['clients-conseil'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients_conseil')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      return data as ClientConseilDB[];
    },
  });
}

export function useClientConseil(id: string) {
  return useQuery({
    queryKey: ['clients-conseil', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients_conseil')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ClientConseilDB | null;
    },
    enabled: !!id,
  });
}

export function useCreateClientConseil() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (client: Omit<ClientConseilDB, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('clients_conseil')
        .insert(client)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-conseil'] });
      toast.success('Client créé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

export function useUpdateClientConseil() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientConseilDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients_conseil')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients-conseil'] });
      queryClient.invalidateQueries({ queryKey: ['clients-conseil', data.id] });
      toast.success('Client mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Tâches Conseil
export interface TacheConseilDB {
  id: string;
  client_id: string;
  date: string;
  type: 'CONSULTATION' | 'REDACTION' | 'NEGOCIATION' | 'RECHERCHE' | 'REUNION' | 'APPEL' | 'EMAIL' | 'AUTRE';
  description: string;
  duree_minutes: number | null;
  mois_concerne: string;
  created_at: string;
  created_by: string;
  clients_conseil?: ClientConseilDB;
}

export function useTachesConseil(clientId?: string) {
  return useQuery({
    queryKey: ['taches-conseil', clientId],
    queryFn: async () => {
      let query = supabase
        .from('taches_conseil')
        .select(`
          *,
          clients_conseil (*)
        `)
        .order('date', { ascending: false });
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as TacheConseilDB[];
    },
  });
}

export function useCreateTacheConseil() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tache: Omit<TacheConseilDB, 'id' | 'created_at' | 'clients_conseil'>) => {
      const { data, error } = await supabase
        .from('taches_conseil')
        .insert([tache])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taches-conseil'] });
      toast.success('Tâche enregistrée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Factures Conseil
export interface FactureConseilDB {
  id: string;
  client_id: string;
  reference: string;
  mois_concerne: string;
  montant_ht: number;
  tva: number | null;
  montant_ttc: number;
  date_emission: string;
  date_echeance: string;
  statut: 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
  notes: string | null;
  created_at: string;
  created_by: string;
  clients_conseil?: ClientConseilDB;
}

export function useFacturesConseil() {
  return useQuery({
    queryKey: ['factures-conseil'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('factures_conseil')
        .select(`
          *,
          clients_conseil (*)
        `)
        .order('date_emission', { ascending: false });
      
      if (error) throw error;
      return data as FactureConseilDB[];
    },
  });
}

export function useCreateFactureConseil() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (facture: Omit<FactureConseilDB, 'id' | 'created_at' | 'clients_conseil'>) => {
      const { data, error } = await supabase
        .from('factures_conseil')
        .insert(facture)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      toast.success('Facture créée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

export function useUpdateFactureConseil() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FactureConseilDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('factures_conseil')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      toast.success('Facture mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Paiements Conseil
export interface PaiementConseilDB {
  id: string;
  facture_id: string;
  date: string;
  montant: number;
  mode: 'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM';
  reference: string | null;
  commentaire: string | null;
  created_at: string;
  created_by: string;
}

export function usePaiementsConseil(factureId?: string) {
  return useQuery({
    queryKey: ['paiements-conseil', factureId],
    queryFn: async () => {
      let query = supabase
        .from('paiements_conseil')
        .select('*')
        .order('date', { ascending: false });
      
      if (factureId) {
        query = query.eq('facture_id', factureId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PaiementConseilDB[];
    },
  });
}

export function useCreatePaiementConseil() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paiement: Omit<PaiementConseilDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('paiements_conseil')
        .insert(paiement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements-conseil'] });
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      toast.success('Paiement enregistré');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}
