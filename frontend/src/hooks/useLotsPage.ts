import { useState, useMemo } from 'react';
import { useLots, useImmeubles, useLocataires } from '@/hooks/useImmobilier';

export function useLotsPage() {
    const { data: lots = [], isLoading: lotsLoading } = useLots();
    const { data: immeubles = [], isLoading: immeublesLoading } = useImmeubles();
    const { data: locataires = [] } = useLocataires();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImmeuble, setSelectedImmeuble] = useState<string>('all');
    const [selectedStatut, setSelectedStatut] = useState<string>('all');

    const filteredLots = useMemo(() => {
        return lots.map(lot => ({
            ...lot,
            immeuble: immeubles.find(i => i.id === lot.immeubleId)
        })).filter(lot => {
            const matchesSearch =
                lot.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (lot.immeuble?.nom && lot.immeuble.nom.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesImmeuble = selectedImmeuble === 'all' || lot.immeubleId === selectedImmeuble;
            const matchesStatut = selectedStatut === 'all' || lot.statut === selectedStatut;

            return matchesSearch && matchesImmeuble && matchesStatut;
        });
    }, [lots, immeubles, searchQuery, selectedImmeuble, selectedStatut]);

    const stats = useMemo(() => ({
        total: lots.length,
        occupes: lots.filter(l => l.statut === 'OCCUPE').length,
        libres: lots.filter(l => l.statut === 'LIBRE').length
    }), [lots]);

    return {
        lots: filteredLots,
        immeubles,
        locataires,
        stats,
        isLoading: lotsLoading || immeublesLoading,
        filters: {
            searchQuery,
            setSearchQuery,
            selectedImmeuble,
            setSelectedImmeuble,
            selectedStatut,
            setSelectedStatut
        }
    };
}
