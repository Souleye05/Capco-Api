import { 
  AffaireContentieuse, 
  Audience, 
  DossierRecouvrement, 
  Immeuble, 
  Lot, 
  Proprietaire,
  DashboardStats,
  Alerte,
  ActionRecouvrement,
  EncaissementLoyer,
  ClientConseil,
  TacheConseil,
  FactureConseil,
  PaiementConseil,
  DepenseImmeuble,
  Locataire,
  Bail,
  RapportGestion
} from '@/types';

// Helper to create dates
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

// ============================================
// CONTENTIEUX - Affaires
// ============================================

export const mockAffaires: AffaireContentieuse[] = [
  {
    id: '1',
    reference: 'AFF-2026-0001',
    intitule: 'SARL Durand c/ SCI Les Oliviers',
    demandeurs: [{ id: 'd1', type: 'morale', nom: 'SARL Durand', typeRelation: 'demandeur' }],
    defendeurs: [{ id: 'def1', type: 'morale', nom: 'SCI Les Oliviers', typeRelation: 'defendeur' }],
    juridiction: 'Tribunal de Commerce de Paris',
    chambre: '3ème Chambre',
    statut: 'ACTIVE',
    notes: 'Litige sur factures impayées',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-10'),
    createdBy: 'admin'
  },
  {
    id: '2',
    reference: 'AFF-2026-0002',
    intitule: 'Martin Jean c/ Assurance Mutuelle',
    demandeurs: [{ id: 'd2', type: 'physique', nom: 'Martin Jean', typeRelation: 'demandeur' }],
    defendeurs: [{ id: 'def2', type: 'morale', nom: 'Assurance Mutuelle SA', typeRelation: 'defendeur' }],
    juridiction: 'Tribunal Judiciaire de Lyon',
    chambre: '1ère Chambre Civile',
    statut: 'ACTIVE',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-15'),
    createdBy: 'admin'
  },
  {
    id: '3',
    reference: 'AFF-2026-0003',
    intitule: 'Société Bâtiment Pro c/ Commune de Marseille',
    demandeurs: [{ id: 'd3', type: 'morale', nom: 'Société Bâtiment Pro', typeRelation: 'demandeur' }],
    defendeurs: [{ id: 'def3', type: 'morale', nom: 'Commune de Marseille', typeRelation: 'defendeur' }],
    juridiction: 'Tribunal Administratif de Marseille',
    chambre: '2ème Chambre',
    statut: 'ACTIVE',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-12'),
    createdBy: 'admin'
  }
];

// ============================================
// CONTENTIEUX - Audiences
// ============================================

export const mockAudiences: Audience[] = [
  {
    id: 'aud1',
    affaireId: '1',
    affaire: mockAffaires[0],
    date: tomorrow,
    heure: '09:30',
    objet: 'MISE_EN_ETAT',
    statut: 'A_VENIR',
    notesPreparation: 'Préparer conclusions récapitulatives',
    createdAt: new Date('2026-01-10'),
    createdBy: 'admin'
  },
  {
    id: 'aud2',
    affaireId: '2',
    affaire: mockAffaires[1],
    date: tomorrow,
    heure: '14:00',
    objet: 'PLAIDOIRIE',
    statut: 'A_VENIR',
    notesPreparation: 'Dossier de plaidoirie finalisé',
    createdAt: new Date('2026-01-12'),
    createdBy: 'admin'
  },
  {
    id: 'aud3',
    affaireId: '1',
    affaire: mockAffaires[0],
    date: yesterday,
    heure: '10:00',
    objet: 'MISE_EN_ETAT',
    statut: 'PASSEE_NON_RENSEIGNEE',
    createdAt: new Date('2026-01-05'),
    createdBy: 'admin'
  },
  {
    id: 'aud4',
    affaireId: '3',
    affaire: mockAffaires[2],
    date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
    heure: '11:00',
    objet: 'REFERE',
    statut: 'A_VENIR',
    createdAt: new Date('2026-01-15'),
    createdBy: 'admin'
  }
];

// ============================================
// RECOUVREMENT - Dossiers
// ============================================

export const mockDossiersRecouvrement: DossierRecouvrement[] = [
  {
    id: 'rec1',
    reference: 'REC-2026-0001',
    creancier: { id: 'c1', type: 'morale', nom: 'Entreprise ABC', typeRelation: 'creancier' },
    debiteur: { id: 'deb1', type: 'morale', nom: 'SARL XYZ', telephone: '01 23 45 67 89', typeRelation: 'debiteur' },
    montantPrincipal: 25000,
    penalitesInterets: 2500,
    totalARecouvrer: 27500,
    statut: 'EN_COURS',
    notes: 'Factures de prestations informatiques',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-15'),
    createdBy: 'admin'
  },
  {
    id: 'rec2',
    reference: 'REC-2026-0002',
    creancier: { id: 'c2', type: 'physique', nom: 'Dupont Marie', typeRelation: 'creancier' },
    debiteur: { id: 'deb2', type: 'physique', nom: 'Bernard Paul', typeRelation: 'debiteur' },
    montantPrincipal: 8500,
    totalARecouvrer: 8500,
    statut: 'EN_COURS',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-10'),
    createdBy: 'admin'
  },
  {
    id: 'rec3',
    reference: 'REC-2026-0003',
    creancier: { id: 'c3', type: 'morale', nom: 'Banque Nationale', typeRelation: 'creancier' },
    debiteur: { id: 'deb3', type: 'morale', nom: 'Restaurant Le Gourmet', typeRelation: 'debiteur' },
    montantPrincipal: 45000,
    penalitesInterets: 5400,
    totalARecouvrer: 50400,
    statut: 'EN_COURS',
    createdAt: new Date('2025-12-15'),
    updatedAt: new Date('2026-01-08'),
    createdBy: 'admin'
  }
];

export const mockActionsRecouvrement: ActionRecouvrement[] = [
  {
    id: 'act1',
    dossierId: 'rec1',
    date: new Date('2026-01-15'),
    typeAction: 'MISE_EN_DEMEURE',
    resume: 'Envoi mise en demeure par LRAR',
    prochaineEtape: 'Attendre réponse 15 jours',
    echeanceProchaineEtape: new Date('2026-01-30'),
    createdAt: new Date('2026-01-15'),
    createdBy: 'admin'
  },
  {
    id: 'act2',
    dossierId: 'rec1',
    date: new Date('2026-01-10'),
    typeAction: 'APPEL_TELEPHONIQUE',
    resume: 'Appel débiteur - demande délai de paiement refusée',
    createdAt: new Date('2026-01-10'),
    createdBy: 'admin'
  },
  {
    id: 'act3',
    dossierId: 'rec2',
    date: new Date('2026-01-05'),
    typeAction: 'LETTRE_RELANCE',
    resume: 'Première relance envoyée',
    createdAt: new Date('2026-01-05'),
    createdBy: 'admin'
  }
];

// ============================================
// IMMOBILIER
// ============================================

export const mockProprietaires: Proprietaire[] = [
  {
    id: 'prop1',
    nom: 'SCI Les Acacias',
    telephone: '01 45 67 89 00',
    email: 'contact@sci-acacias.fr',
    createdAt: new Date('2025-06-01')
  },
  {
    id: 'prop2',
    nom: 'M. Robert Lefebvre',
    telephone: '06 12 34 56 78',
    email: 'r.lefebvre@email.com',
    createdAt: new Date('2025-08-15')
  }
];

export const mockImmeubles: Immeuble[] = [
  {
    id: 'imm1',
    proprietaireId: 'prop1',
    proprietaire: mockProprietaires[0],
    nom: 'Résidence Les Acacias',
    reference: 'IMM-001',
    adresse: '15 rue des Acacias, 75016 Paris',
    tauxCommissionCAPCO: 8,
    notes: 'Immeuble de standing, 12 lots',
    createdAt: new Date('2025-06-01')
  },
  {
    id: 'imm2',
    proprietaireId: 'prop2',
    proprietaire: mockProprietaires[1],
    nom: 'Immeuble Lefebvre',
    reference: 'IMM-002',
    adresse: '42 avenue Victor Hugo, 69006 Lyon',
    tauxCommissionCAPCO: 7,
    createdAt: new Date('2025-08-15')
  }
];

export const mockLocataires: Locataire[] = [
  {
    id: 'loc1',
    nom: 'M. Jean Dupont',
    telephone: '06 11 22 33 44',
    email: 'j.dupont@email.com',
    createdAt: new Date('2025-06-15')
  },
  {
    id: 'loc2',
    nom: 'Mme Marie Martin',
    telephone: '06 55 66 77 88',
    email: 'm.martin@email.com',
    createdAt: new Date('2025-06-20')
  },
  {
    id: 'loc3',
    nom: 'SARL Commerce Plus',
    telephone: '01 99 88 77 66',
    email: 'contact@commerce-plus.fr',
    createdAt: new Date('2025-09-01')
  }
];

export const mockLots: Lot[] = [
  {
    id: 'lot1',
    immeubleId: 'imm1',
    immeuble: mockImmeubles[0],
    numero: 'A01',
    etage: 'RDC',
    type: 'F2',
    loyerMensuelAttendu: 1200,
    statut: 'OCCUPE',
    locataireId: 'loc1',
    locataire: mockLocataires[0],
    createdAt: new Date('2025-06-01')
  },
  {
    id: 'lot2',
    immeubleId: 'imm1',
    immeuble: mockImmeubles[0],
    numero: 'A02',
    etage: '1er',
    type: 'F3',
    loyerMensuelAttendu: 1500,
    statut: 'OCCUPE',
    locataireId: 'loc2',
    locataire: mockLocataires[1],
    createdAt: new Date('2025-06-01')
  },
  {
    id: 'lot3',
    immeubleId: 'imm1',
    immeuble: mockImmeubles[0],
    numero: 'A03',
    etage: '2ème',
    type: 'F4',
    loyerMensuelAttendu: 1800,
    statut: 'LIBRE',
    createdAt: new Date('2025-06-01')
  },
  {
    id: 'lot4',
    immeubleId: 'imm2',
    immeuble: mockImmeubles[1],
    numero: 'B01',
    etage: 'RDC',
    type: 'MAGASIN',
    loyerMensuelAttendu: 2500,
    statut: 'OCCUPE',
    locataireId: 'loc3',
    locataire: mockLocataires[2],
    createdAt: new Date('2025-08-15')
  }
];

export const mockEncaissementsLoyers: EncaissementLoyer[] = [
  {
    id: 'enc1',
    lotId: 'lot1',
    lot: mockLots[0],
    moisConcerne: '2026-01',
    dateEncaissement: new Date('2026-01-05'),
    montantEncaisse: 1200,
    modePaiement: 'VIREMENT',
    commissionCAPCO: 96,
    netProprietaire: 1104,
    createdAt: new Date('2026-01-05'),
    createdBy: 'admin'
  },
  {
    id: 'enc2',
    lotId: 'lot2',
    lot: mockLots[1],
    moisConcerne: '2026-01',
    dateEncaissement: new Date('2026-01-06'),
    montantEncaisse: 1500,
    modePaiement: 'VIREMENT',
    commissionCAPCO: 120,
    netProprietaire: 1380,
    createdAt: new Date('2026-01-06'),
    createdBy: 'admin'
  },
  {
    id: 'enc3',
    lotId: 'lot4',
    lot: mockLots[3],
    moisConcerne: '2026-01',
    dateEncaissement: new Date('2026-01-08'),
    montantEncaisse: 2500,
    modePaiement: 'CHEQUE',
    commissionCAPCO: 175,
    netProprietaire: 2325,
    createdAt: new Date('2026-01-08'),
    createdBy: 'admin'
  },
  // Historical data
  {
    id: 'enc4',
    lotId: 'lot1',
    lot: mockLots[0],
    moisConcerne: '2025-12',
    dateEncaissement: new Date('2025-12-05'),
    montantEncaisse: 1200,
    modePaiement: 'VIREMENT',
    commissionCAPCO: 96,
    netProprietaire: 1104,
    createdAt: new Date('2025-12-05'),
    createdBy: 'admin'
  },
  {
    id: 'enc5',
    lotId: 'lot2',
    lot: mockLots[1],
    moisConcerne: '2025-12',
    dateEncaissement: new Date('2025-12-06'),
    montantEncaisse: 1500,
    modePaiement: 'VIREMENT',
    commissionCAPCO: 120,
    netProprietaire: 1380,
    createdAt: new Date('2025-12-06'),
    createdBy: 'admin'
  },
  {
    id: 'enc6',
    lotId: 'lot4',
    lot: mockLots[3],
    moisConcerne: '2025-12',
    dateEncaissement: new Date('2025-12-10'),
    montantEncaisse: 2500,
    modePaiement: 'CHEQUE',
    commissionCAPCO: 175,
    netProprietaire: 2325,
    createdAt: new Date('2025-12-10'),
    createdBy: 'admin'
  }
];

// ============================================
// DEPENSES IMMEUBLES
// ============================================

export const mockDepensesImmeubles: DepenseImmeuble[] = [
  {
    id: 'dep1',
    immeubleId: 'imm1',
    date: new Date('2026-01-10'),
    nature: 'Entretien parties communes',
    description: 'Nettoyage mensuel des escaliers et hall',
    montant: 75000,
    typeDepense: 'ENTRETIEN_MAINTENANCE',
    createdAt: new Date('2026-01-10'),
    createdBy: 'admin'
  },
  {
    id: 'dep2',
    immeubleId: 'imm1',
    date: new Date('2026-01-08'),
    nature: 'Réparation plomberie',
    description: 'Remplacement robinetterie appartement A02',
    montant: 45000,
    typeDepense: 'PLOMBERIE_ASSAINISSEMENT',
    createdAt: new Date('2026-01-08'),
    createdBy: 'admin'
  },
  {
    id: 'dep3',
    immeubleId: 'imm1',
    date: new Date('2025-12-15'),
    nature: 'Électricité parties communes',
    description: 'Facture électricité décembre 2025',
    montant: 35000,
    typeDepense: 'ELECTRICITE_ECLAIRAGE',
    createdAt: new Date('2025-12-15'),
    createdBy: 'admin'
  },
  {
    id: 'dep4',
    immeubleId: 'imm2',
    date: new Date('2026-01-05'),
    nature: 'Entretien ascenseur',
    description: 'Contrat maintenance mensuel',
    montant: 120000,
    typeDepense: 'ENTRETIEN_MAINTENANCE',
    createdAt: new Date('2026-01-05'),
    createdBy: 'admin'
  },
  {
    id: 'dep5',
    immeubleId: 'imm2',
    date: new Date('2025-12-20'),
    nature: 'Assurance immeuble',
    description: 'Prime annuelle 2026',
    montant: 850000,
    typeDepense: 'SECURITE_GARDIENNAGE_ASSURANCE',
    createdAt: new Date('2025-12-20'),
    createdBy: 'admin'
  },
  {
    id: 'dep6',
    immeubleId: 'imm1',
    date: new Date('2026-01-12'),
    nature: 'Gardiennage',
    description: 'Service de gardiennage mensuel',
    montant: 150000,
    typeDepense: 'SECURITE_GARDIENNAGE_ASSURANCE',
    createdAt: new Date('2026-01-12'),
    createdBy: 'admin'
  }
];

// ============================================
// RAPPORTS DE GESTION
// ============================================

export const mockRapportsGestion: RapportGestion[] = [
  {
    id: 'rap1',
    immeubleId: 'imm1',
    immeuble: mockImmeubles[0],
    periodeDebut: new Date('2025-12-01'),
    periodeFin: new Date('2025-12-31'),
    totalLoyers: 2700,
    totalDepenses: 155000,
    totalCommissions: 216,
    netProprietaire: 2329,
    dateGeneration: new Date('2026-01-02'),
    genererPar: 'admin',
    statut: 'GENERE'
  },
  {
    id: 'rap2',
    immeubleId: 'imm2',
    immeuble: mockImmeubles[1],
    periodeDebut: new Date('2025-12-01'),
    periodeFin: new Date('2025-12-31'),
    totalLoyers: 2500,
    totalDepenses: 970000,
    totalCommissions: 175,
    netProprietaire: 1155,
    dateGeneration: new Date('2026-01-03'),
    genererPar: 'admin',
    statut: 'GENERE'
  }
];

// ============================================
// DASHBOARD STATS
// ============================================

export const mockDashboardStats: DashboardStats = {
  contentieux: {
    audiencesDemain: 2,
    audiencesNonRenseignees: 1,
    prochainesAudiences: 4,
    affairesActives: 3,
    honorairesFactures: 1500000,
    honorairesEncaisses: 850000,
    honorairesEnAttente: 650000
  },
  recouvrement: {
    dossiersEnCours: 3,
    montantARecouvrer: 86400,
    totalEncaisse: 12500,
    dossiersSansAction7j: 1,
    dossiersSansAction15j: 0,
    dossiersSansAction30j: 1,
    honorairesFactures: 2500000,
    honorairesEncaisses: 1750000,
    honorairesEnAttente: 750000
  },
  immobilier: {
    loyersAttendusMois: 7000,
    loyersEncaissesMois: 5200,
    impayesMois: 1800,
    depensesMois: 450,
    commissionsCAPCO: 391
  },
  conseil: {
    clientsActifs: 4,
    facturesEnAttente: 2,
    montantFactureMois: 2500000,
    montantEncaisseMois: 1800000,
    tachesMois: 28
  }
};

// ============================================
// CONSEILS / ASSISTANCE JURIDIQUE
// ============================================

export const mockClientsConseil: ClientConseil[] = [
  {
    id: 'cli1',
    reference: 'CLI-2026-0001',
    nom: 'Société Alpha Industries',
    type: 'morale',
    telephone: '01 45 67 89 00',
    email: 'direction@alpha-industries.com',
    adresse: '25 rue des Entreprises, 75008 Paris',
    honoraireMensuel: 750000,
    jourFacturation: 1,
    statut: 'ACTIF',
    notes: 'Contrat annuel renouvelable',
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'cli2',
    reference: 'CLI-2026-0002',
    nom: 'M. Bernard Kouassi',
    type: 'physique',
    telephone: '06 12 34 56 78',
    email: 'b.kouassi@email.com',
    honoraireMensuel: 250000,
    jourFacturation: 5,
    statut: 'ACTIF',
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2026-01-05'),
    createdBy: 'admin'
  },
  {
    id: 'cli3',
    reference: 'CLI-2026-0003',
    nom: 'ONG Espoir Solidarité',
    type: 'morale',
    telephone: '01 23 45 67 89',
    email: 'contact@espoir-solidarite.org',
    adresse: '10 avenue de la Paix, Abidjan',
    honoraireMensuel: 500000,
    jourFacturation: 1,
    statut: 'ACTIF',
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2026-01-10'),
    createdBy: 'admin'
  },
  {
    id: 'cli4',
    reference: 'CLI-2026-0004',
    nom: 'Groupe Immobilier SAFA',
    type: 'morale',
    telephone: '01 98 76 54 32',
    email: 'juridique@safa-immo.com',
    honoraireMensuel: 1000000,
    jourFacturation: 10,
    statut: 'ACTIF',
    notes: 'Client premium - réponse prioritaire',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2026-01-15'),
    createdBy: 'admin'
  }
];

export const mockTachesConseil: TacheConseil[] = [
  {
    id: 'tache1',
    clientId: 'cli1',
    client: mockClientsConseil[0],
    date: new Date('2026-01-15'),
    type: 'CONSULTATION',
    description: 'Consultation sur restructuration contrats fournisseurs',
    dureeMinutes: 90,
    moisConcerne: '2026-01',
    createdAt: new Date('2026-01-15'),
    createdBy: 'admin'
  },
  {
    id: 'tache2',
    clientId: 'cli1',
    client: mockClientsConseil[0],
    date: new Date('2026-01-12'),
    type: 'REDACTION',
    description: 'Rédaction avenant contrat de distribution',
    dureeMinutes: 180,
    moisConcerne: '2026-01',
    createdAt: new Date('2026-01-12'),
    createdBy: 'admin'
  },
  {
    id: 'tache3',
    clientId: 'cli2',
    client: mockClientsConseil[1],
    date: new Date('2026-01-10'),
    type: 'APPEL',
    description: 'Appel conseil sur litige successoral',
    dureeMinutes: 45,
    moisConcerne: '2026-01',
    createdAt: new Date('2026-01-10'),
    createdBy: 'admin'
  },
  {
    id: 'tache4',
    clientId: 'cli3',
    client: mockClientsConseil[2],
    date: new Date('2026-01-08'),
    type: 'REUNION',
    description: 'Réunion statuts et gouvernance associative',
    dureeMinutes: 120,
    moisConcerne: '2026-01',
    createdAt: new Date('2026-01-08'),
    createdBy: 'admin'
  },
  {
    id: 'tache5',
    clientId: 'cli4',
    client: mockClientsConseil[3],
    date: new Date('2026-01-05'),
    type: 'NEGOCIATION',
    description: 'Négociation bail commercial immeuble Plateau',
    dureeMinutes: 150,
    moisConcerne: '2026-01',
    createdAt: new Date('2026-01-05'),
    createdBy: 'admin'
  }
];

export const mockFacturesConseil: FactureConseil[] = [
  {
    id: 'fac1',
    clientId: 'cli1',
    client: mockClientsConseil[0],
    reference: 'FAC-2026-0001',
    moisConcerne: '2026-01',
    montantHT: 750000,
    tva: 135000,
    montantTTC: 885000,
    dateEmission: new Date('2026-01-01'),
    dateEcheance: new Date('2026-01-31'),
    statut: 'ENVOYEE',
    createdAt: new Date('2026-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'fac2',
    clientId: 'cli2',
    client: mockClientsConseil[1],
    reference: 'FAC-2026-0002',
    moisConcerne: '2026-01',
    montantHT: 250000,
    montantTTC: 250000,
    dateEmission: new Date('2026-01-05'),
    dateEcheance: new Date('2026-02-05'),
    statut: 'PAYEE',
    createdAt: new Date('2026-01-05'),
    createdBy: 'admin'
  },
  {
    id: 'fac3',
    clientId: 'cli3',
    client: mockClientsConseil[2],
    reference: 'FAC-2026-0003',
    moisConcerne: '2026-01',
    montantHT: 500000,
    montantTTC: 500000,
    dateEmission: new Date('2026-01-01'),
    dateEcheance: new Date('2026-01-31'),
    statut: 'ENVOYEE',
    createdAt: new Date('2026-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'fac4',
    clientId: 'cli4',
    client: mockClientsConseil[3],
    reference: 'FAC-2025-0048',
    moisConcerne: '2025-12',
    montantHT: 1000000,
    tva: 180000,
    montantTTC: 1180000,
    dateEmission: new Date('2025-12-10'),
    dateEcheance: new Date('2026-01-10'),
    statut: 'PAYEE',
    createdAt: new Date('2025-12-10'),
    createdBy: 'admin'
  }
];

export const mockPaiementsConseil: PaiementConseil[] = [
  {
    id: 'paiC1',
    factureId: 'fac2',
    facture: mockFacturesConseil[1],
    date: new Date('2026-01-12'),
    montant: 250000,
    mode: 'VIREMENT',
    reference: 'VIR-2026-0112',
    createdAt: new Date('2026-01-12'),
    createdBy: 'admin'
  },
  {
    id: 'paiC2',
    factureId: 'fac4',
    facture: mockFacturesConseil[3],
    date: new Date('2026-01-08'),
    montant: 1180000,
    mode: 'VIREMENT',
    reference: 'VIR-2026-0108',
    createdAt: new Date('2026-01-08'),
    createdBy: 'admin'
  }
];

// ============================================
// ALERTES
// ============================================

export const mockAlertes: Alerte[] = [
  {
    id: 'alert1',
    type: 'AUDIENCE_NON_RENSEIGNEE',
    titre: 'Audience non renseignée',
    description: 'AFF-2026-0001 - Audience du 17/01/2026 non renseignée',
    lien: '/contentieux/audiences/aud3',
    dateCreation: yesterday,
    lu: false,
    priorite: 'HAUTE'
  },
  {
    id: 'alert2',
    type: 'DOSSIER_SANS_ACTION',
    titre: 'Dossier sans action depuis 30 jours',
    description: 'REC-2026-0003 - Aucune action depuis le 08/01/2026',
    lien: '/recouvrement/dossiers/rec3',
    dateCreation: today,
    lu: false,
    priorite: 'MOYENNE'
  },
  {
    id: 'alert3',
    type: 'LOYER_IMPAYE',
    titre: 'Loyer impayé',
    description: 'Lot A03 - Résidence Les Acacias - Janvier 2026',
    lien: '/immobilier/lots/lot3',
    dateCreation: today,
    lu: false,
    priorite: 'HAUTE'
  }
];
