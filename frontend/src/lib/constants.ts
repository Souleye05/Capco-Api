export const STATUT_AFFAIRE = {
  ACTIVE: { label: 'Active', variant: 'success' },
  CLOTUREE: { label: 'Clôturée', variant: 'muted' },
  RADIEE: { label: 'Radiée', variant: 'destructive' },
} as const;

export const STATUT_AUDIENCE = {
  A_VENIR: { label: 'À venir', variant: 'info' },
  PASSEE_NON_RENSEIGNEE: { label: 'Non renseignée', variant: 'destructive' },
  RENSEIGNEE: { label: 'Renseignée', variant: 'success' }
} as const;

export const STATUT_LOUE = {
  OCCUPE: { label: 'Occupé', variant: 'success' },
  VACANT: { label: 'Vacant', variant: 'destructive' },
  MAINTENANCE: { label: 'Maintenance', variant: 'warning' }
} as const;

export const LIST_CHAMBRES = [
  'Chambre civile',
  'Chambre commerciale',
  'Chambre sociale',
  'Chambre criminelle',
  'Chambre des référés',
  'Chambre correctionnelle',
  'Chambre de l\'instruction',
  'Chambre civile 1',
  'Chambre civile 2',
  'Chambre civile 3',
] as const;
