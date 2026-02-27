import { useState, useMemo } from 'react';
import { useArrieres, useCreateArriere, useUpdateArriere, useDeleteArriere, useImmeubles, useLots, useCreatePaiementArriere, useArrieresStatistics } from '@/hooks/useImmobilier';
import { useAuth } from '@/contexts/NestJSAuthContext';
import { toast } from 'sonner';

export function useArrieresLogic() {
    const { isAdmin } = useAuth();

    // Data
    // Pagination & Filters state
    const [page, setPage] = useState(1);
    const [filterImmeuble, setFilterImmeuble] = useState('all');
    const [search, setSearch] = useState('');

    // Data
    const { data: arrieresResult, isLoading: loadingArr } = useArrieres({
        page,
        limit: 10,
        immeubleId: filterImmeuble === 'all' ? undefined : filterImmeuble,
        search: search || undefined
    });

    const { data: stats, isLoading: loadingStats } = useArrieresStatistics(filterImmeuble === 'all' ? undefined : filterImmeuble);

    // We still need all immeubles/lots for selects, but arrieres are now paginated
    const { data: immeublesResult, isLoading: loadingImm } = useImmeubles({ limit: 100 });
    const { data: lotsResult, isLoading: loadingLots } = useLots({ limit: 200 });

    const arrieres = arrieresResult?.data || [];
    const pagination = arrieresResult?.pagination;
    const immeubles = immeublesResult?.data || [];
    const lots = lotsResult?.data || [];

    // Mutations
    const createArriere = useCreateArriere();
    const updateArriere = useUpdateArriere();
    const deleteArriere = useDeleteArriere();
    const createPaiement = useCreatePaiementArriere();


    // Dialogs state
    const [arriereDialog, setArriereDialog] = useState({ open: false, id: null as string | null });
    const [form, setForm] = useState({ immeubleId: '', lotId: '', montant: '', observation: '' });
    const [paiementDialog, setPaiementDialog] = useState({ open: false, arriereId: '' });
    const [pForm, setPForm] = useState({ montant: '', mode: 'CASH', date: '', observation: '' });
    const [arriereToDelete, setArriereToDelete] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Derived Data
    const enriched = useMemo(() => arrieres.map(a => ({
        ...a,
        totalPaye: a.montantPaye,
        solde: a.montantRestant,
        tauxCommission: a.immeubleTauxCommission || 5,
    })), [arrieres]);

    const filtered = enriched; // Filtering is now done on server

    const totals = useMemo(() => {
        if (!stats) return { due: 0, paye: 0, comm: 0, solde: 0, rate: 0 };
        return {
            due: stats.totalMontantDu || 0,
            paye: stats.totalMontantPaye || 0,
            comm: stats.totalCommissions || 0,
            solde: stats.totalMontantRestant || 0,
            rate: stats.tauxRecouvrement || 0
        };
    }, [stats]);

    const resumeByImmeuble = useMemo(() => {
        // Si on a des statistiques, les utiliser
        if (stats?.repartitionParImmeuble) {
            return stats.repartitionParImmeuble.map((item: any) => ({
                nom: item.nom || 'Immeuble inconnu',
                due: Number(item.due) || 0,
                paye: Number(item.paye) || 0,
                solde: Number(item.solde) || 0,
                count: Number(item.count) || 0
            }));
        }
        
        // Sinon, calculer à partir des arriérés actuels
        const map = new Map<string, any>();
        enriched.forEach(a => {
            const key = a.immeubleId;
            const existing = map.get(key) || { 
                nom: a.immeubleNom || 'Immeuble inconnu', 
                due: 0, 
                paye: 0, 
                solde: 0, 
                count: 0 
            };
            existing.due += Number(a.montantDu) || 0;
            existing.paye += Number(a.totalPaye) || 0;
            existing.solde += Number(a.solde) || 0;
            existing.count++;
            map.set(key, existing);
        });
        return Array.from(map.values()).sort((a, b) => (b.solde || 0) - (a.solde || 0));
    }, [stats, enriched]);

    const lotsForDialog = useMemo(() => {
        if (!form.immeubleId) return [];
        return lots
            .filter(l => l.statut === 'OCCUPE' && l.immeubleId === form.immeubleId)
            .map(l => ({ id: l.id, label: `${l.numero} — ${l.locataireNom || 'N/A'}` }));
    }, [lots, form.immeubleId]);

    const selectedArriere = enriched.find(a => a.id === paiementDialog.arriereId);
    const availableSolde = selectedArriere ? (selectedArriere.montantDu - selectedArriere.totalPaye) : 0;

    // Handlers
    const handleOpenArriere = (a?: any) => {
        if (a) {
            setForm({ immeubleId: a.immeubleId, lotId: a.lotId, montant: String(a.montantDu), observation: a.description || '' });
            setArriereDialog({ open: true, id: a.id });
        } else {
            setForm({ immeubleId: '', lotId: '', montant: '', observation: '' });
            setArriereDialog({ open: true, id: null });
        }
    };

    const submitArriere = async () => {
        const montant = parseFloat(form.montant);
        if (!arriereDialog.id && !form.lotId) return toast.error('Sélectionnez un lot');
        if (isNaN(montant) || montant <= 0) return toast.error('Montant invalide');

        try {
            if (arriereDialog.id) {
                await updateArriere.mutateAsync({ id: arriereDialog.id, montantDu: montant, description: form.observation || undefined });
            } else {
                const currentYear = new Date().getFullYear();
                await createArriere.mutateAsync({
                    lotId: form.lotId,
                    montantDu: montant,
                    periodeDebut: `${currentYear - 1}-01-01T00:00:00Z`,
                    periodeFin: `${currentYear - 1}-12-31T23:59:59Z`,
                    description: form.observation || undefined
                });
            }
            setArriereDialog({ open: false, id: null });
        } catch { }
    };

    const handleOpenPaiement = (arriereId: string) => {
        setPaiementDialog({ open: true, arriereId });
        setPForm({ montant: '', mode: 'CASH', date: new Date().toISOString().split('T')[0], observation: '' });
    };

    const submitPaiement = async () => {
        const montant = parseFloat(pForm.montant);
        if (isNaN(montant) || montant <= 0) return toast.error('Montant invalide');
        if (montant > availableSolde) return toast.error('Dépasse le solde');

        try {
            await createPaiement.mutateAsync({
                arrierageId: paiementDialog.arriereId,
                date: pForm.date,
                montant,
                mode: pForm.mode,
                commentaire: pForm.observation || undefined
            });
            setPaiementDialog({ open: false, arriereId: '' });
        } catch (e: any) {
            toast.error(e.message || 'Erreur');
        }
    };

    const confirmDelete = async () => {
        if (!arriereToDelete) return;
        await deleteArriere.mutateAsync(arriereToDelete);
        setArriereToDelete(null);
    };

    return {
        state: { filterImmeuble, search, arriereDialog, form, paiementDialog, pForm, arriereToDelete, expandedRow, page },
        data: { arrieres: enriched, filtered, immeubles, lots, lotsForDialog, totals, resumeByImmeuble, availableSolde, isAdmin, isLoading: loadingArr || loadingImm || loadingLots || loadingStats, pagination },
        handlers: {
            setFilterImmeuble: (v: string) => { setFilterImmeuble(v); setPage(1); },
            setSearch: (v: string) => { setSearch(v); setPage(1); },
            setPage, setForm, setPForm, setArriereDialog, setPaiementDialog, setArriereToDelete, setExpandedRow,
            handleOpenArriere, submitArriere, handleOpenPaiement, submitPaiement, confirmDelete
        }
    };
}
