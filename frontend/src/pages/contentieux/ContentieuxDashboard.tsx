import { useState } from 'react';
import {
  BarChart3,
  Calendar,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useContentieuxDashboard,
  usePlanningAudiences,
  useRechercheGlobale,
  useIndicateursPerformance
} from '@/hooks/useContentieuxDashboard';

import { StatCard } from '@/components/ui/stat-card';
import { formatDate, formatDateTimeUTC, parseDateFromAPI, createUTCDate, addDays } from '@/lib/date-utils';

export default function ContentieuxDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: dashboard, isLoading: dashboardLoading } = useContentieuxDashboard();
  const { data: planning } = usePlanningAudiences();
  const { data: searchResults } = useRechercheGlobale(searchTerm);
  const { data: indicateurs } = useIndicateursPerformance();

  // Calcul des dates pour le planning
  const today = createUTCDate(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const nextWeek = addDays(today, 7);

  if (dashboardLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Dashboard Contentieux"
          description="Vue d'ensemble de l'activité contentieuse"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard Contentieux"
        description="Vue d'ensemble de l'activité contentieuse"
      />

      {/* Barre de recherche globale */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans toutes les données contentieuses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {searchResults && searchTerm && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Résultats de recherche :</h4>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                {searchResults.affaires?.length > 0 && (
                  <div>
                    <Badge variant="outline">Affaires ({searchResults.affaires.length})</Badge>
                  </div>
                )}
                {searchResults.audiences?.length > 0 && (
                  <div>
                    <Badge variant="outline">Audiences ({searchResults.audiences.length})</Badge>
                  </div>
                )}
                {searchResults.honoraires?.length > 0 && (
                  <div>
                    <Badge variant="outline">Honoraires ({searchResults.honoraires.length})</Badge>
                  </div>
                )}
                {searchResults.depenses?.length > 0 && (
                  <div>
                    <Badge variant="outline">Dépenses ({searchResults.depenses.length})</Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Affaires Actives"
          value={dashboard?.affaires.actives || 0}
          icon={FileText}
          subtitle={`${dashboard?.affaires.total || 0} au total`}
          trend={{ value: 12, isPositive: true }}
          variant="contentieux"
        />

        <StatCard
          title="Audiences à venir"
          value={dashboard?.audiences.a_venir || 0}
          icon={Calendar}
          subtitle={`${dashboard?.audiences.cette_semaine || 0} cette semaine`}
          trend={{ value: 8, isPositive: true }}
          variant="contentieux"
        />

        <StatCard
          title="CA Prévisionnel"
          value={`${(dashboard?.financier.ca_previsionnel || 0).toLocaleString()} FCFA`}
          icon={DollarSign}
          subtitle="Basé sur les honoraires en cours"
          trend={{ value: 15, isPositive: true }}
          variant="success"
        />

        <StatCard
          title="Taux de Réussite"
          value={`${dashboard?.performance.taux_reussite || 0}%`}
          icon={TrendingUp}
          subtitle="Affaires gagnées"
          trend={{ value: 3, isPositive: true }}
          variant="info"
        />
      </div>

      {/* Détails par section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Affaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Affaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Actives</span>
              <Badge variant="default">{dashboard?.affaires.actives || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Clôturées</span>
              <Badge variant="secondary">{dashboard?.affaires.cloturees || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Radiées</span>
              <Badge variant="destructive">{dashboard?.affaires.radiees || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-green-600">Nouvelles ce mois</span>
              <Badge variant="outline">{dashboard?.affaires.nouvelles_ce_mois || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Audiences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Audiences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                À venir
              </span>
              <Badge variant="default">{dashboard?.audiences.a_venir || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Non renseignées
              </span>
              <Badge variant="destructive">{dashboard?.audiences.passees_non_renseignees || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Renseignées
              </span>
              <Badge variant="secondary">{dashboard?.audiences.renseignees || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blue-600">Cette semaine</span>
              <Badge variant="outline">{dashboard?.audiences.cette_semaine || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Financier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Financier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Honoraires total</span>
                <span className="font-medium">{(dashboard?.financier.honoraires_total || 0).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span className="text-xs">Ce mois</span>
                <span className="text-xs">{(dashboard?.financier.honoraires_ce_mois || 0).toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Dépenses total</span>
                <span className="font-medium">{(dashboard?.financier.depenses_total || 0).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span className="text-xs">Ce mois</span>
                <span className="text-xs">{(dashboard?.financier.depenses_ce_mois || 0).toLocaleString()} FCFA</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning des audiences à venir */}
      <Card>
        <CardHeader>
          <CardTitle>Planning des audiences - 7 prochains jours</CardTitle>
          <CardDescription>
            Audiences programmées du {formatDate(today)} au {formatDate(nextWeek)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {planning && planning.length > 0 ? (
            <div className="space-y-3">
              {planning.slice(0, 5).map((audience) => (
                <div key={audience.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{audience.affaire.reference} - {audience.affaire.intitule}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(parseDateFromAPI(audience.date))}
                      {audience.heure && ` à ${audience.heure}`} - {audience.juridiction}
                    </div>
                  </div>
                  <Badge variant={audience.statut === 'A_VENIR' ? 'default' : 'secondary'}>
                    {audience.type}
                  </Badge>
                </div>
              ))}
              {planning.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    Voir toutes les audiences ({planning.length})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune audience programmée dans les 7 prochains jours
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activité récente */}
      {dashboard?.activite_recente && dashboard.activite_recente.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Dernières actions dans le module contentieux</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.activite_recente.slice(0, 5).map((activite) => (
                <div key={activite.id} className="flex items-center space-x-3 p-2 border-l-2 border-blue-200">
                  <div className="flex-1">
                    <div className="font-medium">{activite.titre}</div>
                    <div className="text-sm text-muted-foreground">{activite.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTimeUTC(parseDateFromAPI(activite.date))} par {activite.utilisateur}
                    </div>
                  </div>
                  <Badge variant="outline">{activite.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}