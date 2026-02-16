import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NouvelleAffaireDialog } from '@/components/dialogs/NouvelleAffaireDialog';
import { useAffaires } from '@/hooks/useAffaires';
import { cn } from '@/lib/utils';

const statutLabels = {
  ACTIVE: { label: 'Active', variant: 'success' as const },
  CLOTUREE: { label: 'Clôturée', variant: 'secondary' as const },
  RADIEE: { label: 'Radiée', variant: 'destructive' as const }
};

export default function AffairesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  const [showNouvelleAffaire, setShowNouvelleAffaire] = useState(false);

  const { data: affaires = [], isLoading } = useAffaires();

  const filteredAffaires = affaires.filter(affaire => {
    const matchesSearch = 
      affaire.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affaire.intitule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affaire.juridiction.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatut = statutFilter === 'all' || affaire.statut === statutFilter;
    
    return matchesSearch && matchesStatut;
  });

  return (
    <div className="min-h-screen">
      <Header 
        title="Affaires Contentieuses" 
        subtitle={`${affaires.length} affaires`}
        actions={
          <Button className="gap-2" onClick={() => setShowNouvelleAffaire(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle affaire
          </Button>
        }
      />

      <NouvelleAffaireDialog 
        open={showNouvelleAffaire} 
        onOpenChange={setShowNouvelleAffaire} 
      />

      <div className="p-6 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une affaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="CLOTUREE">Clôturée</SelectItem>
              <SelectItem value="RADIEE">Radiée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead className="bg-muted/50">
                  <tr>
                    <th>Référence</th>
                    <th>Intitulé</th>
                    <th>Juridiction</th>
                    <th>Chambre</th>
                    <th>Statut</th>
                    <th>Date création</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffaires.map((affaire) => {
                    const demandeurs = Array.isArray(affaire.demandeurs) ? affaire.demandeurs : [];
                    const defendeurs = Array.isArray(affaire.defendeurs) ? affaire.defendeurs : [];
                    
                    return (
                      <tr 
                        key={affaire.id} 
                        className="group cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/contentieux/affaires/${affaire.id}`)}
                      >
                        <td>
                          <span className="font-mono text-sm font-medium text-primary">
                            {affaire.reference}
                          </span>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium">{affaire.intitule}</p>
                            <p className="text-xs text-muted-foreground">
                              {demandeurs.map((d: any) => d.nom).join(', ')} c/ {defendeurs.map((d: any) => d.nom).join(', ')}
                            </p>
                          </div>
                        </td>
                        <td className="text-sm">{affaire.juridiction}</td>
                        <td className="text-sm">{affaire.chambre}</td>
                        <td>
                          <Badge 
                            variant="secondary"
                            className={cn(
                              affaire.statut === 'ACTIVE' && 'bg-success/10 text-success border-success/20',
                              affaire.statut === 'CLOTUREE' && 'bg-muted text-muted-foreground',
                              affaire.statut === 'RADIEE' && 'bg-destructive/10 text-destructive border-destructive/20'
                            )}
                          >
                            {statutLabels[affaire.statut].label}
                          </Badge>
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {new Date(affaire.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => navigate(`/contentieux/affaires/${affaire.id}`)}>
                                <Eye className="h-4 w-4" /> Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Edit className="h-4 w-4" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive">
                                <Trash2 className="h-4 w-4" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredAffaires.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune affaire trouvée</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setShowNouvelleAffaire(true)}
                >
                  Créer une nouvelle affaire
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
