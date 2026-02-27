import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dépenses Immeubles</h1>
                    <p className="text-sm text-muted-foreground">Suivi des dépenses liées aux immeubles</p>
                </div>
                <Button onClick={() => { handlers.resetForm(); handlers.setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle dépense
                </Button>
            </div>

            <DepenseStats total={data.totalFiltered} count={data.filtered.length} />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher..." value={state.search} onChange={e => handlers.setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={state.filterImmeuble} onValueChange={handlers.setFilterImmeuble}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Immeuble" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les immeubles</SelectItem>
                        {data.immeubles.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.nom}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={state.filterType} onValueChange={handlers.setFilterType}>
                    <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {Object.entries(TYPE_DEPENSE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
