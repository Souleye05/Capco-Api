import { useState, useMemo } from 'react';
import { useLocatairesComplete } from '@/hooks/useLocataires';

export function useLocatairesPage() {
    const { data: locataires = [], isLoading } = useLocatairesComplete();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLocataires = useMemo(() => {
        if (!searchTerm) return locataires;
        const lowerSearch = searchTerm.toLowerCase();
        return locataires.filter(l =>
            l.nom.toLowerCase().includes(lowerSearch) ||
            l.email?.toLowerCase().includes(lowerSearch) ||
            l.telephone?.includes(searchTerm)
        );
    }, [locataires, searchTerm]);

    return {
        locataires,
        filteredLocataires,
        searchTerm,
        setSearchTerm,
        isLoading,
        totalCount: locataires.length,
        activeLeasesCount: locataires.length, // TODO: Update when logic available
    };
}
