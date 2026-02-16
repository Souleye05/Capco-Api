import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Extended Locataire interface with all new fields
export interface LocataireComplete {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  profession: string | null;
  lieu_travail: string | null;
  personne_contact_urgence: string | null;
  telephone_urgence: string | null;
  numero_piece_identite: string | null;
  type_piece_identite: string | null;
  nationalite: string | null;
  date_naissance: string | null;
  situation_familiale: string | null;
  notes: string | null;
  piece_identite_url: string | null;
  contrat_url: string | null;
  documents: Json | null;
  created_at: string;
  created_by: string | null;
}

export interface DocumentLocataire {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

// Fetch all locataires with complete info
export function useLocatairesComplete() {
  return useQuery({
    queryKey: ['locataires-complete'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locataires')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      return data as unknown as LocataireComplete[];
    },
  });
}

// Fetch single locataire with complete info
export function useLocataireComplete(id: string) {
  return useQuery({
    queryKey: ['locataires-complete', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locataires')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as LocataireComplete | null;
    },
    enabled: !!id,
  });
}

// Update locataire
export function useUpdateLocataire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LocataireComplete> & { id: string }) => {
      const { data, error } = await supabase
        .from('locataires')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locataires'] });
      queryClient.invalidateQueries({ queryKey: ['locataires-complete'] });
      queryClient.invalidateQueries({ queryKey: ['locataires-complete', data.id] });
      toast.success('Locataire mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Fetch baux (lease agreements) for a locataire
export function useBauxByLocataire(locataireId: string) {
  return useQuery({
    queryKey: ['baux', 'locataire', locataireId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('baux')
        .select(`
          *,
          lots (
            *,
            immeubles (*)
          )
        `)
        .eq('locataire_id', locataireId)
        .order('date_debut', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!locataireId,
  });
}

// Fetch encaissements (rent payments) for lots occupied by a locataire
export function useEncaissementsByLocataire(locataireId: string) {
  return useQuery({
    queryKey: ['encaissements', 'locataire', locataireId],
    queryFn: async () => {
      // First get all lots for this locataire
      const { data: lots, error: lotsError } = await supabase
        .from('lots')
        .select('id')
        .eq('locataire_id', locataireId);
      
      if (lotsError) throw lotsError;
      
      if (!lots || lots.length === 0) return [];
      
      const lotIds = lots.map(l => l.id);
      
      const { data, error } = await supabase
        .from('encaissements_loyers')
        .select(`
          *,
          lots (
            *,
            immeubles (*)
          )
        `)
        .in('lot_id', lotIds)
        .order('date_encaissement', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!locataireId,
  });
}

// Fetch dossiers recouvrement linked to locataire
export function useDossiersRecouvrementByLocataire(locataireId: string) {
  return useQuery({
    queryKey: ['dossiers-recouvrement', 'locataire', locataireId],
    queryFn: async () => {
      // Get dossier IDs from junction table
      const { data: links, error: linksError } = await supabase
        .from('locataires_dossiers_recouvrement')
        .select('dossier_id')
        .eq('locataire_id', locataireId);
      
      if (linksError) throw linksError;
      
      if (!links || links.length === 0) return [];
      
      const dossierIds = links.map(l => l.dossier_id);
      
      const { data, error } = await supabase
        .from('dossiers_recouvrement')
        .select('*')
        .in('id', dossierIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!locataireId,
  });
}

// Fetch actions recouvrement for dossiers linked to locataire (includes mises en demeure)
export function useActionsRecouvrementByLocataire(locataireId: string) {
  return useQuery({
    queryKey: ['actions-recouvrement', 'locataire', locataireId],
    queryFn: async () => {
      // Get dossier IDs from junction table
      const { data: links, error: linksError } = await supabase
        .from('locataires_dossiers_recouvrement')
        .select('dossier_id')
        .eq('locataire_id', locataireId);
      
      if (linksError) throw linksError;
      
      if (!links || links.length === 0) return [];
      
      const dossierIds = links.map(l => l.dossier_id);
      
      const { data, error } = await supabase
        .from('actions_recouvrement')
        .select(`
          *,
          dossiers_recouvrement (*)
        `)
        .in('dossier_id', dossierIds)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!locataireId,
  });
}

// Link locataire to dossier recouvrement
export function useLinkLocataireToDossier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ locataireId, dossierId, createdBy }: { locataireId: string; dossierId: string; createdBy: string }) => {
      const { data, error } = await supabase
        .from('locataires_dossiers_recouvrement')
        .insert({
          locataire_id: locataireId,
          dossier_id: dossierId,
          created_by: createdBy
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-recouvrement', 'locataire', variables.locataireId] });
      queryClient.invalidateQueries({ queryKey: ['actions-recouvrement', 'locataire', variables.locataireId] });
      toast.success('Dossier lié au locataire');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Ce dossier est déjà lié à ce locataire');
      } else {
        toast.error('Erreur: ' + error.message);
      }
    },
  });
}

// Unlink locataire from dossier recouvrement
export function useUnlinkLocataireFromDossier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ locataireId, dossierId }: { locataireId: string; dossierId: string }) => {
      const { error } = await supabase
        .from('locataires_dossiers_recouvrement')
        .delete()
        .eq('locataire_id', locataireId)
        .eq('dossier_id', dossierId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-recouvrement', 'locataire', variables.locataireId] });
      queryClient.invalidateQueries({ queryKey: ['actions-recouvrement', 'locataire', variables.locataireId] });
      toast.success('Lien supprimé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}
