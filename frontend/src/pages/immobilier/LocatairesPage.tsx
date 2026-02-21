import { useState } from 'react';
import { useCreateLocataire, useLots } from '@/hooks/useImmobilier';
import {
  useLocatairesComplete as useLocatairesHook,
  type LocataireComplete,
} from '@/hooks/useLocataires';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { CreateLocataireDialog, EditLocataireDialog } from '@/components/immobilier/LocataireDialogs';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Plus, Search, Users, FileText, AlertTriangle, Eye, Edit, Phone, Mail, Loader2
} from 'lucide-react';

export default function LocatairesPage() {
  const { data: locatairesData, isLoading } = useLocatairesHook();
  const { user } = useNestJSAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocataire, setSelectedLocataire] = useState<LocataireComplete | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const filteredLocataires = locatairesData?.filter(l =>
    l.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.telephone?.includes(searchTerm)
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in bg-background">
      <PageHeader
        title="Gestion des Locataires"
        description="Gerez les informations, baux et documents de vos locataires."
        action={{
          label: "Nouveau Locataire",
          icon: <Plus className="h-5 w-5" />,
          onClick: () => setCreateDialogOpen(true)
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Locataires" value={locatairesData?.length || 0} icon={Users} variant="primary" />
        <StatCard title="Baux actifs" value={locatairesData?.length || 0} icon={FileText} variant="success" />
        <StatCard title="Impayés" value={0} icon={AlertTriangle} variant="destructive" />
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un locataire..."
                className="pl-9 h-11 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/10">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold py-4">Locataire</TableHead>
                  <TableHead className="font-bold py-4">Contact</TableHead>
                  <TableHead className="font-bold py-4">Profession</TableHead>
                  <TableHead className="font-bold py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground font-medium">Chargement des données...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLocataires?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2 p-12">
                        <Users className="h-12 w-12 text-muted-foreground opacity-20" />
                        <p className="text-lg font-bold text-muted-foreground">Aucun locataire trouvé</p>
                        <p className="text-sm text-muted-foreground">Essayez d'ajuster vos filtres de recherche.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLocataires?.map(locataire => (
                  <TableRow key={locataire.id} className="hover:bg-background transition-colors group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-[14px] bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                          {locataire.nom[0]}
                        </div>
                        <div>
                          <p className="font-black text-foreground">{locataire.nom}</p>
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{locataire.adresse || 'Pas d\'adresse'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5 font-medium">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 text-primary" />
                          {locataire.telephone || <span className="italic opacity-30">Non renseigné</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 text-primary" />
                          {locataire.email || <span className="italic opacity-30">Non renseigné</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={locataire.profession || 'Non renseigné'} variant={locataire.profession ? "info" : "muted"} />
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => {
                            setSelectedLocataire(locataire);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl hover:bg-info/10 hover:text-info transition-all"
                          onClick={() => {
                            setSelectedLocataire(locataire);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateLocataireDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        userId={user?.id}
      />

      {selectedLocataire && (
        <EditLocataireDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          locataire={selectedLocataire}
        />
      )}
    </div>
  );
}
