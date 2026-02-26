import { useState, useMemo } from 'react';
import { useImmeubles, useLots, useEncaissementsLoyers } from '@/hooks/useImmobilier';

export function useImmeublesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showNouvelImmeuble, setShowNouvelImmeuble] = useState(false);
    const [showImportExcel, setShowImportExcel] = useState(false);
    const [editingImmeuble, setEditingImmeuble] = useState<any | null>(null);

    const { data: immeubles = [], isLoading } = useImmeubles();
    const { data: lots = [] } = useLots();
    const { data: encaissements = [] } = useEncaissementsLoyers();

    const filteredImmeubles = useMemo(() => {
        if (!searchQuery) return immeubles;
        const lowerQuery = searchQuery.toLowerCase();
        return immeubles.filter(immeuble =>
            immeuble.nom.toLowerCase().includes(lowerQuery) ||
            immeuble.adresse.toLowerCase().includes(lowerQuery) ||
            (immeuble.proprietaireNom && immeuble.proprietaireNom.toLowerCase().includes(lowerQuery))
        );
    }, [immeubles, searchQuery]);

    const currentMonth = new Date().toISOString().slice(0, 7);

    return {
        immeubles: filteredImmeubles,
        allImmeublesCount: immeubles.length,
        lots,
        encaissements,
        currentMonth,
        isLoading,
        searchQuery,
        setSearchQuery,
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
