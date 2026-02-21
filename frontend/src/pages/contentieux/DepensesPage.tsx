import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Receipt,
  Calendar,
  FileText,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepenses, useDepensesStats } from '@/hooks/useDepenses';
import { NouvelleDepenseDialog } from '@/components/dialogs/NouvelleDepenseDialog';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Depense {
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
  date: string;
  typeDepense: string;
  nature: string;
  montant: number;
  description?: string;
  justificatif?: string;
  createdAt: string;
}

interface DepensesStats {
  totalMontant: number;
  nombreDepenses: number;
  parType: Array<{
    type: string;
    montant: number;
    nombre: number;
  }>;
}

const typeDepenseLabels: Record<string, string> = {
  'FRAIS_JUSTICE': 'Frais de justice',
  'FRAIS_HUISSIER': 'Frais d\'huissier',
  'FRAIS_GREFFE': 'Frais de greffe',
  'FRAIS_EXPERTISE': 'Frais d\'expertise',
  'FRAIS_DEPLACEMENT': 'Frais de déplacement',
  'FRAIS_COURRIER': 'Frais de courrier',
  'TIMBRES_FISCAUX': 'Timbres fiscaux',
  'AUTRES': 'Autres frais'
};

const getTypeDepenseColor = (type: string) => {
  const colors: Record<string, string> = {
    'FRAIS_JUSTICE': 'bg-blue-100 text-blue-800',
    'FRAIS_HUISSIER': 'bg-purple-100 text-purple-800',
    'FRAIS_GREFFE': 'bg-green-100 text-green-800',
    'FRAIS_EXPERTISE': 'bg-orange-100 text-orange-800',
    'FRAIS_DEPLACEMENT': 'bg-yellow-100 text-yellow-800',
    'FRAIS_COURRIER': 'bg-pink-100 text-pink-800',
    'TIMBRES_FISCAUX': 'bg-indigo-100 text-indigo-800',
    'AUTRES': 'bg-gray-100 text-gray-800'
  };
  return colors[type] || colors['AUTRES'];
};

export default function DepensesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNouvelleDepense, setShowNouvelleDepense] = useState(false);

  // Fetch dépenses
  const { data: depensesResponse, isLoading: depensesLoading } = useDepenses({
    page: currentPage,
    limit: 10,
    search: searchQuery || undefined
  });

  // Fetch statistics
  const { data: statsResponse, isLoading: statsLoading } = useDepensesStats();

  const depenses = (depensesResponse as any)?.data?.data || [];
  const pagination = (depensesResponse as any)?.data?.pagination;
  const stats: DepensesStats = (statsResponse as any)?.data || {
    totalMontant: 0,
    nombreDepenses: 0,
    parType: []
  };

  if (depensesLoading || statsLoading) {
    return (
      <div className="min-h-screen">
        <Header 
          title="Dépenses" 
          subtitle="Chargement..." 
          breadcrumbs={[
            { label: 'Contentieux' }, 
            { label: 'Dépenses' }
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
        title="Dépenses Affaires" 
        subtitle={`${stats.nombreDepenses} dépenses • ${formatCurrency(stats.totalMontant)} total`}
        breadcrumbs={[
          { label: 'Contentieux', href: '/contentieux/affaires' },
          { label: 'Dépenses' },
        ]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setShowNouvelleDepense(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle dépense
          </Button>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        <NouvelleDepenseDialog 
          open={showNouvelleDepense} 
          onOpenChange={setShowNouvelleDepense} 
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalMontant)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nombre de Dépenses</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.nombreDepenses}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Types de Dépenses</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.parType.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Types Breakdown */}
        {stats.parType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.parType.map((typeStats) => (
                  <div key={typeStats.type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {typeDepenseLabels[typeStats.type] || typeStats.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {typeStats.nombre} dépense(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatCurrency(typeStats.montant)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par référence d'affaire, nature, description..."
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

        {/* Dépenses List */}
        <div className="space-y-4">
          {depenses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune dépense trouvée</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Commencez par enregistrer votre première dépense pour une affaire.
                </p>
                <Button onClick={() => setShowNouvelleDepense(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une dépense
                </Button>
              </CardContent>
            </Card>
          ) : (
            depenses.map((depense: Depense) => (
              <Card key={depense.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {depense.affaire.reference}
                        </h3>
                        <Badge className={getTypeDepenseColor(depense.typeDepense)}>
                          {typeDepenseLabels[depense.typeDepense] || depense.typeDepense}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-2">
                        {depense.affaire.intitule}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(depense.date), 'dd MMM yyyy', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {depense.nature}
                        </div>
                      </div>

                      {depense.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {depense.description}
                        </p>
                      )}

                      {depense.justificatif && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <FileText className="h-3 w-3" />
                          {depense.justificatif}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-semibold text-red-600">
                        {formatCurrency(depense.montant)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(depense.createdAt), 'dd/MM/yyyy', { locale: fr })}
                      </div>
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
              Page {pagination.currentPage} sur {pagination.totalPages} • {pagination.total} dépenses
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