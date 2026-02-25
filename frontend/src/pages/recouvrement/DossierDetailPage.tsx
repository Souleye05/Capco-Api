import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Banknote, Calendar, History, Info, Loader2, AlertTriangle, Building2, Wallet, MoreVertical, Edit, Trash2, Receipt
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useDossierRecouvrement, useCreateActionRecouvrement,
  useCreatePaiementRecouvrement, useUpdateActionRecouvrement,
  useDeleteActionRecouvrement, useUpdatePaiementRecouvrement,
  useDeletePaiementRecouvrement, useCreateDepenseRecouvrement,
  useDeleteDepenseRecouvrement, useUpdateHonoraireRecouvrement
} from '@/hooks/useRecouvrement';

// Refactored Components
import { DossierSummaryCards } from '@/pages/recouvrement/components/DossierSummaryCards';
import { PartiesCards } from '@/pages/recouvrement/components/PartiesCards';
import { DossierFinanceSidebar } from '@/pages/recouvrement/components/DossierFinanceSidebar';
import { ActionFormDialog, PaiementFormDialog, ConfirmDeleteDialog, DepenseFormDialog, HonoraireFormDialog } from '@/pages/recouvrement/components/DossierDialogs';

const typeLabels: Record<string, string> = {
  APPEL_TELEPHONIQUE: 'Appel téléphonique',
  COURRIER: 'Courrier',
  LETTRE_RELANCE: 'Lettre de relance',
  MISE_DEMEURE: 'Mise en demeure',
  COMMANDEMENT_PAYER: 'Commandement de payer',
  ASSIGNATION: 'Assignation',
  REQUETE: 'Requête',
  AUDIENCE_PROCEDURE: 'Audience / Procédure',
  AUTRE: 'Autre'
};

const modeLabels: Record<string, string> = {
  CASH: 'Espèces',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  WAVE: 'Wave',
  OM: 'Orange Money'
};

const depenseLabels: Record<string, string> = {
  FRAIS_HUISSIER: "Frais d'huissier",
  FRAIS_GREFFE: "Frais de greffe",
  TIMBRES_FISCAUX: "Timbres fiscaux",
  FRAIS_COURRIER: "Frais de courrier",
  FRAIS_DEPLACEMENT: "Frais de déplacement",
  FRAIS_EXPERTISE: "Frais d'expertise",
  AUTRES: "Autres frais"
};

export default function DossierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dossier, isLoading } = useDossierRecouvrement(id);
  const createAction = useCreateActionRecouvrement();
  const updateAction = useUpdateActionRecouvrement();
  const deleteAction = useDeleteActionRecouvrement();
  const createPaiement = useCreatePaiementRecouvrement();
  const updatePaiement = useUpdatePaiementRecouvrement();
  const deletePaiement = useDeletePaiementRecouvrement();
  const createDepense = useCreateDepenseRecouvrement();
  const deleteDepense = useDeleteDepenseRecouvrement();
  const updateHonoraire = useUpdateHonoraireRecouvrement();

  const [dialogs, setDialogs] = useState({ action: false, paiement: false, depense: false, honoraire: false });
  const [editingItem, setEditingItem] = useState<{ type: 'action' | 'paiement' | 'depense' | 'honoraire', data: any } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'action' | 'paiement' | 'depense', data: any } | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (!dossier) return <NotFoundScreen onBack={() => navigate('/recouvrement/dossiers')} />;

  const handleCreateAction = async (data: any) => {
    try {
      if (editingItem?.type === 'action') {
        await updateAction.mutateAsync({ id: editingItem.data.id, data });
      } else {
        await createAction.mutateAsync({ dossierId: dossier!.id, date: new Date().toISOString(), ...data });
      }
      setDialogs({ ...dialogs, action: false });
      setEditingItem(null);
    } catch (e) { }
  };

  const handleCreatePaiement = async (data: any) => {
    try {
      if (editingItem?.type === 'paiement') {
        await updatePaiement.mutateAsync({ id: editingItem.data.id, data });
      } else {
        await createPaiement.mutateAsync({ dossierId: dossier!.id, date: new Date().toISOString(), ...data });
      }
      setDialogs({ ...dialogs, paiement: false });
      setEditingItem(null);
    } catch (e) { }
  };

  const handleCreateDepense = async (data: any) => {
    try {
      await createDepense.mutateAsync({ dossierId: dossier!.id, date: new Date().toISOString(), ...data });
      setDialogs({ ...dialogs, depense: false });
    } catch (e) { }
  };

  const handleUpdateHonoraire = async (data: any) => {
    try {
      const activeHonoraire = dossier?.honoraires?.[0];
      if (activeHonoraire) {
        await updateHonoraire.mutateAsync({ id: activeHonoraire.id, dossierId: dossier!.id, ...data });
      }
      setDialogs({ ...dialogs, honoraire: false });
    } catch (e) { }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      if (deletingItem.type === 'action') {
        await deleteAction.mutateAsync({ id: deletingItem.data.id, dossierId: dossier!.id });
      } else if (deletingItem.type === 'paiement') {
        await deletePaiement.mutateAsync({ id: deletingItem.data.id, dossierId: dossier!.id });
      } else {
        await deleteDepense.mutateAsync({ id: deletingItem.data.id, dossierId: dossier!.id });
      }
      setDeletingItem(null);
    } catch (e) { }
  };

  const timelineEvents = [
    ...(dossier.actions?.map(a => ({ type: 'action', date: new Date(a.date), data: a })) || []),
    ...(dossier.paiements?.map(p => ({ type: 'paiement', date: new Date(p.date), data: p })) || []),
    ...(dossier.depenses?.map(d => ({ type: 'depense', date: new Date(d.date), data: d })) || [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="min-h-screen bg-slate-50/30">
      <Header
        title={
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/recouvrement/dossiers')} className="rounded-full"><ArrowLeft className="h-5 w-5 text-primary" /></Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{dossier.reference}</h1>
                <Badge className={cn("rounded-full px-3 shadow-none border-none", dossier.statut === 'EN_COURS' ? "bg-success/10 text-success" : "bg-slate-100 text-slate-600")}>
                  {dossier.statut.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium italic">Créé le {new Date(dossier.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogs({ ...dialogs, action: true })} className="border-slate-200 shadow-sm text-primary hover:text-primary/90"><Plus className="h-4 w-4 mr-2" /> Action</Button>
            <Button onClick={() => setDialogs({ ...dialogs, paiement: true })} className="bg-primary hover:bg-primary/90 shadow-md transition-all text-white"><Banknote className="h-4 w-4 mr-2" /> Paiement</Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <DossierSummaryCards dossier={dossier} />
            <PartiesCards dossier={dossier} />

            <Tabs defaultValue="chronologie" className="w-full">
              <TabsList className="bg-slate-200/50 p-1 rounded-xl mb-4 w-fit">
                <TabsTrigger value="chronologie" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Chronologie</TabsTrigger>
                <TabsTrigger value="actions" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Actions ({dossier.nombreActions})</TabsTrigger>
                <TabsTrigger value="paiements" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Paiements ({dossier.paiements?.length || 0})</TabsTrigger>
                <TabsTrigger value="depenses" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Dépenses ({dossier.depenses?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="chronologie" className="animate-in slide-in-from-top-1">
                <Card className="border-none shadow-sm p-6 overflow-hidden">
                  <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Historique des événements
                  </h3>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-100 before:to-transparent">
                    {timelineEvents.length ? timelineEvents.map((event, idx) => (
                      <div key={idx} className="relative flex items-start gap-4 pl-10">
                        <div className={cn(
                          "absolute left-0 h-10 w-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-slate-100",
                          event.type === 'action' ? "bg-primary/10 text-primary" :
                            event.type === 'paiement' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        )}>
                          {event.type === 'action' ? <Calendar className="h-4 w-4" /> :
                            event.type === 'paiement' ? <Banknote className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {event.type === 'action' ? (typeLabels[event.data.typeAction] || event.data.typeAction) :
                                  event.type === 'paiement' ? "Paiement reçu" : (depenseLabels[event.data.typeDepense] || event.data.typeDepense)}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">
                                {event.type === 'action' ? event.data.resume :
                                  event.type === 'paiement' ? `${formatCurrency(event.data.montant)} - ${modeLabels[event.data.mode] || event.data.mode}` :
                                    `${formatCurrency(event.data.montant)} - ${event.data.nature}`}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-4">
                              {event.date.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center text-slate-400 italic">Aucun événement enregistré</div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="animate-in slide-in-from-top-1">
                <Card className="border-none shadow-sm divide-y divide-slate-50 overflow-hidden">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider italic">Actions de recouvrement</h3>
                    <Button variant="ghost" size="sm" onClick={() => setDialogs({ ...dialogs, action: true })} className="h-7 text-xs font-bold gap-1.5"><Plus className="h-3 w-3" /> Ajouter</Button>
                  </div>
                  {dossier.actions?.length ? dossier.actions.map((action: any) => (
                    <div key={action.id} className="p-4 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase w-fit">{typeLabels[action.typeAction] || action.typeAction}</Badge>
                          <span className="text-xs text-slate-400 font-medium">{new Date(action.date).toLocaleDateString()}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingItem({ type: 'action', data: action }); setDialogs({ ...dialogs, action: true }); }}>
                              <Edit className="h-4 w-4 mr-2" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingItem({ type: 'action', data: action })}>
                              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm text-slate-700 font-medium">{action.resume}</p>
                      {action.prochaineEtape && (
                        <div className="mt-2 text-[10px] text-warning font-bold bg-warning/10 w-fit px-2 py-0.5 rounded flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Prochaine étape : {action.prochaineEtape}
                        </div>
                      )}
                    </div>
                  )) : <EmptyState icon={<History />} title="Suivi des actions" sub="Aucune action enregistrée" onAdd={() => setDialogs({ ...dialogs, action: true })} />}
                </Card>
              </TabsContent>

              <TabsContent value="paiements" className="animate-in slide-in-from-top-1">
                <Card className="border-none shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider italic">Paiements reçus</h3>
                    <Button variant="ghost" size="sm" onClick={() => setDialogs({ ...dialogs, paiement: true })} className="h-7 text-xs font-bold gap-1.5"><Plus className="h-3 w-3" /> Ajouter</Button>
                  </div>
                  <div className="p-4 space-y-4">
                    {dossier.paiements?.length ? dossier.paiements.map((p: any) => (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-50/50 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-400 border-slate-200">{modeLabels[p.mode] || p.mode}</Badge>
                            <span className="text-xs font-bold text-slate-400">{new Date(p.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-lg font-black text-success">+{formatCurrency(p.montant)}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingItem({ type: 'paiement', data: p }); setDialogs({ ...dialogs, paiement: true }); }}>
                                <Edit className="h-4 w-4 mr-2" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeletingItem({ type: 'paiement', data: p })}>
                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )) : <EmptyState icon={<Wallet />} title="Historique paiements" sub="Aucun encaissement reçu" onAdd={() => setDialogs({ ...dialogs, paiement: true })} />}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="depenses" className="animate-in slide-in-from-top-1">
                <Card className="border-none shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider italic">Dépenses engagées</h3>
                    <Button variant="ghost" size="sm" onClick={() => setDialogs({ ...dialogs, depense: true })} className="h-7 text-xs font-bold gap-1.5"><Plus className="h-3 w-3" /> Ajouter</Button>
                  </div>
                  <div className="p-4 space-y-3">
                    {dossier.depenses?.length ? dossier.depenses.map((d: any) => (
                      <div key={d.id} className="p-3 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0"><Receipt className="h-4 w-4" /></div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">{d.nature}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{depenseLabels[d.typeDepense] || d.typeDepense} • {new Date(d.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-destructive tabular-nums">-{formatCurrency(d.montant)}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeletingItem({ type: 'depense', data: d })}>
                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )) : <EmptyState icon={<Receipt />} title="Dépenses engagées" sub="Aucune dépense enregistrée" onAdd={() => setDialogs({ ...dialogs, depense: true })} />}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-6 h-fit">
            <DossierFinanceSidebar
              dossier={dossier}
              onEditHonoraires={() => setDialogs({ ...dialogs, honoraire: true })}
            />
          </div>
        </div>
      </div>

      <ActionFormDialog
        open={dialogs.action}
        onOpenChange={(val) => { setDialogs({ ...dialogs, action: val }); if (!val) setEditingItem(null); }}
        onSubmit={handleCreateAction}
        labels={typeLabels}
        initialData={editingItem?.type === 'action' ? editingItem.data : undefined}
      />
      <PaiementFormDialog
        open={dialogs.paiement}
        onOpenChange={(val) => { setDialogs({ ...dialogs, paiement: val }); if (!val) setEditingItem(null); }}
        onSubmit={handleCreatePaiement}
        initialData={editingItem?.type === 'paiement' ? editingItem.data : undefined}
        soldeRestant={dossier?.soldeRestant}
      />
      <DepenseFormDialog
        open={dialogs.depense}
        onOpenChange={(val) => setDialogs({ ...dialogs, depense: val })}
        onSubmit={handleCreateDepense}
      />
      <HonoraireFormDialog
        open={dialogs.honoraire}
        onOpenChange={(val) => setDialogs({ ...dialogs, honoraire: val })}
        onSubmit={handleUpdateHonoraire}
        initialData={dossier?.honoraires?.[0]}
      />

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title={`Supprimer cette ${deletingItem?.type === 'action' ? 'action' : deletingItem?.type === 'paiement' ? 'paiement' : 'dépense'} ?`}
        description="Cette opération est irréversible. Voulez-vous continuer ?"
      />
    </div>
  );
}

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
    <div className="text-center space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-recouvrement mx-auto" />
      <p className="text-slate-500 font-medium italic">Traitement du dossier...</p>
    </div>
  </div>
);

const NotFoundScreen = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
    <Card className="w-96 text-center p-8 border-none shadow-xl">
      <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Introuvable</h2>
      <p className="text-slate-400 mt-2 mb-6 text-sm">Ce dossier n'existe plus ou a changé de référence.</p>
      <Button onClick={onBack} className="w-full bg-primary hover:bg-primary/90 text-white">Retour à la liste</Button>
    </Card>
  </div>
);

const EmptyState = ({ icon, title, sub, onAdd }: any) => (
  <div className="p-12 text-center text-slate-400">
    <div className="opacity-10 mb-4 flex justify-center">{icon && React.cloneElement(icon, { className: "h-12 w-12" })}</div>
    <p className="text-lg font-medium">{title}</p>
    <p className="text-xs mb-4">{sub}</p>
    <Button variant="outline" size="sm" onClick={onAdd}>Ajouter ici</Button>
  </div>
);
