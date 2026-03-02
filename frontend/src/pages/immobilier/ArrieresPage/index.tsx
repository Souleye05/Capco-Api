import React from 'react';
import { Building2, Search, Printer, Plus, TrendingUp, Info, LayoutGrid, Filter, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-background/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                        <TrendingUp className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-foreground leading-none">Arriérés de loyers</h1>
                        <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest mt-2 flex items-center gap-2 italic">
                            Dettes antérieures à Janvier 2026
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => handlers.handleOpenArriere()} className="h-11 px-6 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-foreground/10 transition-all hover:scale-[1.02]">
                        <Plus className="h-4 w-4" />
                        Nouvel Arriéré
                    </Button>
                    <Button variant="outline" onClick={printPDF} className="h-11 px-6 rounded-xl border-border/40 bg-background/50 backdrop-blur-md font-black text-[10px] uppercase tracking-widest gap-2 transition-all hover:bg-background/80">
                        <Printer className="h-4 w-4" />
                        Imprimer
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard title="Total arriérés" value={formatFCFA(data.totals.due)} sub={`${data.filtered.length} ligne(s)`} color="text-slate-600/80 font-black" />
                <StatCard title="Total récupéré" value={formatFCFA(data.totals.paye)} color="text-success font-black" />
                <StatCard title="Commission CAPCO" value={formatFCFA(data.totals.comm)} color="text-primary font-black" />
                <StatCard title="Solde restant" value={formatFCFA(data.totals.solde)} color="text-destructive font-black" />
                <StatCard title="Récupération" value={`${data.totals.rate}%`} rate={data.totals.rate} />
            </div>

            <ResumeImmeubles data={data.resumeByImmeuble} />

            <div className="bg-background/40 backdrop-blur-xl rounded-[2rem] border border-border/40 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border/10 bg-muted/5 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors z-10" />
                        <Input
                            placeholder="Rechercher par lot ou locataire..."
                            value={state.search}
                            onChange={e => handlers.setSearch(e.target.value)}
                            className="h-11 pl-11 rounded-xl bg-muted/20 border-none shadow-none focus:bg-background focus:ring-4 focus:ring-primary/5 text-sm font-bold transition-all placeholder:font-medium placeholder:opacity-50"
                        />
                    </div>
                    <SearchableSelect
                        value={state.filterImmeuble}
                        onValueChange={handlers.setFilterImmeuble}
                        options={[
                            { value: "all", label: "Tous les immeubles" },
                            ...data.immeubles.map(imm => ({ value: imm.id, label: imm.nom }))
                        ]}
                        placeholder="Filtrer par immeuble"
                        className="h-11 w-full sm:w-[240px] rounded-xl border-none bg-muted/20 shadow-none font-black text-[10px] uppercase tracking-wider focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                </div>
                <div className="p-1">
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
                </div>
            </div>

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
