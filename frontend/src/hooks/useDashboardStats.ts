import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      // Fetch all data in parallel
      const [
        audiencesResult,
        affairesResult,
        honorairesContentieuxResult,
        dossiersResult,
        paiementsRecouvrementResult,
        actionsRecouvrementResult,
        honorairesRecouvrementResult,
        lotsResult,
        immeublesResult,
        encaissementsResult,
        depensesImmResult,
        clientsResult,
        facturesResult,
        paiementsConseilResult,
        tachesResult
      ] = await Promise.all([
        supabase.from('audiences').select('id, date, statut'),
        supabase.from('affaires').select('id, statut'),
        supabase.from('honoraires_contentieux').select('montant_facture, montant_encaisse'),
        supabase.from('dossiers_recouvrement').select('id, statut, total_a_recouvrer, created_at'),
        supabase.from('paiements_recouvrement').select('montant'),
        supabase.from('actions_recouvrement').select('dossier_id, date'),
        supabase.from('honoraires_recouvrement').select('montant_prevu, montant_paye'),
        supabase.from('lots').select('id, loyer_mensuel_attendu, statut, immeuble_id'),
        supabase.from('immeubles').select('id, taux_commission_capco'),
        supabase.from('encaissements_loyers').select('montant_encaisse, commission_capco, date_encaissement').gte('date_encaissement', startOfMonth.toISOString().split('T')[0]),
        supabase.from('depenses_immeubles').select('montant, date').gte('date', startOfMonth.toISOString().split('T')[0]),
        supabase.from('clients_conseil').select('id, statut'),
        supabase.from('factures_conseil').select('id, statut, montant_ttc, date_emission'),
        supabase.from('paiements_conseil').select('montant, date').gte('date', startOfMonth.toISOString().split('T')[0]),
        supabase.from('taches_conseil').select('id, date').gte('date', startOfMonth.toISOString().split('T')[0])
      ]);

      // Calculate contentieux stats
      const audiences = audiencesResult.data || [];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const audiencesDemain = audiences.filter(a => a.date === tomorrowStr).length;
      const audiencesNonRenseignees = audiences.filter(a => a.statut === 'PASSEE_NON_RENSEIGNEE').length;
      const prochainesAudiences = audiences.filter(a => a.statut === 'A_VENIR').length;
      
      const affaires = affairesResult.data || [];
      const affairesActives = affaires.filter(a => a.statut === 'ACTIVE').length;

      const honorairesContentieux = honorairesContentieuxResult.data || [];
      const contentieuxFactures = honorairesContentieux.reduce((sum, h) => sum + (h.montant_facture || 0), 0);
      const contentieuxEncaisses = honorairesContentieux.reduce((sum, h) => sum + (h.montant_encaisse || 0), 0);

      // Calculate recouvrement stats
      const dossiers = dossiersResult.data || [];
      const dossiersEnCours = dossiers.filter(d => d.statut === 'EN_COURS').length;
      const montantARecouvrer = dossiers.filter(d => d.statut === 'EN_COURS').reduce((sum, d) => sum + (d.total_a_recouvrer || 0), 0);
      
      const paiementsRecouvrement = paiementsRecouvrementResult.data || [];
      const totalEncaisseRecouvrement = paiementsRecouvrement.reduce((sum, p) => sum + (p.montant || 0), 0);

      const actionsRecouvrement = actionsRecouvrementResult.data || [];
      const dossiersWithRecentAction = new Set(
        actionsRecouvrement
          .filter(a => new Date(a.date) >= sevenDaysAgo)
          .map(a => a.dossier_id)
      );
      const dossiersWithAction30d = new Set(
        actionsRecouvrement
          .filter(a => new Date(a.date) >= thirtyDaysAgo)
          .map(a => a.dossier_id)
      );
      
      const dossiersSansAction7j = dossiers.filter(d => d.statut === 'EN_COURS' && !dossiersWithRecentAction.has(d.id)).length;
      const dossiersSansAction30j = dossiers.filter(d => d.statut === 'EN_COURS' && !dossiersWithAction30d.has(d.id)).length;

      const honorairesRecouvrement = honorairesRecouvrementResult.data || [];
      const recouvrementFactures = honorairesRecouvrement.reduce((sum, h) => sum + (h.montant_prevu || 0), 0);
      const recouvrementEncaisses = honorairesRecouvrement.reduce((sum, h) => sum + (h.montant_paye || 0), 0);

      // Calculate immobilier stats
      const lots = lotsResult.data || [];
      const immeubles = immeublesResult.data || [];
      
      // Create a map of immeuble id to commission rate
      const immeublesCommissionMap = new Map<string, number>();
      immeubles.forEach(imm => {
        const tauxCommission = Number(imm.taux_commission_capco) || 0;
        immeublesCommissionMap.set(imm.id, tauxCommission);
      });
      
      // Calculate expected rents and expected commissions for occupied lots
      const lotsOccupes = lots.filter(l => l.statut === 'OCCUPE');
      const loyersAttendusMois = lotsOccupes.reduce((sum, l) => {
        const loyer = Number(l.loyer_mensuel_attendu) || 0;
        return sum + loyer;
      }, 0);
      
      // Calculate expected commissions based on expected rents × commission rate per building
      const commissionsAttenduesMois = lotsOccupes.reduce((sum, lot) => {
        const loyer = Number(lot.loyer_mensuel_attendu) || 0;
        const immeubleId = lot.immeuble_id;
        const tauxCommission = immeubleId ? (immeublesCommissionMap.get(immeubleId) || 0) : 0;
        const commission = (loyer * tauxCommission) / 100;
        return sum + (isNaN(commission) ? 0 : commission);
      }, 0);
      
      const encaissements = encaissementsResult.data || [];
      const loyersEncaissesMois = encaissements.reduce((sum, e) => sum + (Number(e.montant_encaisse) || 0), 0);
      const commissionsCAPCO = encaissements.reduce((sum, e) => sum + (Number(e.commission_capco) || 0), 0);
      
      const depensesImm = depensesImmResult.data || [];
      const depensesMois = depensesImm.reduce((sum, d) => sum + (Number(d.montant) || 0), 0);

      // Calculate conseil stats
      const clients = clientsResult.data || [];
      const clientsActifs = clients.filter(c => c.statut === 'ACTIF').length;

      const factures = facturesResult.data || [];
      const facturesEnAttente = factures.filter(f => f.statut === 'ENVOYEE' || f.statut === 'EN_RETARD').length;
      const facturesMois = factures.filter(f => new Date(f.date_emission) >= startOfMonth);
      const montantFactureMois = facturesMois.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

      const paiementsConseil = paiementsConseilResult.data || [];
      const montantEncaisseMois = paiementsConseil.reduce((sum, p) => sum + (p.montant || 0), 0);

      const taches = tachesResult.data || [];
      const tachesMois = taches.length;

      return {
        contentieux: {
          audiencesDemain,
          audiencesNonRenseignees,
          prochainesAudiences,
          affairesActives,
          honorairesFactures: contentieuxFactures,
          honorairesEncaisses: contentieuxEncaisses,
          honorairesEnAttente: contentieuxFactures - contentieuxEncaisses
        },
        recouvrement: {
          dossiersEnCours,
          montantARecouvrer,
          totalEncaisse: totalEncaisseRecouvrement,
          dossiersSansAction7j,
          dossiersSansAction30j,
          honorairesFactures: recouvrementFactures,
          honorairesEncaisses: recouvrementEncaisses,
          honorairesEnAttente: recouvrementFactures - recouvrementEncaisses
        },
        immobilier: {
          loyersAttendusMois,
          loyersEncaissesMois,
          impayesMois: loyersAttendusMois - loyersEncaissesMois,
          depensesMois,
          commissionsCAPCO,
          commissionsAttenduesMois
        },
        conseil: {
          clientsActifs,
          facturesEnAttente,
          montantFactureMois,
          montantEncaisseMois,
          tachesMois
        }
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Audiences de demain avec détails
export function useAudiencesDemain() {
  return useQuery({
    queryKey: ['audiences-demain'],
    queryFn: async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('audiences')
        .select(`
          *,
          affaires (*)
        `)
        .eq('date', tomorrowStr)
        .order('heure');

      if (error) throw error;
      return data || [];
    },
  });
}

// Activité récente depuis audit_log
export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });
}
