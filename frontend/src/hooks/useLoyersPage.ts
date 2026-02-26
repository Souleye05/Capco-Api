import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useImmeubles, useLots } from '@/hooks/useImmobilier';
import { nestjsApi } from '@/integrations/nestjs/client';

export function useLoyersPage() {
    const { data: immeubles = [], isLoading: immLoading } = useImmeubles();
    const { data: lots = [], isLoading: lotsLoading } = useLots();

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
    const [selectedLot, setSelectedLot] = useState<string>('all');
    const [selectedMois, setSelectedMois] = useState<string>('all');
    const [dateDebut, setDateDebut] = useState<Date | undefined>();
    const [dateFin, setDateFin] = useState<Date | undefined>();

    const enrichedLots = useMemo(() => lots.map(lot => ({
        ...lot,
        immeuble: immeubles.find(i => i.id === lot.immeubleId)
    })), [lots, immeubles]);

    const uniqueMois = useMemo(() =>
        [...new Set(encaissements.map(e => (e as any).moisConcerne))].sort().reverse()
        , [encaissements]);

    const filteredEncaissements = useMemo(() => {
        return encaissements.map(enc => ({
            ...enc,
            lot: enrichedLots.find(l => l.id === (enc as any).lotId)
        })).filter(enc => {
            const matchesSearch =
                (enc.lot?.numero.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (enc.lot?.immeuble?.nom.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesImmeuble = selectedImmeuble === 'all' || enc.lot?.immeubleId === selectedImmeuble;
            const matchesLot = selectedLot === 'all' || (enc as any).lotId === selectedLot;
            const matchesMois = selectedMois === 'all' || (enc as any).moisConcerne === selectedMois;
            const matchesDateDebut = !dateDebut || new Date((enc as any).dateEncaissement) >= dateDebut;
            const matchesDateFin = !dateFin || new Date((enc as any).dateEncaissement) <= dateFin;

            return matchesSearch && matchesImmeuble && matchesLot && matchesMois && matchesDateDebut && matchesDateFin;
        });
    }, [encaissements, enrichedLots, searchQuery, selectedImmeuble, selectedLot, selectedMois, dateDebut, dateFin]);

    const totals = useMemo(() => ({
        totalEncaisse: filteredEncaissements.reduce((sum, e) => sum + (e as any).montantEncaisse, 0),
        totalCommissions: filteredEncaissements.reduce((sum, e) => sum + (e as any).commissionCapco, 0),
        totalNet: filteredEncaissements.reduce((sum, e) => sum + (e as any).netProprietaire, 0),
    }), [filteredEncaissements]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedImmeuble('all');
        setSelectedLot('all');
        setSelectedMois('all');
        setDateDebut(undefined);
        setDateFin(undefined);
    };

    return {
        encaissements: filteredEncaissements,
        allEncaissementsCount: encaissements.length,
        immeubles,
        lots: enrichedLots,
        uniqueMois,
        totals,
        isLoading: encLoading || immLoading || lotsLoading,
        filters: {
            searchQuery, setSearchQuery,
            selectedImmeuble, setSelectedImmeuble,
            selectedLot, setSelectedLot,
            selectedMois, setSelectedMois,
            dateDebut, setDateDebut,
            dateFin, setDateFin,
            clearFilters
        }
    };
}
