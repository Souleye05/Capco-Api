import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Users, 
  Euro,
  Home,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Loader2,
  Download,
  Upload
} from 'lucide-react';
import { generateImportTemplate } from '@/utils/generateExcelTemplate';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NouvelImmeubleDialog } from '@/components/dialogs/NouvelImmeubleDialog';
import { EditImmeubleDialog } from '@/components/dialogs/EditImmeubleDialog';
import { ImportExcelDialog } from '@/components/dialogs/ImportExcelDialog';
import { useImmeubles, useLots, useEncaissementsLoyers, ImmeubleDB } from '@/hooks/useImmobilier';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

type ImmeubleWithProprietaire = ImmeubleDB & { proprietaires?: { nom: string } | null };

export default function ImmeublesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNouvelImmeuble, setShowNouvelImmeuble] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [editingImmeuble, setEditingImmeuble] = useState<ImmeubleWithProprietaire | null>(null);

  const { data: immeubles = [], isLoading } = useImmeubles();
  const { data: lots = [] } = useLots();
  const { data: encaissements = [] } = useEncaissementsLoyers();

  const filteredImmeubles = immeubles.filter(immeuble => 
    immeuble.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    immeuble.adresse.toLowerCase().includes(searchQuery.toLowerCase()) ||
    immeuble.proprietaires?.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenererRapport = (immeubleNom: string) => {
    toast.success(`Rapport généré pour ${immeubleNom}`);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="min-h-screen">
      <Header 
        title="Gestion Immobilière" 
        subtitle={`${immeubles.length} immeubles gérés`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={generateImportTemplate}>
              <Download className="h-4 w-4" />
              Template Excel
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setShowImportExcel(true)}>
              <Upload className="h-4 w-4" />
              Importer Excel
            </Button>
            <Button className="gap-2" onClick={() => setShowNouvelImmeuble(true)}>
              <Plus className="h-4 w-4" />
              Nouvel immeuble
            </Button>
          </div>
        }
      />

      <NouvelImmeubleDialog 
        open={showNouvelImmeuble} 
        onOpenChange={setShowNouvelImmeuble} 
      />
      
      <ImportExcelDialog
        open={showImportExcel}
        onOpenChange={setShowImportExcel}
      />
      
      {editingImmeuble && (
        <EditImmeubleDialog
          open={!!editingImmeuble}
          onOpenChange={(open) => !open && setEditingImmeuble(null)}
          immeuble={editingImmeuble}
        />
      )}

      <div className="p-6 animate-fade-in">
        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un immeuble..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredImmeubles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun immeuble trouvé</p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => setShowNouvelImmeuble(true)}
            >
              Créer un nouvel immeuble
            </Button>
          </div>
        )}

        {/* Immeubles grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredImmeubles.map((immeuble) => {
              const immeubleLots = lots.filter(l => l.immeuble_id === immeuble.id);
              const lotsOccupes = immeubleLots.filter(l => l.statut === 'OCCUPE').length;
              const loyerTotal = immeubleLots.reduce((sum, l) => sum + Number(l.loyer_mensuel_attendu), 0);
              const immeubleEncaissements = encaissements.filter(e => 
                immeubleLots.some(l => l.id === e.lot_id) && e.mois_concerne === currentMonth
              );
              const loyerEncaisse = immeubleEncaissements.reduce((sum, e) => sum + Number(e.montant_encaisse), 0);
              const commissions = immeubleEncaissements.reduce((sum, e) => sum + Number(e.commission_capco), 0);
              
              return (
                <div 
                  key={immeuble.id} 
                  className="bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/immobilier/immeubles/${immeuble.id}`)}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-immobilier/10 to-immobilier/5 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-immobilier/20">
                          <Building2 className="h-8 w-8 text-immobilier" />
                        </div>
                        <div>
                          <h3 className="text-lg font-display font-semibold">{immeuble.nom}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {immeuble.adresse}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/immobilier/immeubles/${immeuble.id}`); }}>
                            <Eye className="h-4 w-4" /> Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); setEditingImmeuble(immeuble); }}>
                            <Edit className="h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); handleGenererRapport(immeuble.nom); }}>
                            <FileText className="h-4 w-4" /> Générer rapport
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Propriétaire</p>
                      <p className="font-medium">{immeuble.proprietaires?.nom || '-'}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-6 space-y-4">
                    {/* Lots */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Lots</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{immeubleLots.length} lots</Badge>
                        <Badge className="bg-success/10 text-success">{lotsOccupes} occupés</Badge>
                        {immeubleLots.length - lotsOccupes > 0 && (
                          <Badge className="bg-warning/10 text-warning">{immeubleLots.length - lotsOccupes} libre(s)</Badge>
                        )}
                      </div>
                    </div>

                    {/* Loyers */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Loyers ce mois</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(loyerEncaisse)} / {formatCurrency(loyerTotal)}
                        </span>
                      </div>
                      <Progress value={loyerTotal > 0 ? (loyerEncaisse / loyerTotal) * 100 : 0} className="h-2" />
                    </div>

                    {/* Commission */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Commission CAPCO ({immeuble.taux_commission_capco}%)</p>
                        <p className="text-lg font-semibold text-immobilier">{formatCurrency(commissions)}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleGenererRapport(immeuble.nom)}
                      >
                        <FileText className="h-4 w-4" />
                        Rapport
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
