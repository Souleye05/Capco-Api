import { useState } from 'react';
import { useLots, useImmeubles, useLocataires, useLotsStatistics } from '@/hooks/useImmobilier';

export function useLotsPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImmeuble, setSelectedImmeuble] = useState<string>('all');
    const [selectedStatut, setSelectedStatut] = useState<string>('all');

    const { data: lotsResult, isLoading: lotsLoading } = useLots({
        page,
        limit: 20,
        search: searchQuery || undefined,
        immeubleId: selectedImmeuble === 'all' ? undefined : selectedImmeuble,
        statut: selectedStatut === 'all' ? undefined : (selectedStatut as any)
    });
    const lots = lotsResult?.data || [];
    const pagination = lotsResult?.pagination;

    const { data: immeublesResult, isLoading: immeublesLoading } = useImmeubles({ limit: 100 });
    const { data: locatairesResult } = useLocataires({ limit: 200 });

    const immeubles = immeublesResult?.data || [];
    const locataires = locatairesResult?.data || [];

    const { data: statsData } = useLotsStatistics({
        immeubleId: selectedImmeuble === 'all' ? undefined : selectedImmeuble
    });

    const filteredLots = lots; // Server-side

    const stats = statsData || { total: 0, occupes: 0, libres: 0 };

    return {
        lots: filteredLots,
        immeubles,
        locataires,
        stats,
        isLoading: lotsLoading || immeublesLoading,
        page,
        setPage,
        pagination,
        filters: {
            searchQuery,
            setSearchQuery: (v: string) => { setSearchQuery(v); setPage(1); },
            selectedImmeuble,
            setSelectedImmeuble: (v: string) => { setSelectedImmeuble(v); setPage(1); },
            selectedStatut,
            setSelectedStatut: (v: string) => { setSelectedStatut(v); setPage(1); }
        }
    };
}
