import { useQuery } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';

export interface ContentieuxDashboard {
  affaires: {
    total: number;
    actives: number;
    cloturees: number;
    radiees: number;
    nouvelles_ce_mois: number;
  };
  audiences: {
    total: number;
    a_venir: number;
    passees_non_renseignees: number;
    renseignees: number;
    cette_semaine: number;
    ce_mois: number;
  };
  financier: {
    honoraires_total: number;
    honoraires_ce_mois: number;
    depenses_total: number;
    depenses_ce_mois: number;
    ca_previsionnel: number;
  };
  performance: {
    taux_reussite: number;
    duree_moyenne_affaire: number;
    audiences_par_affaire: number;
    satisfaction_client: number;
  };
  activite_recente: Array<{
    id: string;
    type: 'affaire' | 'audience' | 'honoraire' | 'depense';
    titre: string;
    description: string;
    date: string;
    utilisateur: string;
  }>;
}

export interface PlanningAudience {
  id: string;
  date: string;
  heure?: string;
  affaire: {
    id: string;
    reference: string;
    intitule: string;
  };
  juridiction: string;
  chambre?: string;
  type: string;
  statut: string;
}

export interface IndicateursPerformance {
  taux_reussite_global: number;
  duree_moyenne_procedures: number;
  satisfaction_clients: number;
  ca_mensuel: number;
  evolution_ca: {
    mois: string;
    montant: number;
  }[];
  repartition_affaires_par_type: {
    type: string;
    nombre: number;
    pourcentage: number;
  }[];
  top_juridictions: {
    nom: string;
    nombre_audiences: number;
  }[];
}

// Hook pour récupérer le dashboard contentieux
export function useContentieuxDashboard() {
  return useQuery({
    queryKey: ['contentieux', 'dashboard'],
    queryFn: async (): Promise<ContentieuxDashboard> => {
      const response = await nestjsApi.get<ContentieuxDashboard>('/contentieux/dashboard');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
}

// Hook pour récupérer le planning des audiences
export function usePlanningAudiences(dateDebut?: Date, dateFin?: Date) {
  return useQuery({
    queryKey: ['contentieux', 'planning', dateDebut?.toISOString(), dateFin?.toISOString()],
    queryFn: async (): Promise<PlanningAudience[]> => {
      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut.toISOString());
      if (dateFin) params.append('dateFin', dateFin.toISOString());
      
      const endpoint = `/contentieux/planning-audiences${params.toString() ? '?' + params.toString() : ''}`;
      const response = await nestjsApi.get<PlanningAudience[]>(endpoint);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook pour la recherche globale
export function useRechercheGlobale(terme: string) {
  return useQuery({
    queryKey: ['contentieux', 'recherche', terme],
    queryFn: async () => {
      if (!terme.trim()) return { affaires: [], audiences: [], honoraires: [], depenses: [] };
      
      const response = await nestjsApi.get(`/contentieux/recherche?terme=${encodeURIComponent(terme)}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || { affaires: [], audiences: [], honoraires: [], depenses: [] };
    },
    enabled: !!terme.trim(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook pour les indicateurs de performance
export function useIndicateursPerformance() {
  return useQuery({
    queryKey: ['contentieux', 'indicateurs-performance'],
    queryFn: async (): Promise<IndicateursPerformance> => {
      const response = await nestjsApi.get<IndicateursPerformance>('/contentieux/indicateurs-performance');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook pour l'export de données
export function useExportDonnees() {
  return {
    exporterDonnees: async (options: {
      type: 'affaires' | 'audiences' | 'honoraires' | 'depenses';
      format?: 'json' | 'csv';
      dateDebut?: Date;
      dateFin?: Date;
    }) => {
      const params = new URLSearchParams({
        type: options.type,
        format: options.format || 'json',
      });
      
      if (options.dateDebut) {
        params.append('dateDebut', options.dateDebut.toISOString());
      }
      if (options.dateFin) {
        params.append('dateFin', options.dateFin.toISOString());
      }
      
      const response = await nestjsApi.get(`/contentieux/export?${params.toString()}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    }
  };
}

// Hook pour le résumé financier d'une affaire
export function useResumeFinancierAffaire(affaireId: string | undefined) {
  return useQuery({
    queryKey: ['contentieux', 'affaires', affaireId, 'resume-financier'],
    queryFn: async () => {
      if (!affaireId) return null;
      
      const response = await nestjsApi.get(`/contentieux/affaires/${affaireId}/resume-financier`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    },
    enabled: !!affaireId,
    staleTime: 5 * 60 * 1000,
  });
}