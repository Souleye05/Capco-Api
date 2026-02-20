import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  FileText, 
  Plus,
  Edit,
  Building2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAudience } from '@/hooks/useAudiences';
import { ResultatAudienceCard } from '@/components/audiences/ResultatAudienceCard';
import { ResultatAudienceDialog } from '@/components/dialogs/ResultatAudienceDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'A_VENIR':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">À venir</Badge>;
    case 'PASSEE_NON_RENSEIGNEE':
      return <Badge variant="destructive">Non renseignée</Badge>;
    case 'RENSEIGNEE':
      return <Badge variant="default" className="bg-green-100 text-green-800">Renseignée</Badge>;
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
};

const getTypeBadge = (type: string) => {
  const typeLabels = {
    'MISE_EN_ETAT': 'Mise en état',
    'PLAIDOIRIE': 'Plaidoirie',
    'REFERE': 'Référé',
    'EVOCATION': 'Évocation',
    'CONCILIATION': 'Conciliation',
    'MEDIATION': 'Médiation',
    'AUTRE': 'Autre'
  };
  
  return <Badge variant="outline">{typeLabels[type as keyof typeof typeLabels] || type}</Badge>;
};

export function AudienceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showResultatDialog, setShowResultatDialog] = useState(false);
  
  // Validate that we have a valid UUID
  if (!id) {
    return (
      <div className="min-h-screen">
        <Header 
          title="Audience introuvable" 
          breadcrumbs={[
            { label: 'Contentieux', href: '/contentieux/affaires' },
            { label: 'Audiences', href: '/contentieux/audiences' },
            { label: 'Erreur' },
          ]}
        />
        <div className="p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">ID d'audience manquant dans l'URL.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/contentieux/audiences')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux audiences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return (
      <div className="min-h-screen">
        <Header 
          title="Audience introuvable" 
          breadcrumbs={[
            { label: 'Contentieux', href: '/contentieux/affaires' },
            { label: 'Audiences', href: '/contentieux/audiences' },
            { label: 'Erreur' },
          ]}
        />
        <div className="p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">ID d'audience invalide: {id}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/contentieux/audiences')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux audiences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const { data: audience, isLoading, error } = useAudience(id);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header 
          title="Détails de l'audience" 
          subtitle="Chargement..."
          breadcrumbs={[
            { label: 'Contentieux', href: '/contentieux/affaires' },
            { label: 'Audiences', href: '/contentieux/audiences' },
            { label: 'Détails' },
          ]}
        />
        <div className="p-6 lg:p-8 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !audience) {
    return (
      <div className="min-h-screen">
        <Header 
          title="Audience introuvable" 
          breadcrumbs={[
            { label: 'Contentieux', href: '/contentieux/affaires' },
            { label: 'Audiences', href: '/contentieux/audiences' },
            { label: 'Erreur' },
          ]}
        />
        <div className="p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Cette audience n'existe pas ou n'est plus accessible.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/contentieux/audiences')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux audiences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const audienceInfo = {
    reference: audience.affaire?.reference || 'N/A',
    intitule: audience.affaire?.intitule || 'N/A',
    date: audience.date,
    juridiction: audience.juridiction
  };

  const canAddResult = audience.statut === 'PASSEE_NON_RENSEIGNEE';
  const hasResult = audience.statut === 'RENSEIGNEE';

  return (
    <div className="min-h-screen">
      <Header 
        title="Détails de l'audience" 
        subtitle={`${audience.affaire?.reference} - ${new Date(audience.date).toLocaleDateString('fr-FR')}`}
        breadcrumbs={[
          { label: 'Contentieux', href: '/contentieux/affaires' },
          { label: 'Audiences', href: '/contentieux/audiences' },
          { label: 'Détails' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/contentieux/audiences')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            {canAddResult && (
              <Button 
                size="sm" 
                onClick={() => setShowResultatDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Saisir le résultat
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Informations de l'audience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Informations de l'audience</span>
              <div className="flex items-center gap-2">
                {getStatutBadge(audience.statut)}
                {getTypeBadge(audience.type)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Affaire */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Affaire</div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{audience.affaire?.reference}</span>
                </div>
                <div className="text-sm text-muted-foreground pl-6">
                  {audience.affaire?.intitule}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Statut de l'affaire</div>
                <div className="pl-6">
                  <Badge variant={audience.affaire?.statut === 'ACTIVE' ? 'default' : 'secondary'}>
                    {audience.affaire?.statut === 'ACTIVE' ? 'Active' : audience.affaire?.statut}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Date et heure */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(audience.date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
              
              {audience.heure && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Heure</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{audience.heure}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Type</div>
                <div className="pl-6">
                  {getTypeBadge(audience.type)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Lieu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Juridiction</div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{audience.juridiction}</span>
                </div>
              </div>
              
              {audience.chambre && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Chambre</div>
                  <div className="pl-6">
                    <span>{audience.chambre}</span>
                  </div>
                </div>
              )}
              
              {audience.ville && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Ville</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{audience.ville}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes de préparation */}
            {audience.notesPreparation && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Notes de préparation</div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    {audience.notesPreparation}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Résultat de l'audience */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Résultat de l'audience</h2>
            {canAddResult && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResultatDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Saisir le résultat
              </Button>
            )}
          </div>
          
          <ResultatAudienceCard
            audienceId={audience.id}
            audienceInfo={audienceInfo}
            canEdit={hasResult}
            canDelete={hasResult}
          />
        </div>

        {/* Informations de création */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de création</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Créée le :</span>{' '}
              {new Date(audience.createdAt).toLocaleDateString('fr-FR')} à{' '}
              {new Date(audience.createdAt).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            {audience.updatedAt && audience.updatedAt !== audience.createdAt && (
              <div className="text-sm">
                <span className="text-muted-foreground">Modifiée le :</span>{' '}
                {new Date(audience.updatedAt).toLocaleDateString('fr-FR')} à{' '}
                {new Date(audience.updatedAt).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {audience && (
        <ResultatAudienceDialog
          open={showResultatDialog}
          onOpenChange={setShowResultatDialog}
          audienceId={audience.id}
          audienceInfo={audienceInfo}
          mode="create"
        />
      )}
    </div>
  );
}