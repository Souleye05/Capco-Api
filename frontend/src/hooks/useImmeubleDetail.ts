import { useState, useMemo } from 'react';
import {
    useImmeuble,
    useLotsByImmeuble,
    useEncaissementsByImmeuble,
    useDepensesImmeubles,
    useRapportsGestion
} from '@/hooks/useImmobilier';

export function useImmeubleDetail(id: string) {
    const { data: immeuble, isLoading: immeubleLoading } = useImmeuble(id);
    const { data: lots = [], isLoading: lotsLoading } = useLotsByImmeuble(id);
    const { data: encaissements = [] } = useEncaissementsByImmeuble(id);
    const { data: depenses = [] } = useDepensesImmeubles(id);
    const { data: rapports = [] } = useRapportsGestion(id);

    // Filter States
    const [selectedLot, setSelectedLot] = useState<string>('all');
    const [selectedMois, setSelectedMois] = useState<string>('all');
    const [dateDebut, setDateDebut] = useState<Date | undefined>();
    const [dateFin, setDateFin] = useState<Date | undefined>();

    // Derived Data: Encaissements
    const filteredEncaissements = useMemo(() => {
        return encaissements.filter(e => {
            if (selectedLot !== 'all' && e.lotId !== selectedLot) return false;
            if (selectedMois !== 'all' && e.moisConcerne !== selectedMois) return false;
            if (dateDebut && new Date(e.dateEncaissement) < dateDebut) return false;
            if (dateFin && new Date(e.dateEncaissement) > dateFin) return false;
            return true;
        });
    }, [encaissements, selectedLot, selectedMois, dateDebut, dateFin]);

    // Derived Data: Depenses
    const filteredDepenses = useMemo(() => {
        return depenses.filter(d => {
            if (dateDebut && new Date(d.date) < dateDebut) return false;
            if (dateFin && new Date(d.date) > dateFin) return false;
            return true;
        });
    }, [depenses, dateDebut, dateFin]);

    // Totals
    const totalLoyers = useMemo(() => filteredEncaissements.reduce((sum, e) => sum + Number(e.montantEncaisse), 0), [filteredEncaissements]);
    const totalCommissions = useMemo(() => filteredEncaissements.reduce((sum, e) => sum + Number(e.commissionCapco), 0), [filteredEncaissements]);
    const totalDepenses = useMemo(() => filteredDepenses.reduce((sum, d) => sum + Number(d.montant), 0), [filteredDepenses]);
    const netProprietaire = totalLoyers - totalCommissions - totalDepenses;

    // Unique Months for filters
    const uniqueMois = useMemo(() =>
        [...new Set(encaissements.map(e => e.moisConcerne))].sort().reverse()
        , [encaissements]);

    const clearFilters = () => {
        setSelectedLot('all');
        setSelectedMois('all');
        setDateDebut(undefined);
        setDateFin(undefined);
    };

    return {
        immeuble,
        lots,
        encaissements,
        depenses,
        rapports,
        loading: immeubleLoading || lotsLoading,
        filters: {
            selectedLot,
            setSelectedLot,
            selectedMois,
            setSelectedMois,
            dateDebut,
            setDateDebut,
            dateFin,
            setDateFin,
            uniqueMois,
            clearFilters
        },
        filteredData: {
            encaissements: filteredEncaissements,
            depenses: filteredDepenses
        },
        totals: {
            totalLoyers,
            totalCommissions,
            totalDepenses,
            netProprietaire
        }
    };
}
