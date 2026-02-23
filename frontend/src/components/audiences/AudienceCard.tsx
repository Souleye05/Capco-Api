import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  FileText,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Copy,
  Download,
  Bell,
  BookCheck,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AudienceDB, useMarquerEnrolementEffectue } from '@/hooks/useAudiences';
import { ModifierAudienceDialog } from '@/components/dialogs/ModifierAudienceDialog';
import { SupprimerAudienceDialog } from '@/components/dialogs/SupprimerAudienceDialog';

interface AudienceCardProps {
  audience: AudienceDB;
  onSaisirResultat?: (audience: AudienceDB) => void;
  onVoirDetails?: (id: string) => void;
}

const statusConfig = {
  A_VENIR: { label: 'À venir', variant: 'default' as const, color: 'text-blue-600' },
  PASSEE_NON_RENSEIGNEE: { label: 'Non renseignée', variant: 'destructive' as const, color: 'text-red-600' },
  RENSEIGNEE: { label: 'Renseignée', variant: 'success' as const, color: 'text-green-600' },
};

const typeConfig = {
  MISE_EN_ETAT: 'Mise en état',
  PLAIDOIRIE: 'Plaidoirie',
  REFERE: 'Référé',
  EVOCATION: 'Évocation',
  CONCILIATION: 'Conciliation',
  MEDIATION: 'Médiation',
  AUTRE: 'Autre',
};

export function AudienceCard({ audience, onSaisirResultat, onVoirDetails }: AudienceCardProps) {
  const [showModifier, setShowModifier] = useState(false);
  const [showSupprimer, setShowSupprimer] = useState(false);
  const marquerEnrolementMutation = useMarquerEnrolementEffectue();

  const audienceDate = new Date(audience.date);
  const isPassee = audienceDate < new Date();
  const status = statusConfig[audience.statut];

  const formattedDate = audienceDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = audience.heure || 'Heure non précisée';

  const handleModifier = () => {
    setShowModifier(true);
  };

  const handleSupprimer = () => {
    setShowSupprimer(true);
  };

  const handleMarquerEnrolement = () => {
    marquerEnrolementMutation.mutate(audience.id);
  };

  const audienceForDialog = {
    id: audience.id,
    affaireId: audience.affaireId,
    date: audience.date,
    heure: audience.heure,
    type: audience.type,
    juridiction: audience.juridiction,
    chambre: audience.chambre,
    ville: audience.ville,
    statut: audience.statut,
    notesPreparation: audience.notesPreparation,
    estPreparee: audience.estPrepare,
    rappelEnrolement: audience.rappelEnrolement || false,
  };

  const audienceForDelete = {
    id: audience.id,
    date: audience.date,
    juridiction: audience.juridiction,
    affaire: audience.affaire,
  };

  return (
    <>
      <Card className={cn(
        "border-border/50 transition-all duration-200 hover:shadow-sm",
        audience.statut === 'PASSEE_NON_RENSEIGNEE' && "border-destructive/30 bg-destructive/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">
                      {audience.affaire?.reference || 'N/A'}
                    </h3>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {audience.affaire?.intitule || 'Intitulé non disponible'}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onVoirDetails?.(audience.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleModifier}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    {audience.rappelEnrolement && !audience.enrolementEffectue && (
                      <DropdownMenuItem onClick={handleMarquerEnrolement}>
                        <BookCheck className="h-4 w-4 mr-2" />
                        Marquer enrôlement effectué
                      </DropdownMenuItem>
                    )}
                    {audience.statut === 'PASSEE_NON_RENSEIGNEE' && onSaisirResultat && (
                      <DropdownMenuItem onClick={() => onSaisirResultat(audience)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Saisir le résultat
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={handleSupprimer}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="capitalize">{formattedDate}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{formattedTime}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{audience.juridiction}</span>
                </div>

                {audience.ville && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{audience.ville}</span>
                  </div>
                )}
              </div>

              {/* Type et chambre */}
              <div className="flex items-center gap-3 text-xs">
                <Badge variant="outline" className="text-xs">
                  {typeConfig[audience.type] || audience.type}
                </Badge>
                {audience.chambre && (
                  <span className="text-muted-foreground">{audience.chambre}</span>
                )}
                {audience.rappelEnrolement && !audience.enrolementEffectue && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                    <Bell className="h-3 w-3 mr-1" />
                    Rappel enrôlement
                  </Badge>
                )}
              </div>

              {/* Notes */}
              {audience.notesPreparation && (
                <div className="flex items-start gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                  <p className="text-muted-foreground line-clamp-2">
                    {audience.notesPreparation}
                  </p>
                </div>
              )}

              {/* Parties */}
              {audience.affaire?.parties && audience.affaire.parties.length > 0 && (
                <div className="text-xs">
                  <p className="text-muted-foreground mb-1">Parties :</p>
                  <div className="flex flex-wrap gap-1">
                    {audience.affaire.parties.slice(0, 3).map((partie, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {partie.nom} ({partie.role})
                      </Badge>
                    ))}
                    {audience.affaire.parties.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{audience.affaire.parties.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ModifierAudienceDialog
        open={showModifier}
        onOpenChange={setShowModifier}
        audience={audienceForDialog}
      />

      <SupprimerAudienceDialog
        open={showSupprimer}
        onOpenChange={setShowSupprimer}
        audience={audienceForDelete}
      />
    </>
  );
}