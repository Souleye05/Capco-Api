import { useState, useMemo } from 'react';
import { useLocatairesComplete } from '@/hooks/useLocataires';

export function useLocatairesPage() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: result, isLoading } = useLocatairesComplete({
        page,
        limit: 10,
        search: searchTerm || undefined
    });

    const locataires = result?.data || [];
    const pagination = result?.pagination;

    const filteredLocataires = locataires; // Server-side

    return {
        locataires,
        filteredLocataires,
        searchTerm,
        setSearchTerm,
        isLoading,
        totalCount: pagination?.total || 0,
        activeLeasesCount: pagination?.total || 0, // Placeholder
        page,
        setPage,
        pagination,
        setSearchTerm: (v: string) => { setSearchTerm(v); setPage(1); }
    };
}
