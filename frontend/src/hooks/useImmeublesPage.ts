import { useState, useMemo } from 'react';
import { useImmeubles, useLots, useEncaissementsLoyers } from '@/hooks/useImmobilier';

export function useImmeublesPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNouvelImmeuble, setShowNouvelImmeuble] = useState(false);
    const [showImportExcel, setShowImportExcel] = useState(false);
    const [editingImmeuble, setEditingImmeuble] = useState<any | null>(null);

    const { data: immeublesResult, isLoading } = useImmeubles({
        page,
        limit: 12, // Grid views usually look better with multiples of 3 or 4
        search: searchQuery || undefined
    });
    const immeubles = immeublesResult?.data || [];
    const pagination = immeublesResult?.pagination;
    const allImmeublesCount = pagination?.total || 0;

    const { data: lotsResult } = useLots({ limit: 200 });
    const lots = lotsResult?.data || [];

    // Encaissements are not yet updated to pagination in this hook, but we should probably use a separate statistics hook if needed
    const { data: encaissementsResult } = useEncaissementsLoyers();
    const encaissements = (encaissementsResult as any)?.data || encaissementsResult || [];

    const filteredImmeubles = immeubles; // Server-side

    const currentMonth = new Date().toISOString().slice(0, 7);

    return {
        immeubles: filteredImmeubles,
        allImmeublesCount: pagination?.total || 0,
        lots,
        encaissements,
        currentMonth,
        isLoading,
        searchQuery,
        setSearchQuery: (v: string) => { setSearchQuery(v); setPage(1); },
        page,
        setPage,
        pagination,
        dialogs: {
            showNouvelImmeuble,
            setShowNouvelImmeuble,
            showImportExcel,
            setShowImportExcel,
            editingImmeuble,
            setEditingImmeuble
        }
    };
}
