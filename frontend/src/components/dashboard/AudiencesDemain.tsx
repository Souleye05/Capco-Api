import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudienceDB {
  id: string;
  affaire_id: string;
  date: string;
  heure: string | null;
  objet: 'MISE_EN_ETAT' | 'PLAIDOIRIE' | 'REFERE' | 'AUTRE';
  statut: 'A_VENIR' | 'PASSEE_NON_RENSEIGNEE' | 'RENSEIGNEE';
  notes_preparation: string | null;
  affaires?: {
    id: string;
    reference: string;
    intitule: string;
    juridiction: string;
    chambre: string;
  };
}

interface AudiencesDemainProps {
  audiences: AudienceDB[];
}

const objetLabels = {
  MISE_EN_ETAT: 'Mise en état',
  PLAIDOIRIE: 'Plaidoirie',
  REFERE: 'Référé',
  AUTRE: 'Autre'
};

export function AudiencesDemain({ audiences }: AudiencesDemainProps) {
  if (audiences.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Aucune audience demain</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {audiences.map((audience) => (
        <div
          key={audience.id}
          className="p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="module-badge module-badge-contentieux">
                  {objetLabels[audience.objet]}
                </span>
                {audience.heure && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {audience.heure}
                  </span>
                )}
              </div>
              <h4 className="font-medium text-foreground">
                {audience.affaires?.reference}
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                {audience.affaires?.intitule}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {audience.affaires?.juridiction} - {audience.affaires?.chambre}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {audience.notes_preparation && (
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Notes: </span>
              {audience.notes_preparation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
