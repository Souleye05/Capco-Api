import { useState, useMemo } from 'react';
import { useImmeubles, useLots, useEncaissements, useEncaissementsStatistics, useUpdateEncaissement, useDeleteEncaissement, type Encaissement } from '@/hooks/useImmobilier';

export function useLoyersPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImmeuble, setSelectedImmeuble] = useState<string>('all');
    const [selectedLot, setSelectedLot] = useState<string>('all');
    const [selectedMois, setSelectedMois] = useState<string>('all');
    const [dateDebut, setDateDebut] = useState<Date | undefined>();
    const [dateFin, setDateFin] = useState<Date | undefined>();

    const { data: result, isLoading: encLoading } = useEncaissements({
        page,
        limit: 20,
        search: searchQuery || undefined,
        immeubleId: selectedImmeuble === 'all' ? undefined : selectedImmeuble,
        lotId: selectedLot === 'all' ? undefined : selectedLot,
        moisConcerne: selectedMois === 'all' ? undefined : selectedMois,
        dateDebut: dateDebut?.toISOString().split('T')[0],
        dateFin: dateFin?.toISOString().split('T')[0]
    });

    const encaissements = result?.data || [];
    const pagination = result?.pagination;

    const { data: statsData } = useEncaissementsStatistics({
        immeubleId: selectedImmeuble === 'all' ? undefined : selectedImmeuble,
        moisConcerne: selectedMois === 'all' ? undefined : selectedMois
    });

    const { data: immeublesResult, isLoading: immLoading } = useImmeubles({ limit: 100 });
    const { data: lotsResult, isLoading: lotsLoading } = useLots({ limit: 200 });

    const immeubles = immeublesResult?.data || [];
    const lots = lotsResult?.data || [];

    const enrichedLots = useMemo(() => lots.map(lot => ({
        ...lot,
        immeuble: immeubles.find(i => i.id === lot.immeubleId)
    })), [lots, immeubles]);

    const uniqueMois: string[] = []; // Can be fetched from separate endpoint or just a list of months

    const filteredEncaissements = encaissements; // Server-side

    const totals = {
        totalEncaisse: statsData?.totalEncaisse || 0,
        totalCommissions: statsData?.totalCommissions || 0,
        totalNet: statsData?.totalNetProprietaire || 0,
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedImmeuble('all');
        setSelectedLot('all');
        setSelectedMois('all');
        setDateDebut(undefined);
        setDateFin(undefined);
    };

    const deleteMutation = useDeleteEncaissement();
    const updateMutation = useUpdateEncaissement();

    return {
        encaissements: filteredEncaissements,
        allEncaissementsCount: pagination?.total || 0,
        immeubles,
        lots: enrichedLots,
        uniqueMois,
        totals,
        isLoading: encLoading || immLoading || lotsLoading,
        page,
        setPage,
        pagination,
        deleteEncaissement: deleteMutation.mutateAsync,
        updateEncaissement: updateMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        isUpdating: updateMutation.isPending,
        filters: {
            searchQuery, setSearchQuery: (v: string) => { setSearchQuery(v); setPage(1); },
            selectedImmeuble, setSelectedImmeuble: (v: string) => { setSelectedImmeuble(v); setPage(1); },
            selectedLot, setSelectedLot: (v: string) => { setSelectedLot(v); setPage(1); },
            selectedMois, setSelectedMois: (v: string) => { setSelectedMois(v); setPage(1); },
            dateDebut, setDateDebut: (v: Date | undefined) => { setDateDebut(v); setPage(1); },
            dateFin, setDateFin: (v: Date | undefined) => { setDateFin(v); setPage(1); },
            clearFilters
        }
    };
}
