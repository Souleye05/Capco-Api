import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useImmeubles, useLots, useCreateRapportGestion } from '@/hooks/useImmobilier';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { nestjsApi } from '@/integrations/nestjs/client';
import { format } from 'date-fns';

export function useRapportsPage() {
    const { user } = useNestJSAuth();
    const [selectedImmeuble, setSelectedImmeuble] = useState<string>('all');

    const { data: immeublesResult, isLoading: immLoading } = useImmeubles({ limit: 100 });
    const { data: lotsResult, isLoading: lotsLoading } = useLots({ limit: 200 });

    const immeubles = useMemo(() => immeublesResult?.data || [], [immeublesResult]);
    const lots = useMemo(() => lotsResult?.data || [], [lotsResult]);

    // Aggregate rapports
    const { data: rapports = [], isLoading: rapportsLoading } = useQuery({
        queryKey: ['rapports-gestion', 'all', selectedImmeuble, immeubles.map(i => i.id)],
        queryFn: async () => {
            if (selectedImmeuble !== 'all') {
                const result = await nestjsApi.getRapportsByImmeuble(selectedImmeuble);
                return (result.data as any[]) || [];
            }
            if (immeubles.length === 0) return [];
            const results = await Promise.all(
                immeubles.map(imm =>
                    nestjsApi.getRapportsByImmeuble(imm.id).then(r => (r.data as any[]) || [])
                )
            );
            return results.flat().sort((a, b) => new Date(b.dateGeneration).getTime() - new Date(a.dateGeneration).getTime());
        },
        enabled: immeubles.length > 0 || selectedImmeuble !== 'all',
    });

    // Aggregate encaissements for preview
    const { data: encaissements = [], isLoading: encLoading } = useQuery({
        queryKey: ['encaissements', 'all-for-preview', immeubles.map(i => i.id)],
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

    // Aggregate depenses for preview
    const { data: depenses = [], isLoading: depLoading } = useQuery({
        queryKey: ['depenses-immeubles', 'all-for-preview', immeubles.map(i => i.id)],
        queryFn: async () => {
            if (immeubles.length === 0) return [];
            const results = await Promise.all(
                immeubles.map(imm =>
                    nestjsApi.getDepensesByImmeuble(imm.id).then(r => (r.data as any[]) || [])
                )
            );
            return results.flat();
        },
        enabled: immeubles.length > 0,
    });

    const createRapport = useCreateRapportGestion();

    const handleGenerate = async (genData: { immeubleId: string, dateDebut: Date, dateFin: Date }) => {
        if (!user) return;

        const { immeubleId, dateDebut, dateFin } = genData;
        const selectedImmeubleData = immeubles.find(i => i.id === immeubleId);

        const immeubleEncaissements = encaissements.filter(e => {
            const lot = lots.find(l => l.id === e.lotId);
            if (!lot || lot.immeubleId !== immeubleId) return false;
            const encDate = new Date(e.dateEncaissement);
            return encDate >= dateDebut && encDate <= dateFin;
        });

        const immeubleDepenses = depenses.filter(d => {
            if (d.immeubleId !== immeubleId) return false;
            const depDate = new Date(d.date);
            return depDate >= dateDebut && depDate <= dateFin;
        });

        const totalLoyers = immeubleEncaissements.reduce((sum, e) => sum + e.montantEncaisse, 0);
        const totalDepenses = immeubleDepenses.reduce((sum, d) => sum + d.montant, 0);
        const tauxCommission = selectedImmeubleData?.tauxCommissionCapco || 10;
        const totalCommissions = totalLoyers * (tauxCommission / 100);
        const netProprietaire = totalLoyers - totalDepenses - totalCommissions;

        return await createRapport.mutateAsync({
            immeubleId,
            periodeDebut: format(dateDebut, 'yyyy-MM-dd'),
            periodeFin: format(dateFin, 'yyyy-MM-dd'),
            totalLoyers,
            totalDepenses,
            totalCommissions,
            netProprietaire,
            genererPar: user.id,
            statut: 'GENERE'
        } as any);
    };

    return {
        rapports,
        immeubles,
        lots,
        encaissements,
        depenses,
        selectedImmeuble,
        setSelectedImmeuble,
        isLoading: rapportsLoading || immLoading || lotsLoading || encLoading || depLoading,
        handleGenerate,
        isGenerating: createRapport.isPending
    };
}
