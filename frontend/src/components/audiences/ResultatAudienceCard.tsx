import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  FileText,
  AlertTriangle,
  Edit,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatDate, parseDateFromAPI } from '@/lib/date-utils';
import { useResultatAudience, useDeleteResultatAudience } from '@/hooks/useResultatsAudiences';
import { ResultatAudienceDialog } from '@/components/dialogs/ResultatAudienceDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { TypeResultatAudience } from '@/types/api';

interface ResultatAudienceCardProps {
  audienceId: string | undefined;
  audienceInfo?: {
    reference: string;
    intitule: string;
    date: string;
    juridiction: string;
  };
  canEdit?: boolean;
  canDelete?: boolean;
}

const getResultatIcon = (type: TypeResultatAudience) => {
  switch (type) {
    case 'RENVOI':
      return <Calendar className="h-4 w-4" />;
    case 'RADIATION':
      return <AlertTriangle className="h-4 w-4" />;
    case 'DELIBERE':
      return <FileText className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getResultatBadge = (type: TypeResultatAudience) => {
  switch (type) {
    case 'RENVOI':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Renvoi</Badge>;
    case 'RADIATION':
      return <Badge variant="destructive">Radiation</Badge>;
    case 'DELIBERE':
      return <Badge variant="default" className="bg-green-100 text-green-800">Délibéré</Badge>;
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
};

export function ResultatAudienceCard({
  audienceId,
  audienceInfo,
  canEdit = true,
  canDelete = false
}: ResultatAudienceCardProps) {
  // Safety check: don't render if audienceId is invalid
  if (!audienceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Audience non disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data: resultat, isLoading } = useResultatAudience(audienceId);
  const deleteResultat = useDeleteResultatAudience();
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 animate-spin mr-2" />
            Chargement du résultat...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resultat) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun résultat enregistré pour cette audience</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteResultat.mutateAsync(audienceId);
    } catch (error) {
      // L'erreur est gérée par le hook
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getResultatIcon(resultat.type)}
              Résultat d'audience
            </div>
            <div className="flex items-center gap-2">
              {getResultatBadge(resultat.type)}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le résultat</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer ce résultat d'audience ?
                        Cette action est irréversible et remettra l'audience au statut "Non renseignée".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resultat.type === 'RENVOI' && (
            <>
              {resultat.nouvelleDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Nouvelle date :</span>
                  <span>{formatDate(parseDateFromAPI(resultat.nouvelleDate))}</span>
                </div>
              )}
              {resultat.motifRenvoi && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Motif du renvoi :</div>
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {resultat.motifRenvoi}
                  </div>
                </div>
              )}
            </>
          )}

          {resultat.type === 'RADIATION' && resultat.motifRadiation && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Motif de la radiation :</div>
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {resultat.motifRadiation}
              </div>
            </div>
          )}

          {resultat.type === 'DELIBERE' && resultat.texteDelibere && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Texte du délibéré :</div>
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {resultat.texteDelibere}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <CheckCircle className="h-3 w-3" />
            Enregistré le {(() => {
              const createdDate = parseDateFromAPI(resultat.createdAt);
              return createdDate.toLocaleDateString('fr-FR', { timeZone: 'UTC' }) +
                ' à ' +
                createdDate.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'UTC'
                });
            })()}
          </div>
        </CardContent>
      </Card>

      <ResultatAudienceDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        audienceId={audienceId}
        audienceInfo={audienceInfo}
        mode="edit"
      />
    </>
  );
}