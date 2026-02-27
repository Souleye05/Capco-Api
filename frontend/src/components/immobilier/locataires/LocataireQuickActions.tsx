import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  FileText, 
  Home, 
  CreditCard, 
  Trash2,
  UserPlus,
  Phone,
  Mail
} from 'lucide-react';
import { type LocataireComplete } from '@/hooks/useLocataires';

interface LocataireQuickActionsProps {
  locataire: LocataireComplete;
  onView: (locataire: LocataireComplete) => void;
  onEdit: (locataire: LocataireComplete) => void;
  onAssignLot?: (locataire: LocataireComplete) => void;
  onViewPayments?: (locataire: LocataireComplete) => void;
  onViewDocuments?: (locataire: LocataireComplete) => void;
  onDelete?: (locataire: LocataireComplete) => void;
}

export function LocataireQuickActions({
  locataire,
  onView,
  onEdit,
  onAssignLot,
  onViewPayments,
  onViewDocuments,
  onDelete
}: LocataireQuickActionsProps) {
  const handleCall = () => {
    if (locataire.telephone) {
      window.open(`tel:${locataire.telephone}`);
    }
  };

  const handleEmail = () => {
    if (locataire.email) {
      window.open(`mailto:${locataire.email}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-muted transition-all"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl w-48">
        <DropdownMenuItem onClick={() => onView(locataire)} className="gap-2 font-medium">
          <Eye className="h-4 w-4" />
          Voir les détails
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onEdit(locataire)} className="gap-2 font-medium">
          <Edit className="h-4 w-4" />
          Modifier
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {locataire.telephone && (
          <DropdownMenuItem onClick={handleCall} className="gap-2 font-medium text-success">
            <Phone className="h-4 w-4" />
            Appeler
          </DropdownMenuItem>
        )}

        {locataire.email && (
          <DropdownMenuItem onClick={handleEmail} className="gap-2 font-medium text-info">
            <Mail className="h-4 w-4" />
            Envoyer un email
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {onAssignLot && locataire.nombreLots === 0 && (
          <DropdownMenuItem onClick={() => onAssignLot(locataire)} className="gap-2 font-medium text-primary">
            <UserPlus className="h-4 w-4" />
            Assigner un lot
          </DropdownMenuItem>
        )}

        {onViewPayments && (
          <DropdownMenuItem onClick={() => onViewPayments(locataire)} className="gap-2 font-medium">
            <CreditCard className="h-4 w-4" />
            Voir les paiements
          </DropdownMenuItem>
        )}

        {onViewDocuments && (
          <DropdownMenuItem onClick={() => onViewDocuments(locataire)} className="gap-2 font-medium">
            <FileText className="h-4 w-4" />
            Gérer les documents
          </DropdownMenuItem>
        )}

        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(locataire)} 
              className="gap-2 font-medium text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}