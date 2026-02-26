import { useMemo, useState } from 'react';
import { Building2, User, Search, Printer, Plus, CreditCard, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useArrieres, useCreateArriere, useUpdateArriere, useDeleteArriere, useImmeubles, useLots, usePaiementsArrieres, useCreatePaiementArriere, useUpdatePaiementArriere } from '@/hooks/useImmobilier';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { generateArrieresPDF } from '@/utils/generateArrieresPDF';

export default function ArrieresPage() {
  const { data: arrieres = [], isLoading: loadingArr } = useArrieres();
  const { data: immeubles = [], isLoading: loadingImm } = useImmeubles();
  const { data: lots = [], isLoading: loadingLots } = useLots();
  const { data: paiements = [] } = usePaiementsArrieres();
  const createArriere = useCreateArriere();
  const updateArriere = useUpdateArriere();
  const deleteArriere = useDeleteArriere();
  const createPaiement = useCreatePaiementArriere();
  const updatePaiement = useUpdatePaiementArriere();
  const { user, isAdmin } = useAuth();

  const [filterImmeuble, setFilterImmeuble] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Dialog création/édition arriéré
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArriereId, setEditingArriereId] = useState<string | null>(null);
  const [formImmeubleId, setFormImmeubleId] = useState('');
  const [formLotId, setFormLotId] = useState('');
  const [formMontant, setFormMontant] = useState('');
  const [formObservation, setFormObservation] = useState('');

  // Dialog paiement (création/édition)
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [editingPaiementId, setEditingPaiementId] = useState<string | null>(null);
  const [selectedArriereId, setSelectedArriereId] = useState('');
  const [paiementMontant, setPaiementMontant] = useState('');
  const [paiementMode, setPaiementMode] = useState('CASH');
  const [paiementDate, setPaiementDate] = useState('');
  const [paiementObservation, setPaiementObservation] = useState('');

  // Expand row
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [arriereToDelete, setArriereToDelete] = useState<string | null>(null);

  // Map paiements par arriéré
  const paiementsParArriere = useMemo(() => {
    const map = new Map<string, typeof paiements>();
    paiements.forEach(p => {
      const list = map.get(p.arriere_id) || [];
      list.push(p);
      map.set(p.arriere_id, list);
    });
    return map;
  }, [paiements]);

  // Enrichir les arriérés
  const arrieresEnrichis = useMemo(() => {
    return arrieres.map(a => {
      const lot = a.lots;
      const paiementsArriere = paiementsParArriere.get(a.id) || [];
      const totalPaye = paiementsArriere.reduce((s, p) => s + Number(p.montant_paye), 0);
      const totalCommissions = paiementsArriere.reduce((s, p) => s + Number(p.commission_capco), 0);
      const totalNet = paiementsArriere.reduce((s, p) => s + Number(p.net_proprietaire), 0);
      const solde = Number(a.montant_du) - totalPaye;
      const immeubleData = lot?.immeubles;
      return {
        ...a,
        immeubleNom: immeubleData?.nom || '—',
        immeubleId: immeubleData?.id || '',
        locataireNom: lot?.locataires?.nom || '—',
        lotNumero: lot?.numero || '—',
        tauxCommission: immeubleData?.taux_commission_capco || 0,
        totalPaye,
        totalCommissions,
        totalNet,
        solde,
        paiements: paiementsArriere,
      };
    });
  }, [arrieres, paiementsParArriere]);

  // Filtrer
  const filtered = useMemo(() => {
    let result = arrieresEnrichis;
    if (filterImmeuble && filterImmeuble !== 'all') {
      result = result.filter(a => a.immeubleId === filterImmeuble);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(a =>
        a.locataireNom.toLowerCase().includes(s) ||
        a.lotNumero.toLowerCase().includes(s) ||
        a.immeubleNom.toLowerCase().includes(s) ||
        (a.observation || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [arrieresEnrichis, filterImmeuble, search]);

  const totalArrieres = filtered.reduce((sum, a) => sum + Number(a.montant_du), 0);
  const totalPaye = filtered.reduce((sum, a) => sum + a.totalPaye, 0);
  const totalCommissions = filtered.reduce((sum, a) => sum + a.totalCommissions, 0);
  const totalSolde = filtered.reduce((sum, a) => sum + a.solde, 0);
  const tauxRecouvrement = totalArrieres > 0 ? Math.round((totalPaye / totalArrieres) * 100) : 0;

  // Résumé par immeuble
  const resumeParImmeuble = useMemo(() => {
    const map = new Map<string, { nom: string; total: number; paye: number; solde: number; count: number }>();
    arrieresEnrichis.forEach(a => {
      if (!a.immeubleId) return;
      const existing = map.get(a.immeubleId) || { nom: a.immeubleNom, total: 0, paye: 0, solde: 0, count: 0 };
      existing.total += Number(a.montant_du);
      existing.paye += a.totalPaye;
      existing.solde += a.solde;
      existing.count += 1;
      map.set(a.immeubleId, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.solde - a.solde);
  }, [arrieresEnrichis]);

  // Lots occupés pour le dialog
  const lotsOccupes = useMemo(() => {
    return lots
      .filter(lot => lot.statut === 'OCCUPE')
      .map(lot => ({
        ...lot,
        locataire_nom: (lot as any).locataires?.nom || 'N/A',
      }));
  }, [lots]);

  const lotsForDialog = useMemo(() => {
    if (!formImmeubleId) return [];
    return lotsOccupes.filter(l => l.immeuble_id === formImmeubleId);
  }, [lotsOccupes, formImmeubleId]);

  // === Arriéré handlers ===
  const handleOpenCreateArriere = () => {
    setEditingArriereId(null);
    setFormImmeubleId(''); setFormLotId(''); setFormMontant(''); setFormObservation('');
    setDialogOpen(true);
  };

  const handleOpenEditArriere = (a: typeof arrieresEnrichis[0]) => {
    setEditingArriereId(a.id);
    setFormImmeubleId(a.immeubleId);
    setFormLotId(a.lot_id);
    setFormMontant(String(a.montant_du));
    setFormObservation(a.observation || '');
    setDialogOpen(true);
  };

  const handleSubmitArriere = async () => {
    if (!editingArriereId && !formLotId) { toast.error('Veuillez sélectionner un lot'); return; }
    const montant = parseFloat(formMontant);
    if (isNaN(montant) || montant <= 0) { toast.error('Veuillez saisir un montant valide'); return; }

    try {
      if (editingArriereId) {
        await updateArriere.mutateAsync({
          id: editingArriereId,
          montant_du: montant,
          observation: formObservation || null,
        });
      } else {
        await createArriere.mutateAsync({
          lot_id: formLotId,
          montant_du: montant,
          periode: 'Avant Janvier 2026',
          observation: formObservation || null,
          created_by: user?.id || '',
        });
      }
      setDialogOpen(false);
    } catch {}
  };

  // === Paiement handlers ===
  const handleOpenCreatePaiement = (arriereId: string) => {
    setEditingPaiementId(null);
    setSelectedArriereId(arriereId);
    setPaiementMontant('');
    setPaiementMode('CASH');
    setPaiementDate(new Date().toISOString().split('T')[0]);
    setPaiementObservation('');
    setPaiementDialogOpen(true);
  };

  const handleOpenEditPaiement = (p: typeof paiements[0], arriereId: string) => {
    setEditingPaiementId(p.id);
    setSelectedArriereId(arriereId);
    setPaiementMontant(String(p.montant_paye));
    setPaiementMode(p.mode_paiement);
    setPaiementDate(p.date_paiement);
    setPaiementObservation(p.observation || '');
    setPaiementDialogOpen(true);
  };

  const selectedArriere = arrieresEnrichis.find(a => a.id === selectedArriereId);

  // For edit: exclude the current paiement amount from totalPaye to compute available solde
  const editingPaiementOriginalAmount = editingPaiementId
    ? Number(paiements.find(p => p.id === editingPaiementId)?.montant_paye || 0)
    : 0;
  const availableSolde = selectedArriere
    ? Number(selectedArriere.montant_du) - selectedArriere.totalPaye + editingPaiementOriginalAmount
    : 0;

  const handlePaiementSubmit = async () => {
    if (!selectedArriere) return;
    const montant = parseFloat(paiementMontant);
    if (isNaN(montant) || montant <= 0) { toast.error('Veuillez saisir un montant valide'); return; }
    if (montant > availableSolde) { toast.error(`Le montant dépasse le solde restant (${formatMontant(availableSolde)})`); return; }

    const taux = selectedArriere.tauxCommission / 100;
    const commission = Math.round(montant * taux);
    const net = montant - commission;

    try {
      if (editingPaiementId) {
        await updatePaiement.mutateAsync({
          id: editingPaiementId,
          date_paiement: paiementDate,
          montant_paye: montant,
          mode_paiement: paiementMode,
          commission_capco: commission,
          net_proprietaire: net,
          observation: paiementObservation || null,
        });
      } else {
        await createPaiement.mutateAsync({
          arriere_id: selectedArriereId,
          date_paiement: paiementDate,
          montant_paye: montant,
          mode_paiement: paiementMode,
          commission_capco: commission,
          net_proprietaire: net,
          observation: paiementObservation || null,
          created_by: user?.id || '',
        });
      }
      setPaiementDialogOpen(false);
    } catch {}
  };

  const isLoading = loadingArr || loadingImm || loadingLots;
  const formatMontant = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
  const modeLabels: Record<string, string> = { CASH: 'Espèces', VIREMENT: 'Virement', CHEQUE: 'Chèque', WAVE: 'Wave', OM: 'Orange Money' };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Arriérés de loyers</h1>
          <p className="text-sm text-muted-foreground">Sommes impayées dues par les locataires avant janvier 2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenCreateArriere}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel arriéré
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const immeubleNom = filterImmeuble !== 'all' 
              ? immeubles.find(i => i.id === filterImmeuble)?.nom 
              : undefined;
            generateArrieresPDF({
              rows: filtered.map(a => ({
                immeuble_nom: a.immeubleNom,
                lot_numero: a.lotNumero,
                locataire_nom: a.locataireNom,
                montant_du: Number(a.montant_du),
                total_paye: a.totalPaye,
                total_commissions: a.totalCommissions,
                solde: a.solde,
                statut: a.solde <= 0 ? 'Solde' : a.totalPaye > 0 ? 'Partiel' : 'Impaye',
                observation: a.observation || '',
                periode: a.periode || 'Avant Janvier 2026',
                nb_paiements: a.paiements.length,
              })),
              totalArrieres,
              totalPaye,
              totalCommissions,
              totalSolde,
              tauxRecouvrement,
              immeubleFilter: immeubleNom,
            });
          }}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total arriérés dus</p>
            <p className="text-xl font-bold text-destructive">{formatMontant(totalArrieres)}</p>
            <p className="text-xs text-muted-foreground mt-1">{filtered.length} enregistrement(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total récupéré</p>
            <p className="text-xl font-bold text-green-600">{formatMontant(totalPaye)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Commission CAPCO</p>
            <p className="text-xl font-bold text-primary">{formatMontant(totalCommissions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Solde restant dû</p>
            <p className="text-xl font-bold text-orange-600">{formatMontant(totalSolde)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Taux de recouvrement</p>
            <p className={`text-xl font-bold ${tauxRecouvrement >= 75 ? 'text-green-600' : tauxRecouvrement >= 50 ? 'text-orange-600' : 'text-destructive'}`}>{tauxRecouvrement}%</p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${tauxRecouvrement >= 75 ? 'bg-green-500' : tauxRecouvrement >= 50 ? 'bg-orange-500' : 'bg-destructive'}`}
                style={{ width: `${Math.min(tauxRecouvrement, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé par immeuble */}
      {resumeParImmeuble.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Résumé par immeuble
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resumeParImmeuble.map((r, i) => (
                <div key={i} className="flex flex-col p-3 rounded-lg bg-muted/50 gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{r.nom}</p>
                    <Badge variant="outline" className="text-xs">{r.count} arriéré(s)</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Dû: <span className="text-destructive font-medium">{formatMontant(r.total)}</span></span>
                    <span className="text-muted-foreground">Payé: <span className="text-green-600 font-medium">{formatMontant(r.paye)}</span></span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Solde: <span className="text-orange-600 font-semibold">{formatMontant(r.solde)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres + tableau */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Détail des arriérés</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterImmeuble} onValueChange={setFilterImmeuble}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Tous les immeubles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les immeubles</SelectItem>
                {immeubles.map(imm => (
                  <SelectItem key={imm.id} value={imm.id}>{imm.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun arriéré enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Immeuble</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead className="text-right">Montant dû</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(a => (
                    <>
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => setExpandedRow(expandedRow === a.id ? null : a.id)}>
                        <TableCell className="w-8">
                          {a.paiements.length > 0 && (
                            expandedRow === a.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{a.immeubleNom}</TableCell>
                        <TableCell>{a.lotNumero}</TableCell>
                        <TableCell>{a.locataireNom}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">{formatMontant(Number(a.montant_du))}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">{formatMontant(a.totalPaye)}</TableCell>
                        <TableCell className="text-right text-primary font-medium">{formatMontant(a.totalCommissions)}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">{formatMontant(a.solde)}</TableCell>
                        <TableCell>
                          {a.solde <= 0 ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Soldé</Badge>
                          ) : a.totalPaye > 0 ? (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">Partiel</Badge>
                          ) : (
                            <Badge variant="destructive">Impayé</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenEditArriere(a); }} title="Modifier l'arriéré">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {isAdmin && (
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setArriereToDelete(a.id); setDeleteDialogOpen(true); }} title="Supprimer l'arriéré">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {a.solde > 0 && (
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleOpenCreatePaiement(a.id); }}>
                                <CreditCard className="h-3.5 w-3.5 mr-1" />
                                Payer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRow === a.id && a.paiements.length > 0 && (
                        <TableRow key={`${a.id}-payments`}>
                          <TableCell colSpan={10} className="bg-muted/30 p-0">
                            <div className="p-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Historique des paiements</p>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-xs">Mode</TableHead>
                                    <TableHead className="text-xs text-right">Montant</TableHead>
                                    <TableHead className="text-xs text-right">Commission ({a.tauxCommission}%)</TableHead>
                                    <TableHead className="text-xs text-right">Net propriétaire</TableHead>
                                    <TableHead className="text-xs">Observation</TableHead>
                                    <TableHead className="text-xs"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {a.paiements.map(p => (
                                    <TableRow key={p.id}>
                                      <TableCell className="text-xs">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</TableCell>
                                      <TableCell className="text-xs">{modeLabels[p.mode_paiement] || p.mode_paiement}</TableCell>
                                      <TableCell className="text-xs text-right font-medium">{formatMontant(Number(p.montant_paye))}</TableCell>
                                      <TableCell className="text-xs text-right text-primary">{formatMontant(Number(p.commission_capco))}</TableCell>
                                      <TableCell className="text-xs text-right">{formatMontant(Number(p.net_proprietaire))}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{p.observation || '—'}</TableCell>
                                      <TableCell className="text-xs">
                                        <Button size="sm" variant="ghost" onClick={() => handleOpenEditPaiement(p, a.id)} title="Modifier le paiement">
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog création/édition arriéré */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingArriereId ? 'Modifier l\'arriéré' : 'Enregistrer un arriéré de loyer'}</DialogTitle>
            <DialogDescription>
              {editingArriereId ? 'Modifier le montant ou l\'observation de cet arriéré.' : 'Enregistrer une somme impayée due par un locataire.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingArriereId && (
              <>
                <div>
                  <Label>Immeuble</Label>
                  <Select value={formImmeubleId} onValueChange={(v) => { setFormImmeubleId(v); setFormLotId(''); }}>
                    <SelectTrigger className="mt-2"><SelectValue placeholder="Sélectionner un immeuble" /></SelectTrigger>
                    <SelectContent>
                      {immeubles.map(imm => <SelectItem key={imm.id} value={imm.id}>{imm.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lot / Locataire</Label>
                  <Select value={formLotId} onValueChange={setFormLotId} disabled={!formImmeubleId}>
                    <SelectTrigger className="mt-2"><SelectValue placeholder={formImmeubleId ? "Sélectionner un lot" : "Choisir d'abord un immeuble"} /></SelectTrigger>
                    <SelectContent>
                      {lotsForDialog.map(lot => <SelectItem key={lot.id} value={lot.id}>{lot.numero} — {lot.locataire_nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label>Montant dû (FCFA)</Label>
              <Input type="number" value={formMontant} onChange={(e) => setFormMontant(e.target.value)} placeholder="Ex: 500000" className="mt-2" />
            </div>
            <div>
              <Label>Observation</Label>
              <Input value={formObservation} onChange={(e) => setFormObservation(e.target.value)} placeholder="Ex: Arriérés Oct-Déc 2025" className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitArriere} disabled={createArriere.isPending || updateArriere.isPending}>
              {(createArriere.isPending || updateArriere.isPending) ? 'Enregistrement...' : editingArriereId ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog paiement (création/édition) */}
      <Dialog open={paiementDialogOpen} onOpenChange={setPaiementDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPaiementId ? 'Modifier le paiement' : 'Enregistrer un paiement'}</DialogTitle>
            <DialogDescription>
              {selectedArriere && (
                <>{selectedArriere.locataireNom} — Lot {selectedArriere.lotNumero} — Solde: {formatMontant(availableSolde)}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Date du paiement</Label>
              <Input type="date" value={paiementDate} onChange={(e) => setPaiementDate(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Montant payé (FCFA)</Label>
              <Input type="number" value={paiementMontant} onChange={(e) => setPaiementMontant(e.target.value)} placeholder={`Max: ${availableSolde}`} className="mt-2" />
              {paiementMontant && selectedArriere && !isNaN(parseFloat(paiementMontant)) && (
                <div className="mt-2 p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission CAPCO ({selectedArriere.tauxCommission}%)</span>
                    <span className="font-medium text-primary">{formatMontant(Math.round(parseFloat(paiementMontant) * selectedArriere.tauxCommission / 100))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net propriétaire</span>
                    <span className="font-medium">{formatMontant(parseFloat(paiementMontant) - Math.round(parseFloat(paiementMontant) * selectedArriere.tauxCommission / 100))}</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>Mode de paiement</Label>
              <Select value={paiementMode} onValueChange={setPaiementMode}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="VIREMENT">Virement</SelectItem>
                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                  <SelectItem value="WAVE">Wave</SelectItem>
                  <SelectItem value="OM">Orange Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observation</Label>
              <Input value={paiementObservation} onChange={(e) => setPaiementObservation(e.target.value)} placeholder="Ex: Paiement partiel février" className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaiementDialogOpen(false)}>Annuler</Button>
            <Button onClick={handlePaiementSubmit} disabled={createPaiement.isPending || updatePaiement.isPending}>
              {(createPaiement.isPending || updatePaiement.isPending) ? 'Enregistrement...' : editingPaiementId ? 'Mettre à jour' : 'Enregistrer le paiement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmation suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'arriéré et tous ses paiements associés seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (arriereToDelete) {
                  await deleteArriere.mutateAsync(arriereToDelete);
                  setArriereToDelete(null);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
