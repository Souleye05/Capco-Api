import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Loader2, Gavel, Filter } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

const statutConfig = {
  EN_COURS: { label: 'En cours', className: 'bg-success/10 text-success border-success/20' },
  CLOTUREE: { label: 'Clôturée', className: 'bg-muted text-muted-foreground border-muted' },
  RADIEE: { label: 'Radiée', className: 'bg-destructive/10 text-destructive border-destructive/20' },
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
      affaire.intitule.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatut = statutFilter === 'all' || affaire.statut === statutFilter;
    return matchesSearch && matchesStatut;
  });

  const stats = {
    total: affaires.length,
    actives: affaires.filter(a => a.statut === 'EN_COURS').length,
    cloturees: affaires.filter(a => a.statut === 'CLOTUREE').length,
    radiees: affaires.filter(a => a.statut === 'RADIEE').length,
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Affaires Contentieuses" 
        subtitle={`${stats.total} affaires au total`}
        breadcrumbs={[
          { label: 'Contentieux', href: '/contentieux/affaires' },
          { label: 'Affaires' },
        ]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setShowNouvelleAffaire(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle affaire
          </Button>
        }
      />

      <NouvelleAffaireDialog 
        open={showNouvelleAffaire} 
        onOpenChange={setShowNouvelleAffaire} 
      />

      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: Gavel, color: 'text-foreground' },
            { label: 'Actives', value: stats.actives, icon: Gavel, color: 'text-success' },
            { label: 'Clôturées', value: stats.cloturees, icon: Gavel, color: 'text-muted-foreground' },
            { label: 'Radiées', value: stats.radiees, icon: Gavel, color: 'text-destructive' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className={cn('text-2xl font-semibold mt-1', stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par référence, intitulé, juridiction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="EN_COURS">En cours</SelectItem>
              <SelectItem value="CLOTUREE">Clôturée</SelectItem>
              <SelectItem value="RADIEE">Radiée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <Card className="border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground py-3 px-4">Référence</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-4">Intitulé</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-4 hidden md:table-cell">Juridiction</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-4 hidden lg:table-cell">Chambre</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-4">Statut</th>
                    <th className="text-left font-medium text-muted-foreground py-3 px-4 hidden sm:table-cell">Date</th>
                    <th className="w-10 py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredAffaires.map((affaire) => {
                    const demandeurs = affaire.parties?.filter(p => p.role === 'DEMANDEUR') || [];
                    const defendeurs = affaire.parties?.filter(p => p.role === 'DEFENDEUR') || [];
                    const config = statutConfig[affaire.statut];
                    
                    return (
                      <tr 
                        key={affaire.id} 
                        className="group cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => navigate(`/contentieux/affaires/${affaire.id}`)}
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {affaire.reference}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{affaire.intitule}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {demandeurs.map(d => d.nom).join(', ')} c/ {defendeurs.map(d => d.nom).join(', ')}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">-</td>
                        <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">-</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
                            {config.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                          {new Date(affaire.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 opacity-0 group-hover:opacity-100"
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
            
            {filteredAffaires.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <Gavel className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">Aucune affaire trouvée</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {searchQuery || statutFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Commencez par créer une affaire'}
                </p>
                {!searchQuery && statutFilter === 'all' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowNouvelleAffaire(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Créer une affaire
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
