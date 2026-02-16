import { AlertTriangle, Calendar, Banknote, Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMarkAlerteAsRead } from '@/hooks/useAlertes';

interface AlerteDB {
  id: string;
  titre: string;
  description: string;
  type: 'AUDIENCE_NON_RENSEIGNEE' | 'DOSSIER_SANS_ACTION' | 'LOYER_IMPAYE' | 'ECHEANCE_PROCHE' | 'FACTURE_IMPAYEE';
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
  lu: boolean;
  lien: string | null;
  created_at: string;
}

interface AlertesListProps {
  alertes: AlerteDB[];
  limit?: number;
}

const alerteIcons = {
  AUDIENCE_NON_RENSEIGNEE: Calendar,
  DOSSIER_SANS_ACTION: Banknote,
  LOYER_IMPAYE: Building2,
  ECHEANCE_PROCHE: AlertTriangle,
  FACTURE_IMPAYEE: AlertTriangle,
};

const prioriteColors = {
  HAUTE: 'border-l-destructive bg-destructive/5',
  MOYENNE: 'border-l-warning bg-warning/5',
  BASSE: 'border-l-info bg-info/5',
};

// Map alert types to their corresponding routes
const getAlertRoute = (alerte: AlerteDB): string => {
  if (alerte.lien) return alerte.lien;
  
  switch (alerte.type) {
    case 'AUDIENCE_NON_RENSEIGNEE':
      return '/contentieux/audiences';
    case 'DOSSIER_SANS_ACTION':
      return '/recouvrement/dossiers';
    case 'LOYER_IMPAYE':
      return '/immobilier';
    case 'ECHEANCE_PROCHE':
      return '/recouvrement/dossiers';
    case 'FACTURE_IMPAYEE':
      return '/conseil/factures';
    default:
      return '/dashboard';
  }
};

export function AlertesList({ alertes, limit }: AlertesListProps) {
  const navigate = useNavigate();
  const markAsRead = useMarkAlerteAsRead();
  const displayedAlertes = limit ? alertes.slice(0, limit) : alertes;

  const handleAlertClick = async (alerte: AlerteDB) => {
    if (!alerte.lu) {
      await markAsRead.mutateAsync(alerte.id);
    }
    const route = getAlertRoute(alerte);
    navigate(route);
  };

  if (displayedAlertes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Aucune alerte en cours</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedAlertes.map((alerte) => {
        const Icon = alerteIcons[alerte.type];
        return (
          <div
            key={alerte.id}
            onClick={() => handleAlertClick(alerte)}
            className={cn(
              'p-4 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer',
              prioriteColors[alerte.priorite]
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                alerte.priorite === 'HAUTE' && 'bg-destructive/10',
                alerte.priorite === 'MOYENNE' && 'bg-warning/10',
                alerte.priorite === 'BASSE' && 'bg-info/10'
              )}>
                <Icon className={cn(
                  'h-5 w-5',
                  alerte.priorite === 'HAUTE' && 'text-destructive',
                  alerte.priorite === 'MOYENNE' && 'text-warning',
                  alerte.priorite === 'BASSE' && 'text-info'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">{alerte.titre}</h4>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {alerte.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      {limit && alertes.length > limit && (
        <Button 
          variant="ghost" 
          className="w-full text-primary"
          onClick={() => navigate('/alertes')}
        >
          Voir toutes les alertes ({alertes.length})
        </Button>
      )}
    </div>
  );
}
