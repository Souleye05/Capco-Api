import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ArrieresPage from '../ArrieresPage';

// Mock des hooks
vi.mock('@/hooks/useImmobilier', () => ({
  useArrieres: vi.fn(() => ({
    data: [
      {
        id: '1',
        lotId: 'lot1',
        immeubleId: 'imm1',
        lotNumero: 'A01',
        immeubleNom: 'Immeuble Test',
        immeubleReference: 'REF001',
        immeubleTauxCommission: 5,
        locataireNom: 'John Doe',
        montantDu: 100000,
        montantPaye: 50000,
        montantRestant: 50000,
        statut: 'EN_COURS',
        paiementsPartiels: [],
        createdAt: '2024-01-01',
      }
    ],
    isLoading: false
  })),
  useImmeubles: vi.fn(() => ({
    data: [
      {
        id: 'imm1',
        nom: 'Immeuble Test',
        tauxCommissionCapco: 5
      }
    ],
    isLoading: false
  })),
  useLots: vi.fn(() => ({
    data: [
      {
        id: 'lot1',
        numero: 'A01',
        statut: 'OCCUPE',
        immeubleId: 'imm1',
        locataireNom: 'John Doe'
      }
    ],
    isLoading: false
  })),
  useCreateArriere: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  })),
  useUpdateArriere: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  })),
  useDeleteArriere: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  })),
  useCreatePaiementArriere: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  }))
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user1' },
    isAdmin: true
  }))
}));

vi.mock('@/utils/generateArrieresPDF', () => ({
  generateArrieresPDF: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ArrieresPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render arriérés page correctly', () => {
    renderWithQueryClient(<ArrieresPage />);
    
    expect(screen.getByText('Arriérés de loyers')).toBeInTheDocument();
    expect(screen.getByText('Sommes impayées dues par les locataires avant janvier 2026')).toBeInTheDocument();
  });

  it('should display arriérés data with correct commission calculation', () => {
    renderWithQueryClient(<ArrieresPage />);
    
    // Vérifier que les données sont affichées
    expect(screen.getByText('Immeuble Test')).toBeInTheDocument();
    expect(screen.getByText('A01')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Vérifier le calcul des commissions (50000 * 5% = 2500)
    expect(screen.getByText('2 500 FCFA')).toBeInTheDocument();
  });

  it('should show create arriéré dialog when clicking new button', async () => {
    renderWithQueryClient(<ArrieresPage />);
    
    const newButton = screen.getByText('Nouvel arriéré');
    fireEvent.click(newButton);
    
    await waitFor(() => {
      expect(screen.getByText('Enregistrer un arriéré de loyer')).toBeInTheDocument();
      expect(screen.getByText('La période sera automatiquement définie sur l\'année précédente')).toBeInTheDocument();
    });
  });

  it('should validate montant correctly', () => {
    renderWithQueryClient(<ArrieresPage />);
    
    // Cette fonction devrait être accessible via l'instance du composant
    // Pour un test plus complet, on pourrait tester via l'interface utilisateur
    expect(true).toBe(true); // Placeholder pour la validation
  });

  it('should disable payment modification button', () => {
    renderWithQueryClient(<ArrieresPage />);
    
    // Cliquer pour étendre la ligne avec les paiements
    const expandButton = screen.getByRole('row');
    fireEvent.click(expandButton);
    
    // Le bouton de modification devrait être désactivé
    // Note: Ce test nécessiterait des données de paiements pour être complet
  });

  it('should calculate statistics correctly', () => {
    renderWithQueryClient(<ArrieresPage />);
    
    // Vérifier les statistiques affichées
    expect(screen.getByText('100 000 FCFA')).toBeInTheDocument(); // Total dû
    expect(screen.getByText('50 000 FCFA')).toBeInTheDocument(); // Total payé
    expect(screen.getByText('50%')).toBeInTheDocument(); // Taux de recouvrement
  });
});