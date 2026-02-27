import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useImmeubles, useLots } from '@/hooks/useImmobilier';
import { nestjsApi } from '@/integrations/nestjs/client';

export interface LoyerAttendu {
    id: string;
    lotId: string;
    lotNumero: string;
    immeubleId: string;
    immeubleNom: string;
    locataireNom: string;
    mois: string;
    montantAttendu: number;
    tauxCommission: number;
    statut: 'IMPAYE' | 'PAYE';
    encaissementId?: string;
}

export function useImpayesPage() {
    const { data: immeublesResult, isLoading: immLoading } = useImmeubles({ limit: 100 });
    const { data: lotsResult, isLoading: lotsLoading } = useLots({ limit: 200 });
    const immeubles = immeublesResult?.data || [];
    const lots = lotsResult?.data || [];

    // Aggregate encaissements like in LoyersPage since useEncaissementsLoyers is empty
    const { data: encaissements = [], isLoading: encLoading } = useQuery({
        queryKey: ['encaissements', 'all', immeubles.map(i => i.id)],
        queryFn: async () => {
            if (immeubles.length === 0) return [];
            const results = await Promise.all(
                immeubles.map(imm =>
                    nestjsApi.getEncaissementsByImmeuble(imm.id).then(r => (r.data as any[]) || [])
                )
            );
            return results.flat();
        },
        enabled: immeubles.length > 0,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImmeuble, setSelectedImmeuble] = useState<string>('all');
    const [selectedMois, setSelectedMois] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [showPaidOnly, setShowPaidOnly] = useState<string>('impayes');

    const availableMonths = useMemo(() => {
        const months = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push(format(date, 'yyyy-MM'));
        }
        return months;
    }, []);

    const loyersAttendus = useMemo(() => {
        return lots
            .filter(lot => lot.statut === 'OCCUPE')
            .map(lot => {
                const immeuble = immeubles.find(i => i.id === lot.immeubleId);
                const encaissement = encaissements.find(e =>
                    e.lotId === lot.id && e.moisConcerne === selectedMois
                );

                return {
                    id: `${lot.id}-${selectedMois}`,
                    lotId: lot.id,
                    lotNumero: lot.numero,
                    immeubleId: lot.immeubleId,
                    immeubleNom: immeuble?.nom || 'N/A',
                    locataireNom: lot.locataireNom || 'N/A',
                    mois: selectedMois,
                    montantAttendu: lot.loyerMensuelAttendu,
                    tauxCommission: immeuble?.tauxCommissionCapco || 5,
                    statut: encaissement ? 'PAYE' : 'IMPAYE',
                    encaissementId: encaissement?.id
                } as LoyerAttendu;
            })
            .filter(loyer => {
                if (selectedImmeuble !== 'all' && loyer.immeubleId !== selectedImmeuble) return false;
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    if (!loyer.lotNumero.toLowerCase().includes(query) &&
                        !loyer.immeubleNom.toLowerCase().includes(query) &&
                        !loyer.locataireNom.toLowerCase().includes(query)) {
                        return false;
                    }
                }
                if (showPaidOnly === 'impayes' && loyer.statut === 'PAYE') return false;
                if (showPaidOnly === 'payes' && loyer.statut === 'IMPAYE') return false;
                return true;
            });
    }, [lots, immeubles, encaissements, selectedMois, selectedImmeuble, searchQuery, showPaidOnly]);

    const totals = useMemo(() => {
        const totalAttendu = loyersAttendus.reduce((sum, l) => sum + l.montantAttendu, 0);
        const totalImpayes = loyersAttendus.filter(l => l.statut === 'IMPAYE').reduce((sum, l) => sum + l.montantAttendu, 0);
        const totalPayes = loyersAttendus.filter(l => l.statut === 'PAYE').reduce((sum, l) => sum + l.montantAttendu, 0);
        return {
            totalAttendu,
            totalImpayes,
            totalPayes,
            nbImpayes: loyersAttendus.filter(l => l.statut === 'IMPAYE').length
        };
    }, [loyersAttendus]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedImmeuble('all');
        setShowPaidOnly('impayes');
    };

    return {
        loyersAttendus,
        totals,
        availableMonths,
        immeubles,
        isLoading: encLoading || immLoading || lotsLoading,
        filters: {
            searchQuery,
            setSearchQuery,
            selectedImmeuble,
            setSelectedImmeuble,
            selectedMois,
            setSelectedMois,
            showPaidOnly,
            setShowPaidOnly,
            clearFilters
        }
    };
}
