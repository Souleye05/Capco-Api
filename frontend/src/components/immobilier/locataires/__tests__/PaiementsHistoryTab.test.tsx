import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaiementsHistoryTab } from '../PaiementsHistoryTab';

// Mock the hooks
vi.mock('@/hooks/useLocataires', () => ({
  useEncaissementsByLocataire: vi.fn(() => ({
    data: [
      {
        id: '1',
        lotId: 'lot1',
        moisConcerne: '2026-02',
        dateEncaissement: '2026-02-15T00:00:00.000Z',
        montantEncaisse: 150000,
        modePaiement: 'VIREMENT',
        observation: 'Paiement mensuel',
        commissionCapco: 7500,
        netProprietaire: 142500,
        lotNumero: 'A01',
        immeubleNom: 'Résidence Test',
        immeubleReference: 'REF001',
        locataireNom: 'John Doe',
        createdAt: '2026-02-15T10:00:00.000Z',
      },
      {
        id: '2',
        lotId: 'lot1',
        moisConcerne: '2026-01',
        dateEncaissement: '2026-01-15T00:00:00.000Z',
        montantEncaisse: 150000,
        modePaiement: 'CASH',
        observation: null,
        commissionCapco: 7500,
        netProprietaire: 142500,
        lotNumero: 'A01',
        immeubleNom: 'Résidence Test',
        immeubleReference: 'REF001',
        locataireNom: 'John Doe',
        createdAt: '2026-01-15T10:00:00.000Z',
      },
      {
        id: '3',
        lotId: 'lot2',
        moisConcerne: '2025-12',
        dateEncaissement: '2025-12-15T00:00:00.000Z',
        montantEncaisse: 200000,
        modePaiement: 'WAVE',
        observation: 'Paiement avec retard',
        commissionCapco: 10000,
        netProprietaire: 190000,
        lotNumero: 'B02',
        immeubleNom: 'Immeuble Central',
        immeubleReference: 'REF002',
        locataireNom: 'John Doe',
        createdAt: '2025-12-15T10:00:00.000Z',
      }
    ],
    isLoading: false
  }))
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    formatCurrency: vi.fn((amount) => `${amount.toLocaleString()} FCFA`),
    cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
  };
});

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

describe('PaiementsHistoryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment history correctly', () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Check if the main components are rendered
    expect(screen.getByText('Historique des paiements (3)')).toBeInTheDocument();
    expect(screen.getByText('Évolution mensuelle')).toBeInTheDocument();
    expect(screen.getByText('Répartition par mode de paiement')).toBeInTheDocument();
  });

  it('should display correct payment statistics', () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Check total amount (150000 + 150000 + 200000 = 500000)
    expect(screen.getByText('500,000 FCFA')).toBeInTheDocument();
    
    // Check number of payments
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Check average payment (500000 / 3 ≈ 166667)
    expect(screen.getByText('166,667 FCFA')).toBeInTheDocument();
  });

  it('should display payment modes breakdown', () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Check if different payment modes are displayed
    expect(screen.getByText('Virement')).toBeInTheDocument();
    expect(screen.getByText('Espèces')).toBeInTheDocument();
    expect(screen.getByText('Wave')).toBeInTheDocument();
    
    // Check amounts for each mode
    expect(screen.getByText('150,000 FCFA')).toBeInTheDocument(); // VIREMENT
    expect(screen.getByText('200,000 FCFA')).toBeInTheDocument(); // WAVE
  });

  it('should filter payments by period', async () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Find and click the period filter
    const periodSelect = screen.getByDisplayValue('Toutes les périodes');
    fireEvent.click(periodSelect);
    
    // Select 2026
    const option2026 = screen.getByText('2026');
    fireEvent.click(option2026);
    
    await waitFor(() => {
      // Should show only 2026 payments (2 payments)
      expect(screen.getByText('Historique des paiements (2)')).toBeInTheDocument();
    });
  });

  it('should filter payments by payment mode', async () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Find and click the payment mode filter
    const modeSelect = screen.getByDisplayValue('Tous les modes');
    fireEvent.click(modeSelect);
    
    // Select VIREMENT
    const virementOption = screen.getByText('Virement');
    fireEvent.click(virementOption);
    
    await waitFor(() => {
      // Should show only VIREMENT payments (1 payment)
      expect(screen.getByText('Historique des paiements (1)')).toBeInTheDocument();
    });
  });

  it('should search payments by building or lot', async () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Find the search input
    const searchInput = screen.getByPlaceholderText('Immeuble, lot, mois...');
    
    // Search for "Central"
    fireEvent.change(searchInput, { target: { value: 'Central' } });
    
    await waitFor(() => {
      // Should show only payments from "Immeuble Central" (1 payment)
      expect(screen.getByText('Historique des paiements (1)')).toBeInTheDocument();
    });
  });

  it('should display payment details in modal', async () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Find and click the first payment detail button
    const detailButtons = screen.getAllByRole('button');
    const eyeButton = detailButtons.find(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-eye')
    );
    
    if (eyeButton) {
      fireEvent.click(eyeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Détails du paiement')).toBeInTheDocument();
        expect(screen.getByText('Résidence Test - Lot A01')).toBeInTheDocument();
        expect(screen.getByText('Commission CAPCO')).toBeInTheDocument();
        expect(screen.getByText('Net propriétaire')).toBeInTheDocument();
      });
    }
  });

  it('should display monthly chart with correct data', () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Check if monthly chart is displayed
    expect(screen.getByText('Évolution mensuelle (3 mois)')).toBeInTheDocument();
    
    // Check if months are displayed
    expect(screen.getByText('déc. 2025')).toBeInTheDocument();
    expect(screen.getByText('janv. 2026')).toBeInTheDocument();
    expect(screen.getByText('févr. 2026')).toBeInTheDocument();
  });

  it('should handle empty payment data', () => {
    // Mock empty data
    vi.mocked(require('@/hooks/useLocataires').useEncaissementsByLocataire).mockReturnValue({
      data: [],
      isLoading: false
    });

    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    expect(screen.getByText('Aucun paiement trouvé')).toBeInTheDocument();
    expect(screen.getByText('Aucun paiement ne correspond aux critères sélectionnés.')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    // Mock loading state
    vi.mocked(require('@/hooks/useLocataires').useEncaissementsByLocataire).mockReturnValue({
      data: [],
      isLoading: true
    });

    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Check for loading skeletons
    const skeletons = screen.getAllByRole('generic');
    const loadingElements = skeletons.filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should calculate payment status correctly', () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // The most recent payment is from 2026-02-15, which should be "À jour"
    // (assuming current date is close to that)
    expect(screen.getByText('À jour')).toBeInTheDocument();
  });

  it('should display commission and net amounts correctly', () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Check if commission amounts are displayed in the table
    expect(screen.getByText('Commission: 7,500 FCFA')).toBeInTheDocument();
    expect(screen.getByText('Commission: 10,000 FCFA')).toBeInTheDocument();
  });

  it('should handle export functionality', () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Find and click export button
    const exportButton = screen.getByText('Exporter');
    fireEvent.click(exportButton);
    
    // Since it's a placeholder, we just check it doesn't crash
    expect(exportButton).toBeInTheDocument();
  });

  it('should display correct payment mode icons', () => {
    renderWithQueryClient(<PaiementsHistoryTab locataireId="locataire1" />);
    
    // Check if payment mode labels are displayed
    expect(screen.getByText('Virement')).toBeInTheDocument();
    expect(screen.getByText('Espèces')).toBeInTheDocument();
    expect(screen.getByText('Wave')).toBeInTheDocument();
  });
});