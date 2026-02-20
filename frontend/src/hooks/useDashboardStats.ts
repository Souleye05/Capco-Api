import { useQuery } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';

interface DashboardStats {
  contentieux: {
    audiencesDemain: number;
    audiencesNonRenseignees: number;
    prochainesAudiences: number;
    affairesActives: number;
    honorairesFactures: number;
    honorairesEncaisses: number;
    honorairesEnAttente: number;
  };
  recouvrement: {
    dossiersEnCours: number;
    montantARecouvrer: number;
    totalEncaisse: number;
    dossiersSansAction7j: number;
    dossiersSansAction30j: number;
    honorairesFactures: number;
    honorairesEncaisses: number;
    honorairesEnAttente: number;
  };
  immobilier: {
    loyersAttendusMois: number;
    loyersEncaissesMois: number;
    impayesMois: number;
    depensesMois: number;
    commissionsCAPCO: number;
    commissionsAttenduesMois: number;
  };
  conseil: {
    clientsActifs: number;
    facturesEnAttente: number;
    montantFactureMois: number;
    montantEncaisseMois: number;
    tachesMois: number;
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // Récupérer les statistiques depuis l'API NestJS
        const [
          affairesStatsResponse,
          audiencesStatsResponse,
          honorairesStatsResponse,
          depensesStatsResponse
        ] = await Promise.all([
          nestjsApi.getAffairesStats(),
          nestjsApi.getAudiencesStats(),
          nestjsApi.getHonorairesStats(),
          nestjsApi.getDepensesStats()
        ]);

        const affairesStats = affairesStatsResponse.data || { total: 0, actives: 0, cloturees: 0, radiees: 0 };
        const audiencesStats = audiencesStatsResponse.data || { total: 0, aVenir: 0, tenues: 0, nonRenseignees: 0 };
        const honorairesStats = honorairesStatsResponse.data || { totalFacture: 0, totalEncaisse: 0, totalEnAttente: 0 };
        const depensesStats = depensesStatsResponse.data || { totalDepenses: 0, totalRembourse: 0 };

        return {
          contentieux: {
            audiencesDemain: 0, // À implémenter dans l'API
            audiencesNonRenseignees: audiencesStats.nonRenseignees || 0,
            prochainesAudiences: audiencesStats.aVenir || 0,
            affairesActives: affairesStats.actives || 0,
            honorairesFactures: honorairesStats.totalFacture || 0,
            honorairesEncaisses: honorairesStats.totalEncaisse || 0,
            honorairesEnAttente: honorairesStats.totalEnAttente || 0
          },
          recouvrement: {
            dossiersEnCours: 0, // Module recouvrement pas encore implémenté
            montantARecouvrer: 0,
            totalEncaisse: 0,
            dossiersSansAction7j: 0,
            dossiersSansAction30j: 0,
            honorairesFactures: 0,
            honorairesEncaisses: 0,
            honorairesEnAttente: 0
          },
          immobilier: {
            loyersAttendusMois: 0, // Module immobilier pas encore implémenté
            loyersEncaissesMois: 0,
            impayesMois: 0,
            depensesMois: 0,
            commissionsCAPCO: 0,
            commissionsAttenduesMois: 0
          },
          conseil: {
            clientsActifs: 0, // Module conseil pas encore implémenté
            facturesEnAttente: 0,
            montantFactureMois: 0,
            montantEncaisseMois: 0,
            tachesMois: 0
          }
        };
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        // Retourner des valeurs par défaut en cas d'erreur
        return {
          contentieux: {
            audiencesDemain: 0,
            audiencesNonRenseignees: 0,
            prochainesAudiences: 0,
            affairesActives: 0,
            honorairesFactures: 0,
            honorairesEncaisses: 0,
            honorairesEnAttente: 0
          },
          recouvrement: {
            dossiersEnCours: 0,
            montantARecouvrer: 0,
            totalEncaisse: 0,
            dossiersSansAction7j: 0,
            dossiersSansAction30j: 0,
            honorairesFactures: 0,
            honorairesEncaisses: 0,
            honorairesEnAttente: 0
          },
          immobilier: {
            loyersAttendusMois: 0,
            loyersEncaissesMois: 0,
            impayesMois: 0,
            depensesMois: 0,
            commissionsCAPCO: 0,
            commissionsAttenduesMois: 0
          },
          conseil: {
            clientsActifs: 0,
            facturesEnAttente: 0,
            montantFactureMois: 0,
            montantEncaisseMois: 0,
            tachesMois: 0
          }
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Audiences de demain avec détails
export function useAudiencesDemain() {
  return useQuery({
    queryKey: ['audiences-demain'],
    queryFn: async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const response = await nestjsApi.getAudiences({
          dateDebut: tomorrowStr,
          dateFin: tomorrowStr,
          sortBy: 'heure',
          sortOrder: 'asc'
        });

        if (response.error) {
          throw new Error(response.error);
        }

        return response.data?.data || [];
      } catch (error) {
        console.error('Erreur lors du chargement des audiences de demain:', error);
        return [];
      }
    },
  });
}

// Activité récente depuis audit_log
export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      try {
        // Pour l'instant, retourner un tableau vide
        // L'API d'audit sera implémentée plus tard
        return [];
      } catch (error) {
        console.error('Erreur lors du chargement de l\'activité récente:', error);
        return [];
      }
    },
  });
}
