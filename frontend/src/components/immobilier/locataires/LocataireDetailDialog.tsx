import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  User, Edit, Phone, Mail, MapPin, Briefcase, Heart, Shield,
  Calendar, CreditCard, Home, FileText, Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { type LocataireComplete } from '@/hooks/useLocataires';
import { useBauxByLocataire } from '@/hooks/useLocataires';
import { DocumentsManager } from './DocumentsManager';
import { PaiementsHistoryTab } from './PaiementsHistoryTab';
import { formatCurrency } from '@/lib/utils';

const TYPE_PIECE_OPTIONS = [
  { value: 'CNI', label: 'Carte d\'Identité Nationale' },
  { value: 'PASSPORT', label: 'Passeport' },
  { value: 'PERMIS', label: 'Permis de conduire' },
  { value: 'CARTE_CONSULAIRE', label: 'Carte Consulaire' },
  { value: 'AUTRE', label: 'Autre' },
];

const SITUATION_FAMILIALE_OPTIONS = [
  { value: 'CELIBATAIRE', label: 'Célibataire' },
  { value: 'MARIE', label: 'Marié(e)' },
  { value: 'DIVORCE', label: 'Divorcé(e)' },
  { value: 'VEUF', label: 'Veuf/Veuve' },
];

interface LocataireDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locataire: LocataireComplete | null;
  onEdit?: (locataire: LocataireComplete) => void;
}

export function LocataireDetailDialog({
  open,
  onOpenChange,
  locataire,
  onEdit
}: LocataireDetailDialogProps) {
  const [selectedTab, setSelectedTab] = useState('info');
  const { data: bauxData } = useBauxByLocataire(locataire?.id || '');

  if (!locataire) return null;

  // Get first bail date (entry date)
  const getDateEntree = () => {
    if (!bauxData || bauxData.length === 0) return null;
    const sortedBaux = [...bauxData].sort((a, b) => 
      new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
    );
    return sortedBaux[0].dateDebut;
  };

  const handlePrintInfo = () => {
    // TODO: Implement PDF generation
    console.log('Print locataire info');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-[32px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              {locataire.nom}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrintInfo}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(locataire)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-4 rounded-2xl">
            <TabsTrigger value="info" className="rounded-xl">
              <User className="h-4 w-4 mr-1" />
              Infos
            </TabsTrigger>
            <TabsTrigger value="situation" className="rounded-xl">
              <Home className="h-4 w-4 mr-1" />
              Situation
            </TabsTrigger>
            <TabsTrigger value="paiements" className="rounded-xl">
              <CreditCard className="h-4 w-4 mr-1" />
              Paiements
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-xl">
              <FileText className="h-4 w-4 mr-1" />
              Documents
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Info Tab */}
            <TabsContent value="info" className="space-y-6 m-0">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Téléphone</Label>
                    <p className="font-medium">{locataire.telephone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Email</Label>
                    <p className="font-medium">{locataire.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Adresse</Label>
                    <p className="font-medium">{locataire.adresse || '-'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Profession</Label>
                    <p className="font-medium">{locataire.profession || '-'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Lieu de travail</Label>
                  <p className="font-medium">{locataire.lieuTravail || '-'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Pièce d'identité</Label>
                    <p className="font-medium">
                      {TYPE_PIECE_OPTIONS.find(o => o.value === locataire.typePieceIdentite)?.label || '-'}
                      {locataire.numeroPieceIdentite && ` - ${locataire.numeroPieceIdentite}`}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Nationalité</Label>
                  <p className="font-medium">{locataire.nationalite || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Date de naissance</Label>
                  <p className="font-medium">
                    {locataire.dateNaissance 
                      ? format(new Date(locataire.dateNaissance), 'dd MMMM yyyy', { locale: fr })
                      : '-'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Situation familiale</Label>
                    <p className="font-medium">
                      {SITUATION_FAMILIALE_OPTIONS.find(o => o.value === locataire.situationFamiliale)?.label || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Contact d'urgence</Label>
                  <p className="font-medium">{locataire.personneContactUrgence || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Téléphone d'urgence</Label>
                  <p className="font-medium">{locataire.telephoneUrgence || '-'}</p>
                </div>
              </div>

              {locataire.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Notes</Label>
                    <p className="font-medium whitespace-pre-wrap">{locataire.notes}</p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Situation Tab */}
            <TabsContent value="situation" className="space-y-6 m-0">
              {/* Date d'entrée */}
              <Card className="rounded-2xl border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 font-bold">
                    <Calendar className="h-4 w-4" />
                    Date d'entrée
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {getDateEntree() 
                      ? format(new Date(getDateEntree()!), 'dd MMMM yyyy', { locale: fr })
                      : 'Non renseignée'
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Lots occupés */}
              <Card className="rounded-2xl border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 font-bold">
                    <Home className="h-4 w-4" />
                    Lots occupés ({locataire.nombreLots})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {locataire.lots && locataire.lots.length > 0 ? (
                    <div className="space-y-3">
                      {locataire.lots.map((lot: any) => (
                        <div key={lot.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/30">
                          <div>
                            <p className="font-medium">{lot.immeuble?.nom} - Lot {lot.numero}</p>
                            <p className="text-sm text-muted-foreground">{lot.type} - Étage {lot.etage || 'RDC'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(lot.loyerMensuelAttendu)}</p>
                            <Badge variant={lot.statut === 'OCCUPE' ? 'default' : 'secondary'} className="text-xs">
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
                <Card className="rounded-2xl border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold">Historique des baux</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {bauxData.map((bail: any) => (
                        <div key={bail.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/30">
                          <div>
                            <p className="font-medium">{bail.lot?.immeuble?.nom} - Lot {bail.lot?.numero}</p>
                            <p className="text-sm text-muted-foreground">
                              Du {format(new Date(bail.dateDebut), 'dd/MM/yyyy', { locale: fr })}
                              {bail.dateFin && ` au ${format(new Date(bail.dateFin), 'dd/MM/yyyy', { locale: fr })}`}
                            </p>
                          </div>
                          <Badge variant={bail.statut === 'ACTIF' ? 'default' : 'secondary'} className="text-xs">
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
            <TabsContent value="paiements" className="space-y-6 m-0">
              <PaiementsHistoryTab locataireId={locataire.id} />
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6 m-0">
              <DocumentsManager
                locataireId={locataire.id}
                pieceIdentiteUrl={locataire.pieceIdentiteUrl}
                contratUrl={locataire.contratUrl}
                documents={locataire.documents || []}
                onDocumentUpdate={() => {
                  // TODO: Refresh locataire data
                  console.log('Document updated, should refresh data');
                }}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}