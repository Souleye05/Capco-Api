import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

// ─── Types matching the NestJS backend DTOs (camelCase) ───────────────────────

export interface Proprietaire {
  id: string;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  nombreImmeubles: number;
  immeubles?: ImmeubleResume[];
  createdAt: string;
}

export interface ImmeubleResume {
  id: string;
  nom: string;
  reference: string;
  adresse: string;
  tauxCommissionCapco: number;
}

export interface LotResume {
  id: string;
  numero: string;
  etage?: string;
  type: string;
  loyerMensuelAttendu: number;
  statut: 'LIBRE' | 'OCCUPE';
  locataireNom?: string;
}

export interface Immeuble {
  id: string;
  proprietaireId: string;
  nom: string;
  reference: string;
  adresse: string;
  tauxCommissionCapco: number;
  notes?: string;
  proprietaireNom: string;
  nombreLots: number;
  lotsOccupes: number;
  lotsLibres: number;
  lots: LotResume[];
  createdAt: string;
}

export interface Lot {
  id: string;
  immeubleId: string;
  numero: string;
  etage?: string;
  type: string;
  loyerMensuelAttendu: number;
  statut: 'LIBRE' | 'OCCUPE';
  locataireId?: string;
  locataireNom?: string;
  immeubleNom: string;
  immeubleReference: string;
  createdAt: string;
}

export interface Locataire {
  id: string;
  nom: string;
  telephone?: string;
  email?: string;
  nombreLots: number;
  nombreBauxActifs: number;
  lots?: LocataireLot[];
  baux?: LocataireBail[];
  createdAt: string;
}

export interface LocataireLot {
  id: string;
  numero: string;
  etage?: string;
  type: string;
  statut: string;
  loyerMensuelAttendu: number;
  immeubleNom?: string;
  immeubleReference?: string;
}

export interface LocataireBail {
  id: string;
  dateDebut: string;
  dateFin?: string;
  montantLoyer: number;
  jourPaiementPrevu: number;
  statut: string;
  lotNumero?: string;
  immeubleNom?: string;
}

export interface Bail {
  id: string;
  lotId: string;
  locataireId: string;
  dateDebut: string;
  dateFin?: string;
  montantLoyer: number;
  jourPaiementPrevu: number;
  statut: string;
  locataireNom?: string;
  locataireTelephone?: string;
  lotNumero?: string;
  immeubleNom?: string;
  immeubleReference?: string;
  createdAt: string;
}

export interface Encaissement {
  id: string;
  lotId: string;
  moisConcerne: string;
  dateEncaissement: string;
  montantEncaisse: number;
  modePaiement: string;
  observation?: string;
  commissionCapco: number;
  netProprietaire: number;
  lotNumero?: string;
  immeubleNom?: string;
  immeubleReference?: string;
  locataireNom?: string;
  createdAt: string;
}

export interface DepenseImmeuble {
  id: string;
  immeubleId: string;
  date: string;
  nature: string;
  description?: string;
  montant: number;
  typeDepense: string;
  justificatif?: string;
  immeubleNom?: string;
  immeubleReference?: string;
  createdAt: string;
}

export interface RapportGestion {
  id: string;
  immeubleId: string;
  periodeDebut: string;
  periodeFin: string;
  totalLoyers: number;
  totalDepenses: number;
  totalCommissions: number;
  netProprietaire: number;
  dateGeneration: string;
  statut: string;
  immeubleNom?: string;
  immeubleReference?: string;
  immeubleAdresse?: string;
  tauxCommission?: number;
  proprietaireNom?: string;
  proprietaireTelephone?: string;
  proprietaireEmail?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Helper to throw on API error ────────────────────────────────────────────
function unwrap<T>(result: { data?: T; error?: string }): T {
  if (result.error) throw new Error(result.error);
  return result.data as T;
}

// ─── Propriétaires ────────────────────────────────────────────────────────────

export function useProprietaires(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['proprietaires', params],
    queryFn: async () => {
      const result = await nestjsApi.getProprietaires({ limit: 100, ...params });
      const data = unwrap<PaginatedResult<Proprietaire>>(result);
      return data.data;
    },
  });
}

export function useProprietaire(id: string) {
  return useQuery({
    queryKey: ['proprietaires', id],
    queryFn: async () => {
      const result = await nestjsApi.getProprietaire(id);
      return unwrap<Proprietaire>(result);
    },
    enabled: !!id,
  });
}

export function useCreateProprietaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string; telephone?: string; email?: string; adresse?: string }) => {
      const result = await nestjsApi.createProprietaire(data);
      return unwrap<Proprietaire>(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proprietaires'] });
      toast.success('Propriétaire créé avec succès');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateProprietaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nom?: string; telephone?: string; email?: string; adresse?: string }) => {
      const result = await nestjsApi.updateProprietaire(id, data);
      return unwrap<Proprietaire>(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proprietaires'] });
      queryClient.invalidateQueries({ queryKey: ['proprietaires', data.id] });
      toast.success('Propriétaire mis à jour');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteProprietaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await nestjsApi.deleteProprietaire(id);
      return unwrap<{ message: string }>(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proprietaires'] });
      toast.success('Propriétaire supprimé');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ─── Immeubles ────────────────────────────────────────────────────────────────

export function useImmeubles(params?: { page?: number; limit?: number; search?: string; proprietaireId?: string }) {
  return useQuery({
    queryKey: ['immeubles', params],
    queryFn: async () => {
      const result = await nestjsApi.getImmeubles({ limit: 100, ...params });
      const data = unwrap<PaginatedResult<Immeuble>>(result);
      return data.data;
    },
  });
}

export function useImmeuble(id: string) {
  return useQuery({
    queryKey: ['immeubles', id],
    queryFn: async () => {
      const result = await nestjsApi.getImmeuble(id);
      return unwrap<Immeuble>(result);
    },
    enabled: !!id,
  });
}

export function useCreateImmeuble() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { proprietaireId: string; nom: string; adresse: string; tauxCommissionCapco: number; notes?: string }) => {
      const result = await nestjsApi.createImmeuble(data);
      return unwrap<Immeuble>(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immeubles'] });
      toast.success('Immeuble créé avec succès');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateImmeuble() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nom?: string; adresse?: string; tauxCommissionCapco?: number; notes?: string }) => {
      const result = await nestjsApi.updateImmeuble(id, data);
      return unwrap<Immeuble>(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['immeubles'] });
      queryClient.invalidateQueries({ queryKey: ['immeubles', data.id] });
      toast.success('Immeuble mis à jour');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteImmeuble() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await nestjsApi.deleteImmeuble(id);
      return unwrap<{ message: string }>(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immeubles'] });
      toast.success('Immeuble supprimé');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ─── Lots ─────────────────────────────────────────────────────────────────────

export function useLotsByImmeuble(immeubleId: string) {
  return useQuery({
    queryKey: ['lots', 'immeuble', immeubleId],
    queryFn: async () => {
      const result = await nestjsApi.getLotsByImmeuble(immeubleId);
      return unwrap<Lot[]>(result);
    },
    enabled: !!immeubleId,
  });
}

export function useLot(id: string) {
  return useQuery({
    queryKey: ['lots', id],
    queryFn: async () => {
      const result = await nestjsApi.getLot(id);
      return unwrap<Lot>(result);
    },
    enabled: !!id,
  });
}

// Kept for backward compat: returns lots from all immeubles (not paginated, loaded lazily)
export function useLots() {
  return useQuery({
    queryKey: ['lots', 'all'],
    queryFn: async () => {
      // Fetch immeubles first, then aggregate lots from each
      const immeublesResult = await nestjsApi.getImmeubles({ limit: 100 });
      const immeubles = unwrap<PaginatedResult<Immeuble>>(immeublesResult).data;
      const allLots: Lot[] = immeubles.flatMap(imm =>
        (imm.lots || []).map(l => ({
          id: l.id,
          immeubleId: imm.id,
          numero: l.numero,
          etage: l.etage,
          type: l.type,
          loyerMensuelAttendu: l.loyerMensuelAttendu,
          statut: l.statut as 'LIBRE' | 'OCCUPE',
          locataireNom: l.locataireNom,
          immeubleNom: imm.nom,
          immeubleReference: imm.reference,
          createdAt: imm.createdAt,
        }))
      );
      return allLots;
    },
  });
}

export function useCreateLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { immeubleId: string; numero: string; etage?: string; type?: string; loyerMensuelAttendu?: number; statut?: string; locataireId?: string }) => {
      const result = await nestjsApi.createLot(data);
      return unwrap<Lot>(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['lots', 'immeuble', data.immeubleId] });
      queryClient.invalidateQueries({ queryKey: ['immeubles', data.immeubleId] });
      toast.success('Lot créé avec succès');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; numero?: string; etage?: string; type?: string; loyerMensuelAttendu?: number; statut?: string; locataireId?: string | null }) => {
      const result = await nestjsApi.updateLot(id, data);
      return unwrap<Lot>(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['lots', 'immeuble', data.immeubleId] });
      queryClient.invalidateQueries({ queryKey: ['immeubles', data.immeubleId] });
      toast.success('Lot mis à jour');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ─── Locataires ───────────────────────────────────────────────────────────────

export function useLocataires(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['locataires', params],
    queryFn: async () => {
      const result = await nestjsApi.getLocataires({ limit: 100, ...params });
      const data = unwrap<PaginatedResult<Locataire>>(result);
      return data.data;
    },
  });
}

export function useLocataireDetail(id: string) {
  return useQuery({
    queryKey: ['locataires', id],
    queryFn: async () => {
      const result = await nestjsApi.getLocataire(id);
      return unwrap<Locataire>(result);
    },
    enabled: !!id,
  });
}

export function useCreateLocataire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string; telephone?: string; email?: string }) => {
      const result = await nestjsApi.createLocataire(data);
      return unwrap<Locataire>(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locataires'] });
      toast.success('Locataire créé avec succès');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLocataire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nom?: string; telephone?: string; email?: string }) => {
      const result = await nestjsApi.updateLocataire(id, data);
      return unwrap<Locataire>(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locataires'] });
      queryClient.invalidateQueries({ queryKey: ['locataires', data.id] });
      toast.success('Locataire mis à jour');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ─── Baux ─────────────────────────────────────────────────────────────────────

export function useBauxByLot(lotId: string) {
  return useQuery({
    queryKey: ['baux', 'lot', lotId],
    queryFn: async () => {
      const result = await nestjsApi.getBauxByLot(lotId);
      return unwrap<Bail[]>(result);
    },
    enabled: !!lotId,
  });
}

export function useBauxByLocataire(locataireId: string) {
  return useQuery({
    queryKey: ['baux', 'locataire', locataireId],
    queryFn: async () => {
      const result = await nestjsApi.getBauxByLocataire(locataireId);
      return unwrap<Bail[]>(result);
    },
    enabled: !!locataireId,
  });
}

export function useCreateBail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { lotId: string; locataireId: string; dateDebut: string; dateFin?: string; montantLoyer: number; jourPaiementPrevu?: number; statut?: string }) => {
      const result = await nestjsApi.createBail(data);
      return unwrap<Bail>(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['baux'] });
      queryClient.invalidateQueries({ queryKey: ['lots', 'immeuble'] });
      queryClient.invalidateQueries({ queryKey: ['locataires', data.locataireId] });
      toast.success('Bail créé avec succès');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateBail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; dateDebut?: string; dateFin?: string; montantLoyer?: number; jourPaiementPrevu?: number; statut?: string }) => {
      const result = await nestjsApi.updateBail(id, data);
      return unwrap<Bail>(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baux'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      toast.success('Bail mis à jour');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ─── Encaissements de loyers ──────────────────────────────────────────────────

export function useEncaissementsByImmeuble(immeubleId: string) {
  return useQuery({
    queryKey: ['encaissements', 'immeuble', immeubleId],
    queryFn: async () => {
      const result = await nestjsApi.getEncaissementsByImmeuble(immeubleId);
      return unwrap<Encaissement[]>(result);
    },
    enabled: !!immeubleId,
  });
}

export function useEncaissementsByLot(lotId: string) {
  return useQuery({
    queryKey: ['encaissements', 'lot', lotId],
    queryFn: async () => {
      const result = await nestjsApi.getEncaissementsByLot(lotId);
      return unwrap<Encaissement[]>(result);
    },
    enabled: !!lotId,
  });
}

/** @deprecated Use useEncaissementsByImmeuble instead */
export function useEncaissementsLoyers() {
  return useQuery({
    queryKey: ['encaissements', 'all'],
    queryFn: async () => [] as Encaissement[],
  });
}

export function useCreateEncaissementLoyer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { lotId: string; moisConcerne: string; dateEncaissement: string; montantEncaisse: number; modePaiement: string; observation?: string }) => {
      const result = await nestjsApi.createEncaissement(data);
      return unwrap<Encaissement>(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['encaissements'] });
      queryClient.invalidateQueries({ queryKey: ['lots', 'immeuble'] });
      toast.success('Encaissement enregistré');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ─── Dépenses immeubles ────────────────────────────────────────────────────────

export function useDepensesImmeubles(immeubleId?: string) {
  return useQuery({
    queryKey: ['depenses-immeubles', immeubleId],
    queryFn: async () => {
      if (!immeubleId) return [] as DepenseImmeuble[];
      const result = await nestjsApi.getDepensesByImmeuble(immeubleId);
      return unwrap<DepenseImmeuble[]>(result);
    },
    enabled: !!immeubleId,
  });
}

export function useCreateDepenseImmeuble() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { immeubleId: string; date: string; nature: string; description?: string; montant: number; typeDepense?: string; justificatif?: string }) => {
      const result = await nestjsApi.createDepenseImmeuble(data);
      return unwrap<DepenseImmeuble>(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['depenses-immeubles', data.immeubleId] });
      toast.success('Dépense enregistrée');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ─── Rapports de gestion ──────────────────────────────────────────────────────

export function useRapportsGestion(immeubleId?: string) {
  return useQuery({
    queryKey: ['rapports-gestion', immeubleId],
    queryFn: async () => {
      if (!immeubleId) return [] as RapportGestion[];
      const result = await nestjsApi.getRapportsByImmeuble(immeubleId);
      return unwrap<RapportGestion[]>(result);
    },
    enabled: !!immeubleId,
  });
}

export function useCreateRapportGestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      immeubleId: string;
      periodeDebut: string;
      periodeFin: string;
      totalLoyers?: number;
      totalDepenses?: number;
      totalCommissions?: number;
      netProprietaire?: number;
      genererPar?: string;
      statut?: string;
    }) => {
      const result = await nestjsApi.generateRapport(data);
      return unwrap<RapportGestion>(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rapports-gestion', data.immeubleId] });
      toast.success('Rapport généré avec succès');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ─── Backward-compat type aliases (for pages that still import old names) ─────
/** @deprecated Use Proprietaire */
export type ProprietaireDB = Proprietaire;
/** @deprecated Use Immeuble */
export type ImmeubleDB = Immeuble & {
  // Old snake_case aliases used in some pages
  proprietaire_id?: string;
  taux_commission_capco?: number;
  created_at?: string;
  created_by?: string | null;
  proprietaires?: { nom: string };
};
/** @deprecated Use Lot */
export type LotDB = Lot & {
  immeuble_id?: string;
  locataire_id?: string | null;
  loyer_mensuel_attendu?: number;
  created_at?: string;
  created_by?: string | null;
  immeubles?: ImmeubleDB;
  locataires?: { nom: string };
};
/** @deprecated Use Locataire */
export type LocataireDB = Locataire & {
  created_at?: string;
  created_by?: string | null;
};
/** @deprecated Use Encaissement */
export type EncaissementLoyerDB = Encaissement & {
  lot_id?: string;
  mois_concerne?: string;
  date_encaissement?: string;
  montant_encaisse?: number;
  mode_paiement?: string;
  commission_capco?: number;
  net_proprietaire?: number;
  created_at?: string;
  created_by?: string;
  lots?: LotDB;
};
/** @deprecated Use DepenseImmeuble */
export type DepenseImmeubleDB = DepenseImmeuble & {
  immeuble_id?: string;
  type_depense?: string;
  created_at?: string;
  created_by?: string;
};
/** @deprecated Use RapportGestion */
export type RapportGestionDB = RapportGestion & {
  immeuble_id?: string;
  periode_debut?: string;
  periode_fin?: string;
  total_loyers?: number;
  total_depenses?: number;
  total_commissions?: number;
  net_proprietaire?: number;
  date_generation?: string;
  generer_par?: string;
  created_at?: string;
  immeubles?: ImmeubleDB;
};
