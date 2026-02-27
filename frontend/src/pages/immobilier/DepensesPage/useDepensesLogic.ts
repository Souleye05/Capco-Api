import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useImmeubles, useDepensesImmeubles, useCreateDepenseImmeuble, useUpdateDepenseImmeuble, useDeleteDepenseImmeuble, useDepensesStatistics, type DepenseImmeuble } from '@/hooks/useImmobilier';
import { useAuth } from '@/contexts/NestJSAuthContext';
import { toast } from 'sonner';

export function useDepensesLogic() {
    const { isAdmin } = useAuth();

    // Pagination & Filters state
    const [page, setPage] = useState(1);
    const [filterImmeuble, setFilterImmeuble] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [search, setSearch] = useState('');

    const { data: immeublesResult, isLoading: loadingImm } = useImmeubles({ limit: 100 });
    const immeubles = immeublesResult?.data || [];

    const { data: depensesResult, isLoading: loadingDep } = useDepensesImmeubles({
        page,
        limit: 10,
        immeubleId: filterImmeuble === 'all' ? undefined : filterImmeuble,
        typeDepense: filterType === 'all' ? undefined : filterType,
        search: search || undefined
    });

    const { data: stats, isLoading: loadingStats } = useDepensesStatistics({
        immeubleId: filterImmeuble === 'all' ? undefined : filterImmeuble,
        typeDepense: filterType === 'all' ? undefined : filterType
    });

    const depenses = depensesResult?.data || [];
    const pagination = depensesResult?.pagination;

    const createMutation = useCreateDepenseImmeuble();
    const updateMutation = useUpdateDepenseImmeuble();
    const deleteMutation = useDeleteDepenseImmeuble();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDepense, setEditingDepense] = useState<DepenseImmeuble | null>(null);
    const [deletingDepense, setDeletingDepense] = useState<DepenseImmeuble | null>(null);

    // Form state
    const [form, setForm] = useState({
        immeubleId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        nature: '',
        description: '',
        montant: '',
        typeDepense: 'AUTRES_DEPENSES',
    });

    const immeubleMap = useMemo(() => Object.fromEntries(immeubles.map(i => [i.id, i])), [immeubles]);

    const filtered = depenses; // Server-side
    const totalFiltered = stats?.totalMontant || 0;

    const resetForm = () => {
        setForm({ immeubleId: '', date: format(new Date(), 'yyyy-MM-dd'), nature: '', description: '', montant: '', typeDepense: 'AUTRES_DEPENSES' });
        setEditingDepense(null);
    };

    const openEdit = (d: DepenseImmeuble) => {
        setEditingDepense(d);
        setForm({
            immeubleId: d.immeubleId,
            date: format(new Date(d.date), 'yyyy-MM-dd'),
            nature: d.nature,
            description: d.description || '',
            montant: String(d.montant),
            typeDepense: d.typeDepense,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.immeubleId || !form.nature || !form.montant) return;

        const payload = {
            immeubleId: form.immeubleId,
            date: form.date,
            nature: form.nature,
            description: form.description || undefined,
            montant: Number(form.montant),
            typeDepense: form.typeDepense,
        };

        try {
            if (editingDepense) {
                await updateMutation.mutateAsync({ id: editingDepense.id, ...payload });
                toast.success('Dépense mise à jour');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Dépense enregistrée');
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (e: any) {
            toast.error(e.message || 'Une erreur est survenue');
        }
    };

    const handleDelete = async () => {
        if (!deletingDepense) return;
        try {
            await deleteMutation.mutateAsync(deletingDepense.id);
            toast.success('Dépense supprimée');
            setDeletingDepense(null);
        } catch (e: any) {
            toast.error(e.message || 'Erreur lors de la suppression');
        }
    };

    return {
        state: { filterImmeuble, search, filterType, isDialogOpen, editingDepense, deletingDepense, form, page },
        data: { depenses, filtered, immeubles, totalFiltered, immeubleMap, isAdmin, isLoading: loadingImm || loadingDep || loadingStats, pagination },
        handlers: {
            setFilterImmeuble: (v: string) => { setFilterImmeuble(v); setPage(1); },
            setFilterType: (v: string) => { setFilterType(v); setPage(1); },
            setSearch: (v: string) => { setSearch(v); setPage(1); },
            setPage, setIsDialogOpen, setDeletingDepense, setForm,
            resetForm, openEdit, handleSubmit, handleDelete
        },
        status: {
            isSubmitting: createMutation.isPending || updateMutation.isPending,
            isDeleting: deleteMutation.isPending
        }
    };
}
