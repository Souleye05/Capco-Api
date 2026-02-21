import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Banknote,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useHonoraires, useHonorairesStats } from '@/hooks/useHonoraires';
import { NouvelHonoraireDialog } from '@/components/dialogs/NouvelHonoraireDialog';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Honoraire {
  id: string;
  affaireId: string;
  affaire: {
    id: string;
    reference: string;
    intitule: string;
    parties: Array<{
      id: string;
      nom: string;
      role: string;
    }>;
  };
  montantFacture: number;
  montantEncaisse: number;
  montantRestant: number;
  dateFacturation?: string;
  notes?: string;
  paiements: Array<{
    id: string;
    date: string;
    montant: number;
    modePaiement: string;
    notes?: string;
  }>;
  createdAt: string;
}

interface HonorairesStats {
  totalFacture: number;
  totalEncaisse: number;
  totalRestant: number;
  nombreHonoraires: number;
}

export default function HonorairesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNouvelHonoraire, setShowNouvelHonoraire] = useState(false);

  // Fetch honoraires
  const { data: honorairesResponse, isLoading: honorairesLoading } = useHonoraires({
    page: currentPage,
    limit: 10,
    search: searchQuery || undefined
  });

  // Fetch statistics
  const { data: statsResponse, isLoading: statsLoading } = useHonorairesStats();

  const honoraires = (honorairesResponse as any)?.data?.data || [];
  const pagination = (honorairesResponse as any)?.data?.pagination;
  const stats: HonorairesStats = (statsResponse as any)?.data || {
    totalFacture: 0,
    totalEncaisse: 0,
    totalRestant: 0,
    nombreHonoraires: 0
  };

  if (honorairesLoading || statsLoading) {
    return (
      <div className="min-h-screen">
        <Header 
          title="Honoraires" 
          subtitle="Chargement..." 
          breadcrumbs={[
            { label: 'Contentieux' }, 
            { label: 'Honoraires' }
          ]} 
        />
        <div className="p-6 lg:p-8 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title="Honoraires Contentieux" 
        subtitle={`${stats.nombreHonoraires} honoraires • ${formatCurrency(stats.totalRestant)} en attente`}
        breadcrumbs={[
          { label: 'Contentieux', href: '/contentieux/affaires' },
          { label: 'Honoraires' },
        ]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setShowNouvelHonoraire(true)}>
            <Plus className="h-4 w-4" />
            Nouvel honoraire
          </Button>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        <NouvelHonoraireDialog 
          open={showNouvelHonoraire} 
          onOpenChange={setShowNouvelHonoraire} 
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturé</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalFacture)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Encaissé</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalEncaisse)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.totalRestant)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nombre</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.nombreHonoraires}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par référence d'affaire, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </Button>
        </div>

        {/* Honoraires List */}
        <div className="space-y-4">
          {honoraires.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun honoraire trouvé</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Commencez par créer votre premier honoraire pour une affaire.
                </p>
                <Button onClick={() => setShowNouvelHonoraire(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un honoraire
                </Button>
              </CardContent>
            </Card>
          ) : (
            honoraires.map((honoraire: Honoraire) => (
              <Card key={honoraire.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {honoraire.affaire.reference}
                        </h3>
                        <Badge variant="outline">
                          {honoraire.affaire.parties.length} partie(s)
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">
                        {honoraire.affaire.intitule}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        {honoraire.dateFacturation && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(honoraire.dateFacturation), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {honoraire.paiements.length} paiement(s)
                        </div>
                      </div>

                      {honoraire.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {honoraire.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-lg font-semibold text-blue-600">
                        {formatCurrency(honoraire.montantFacture)}
                      </div>
                      <div className="text-sm text-green-600">
                        Encaissé: {formatCurrency(honoraire.montantEncaisse)}
                      </div>
                      {honoraire.montantRestant > 0 && (
                        <div className="text-sm text-orange-600">
                          Restant: {formatCurrency(honoraire.montantRestant)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {pagination.currentPage} sur {pagination.totalPages} • {pagination.total} honoraires
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage === 1}
                onClick={() => setCurrentPage(pagination.currentPage - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(pagination.currentPage + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}