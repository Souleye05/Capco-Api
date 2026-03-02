import React from 'react';
import { Plus, Search, Filter, Layers, LayoutGrid, Info, Loader2, BarChart3, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';

import { useDepensesLogic } from './useDepensesLogic';
import { DepenseTable } from './DepenseTable';
import { DepenseFormDialog, DeleteConfirmationDialog } from './DepenseDialogs';
import { DepenseStats } from './DepenseStats';

const TYPE_DEPENSE_LABELS: Record<string, string> = {
    PLOMBERIE_ASSAINISSEMENT: 'Plomberie – Assainissement',
    ELECTRICITE_ECLAIRAGE: 'Électricité – Éclairage',
    ENTRETIEN_MAINTENANCE: 'Entretien – Maintenance',
    SECURITE_GARDIENNAGE_ASSURANCE: 'Sécurité – Gardiennage – Assurance',
    AUTRES_DEPENSES: 'Autres dépenses',
};

export default function DepensesPage() {
    const { state, data, handlers, status } = useDepensesLogic();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-background/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm shadow-primary/5">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 shadow-lg shadow-destructive/5">
                        <TrendingDown className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-foreground leading-none">Dépenses Immeubles</h1>
                        <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest mt-2 flex items-center gap-2">
                            <Info className="h-3 w-3" />
                            Console de suivi des charges opérationnelles
                        </p>
                    </div>
                </div>
                <Button onClick={() => { handlers.resetForm(); handlers.setIsDialogOpen(true); }} className="h-12 px-8 rounded-2xl bg-foreground hover:bg-foreground/90 text-background shadow-xl shadow-foreground/10 transition-all hover:scale-[1.02] active:scale-95 font-black text-xs uppercase tracking-widest gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvelle dépense
                </Button>
            </div>

            <DepenseStats total={data.totalFiltered} count={data.filtered.length} />

            {/* Filters Control Bar */}
            <div className="bg-background/60 backdrop-blur-2xl p-4 rounded-3xl border border-border/40 shadow-sm flex flex-col sm:flex-row gap-4 items-center transition-all hover:shadow-md">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-destructive transition-colors z-10" />
                    <Input
                        placeholder="Rechercher une opération..."
                        value={state.search}
                        onChange={e => handlers.setSearch(e.target.value)}
                        className="h-12 pl-11 rounded-2xl bg-muted/20 border-border/40 border-none shadow-none focus:bg-background focus:ring-4 focus:ring-destructive/5 text-sm font-bold transition-all placeholder:font-medium placeholder:opacity-50"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <SearchableSelect
                        value={state.filterImmeuble}
                        onValueChange={handlers.setFilterImmeuble}
                        options={[
                            { value: "all", label: "Tous les immeubles" },
                            ...data.immeubles.map(i => ({ value: i.id, label: i.nom }))
                        ]}
                        placeholder="Immeuble"
                        className="h-12 w-full sm:w-[220px] rounded-2xl border-none bg-muted/20 shadow-none font-black text-xs uppercase tracking-tight focus:ring-4 focus:ring-destructive/5 transition-all"
                    />

                    <SearchableSelect
                        value={state.filterType}
                        onValueChange={handlers.setFilterType}
                        options={[
                            { value: "all", label: "Tous les types" },
                            ...Object.entries(TYPE_DEPENSE_LABELS).map(([k, v]) => ({ value: k, label: v }))
                        ]}
                        placeholder="Catégorie"
                        className="h-12 w-full sm:w-[240px] rounded-2xl border-none bg-muted/20 shadow-none font-black text-xs uppercase tracking-tight focus:ring-4 focus:ring-destructive/5 transition-all"
                    />
                </div>
            </div>

            <DepenseTable
                data={data.filtered}
                immeubleMap={data.immeubleMap}
                isAdmin={data.isAdmin}
                onEdit={handlers.openEdit}
                onDelete={handlers.setDeletingDepense}
                isLoading={data.isLoading}
                pagination={data.pagination}
                onPageChange={handlers.setPage}
            />

            <DepenseFormDialog
                open={state.isDialogOpen}
                onOpenChange={(o) => { handlers.setIsDialogOpen(o); if (!o) handlers.resetForm(); }}
                isEditing={!!state.editingDepense}
                form={state.form}
                setForm={handlers.setForm}
                immeubles={data.immeubles}
                onSave={handlers.handleSubmit}
                isPending={status.isSubmitting}
            />

            <DeleteConfirmationDialog
                open={!!state.deletingDepense}
                onOpenChange={(o) => { if (!o) handlers.setDeletingDepense(null); }}
                item={state.deletingDepense}
                onConfirm={handlers.handleDelete}
                isDeleting={status.isDeleting}
            />
        </div>
    );
}
