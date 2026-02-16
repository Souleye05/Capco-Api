import { useState } from 'react';
import { useLocataires, useCreateLocataire, useLots } from '@/hooks/useImmobilier';
import { 
  useUpdateLocataire, 
  useBauxByLocataire, 
  useEncaissementsByLocataire,
  useDossiersRecouvrementByLocataire,
  useActionsRecouvrementByLocataire,
  useLinkLocataireToDossier,
  useUnlinkLocataireFromDossier,
  type LocataireComplete,
  type DocumentLocataire 
} from '@/hooks/useLocataires';
import { useDossiersRecouvrement } from '@/hooks/useDossiersRecouvrement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Plus, Search, User, FileText, Upload, Eye, Trash2, Download, 
  Edit, Calendar, CreditCard, AlertTriangle, Scale, Home, Phone, Mail,
  MapPin, Briefcase, Heart, Shield, Link2, Unlink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_PIECE_OPTIONS = [
  { value: 'CNI', label: 'Carte Nationale d\'Identité' },
  { value: 'PASSEPORT', label: 'Passeport' },
  { value: 'CARTE_SEJOUR', label: 'Carte de Séjour' },
  { value: 'PERMIS_CONDUIRE', label: 'Permis de Conduire' },
  { value: 'AUTRE', label: 'Autre' },
];

const SITUATION_FAMILIALE_OPTIONS = [
  { value: 'CELIBATAIRE', label: 'Célibataire' },
  { value: 'MARIE', label: 'Marié(e)' },
  { value: 'DIVORCE', label: 'Divorcé(e)' },
  { value: 'VEUF', label: 'Veuf/Veuve' },
  { value: 'UNION_LIBRE', label: 'Union libre' },
];

const TYPE_ACTION_LABELS: Record<string, string> = {
  'APPEL_TELEPHONIQUE': 'Appel téléphonique',
  'COURRIER': 'Courrier',
  'LETTRE_RELANCE': 'Lettre de relance',
  'MISE_EN_DEMEURE': 'Mise en demeure',
  'COMMANDEMENT_PAYER': 'Commandement de payer',
  'ASSIGNATION': 'Assignation',
  'REQUETE': 'Requête',
  'AUDIENCE_PROCEDURE': 'Audience procédure',
  'AUTRE': 'Autre',
};

export default function LocatairesPage() {
  const { data: locatairesData, isLoading, refetch } = useLocataires();
  const { data: lots } = useLots();
  const { data: allDossiers } = useDossiersRecouvrement();
  const { user } = useAuth();
  const createLocataire = useCreateLocataire();
  const updateLocataire = useUpdateLocataire();
  const linkToDossier = useLinkLocataireToDossier();
  const unlinkFromDossier = useUnlinkLocataireFromDossier();
  
  const locataires = locatairesData as unknown as LocataireComplete[] | undefined;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkDossierDialogOpen, setLinkDossierDialogOpen] = useState(false);
  const [selectedLocataire, setSelectedLocataire] = useState<LocataireComplete | null>(null);
  const [selectedTab, setSelectedTab] = useState('info');
  
  // Form state for new locataire
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    profession: '',
    lieu_travail: '',
    personne_contact_urgence: '',
    telephone_urgence: '',
    numero_piece_identite: '',
    type_piece_identite: '',
    nationalite: '',
    date_naissance: '',
    situation_familiale: '',
    notes: '',
  });
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({ ...formData });
  
  // Link dossier state
  const [selectedDossierId, setSelectedDossierId] = useState('');
  
  // Document upload
  const [uploading, setUploading] = useState(false);
  
  // Hooks for selected locataire data
  const { data: bauxData } = useBauxByLocataire(selectedLocataire?.id || '');
  const { data: encaissementsData } = useEncaissementsByLocataire(selectedLocataire?.id || '');
  const { data: dossiersData } = useDossiersRecouvrementByLocataire(selectedLocataire?.id || '');
  const { data: actionsData } = useActionsRecouvrementByLocataire(selectedLocataire?.id || '');

  const filteredLocataires = locataires?.filter(loc =>
    loc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.telephone?.includes(searchTerm)
  ) || [];

  const getLocataireLots = (locataireId: string) => {
    return lots?.filter(lot => lot.locataire_id === locataireId) || [];
  };
  
  // Get first bail date (entry date)
  const getDateEntree = () => {
    if (!bauxData || bauxData.length === 0) return null;
    const sortedBaux = [...bauxData].sort((a, b) => 
      new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
    );
    return sortedBaux[0].date_debut;
  };
  
  // Filter mises en demeure from actions
  const getMisesEnDemeure = () => {
    return actionsData?.filter(a => a.type_action === 'MISE_EN_DEMEURE') || [];
  };

  const resetFormData = () => {
    setFormData({
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      profession: '',
      lieu_travail: '',
      personne_contact_urgence: '',
      telephone_urgence: '',
      numero_piece_identite: '',
      type_piece_identite: '',
      nationalite: '',
      date_naissance: '',
      situation_familiale: '',
      notes: '',
    });
  };

  const handleCreateLocataire = async () => {
    if (!formData.nom.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      await createLocataire.mutateAsync({
        nom: formData.nom,
        telephone: formData.telephone || null,
        email: formData.email || null,
        created_by: user?.id || null,
      });
      
      toast.success('Locataire créé avec succès');
      setNewDialogOpen(false);
      resetFormData();
    } catch (error) {
      toast.error('Erreur lors de la création du locataire');
    }
  };
  
  const handleUpdateLocataire = async () => {
    if (!selectedLocataire) return;
    if (!editFormData.nom.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      await updateLocataire.mutateAsync({
        id: selectedLocataire.id,
        nom: editFormData.nom,
        telephone: editFormData.telephone || null,
        email: editFormData.email || null,
        adresse: editFormData.adresse || null,
        profession: editFormData.profession || null,
        lieu_travail: editFormData.lieu_travail || null,
        personne_contact_urgence: editFormData.personne_contact_urgence || null,
        telephone_urgence: editFormData.telephone_urgence || null,
        numero_piece_identite: editFormData.numero_piece_identite || null,
        type_piece_identite: editFormData.type_piece_identite || null,
        nationalite: editFormData.nationalite || null,
        date_naissance: editFormData.date_naissance || null,
        situation_familiale: editFormData.situation_familiale || null,
        notes: editFormData.notes || null,
      });
      
      setEditDialogOpen(false);
      // Refresh selected locataire
      const { data: updated } = await supabase
        .from('locataires')
        .select('*')
        .eq('id', selectedLocataire.id)
        .single();
      if (updated) setSelectedLocataire(updated as unknown as LocataireComplete);
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };
  
  const openEditDialog = () => {
    if (!selectedLocataire) return;
    setEditFormData({
      nom: selectedLocataire.nom || '',
      telephone: selectedLocataire.telephone || '',
      email: selectedLocataire.email || '',
      adresse: selectedLocataire.adresse || '',
      profession: selectedLocataire.profession || '',
      lieu_travail: selectedLocataire.lieu_travail || '',
      personne_contact_urgence: selectedLocataire.personne_contact_urgence || '',
      telephone_urgence: selectedLocataire.telephone_urgence || '',
      numero_piece_identite: selectedLocataire.numero_piece_identite || '',
      type_piece_identite: selectedLocataire.type_piece_identite || '',
      nationalite: selectedLocataire.nationalite || '',
      date_naissance: selectedLocataire.date_naissance || '',
      situation_familiale: selectedLocataire.situation_familiale || '',
      notes: selectedLocataire.notes || '',
    });
    setEditDialogOpen(true);
  };
  
  const handleLinkDossier = async () => {
    if (!selectedLocataire || !selectedDossierId) return;
    
    try {
      await linkToDossier.mutateAsync({
        locataireId: selectedLocataire.id,
        dossierId: selectedDossierId,
        createdBy: user?.id || '',
      });
      setLinkDossierDialogOpen(false);
      setSelectedDossierId('');
    } catch (error) {
      // Error handled in hook
    }
  };
  
  const handleUnlinkDossier = async (dossierId: string) => {
    if (!selectedLocataire) return;
    
    try {
      await unlinkFromDossier.mutateAsync({
        locataireId: selectedLocataire.id,
        dossierId,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleFileUpload = async (file: File, type: 'piece_identite' | 'contrat' | 'document') => {
    if (!selectedLocataire) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedLocataire.id}/${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('locataires-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      if (type === 'piece_identite') {
        await supabase
          .from('locataires')
          .update({ piece_identite_url: fileName })
          .eq('id', selectedLocataire.id);
      } else if (type === 'contrat') {
        await supabase
          .from('locataires')
          .update({ contrat_url: fileName })
          .eq('id', selectedLocataire.id);
      } else {
        const currentDocs = ((selectedLocataire.documents as unknown) as DocumentLocataire[] || []);
        const newDoc = {
          name: file.name,
          url: fileName,
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
        await supabase
          .from('locataires')
          .update({ documents: JSON.parse(JSON.stringify([...currentDocs, newDoc])) })
          .eq('id', selectedLocataire.id);
      }

      toast.success('Document téléchargé avec succès');
      refetch();
      
      const { data: updated } = await supabase
        .from('locataires')
        .select('*')
        .eq('id', selectedLocataire.id)
        .single();
      if (updated) setSelectedLocataire(updated as unknown as LocataireComplete);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('locataires-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDeleteDocument = async (filePath: string, type: 'piece_identite' | 'contrat' | 'document', docIndex?: number) => {
    if (!selectedLocataire) return;

    try {
      await supabase.storage
        .from('locataires-documents')
        .remove([filePath]);

      if (type === 'piece_identite') {
        await supabase
          .from('locataires')
          .update({ piece_identite_url: null })
          .eq('id', selectedLocataire.id);
      } else if (type === 'contrat') {
        await supabase
          .from('locataires')
          .update({ contrat_url: null })
          .eq('id', selectedLocataire.id);
      } else if (docIndex !== undefined) {
        const currentDocs = ((selectedLocataire.documents as unknown) as DocumentLocataire[] || []);
        const newDocs = currentDocs.filter((_, i) => i !== docIndex);
        await supabase
          .from('locataires')
          .update({ documents: JSON.parse(JSON.stringify(newDocs)) })
          .eq('id', selectedLocataire.id);
      }

      toast.success('Document supprimé');
      refetch();
      
      const { data: updated } = await supabase
        .from('locataires')
        .select('*')
        .eq('id', selectedLocataire.id)
        .single();
      if (updated) setSelectedLocataire(updated as unknown as LocataireComplete);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openDetailDialog = async (locataire: LocataireComplete) => {
    const { data } = await supabase
      .from('locataires')
      .select('*')
      .eq('id', locataire.id)
      .single();
    setSelectedLocataire((data as unknown as LocataireComplete) || locataire);
    setSelectedTab('info');
    setDetailDialogOpen(true);
  };

  // Calculate total payments
  const totalPaiements = encaissementsData?.reduce((sum, e) => sum + (e.montant_encaisse || 0), 0) || 0;
  
  // Available dossiers to link (exclude already linked)
  const linkedDossierIds = dossiersData?.map(d => d.id) || [];
  const availableDossiers = allDossiers?.filter(d => !linkedDossierIds.includes(d.id)) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Locataires</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos locataires et leurs documents
          </p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau locataire
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un locataire..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total locataires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{locataires?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avec lot assigné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {locataires?.filter(loc => getLocataireLots(loc.id).length > 0).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sans lot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {locataires?.filter(loc => getLocataireLots(loc.id).length === 0).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Lot(s)</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocataires.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun locataire trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredLocataires.map((locataire) => {
                  const locataireLots = getLocataireLots(locataire.id);
                  const hasDocuments = locataire.piece_identite_url || locataire.contrat_url || 
                    ((locataire.documents as unknown as DocumentLocataire[])?.length > 0);
                  
                  return (
                    <TableRow 
                      key={locataire.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openDetailDialog(locataire)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {locataire.nom}
                        </div>
                      </TableCell>
                      <TableCell>{locataire.telephone || '-'}</TableCell>
                      <TableCell>{locataire.email || '-'}</TableCell>
                      <TableCell>
                        {locataireLots.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {locataireLots.map(lot => (
                              <Badge key={lot.id} variant="outline" className="text-xs">
                                {(lot as any).immeubles?.nom} - {lot.numero}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasDocuments ? (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Documents
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailDialog(locataire);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Locataire Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau locataire</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nom">Nom complet *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom du locataire"
              />
            </div>
            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="+225 00 00 00 00"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
            <div>
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                placeholder="Profession"
              />
            </div>
            <div>
              <Label htmlFor="lieu_travail">Lieu de travail</Label>
              <Input
                id="lieu_travail"
                value={formData.lieu_travail}
                onChange={(e) => setFormData({ ...formData, lieu_travail: e.target.value })}
                placeholder="Entreprise / Lieu de travail"
              />
            </div>
            <div>
              <Label htmlFor="type_piece_identite">Type de pièce d'identité</Label>
              <Select 
                value={formData.type_piece_identite} 
                onValueChange={(v) => setFormData({ ...formData, type_piece_identite: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_PIECE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="numero_piece_identite">Numéro de pièce d'identité</Label>
              <Input
                id="numero_piece_identite"
                value={formData.numero_piece_identite}
                onChange={(e) => setFormData({ ...formData, numero_piece_identite: e.target.value })}
                placeholder="Numéro"
              />
            </div>
            <div>
              <Label htmlFor="nationalite">Nationalité</Label>
              <Input
                id="nationalite"
                value={formData.nationalite}
                onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                placeholder="Nationalité"
              />
            </div>
            <div>
              <Label htmlFor="date_naissance">Date de naissance</Label>
              <Input
                id="date_naissance"
                type="date"
                value={formData.date_naissance}
                onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="situation_familiale">Situation familiale</Label>
              <Select 
                value={formData.situation_familiale} 
                onValueChange={(v) => setFormData({ ...formData, situation_familiale: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {SITUATION_FAMILIALE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="personne_contact_urgence">Personne à contacter en cas d'urgence</Label>
              <Input
                id="personne_contact_urgence"
                value={formData.personne_contact_urgence}
                onChange={(e) => setFormData({ ...formData, personne_contact_urgence: e.target.value })}
                placeholder="Nom de la personne"
              />
            </div>
            <div>
              <Label htmlFor="telephone_urgence">Téléphone d'urgence</Label>
              <Input
                id="telephone_urgence"
                value={formData.telephone_urgence}
                onChange={(e) => setFormData({ ...formData, telephone_urgence: e.target.value })}
                placeholder="+225 00 00 00 00"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes complémentaires..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewDialogOpen(false); resetFormData(); }}>
              Annuler
            </Button>
            <Button onClick={handleCreateLocataire} disabled={createLocataire.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedLocataire?.nom}
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </DialogHeader>
          
          {selectedLocataire && (
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="info">
                  <User className="h-4 w-4 mr-1" />
                  Infos
                </TabsTrigger>
                <TabsTrigger value="situation">
                  <Home className="h-4 w-4 mr-1" />
                  Situation
                </TabsTrigger>
                <TabsTrigger value="paiements">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Paiements
                </TabsTrigger>
                <TabsTrigger value="contentieux">
                  <Scale className="h-4 w-4 mr-1" />
                  Contentieux
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="h-4 w-4 mr-1" />
                  Documents
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 mt-4">
                {/* Info Tab */}
                <TabsContent value="info" className="space-y-4 m-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Téléphone</Label>
                        <p className="font-medium">{selectedLocataire.telephone || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Email</Label>
                        <p className="font-medium">{selectedLocataire.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Adresse</Label>
                        <p className="font-medium">{selectedLocataire.adresse || '-'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Profession</Label>
                        <p className="font-medium">{selectedLocataire.profession || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Lieu de travail</Label>
                      <p className="font-medium">{selectedLocataire.lieu_travail || '-'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Pièce d'identité</Label>
                        <p className="font-medium">
                          {TYPE_PIECE_OPTIONS.find(o => o.value === selectedLocataire.type_piece_identite)?.label || '-'}
                          {selectedLocataire.numero_piece_identite && ` - ${selectedLocataire.numero_piece_identite}`}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Nationalité</Label>
                      <p className="font-medium">{selectedLocataire.nationalite || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Date de naissance</Label>
                      <p className="font-medium">
                        {selectedLocataire.date_naissance 
                          ? format(new Date(selectedLocataire.date_naissance), 'dd MMMM yyyy', { locale: fr })
                          : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Situation familiale</Label>
                        <p className="font-medium">
                          {SITUATION_FAMILIALE_OPTIONS.find(o => o.value === selectedLocataire.situation_familiale)?.label || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Contact d'urgence</Label>
                      <p className="font-medium">{selectedLocataire.personne_contact_urgence || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Téléphone d'urgence</Label>
                      <p className="font-medium">{selectedLocataire.telephone_urgence || '-'}</p>
                    </div>
                  </div>
                  
                  {selectedLocataire.notes && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground text-xs">Notes</Label>
                        <p className="font-medium whitespace-pre-wrap">{selectedLocataire.notes}</p>
                      </div>
                    </>
                  )}
                </TabsContent>
                
                {/* Situation Tab */}
                <TabsContent value="situation" className="space-y-4 m-0">
                  {/* Date d'entrée */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date d'entrée
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">
                        {getDateEntree() 
                          ? format(new Date(getDateEntree()!), 'dd MMMM yyyy', { locale: fr })
                          : 'Non renseignée'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* Lots occupés */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Lots occupés
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getLocataireLots(selectedLocataire.id).length > 0 ? (
                        <div className="space-y-2">
                          {getLocataireLots(selectedLocataire.id).map(lot => (
                            <div key={lot.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium">{(lot as any).immeubles?.nom} - Lot {lot.numero}</p>
                                <p className="text-sm text-muted-foreground">{lot.type} - Étage {lot.etage || 'RDC'}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{lot.loyer_mensuel_attendu?.toLocaleString()} FCFA</p>
                                <Badge variant={lot.statut === 'OCCUPE' ? 'default' : 'secondary'}>
                                  {lot.statut}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Aucun lot assigné</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Baux */}
                  {bauxData && bauxData.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Historique des baux</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {bauxData.map((bail: any) => (
                            <div key={bail.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium">{bail.lots?.immeubles?.nom} - Lot {bail.lots?.numero}</p>
                                <p className="text-sm text-muted-foreground">
                                  Du {format(new Date(bail.date_debut), 'dd/MM/yyyy', { locale: fr })}
                                  {bail.date_fin && ` au ${format(new Date(bail.date_fin), 'dd/MM/yyyy', { locale: fr })}`}
                                </p>
                              </div>
                              <Badge variant={bail.statut === 'ACTIF' ? 'default' : 'secondary'}>
                                {bail.statut}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                {/* Paiements Tab */}
                <TabsContent value="paiements" className="space-y-4 m-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Total des paiements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{totalPaiements.toLocaleString()} FCFA</p>
                      <p className="text-sm text-muted-foreground">{encaissementsData?.length || 0} paiement(s)</p>
                    </CardContent>
                  </Card>
                  
                  {encaissementsData && encaissementsData.length > 0 ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Historique des paiements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Mois</TableHead>
                              <TableHead>Lot</TableHead>
                              <TableHead>Mode</TableHead>
                              <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {encaissementsData.map((enc: any) => (
                              <TableRow key={enc.id}>
                                <TableCell>
                                  {format(new Date(enc.date_encaissement), 'dd/MM/yyyy', { locale: fr })}
                                </TableCell>
                                <TableCell>{enc.mois_concerne}</TableCell>
                                <TableCell>
                                  {enc.lots?.immeubles?.nom} - {enc.lots?.numero}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{enc.mode_paiement}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {enc.montant_encaisse?.toLocaleString()} FCFA
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Aucun paiement enregistré
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                {/* Contentieux Tab */}
                <TabsContent value="contentieux" className="space-y-4 m-0">
                  {/* Link dossier button */}
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setLinkDossierDialogOpen(true)}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Lier un dossier
                    </Button>
                  </div>
                  
                  {/* Mises en demeure */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Mises en demeure
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getMisesEnDemeure().length > 0 ? (
                        <div className="space-y-2">
                          {getMisesEnDemeure().map((action: any) => (
                            <div key={action.id} className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{action.dossiers_recouvrement?.reference}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(action.date), 'dd/MM/yyyy', { locale: fr })}
                                </p>
                              </div>
                              <p className="text-sm mt-1">{action.resume}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Aucune mise en demeure</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Dossiers de recouvrement */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Dossiers de recouvrement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dossiersData && dossiersData.length > 0 ? (
                        <div className="space-y-2">
                          {dossiersData.map((dossier: any) => (
                            <div key={dossier.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium">{dossier.reference}</p>
                                <p className="text-sm text-muted-foreground">
                                  Créancier: {dossier.creancier_nom}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="font-semibold">{dossier.total_a_recouvrer?.toLocaleString()} FCFA</p>
                                  <Badge variant={dossier.statut === 'EN_COURS' ? 'destructive' : 'secondary'}>
                                    {dossier.statut}
                                  </Badge>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUnlinkDossier(dossier.id)}
                                >
                                  <Unlink className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Aucun dossier de recouvrement</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Actions de recouvrement */}
                  {actionsData && actionsData.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Historique des actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Dossier</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Résumé</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {actionsData.map((action: any) => (
                              <TableRow key={action.id}>
                                <TableCell>
                                  {format(new Date(action.date), 'dd/MM/yyyy', { locale: fr })}
                                </TableCell>
                                <TableCell>{action.dossiers_recouvrement?.reference}</TableCell>
                                <TableCell>
                                  <Badge variant={action.type_action === 'MISE_EN_DEMEURE' ? 'destructive' : 'outline'}>
                                    {TYPE_ACTION_LABELS[action.type_action] || action.type_action}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">{action.resume}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4 m-0">
                  {/* Pièce d'identité */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Pièce d'identité</Label>
                        {selectedLocataire.piece_identite_url ? (
                          <p className="text-sm text-muted-foreground">Document disponible</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun document</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {selectedLocataire.piece_identite_url ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(
                                selectedLocataire.piece_identite_url!,
                                'piece_identite.pdf'
                              )}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(
                                selectedLocataire.piece_identite_url!,
                                'piece_identite'
                              )}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <label>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'piece_identite');
                              }}
                              disabled={uploading}
                            />
                            <Button variant="outline" size="sm" asChild disabled={uploading}>
                              <span>
                                <Upload className="h-4 w-4 mr-1" />
                                Ajouter
                              </span>
                            </Button>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contrat */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Contrat de bail</Label>
                        {selectedLocataire.contrat_url ? (
                          <p className="text-sm text-muted-foreground">Document disponible</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun document</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {selectedLocataire.contrat_url ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(
                                selectedLocataire.contrat_url!,
                                'contrat.pdf'
                              )}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(
                                selectedLocataire.contrat_url!,
                                'contrat'
                              )}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <label>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'contrat');
                              }}
                              disabled={uploading}
                            />
                            <Button variant="outline" size="sm" asChild disabled={uploading}>
                              <span>
                                <Upload className="h-4 w-4 mr-1" />
                                Ajouter
                              </span>
                            </Button>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Other documents */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Label>Autres documents</Label>
                      <label>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'document');
                          }}
                          disabled={uploading}
                        />
                        <Button variant="outline" size="sm" asChild disabled={uploading}>
                          <span>
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter
                          </span>
                        </Button>
                      </label>
                    </div>
                    
                    {(((selectedLocataire.documents as unknown) as DocumentLocataire[]) || []).length > 0 ? (
                      <div className="space-y-2">
                        {(((selectedLocataire.documents as unknown) as DocumentLocataire[]) || []).map((doc, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Ajouté le {format(new Date(doc.uploadedAt), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadDocument(doc.url, doc.name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.url, 'document', index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun autre document
                      </p>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le locataire</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="edit-nom">Nom complet *</Label>
              <Input
                id="edit-nom"
                value={editFormData.nom}
                onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-telephone">Téléphone</Label>
              <Input
                id="edit-telephone"
                value={editFormData.telephone}
                onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-adresse">Adresse</Label>
              <Input
                id="edit-adresse"
                value={editFormData.adresse}
                onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-profession">Profession</Label>
              <Input
                id="edit-profession"
                value={editFormData.profession}
                onChange={(e) => setEditFormData({ ...editFormData, profession: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-lieu_travail">Lieu de travail</Label>
              <Input
                id="edit-lieu_travail"
                value={editFormData.lieu_travail}
                onChange={(e) => setEditFormData({ ...editFormData, lieu_travail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-type_piece_identite">Type de pièce d'identité</Label>
              <Select 
                value={editFormData.type_piece_identite} 
                onValueChange={(v) => setEditFormData({ ...editFormData, type_piece_identite: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_PIECE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-numero_piece_identite">Numéro de pièce d'identité</Label>
              <Input
                id="edit-numero_piece_identite"
                value={editFormData.numero_piece_identite}
                onChange={(e) => setEditFormData({ ...editFormData, numero_piece_identite: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-nationalite">Nationalité</Label>
              <Input
                id="edit-nationalite"
                value={editFormData.nationalite}
                onChange={(e) => setEditFormData({ ...editFormData, nationalite: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-date_naissance">Date de naissance</Label>
              <Input
                id="edit-date_naissance"
                type="date"
                value={editFormData.date_naissance}
                onChange={(e) => setEditFormData({ ...editFormData, date_naissance: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-situation_familiale">Situation familiale</Label>
              <Select 
                value={editFormData.situation_familiale} 
                onValueChange={(v) => setEditFormData({ ...editFormData, situation_familiale: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {SITUATION_FAMILIALE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-personne_contact_urgence">Contact d'urgence</Label>
              <Input
                id="edit-personne_contact_urgence"
                value={editFormData.personne_contact_urgence}
                onChange={(e) => setEditFormData({ ...editFormData, personne_contact_urgence: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-telephone_urgence">Téléphone d'urgence</Label>
              <Input
                id="edit-telephone_urgence"
                value={editFormData.telephone_urgence}
                onChange={(e) => setEditFormData({ ...editFormData, telephone_urgence: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateLocataire} disabled={updateLocataire.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Link Dossier Dialog */}
      <Dialog open={linkDossierDialogOpen} onOpenChange={setLinkDossierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lier un dossier de recouvrement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Dossier</Label>
              <Select value={selectedDossierId} onValueChange={setSelectedDossierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un dossier..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDossiers.length === 0 ? (
                    <SelectItem value="" disabled>Aucun dossier disponible</SelectItem>
                  ) : (
                    availableDossiers.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.reference} - {d.debiteur_nom} ({d.total_a_recouvrer?.toLocaleString()} FCFA)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDossierDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleLinkDossier} disabled={!selectedDossierId || linkToDossier.isPending}>
              Lier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
