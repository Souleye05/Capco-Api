import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Banknote, Calendar, History, Info, Loader2, AlertTriangle, Building2, Wallet, MoreVertical, Edit, Trash2
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
  useDeletePaiementRecouvrement
} from '@/hooks/useRecouvrement';

// Refactored Components
import { DossierSummaryCards } from '@/pages/recouvrement/components/DossierSummaryCards';
import { PartiesCards } from '@/pages/recouvrement/components/PartiesCards';
import { DossierFinanceSidebar } from '@/pages/recouvrement/components/DossierFinanceSidebar';
import { ActionFormDialog, PaiementFormDialog } from '@/pages/recouvrement/components/DossierDialogs';

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

  const [dialogs, setDialogs] = useState({ action: false, paiement: false });
  const [editingItem, setEditingItem] = useState<{ type: 'action' | 'paiement', data: any } | null>(null);

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

  const handleDeleteAction = async (actionId: string) => {
    if (window.confirm("Supprimer cette action ?")) {
      await deleteAction.mutateAsync({ id: actionId, dossierId: dossier!.id });
    }
  };

  const handleDeletePaiement = async (paiementId: string) => {
    if (window.confirm("Supprimer ce paiement ?")) {
      await deletePaiement.mutateAsync({ id: paiementId, dossierId: dossier!.id });
    }
  };

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

            <Tabs defaultValue="actions" className="w-full">
              <TabsList className="bg-slate-200/50 p-1 rounded-xl mb-4 w-fit">
                <TabsTrigger value="actions" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Actions ({dossier.nombreActions})</TabsTrigger>
                <TabsTrigger value="paiements" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Paiements</TabsTrigger>
                <TabsTrigger value="notes" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Observations</TabsTrigger>
              </TabsList>

              <TabsContent value="actions" className="animate-in slide-in-from-top-1">
                <Card className="border-none shadow-sm divide-y divide-slate-50 overflow-hidden">
                  {dossier.actions?.length ? dossier.actions.map((action: any) => (
                    <div key={action.id} className="p-4 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase w-fit">{typeLabels[action.typeAction] || action.typeAction}</Badge>
                          <span className="text-xs text-slate-400 font-medium">{new Date(action.date).toLocaleDateString()}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingItem({ type: 'action', data: action }); setDialogs({ ...dialogs, action: true }); }}>
                              <Edit className="h-4 w-4 mr-2" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAction(action.id)}>
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
                <Card className="border-none shadow-sm divide-y divide-slate-50 overflow-hidden">
                  {dossier.paiements?.length ? dossier.paiements.map((p: any) => (
                    <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0"><Banknote className="h-5 w-5" /></div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{formatCurrency(p.montant)}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{modeLabels[p.mode] || p.mode} • {new Date(p.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.reference && <Badge variant="secondary" className="text-[10px]">{p.reference}</Badge>}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingItem({ type: 'paiement', data: p }); setDialogs({ ...dialogs, paiement: true }); }}>
                              <Edit className="h-4 w-4 mr-2" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePaiement(p.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )) : <EmptyState icon={<Wallet />} title="Historique paiements" sub="Aucun encaissement reçu" onAdd={() => setDialogs({ ...dialogs, paiement: true })} />}
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="animate-in slide-in-from-top-1">
                <Card className="border-none shadow-sm p-6 flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Info className="h-5 w-5 text-slate-400" /></div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 w-full min-h-[120px] text-sm text-slate-600 italic">
                    {dossier.notes || "Aucune observation particulière."}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-6 h-fit">
            <DossierFinanceSidebar dossier={dossier} />
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
