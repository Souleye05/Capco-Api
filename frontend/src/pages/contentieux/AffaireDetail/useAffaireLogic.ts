import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { useAffaire } from '@/hooks/useAffaires';
import { useAudiencesByAffaire } from '@/hooks/useAudiences';
import {
    useHonorairesContentieux,
    useUpdateHonorairesContentieux,
    useCreateHonorairesContentieux,
    useDepensesAffaire,
    useCreateDepenseAffaire,
    usePaiementsHonorairesContentieux,
    useCreatePaiementHonorairesContentieux
} from '@/hooks/useHonorairesDepenses';
import { TypeDepenseDossier } from '@/types';

export function useAffaireLogic() {
    const { id } = useParams();
    const { user } = useNestJSAuth();
    const idValide = id && id !== 'undefined' ? id : undefined;

    // Data fetching
    const { data: affaire, isLoading: loadingAffaire } = useAffaire(idValide);
    const { data: audiences = [] } = useAudiencesByAffaire(idValide);
    const { data: honoraires } = useHonorairesContentieux(idValide);
    const { data: depenses = [] } = useDepensesAffaire(idValide);
    const { data: paiements = [] } = usePaiementsHonorairesContentieux(honoraires?.id);

    // Mutations
    const updateHonoraires = useUpdateHonorairesContentieux();
    const createHonoraires = useCreateHonorairesContentieux();
    const createDepense = useCreateDepenseAffaire();
    const createPaiement = useCreatePaiementHonorairesContentieux();

    // Modal States
    const [showResultat, setShowResultat] = useState(false);
    const [showNouvelleAudience, setShowNouvelleAudience] = useState(false);
    const [showCompteRendu, setShowCompteRendu] = useState(false);
    const [showHonoraires, setShowHonoraires] = useState(false);
    const [showPaiement, setShowPaiement] = useState(false);
    const [showDepense, setShowDepense] = useState(false);
    const [selectedAudience, setSelectedAudience] = useState<any>(null);

    // Financial calculations
    const totalPaiements = useMemo(() => paiements.reduce((sum, p) => sum + Number(p.montant), 0), [paiements]);
    const totalDepenses = useMemo(() => depenses.reduce((sum, d) => sum + Number(d.montant), 0), [depenses]);
    const montantPrevu = honoraires?.montantFacture || 0;
    const solde = montantPrevu - totalPaiements;
    const ratioEncaissement = montantPrevu > 0 ? (totalPaiements / montantPrevu) * 100 : 0;

    // Handlers
    const handleSaisirResultat = (audience: any) => {
        setSelectedAudience(audience);
        setShowResultat(true);
    };

    const handleSaveHonoraires = async (montant: number) => {
        if (!idValide) return;
        try {
            if (honoraires?.id) {
                await updateHonoraires.mutateAsync({ id: honoraires.id, data: { montantFacture: montant } });
            } else {
                await createHonoraires.mutateAsync({ affaireId: idValide, montantFacture: montant, montantEncaisse: 0 });
            }
            setShowHonoraires(false);
        } catch (e) { }
    };

    const handleSavePaiement = async (data: { montant: number; mode: any; notes?: string }) => {
        if (!honoraires?.id) return;
        try {
            await createPaiement.mutateAsync({
                honorairesId: honoraires.id,
                date: new Date().toISOString().split('T')[0],
                ...data
            });
            await updateHonoraires.mutateAsync({
                id: honoraires.id,
                data: { montantEncaisse: totalPaiements + data.montant }
            });
            setShowPaiement(false);
        } catch (e) { }
    };

    const handleSaveDepense = async (data: { type: TypeDepenseDossier; nature: string; montant: number; description?: string }) => {
        if (!idValide) return;
        try {
            await createDepense.mutateAsync({
                affaireId: idValide,
                date: new Date().toISOString().split('T')[0],
                typeDepense: data.type,
                nature: data.nature,
                montant: data.montant,
                description: data.description
            });
            setShowDepense(false);
        } catch (e) { }
    };

    return {
        id: idValide,
        user,
        data: { affaire, audiences, honoraires, depenses, paiements },
        finance: { totalPaiements, totalDepenses, montantPrevu, solde, ratioEncaissement },
        ui: {
            showResultat, setShowResultat,
            showNouvelleAudience, setShowNouvelleAudience,
            showCompteRendu, setShowCompteRendu,
            showHonoraires, setShowHonoraires,
            showPaiement, setShowPaiement,
            showDepense, setShowDepense,
            selectedAudience, handleSaisirResultat
        },
        actions: { handleSaveHonoraires, handleSavePaiement, handleSaveDepense },
        loading: loadingAffaire
    };
}
