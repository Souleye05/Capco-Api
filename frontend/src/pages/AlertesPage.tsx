import { useState } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter,
  Calendar,
  Banknote,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { mockAlertes } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { formatDateLong, parseDateFromAPI } from '@/lib/date-utils';
import { Alerte } from '@/types';

const alerteIcons = {
  AUDIENCE_NON_RENSEIGNEE: Calendar,
  DOSSIER_SANS_ACTION: Banknote,
  LOYER_IMPAYE: Building2,
  ECHEANCE_PROCHE: AlertTriangle,
};

const prioriteStyles = {
  HAUTE: {
    border: 'border-l-destructive',
    bg: 'bg-destructive/5',
    badge: 'bg-destructive text-destructive-foreground',
    icon: 'text-destructive'
  },
  MOYENNE: {
    border: 'border-l-warning',
    bg: 'bg-warning/5',
    badge: 'bg-warning text-warning-foreground',
    icon: 'text-warning'
  },
  BASSE: {
    border: 'border-l-info',
    bg: 'bg-info/5',
    badge: 'bg-info text-info-foreground',
    icon: 'text-info'
  }
};

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>(mockAlertes);

  const nonLues = alertes.filter(a => !a.lu);
  const lues = alertes.filter(a => a.lu);

  const marquerCommeLue = (id: string) => {
    setAlertes(prev => prev.map(a => 
      a.id === id ? { ...a, lu: true } : a
    ));
  };

  const marquerToutesCommeLues = () => {
    setAlertes(prev => prev.map(a => ({ ...a, lu: true })));
  };

  const supprimer = (id: string) => {
    setAlertes(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Alertes" 
        subtitle={`${nonLues.length} non lue(s)`}
        actions={
          nonLues.length > 0 ? (
            <Button variant="outline" onClick={marquerToutesCommeLues} className="gap-2">
              <Check className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          ) : null
        }
      />

      <div className="p-6 animate-fade-in">
        <Tabs defaultValue="non-lues" className="space-y-6">
          <TabsList>
            <TabsTrigger value="non-lues" className="gap-2">
              Non lues
              {nonLues.length > 0 && (
                <Badge variant="destructive">{nonLues.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="lues">Lues</TabsTrigger>
            <TabsTrigger value="toutes">Toutes</TabsTrigger>
          </TabsList>

          <TabsContent value="non-lues" className="space-y-4">
            {nonLues.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Aucune alerte non lue</p>
              </div>
            ) : (
              nonLues.map(alerte => (
                <AlerteCard 
                  key={alerte.id} 
                  alerte={alerte} 
                  onMarkRead={() => marquerCommeLue(alerte.id)}
                  onDelete={() => supprimer(alerte.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="lues" className="space-y-4">
            {lues.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune alerte lue</p>
              </div>
            ) : (
              lues.map(alerte => (
                <AlerteCard 
                  key={alerte.id} 
                  alerte={alerte} 
                  onDelete={() => supprimer(alerte.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="toutes" className="space-y-4">
            {alertes.map(alerte => (
              <AlerteCard 
                key={alerte.id} 
                alerte={alerte} 
                onMarkRead={!alerte.lu ? () => marquerCommeLue(alerte.id) : undefined}
                onDelete={() => supprimer(alerte.id)}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface AlerteCardProps {
  alerte: Alerte;
  onMarkRead?: () => void;
  onDelete: () => void;
}

function AlerteCard({ alerte, onMarkRead, onDelete }: AlerteCardProps) {
  const Icon = alerteIcons[alerte.type];
  const style = prioriteStyles[alerte.priorite];

  return (
    <div className={cn(
      'p-5 rounded-lg border-l-4 transition-all',
      style.border,
      alerte.lu ? 'bg-card opacity-60' : style.bg
    )}>
      <div className="flex items-start gap-4">
        <div className={cn('p-2.5 rounded-lg bg-card', !alerte.lu && 'shadow-sm')}>
          <Icon className={cn('h-5 w-5', style.icon)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground">{alerte.titre}</h4>
            <Badge className={style.badge}>
              {alerte.priorite.toLowerCase()}
            </Badge>
            {!alerte.lu && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{alerte.description}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDateLong(parseDateFromAPI(alerte.dateCreation))}
          </p>
        </div>

        <div className="flex gap-2">
          {onMarkRead && (
            <Button variant="ghost" size="sm" onClick={onMarkRead} className="gap-1">
              <Check className="h-4 w-4" />
              Lu
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
