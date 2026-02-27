import React from 'react';
import { Building2, Search, Printer, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { generateArrieresPDF } from '@/utils/generateArrieresPDF';

import { useArrieresLogic } from './useArrieresLogic';
import { StatCard, ResumeImmeubles } from './ArriereStats';
import { ArriereTable } from './ArriereTable';
import { DialogueArriere, DialoguePaiement, DialogueSuppression } from './ArriereDialogsNew';

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

export default function ArrieresPage() {
    const { state, data, handlers } = useArrieresLogic();

    const printPDF = () => {
        const immNom = state.filterImmeuble !== 'all' ? data.immeubles.find(i => i.id === state.filterImmeuble)?.nom : undefined;
        generateArrieresPDF({
            rows: data.filtered.map(a => ({
                immeuble_nom: a.immeubleNom, lot_numero: a.lotNumero, locataire_nom: a.locataireNom || '—',
                montant_du: Number(a.montantDu), total_paye: a.totalPaye, total_commissions: a.totalPaye * (a.tauxCommission / 100),
                solde: a.solde, statut: a.solde <= 0 ? 'Solde' : a.totalPaye > 0 ? 'Partiel' : 'Impaye',
                observation: a.description || '', periode: 'Avant Janvier 2026', nb_paiements: a.paiementsPartiels.length,
            })),
            totalArrieres: data.totals.due, totalPaye: data.totals.paye, totalCommissions: data.totals.comm,
            totalSolde: data.totals.solde, tauxRecouvrement: data.totals.rate, immeubleFilter: immNom,
        });
    };

    if (data.isLoading) return <div className="flex justify-center h-64 items-center">Chargement...</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Arriérés de loyers</h1>
                    <p className="text-sm text-muted-foreground italic">Dettes antérieures à Janvier 2026</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlers.handleOpenArriere()}> <Plus className="w-4 h-4 mr-2" /> Nouveau </Button>
                    <Button variant="outline" size="sm" onClick={printPDF}> <Printer className="w-4 h-4 mr-2" /> Imprimer </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard title="Total arriérés" value={formatFCFA(data.totals.due)} sub={`${data.filtered.length} ligne(s)`} color="text-destructive" />
                <StatCard title="Total récupéré" value={formatFCFA(data.totals.paye)} color="text-green-600" />
                <StatCard title="Commission CAPCO" value={formatFCFA(data.totals.comm)} color="text-primary" />
                <StatCard title="Solde restant" value={formatFCFA(data.totals.solde)} color="text-orange-600" />
                <StatCard title="Recouvrement" value={`${data.totals.rate}%`} rate={data.totals.rate} />
            </div>

            <ResumeImmeubles data={data.resumeByImmeuble} />

            <Card>
                <CardHeader className="pb-3 space-y-3">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher..." value={state.search} onChange={e => handlers.setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <Select value={state.filterImmeuble} onValueChange={handlers.setFilterImmeuble}>
                            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les immeubles</SelectItem>
                                {data.immeubles.map(imm => <SelectItem key={imm.id} value={imm.id}>{imm.nom}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <ArriereTable
                        data={data.filtered}
                        isAdmin={data.isAdmin}
                        expandedRow={state.expandedRow}
                        onExpand={handlers.setExpandedRow}
                        onEdit={handlers.handleOpenArriere}
                        onDelete={handlers.setArriereToDelete}
                        onPay={handlers.handleOpenPaiement}
                        pagination={data.pagination}
                        onPageChange={handlers.setPage}
                    />
                </CardContent>
            </Card>

            <DialogueArriere
                open={state.arriereDialog.open} onOpenChange={(o) => handlers.setArriereDialog({ ...state.arriereDialog, open: o })}
                id={state.arriereDialog.id} form={state.form} setForm={handlers.setForm}
                immeubles={data.immeubles} lots={data.lotsForDialog} onSave={handlers.submitArriere}
            />

            <DialoguePaiement
                open={state.paiementDialog.open} onOpenChange={(o) => handlers.setPaiementDialog({ ...state.paiementDialog, open: o })}
                availableSolde={data.availableSolde} form={state.pForm} setForm={handlers.setPForm} onSave={handlers.submitPaiement}
            />

            <DialogueSuppression
                open={!!state.arriereToDelete} onOpenChange={(o) => !o && handlers.setArriereToDelete(null)}
                onConfirm={handlers.confirmDelete}
            />
        </div>
    );
}
