import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gavel, Banknote, Building2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NouvelleActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actions = [
  {
    id: 'contentieux',
    label: 'Nouvelle affaire contentieuse',
    description: 'Créer une nouvelle affaire au contentieux',
    icon: Gavel,
    color: 'text-info',
    bgColor: 'bg-info/10',
    route: '/contentieux/affaires'
  },
  {
    id: 'recouvrement',
    label: 'Nouveau dossier recouvrement',
    description: 'Ouvrir un nouveau dossier de recouvrement',
    icon: Banknote,
    color: 'text-success',
    bgColor: 'bg-success/10',
    route: '/recouvrement/dossiers'
  },
  {
    id: 'immobilier',
    label: 'Nouvel encaissement loyer',
    description: 'Enregistrer un paiement de loyer',
    icon: Building2,
    color: 'text-immobilier',
    bgColor: 'bg-immobilier/10',
    route: '/immobilier'
  },
  {
    id: 'conseil',
    label: 'Nouvelle tâche conseil',
    description: 'Ajouter une tâche pour un client conseil',
    icon: Briefcase,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    route: '/conseil/clients'
  }
];

export function NouvelleActionDialog({ open, onOpenChange }: NouvelleActionDialogProps) {
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleActionClick = (actionId: string, route: string) => {
    setSelectedAction(actionId);
    onOpenChange(false);
    navigate(route);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle action</DialogTitle>
          <DialogDescription>
            Choisissez le type d'action que vous souhaitez effectuer
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id, action.route)}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border text-left transition-all',
                  'hover:shadow-md hover:border-primary/30',
                  selectedAction === action.id && 'border-primary bg-primary/5'
                )}
              >
                <div className={cn('p-2.5 rounded-lg', action.bgColor)}>
                  <Icon className={cn('h-5 w-5', action.color)} />
                </div>
                <div>
                  <h4 className="font-medium">{action.label}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}