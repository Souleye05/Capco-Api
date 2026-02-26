import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { formatDateForAPI, getFirstDayOfMonth } from '@/lib/date-utils';
import { ArrowLeft, FileText, Loader2, Receipt, TrendingDown, Percent, FileBarChart } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useImmeubleDetail } from '@/hooks/useImmeubleDetail';
import { ImmeubleStats } from '@/components/immobilier/immeuble-detail/ImmeubleStats';
import { ImmeubleFilters } from '@/components/immobilier/immeuble-detail/ImmeubleFilters';
import { PaiementsTab } from '@/components/immobilier/immeuble-detail/PaiementsTab';
import { DepensesTab } from '@/components/immobilier/immeuble-detail/DepensesTab';
import { CommissionsTab } from '@/components/immobilier/immeuble-detail/CommissionsTab';
import { RapportsTab } from '@/components/immobilier/immeuble-detail/RapportsTab';
import {
  useCreateEncaissementLoyer,
  useCreateDepenseImmeuble,
  useCreateRapportGestion
} from '@/hooks/useImmobilier';
import { generateQuittancePDF, shouldGenerateQuittance } from '@/utils/generateQuittancePDF';
import { generateRapportPDF } from '@/utils/generateRapportPDF';

export default function ImmeubleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  const {
    immeuble,
    lots,
    rapports,
    loading,
    filters,
    filteredData,
    totals
  } = useImmeubleDetail(id);

  const createEncaissement = useCreateEncaissementLoyer();
  const createDepense = useCreateDepenseImmeuble();
  const createRapport = useCreateRapportGestion();

  if (loading) return <LoadingState />;
  if (!immeuble) return <NotFoundState onBack={() => navigate('/immobilier/immeubles')} />;

  const handleCreateEncaissement = async (data: any) => {
    try {
      const response = await createEncaissement.mutateAsync(data);
      toast.success('Encaissement enregistré');

      const lot = lots.find(l => l.id === data.lotId);
      if (lot) {
        generateQuittancePDF({
          type: shouldGenerateQuittance(data.montantEncaisse, Number(lot.loyerMensuelAttendu)),
          locataire: { nom: lot.locataireNom || 'N/A' },
          proprietaire: { nom: immeuble.proprietaireNom || 'N/A' },
          immeuble: { nom: immeuble.nom, adresse: immeuble.adresse },
          lot: { numero: lot.numero, type: lot.type },
          periode: data.moisConcerne,
          loyerMensuel: Number(lot.loyerMensuelAttendu),
          montantPaye: data.montantEncaisse,
          datePaiement: formatDateForAPI(new Date()),
          modePaiement: data.modePaiement
        });
      }
    } catch (err) { }
  };

  const handleCreateDepense = async (data: any) => {
    try {
      await createDepense.mutateAsync({ ...data, immeubleId: id, date: formatDateForAPI(new Date()) });
      toast.success('Dépense enregistrée');
    } catch (err) { }
  };

  const handleGenerateRapport = async () => {
    try {
      const pDebut = filters.dateDebut ? formatDateForAPI(filters.dateDebut) : formatDateForAPI(getFirstDayOfMonth(new Date().getUTCFullYear(), new Date().getUTCMonth()));
      const pFin = filters.dateFin ? formatDateForAPI(filters.dateFin) : formatDateForAPI(new Date());

      await createRapport.mutateAsync({ immeubleId: id, periodeDebut: pDebut, periodeFin: pFin });

      // Build data for PDF
      const locatairesStatus = lots.map(lot => {
        const lotEnc = filteredData.encaissements.filter(e => e.lotId === lot.id);
        const totalPaid = lotEnc.reduce((sum, e) => sum + Number(e.montantEncaisse), 0);
        return {
          lot: { id: lot.id, numero: lot.numero, type: lot.type || 'Lot', loyerMensuelAttendu: Number(lot.loyerMensuelAttendu), locataire: lot.locataireNom ? { nom: lot.locataireNom } : null },
          hasPaid: totalPaid >= Number(lot.loyerMensuelAttendu),
          paiement: lotEnc.length > 0 ? { montantEncaisse: totalPaid } : undefined
        };
      });

      const expensesByType: any = { PLOMBERIE_ASSAINISSEMENT: { total: 0, items: [] }, ELECTRICITE_ECLAIRAGE: { total: 0, items: [] }, ENTRETIEN_MAINTENANCE: { total: 0, items: [] }, SECURITE_GARDIENNAGE_ASSURANCE: { total: 0, items: [] }, AUTRES_DEPENSES: { total: 0, items: [] } };
      filteredData.depenses.forEach(d => {
        if (expensesByType[d.typeDepense]) {
          expensesByType[d.typeDepense].total += Number(d.montant);
          expensesByType[d.typeDepense].items.push({ ...d, montant: Number(d.montant) });
        }
      });

      await generateRapportPDF({
        rapport: { id: crypto.randomUUID(), immeubleId: id, periodeDebut: pDebut, periodeFin: pFin, totalLoyers: totals.totalLoyers, totalDepenses: totals.totalDepenses, totalCommissions: totals.totalCommissions, netProprietaire: totals.netProprietaire, dateGeneration: new Date().toISOString(), statut: 'GENERE', immeuble: { id, nom: immeuble.nom, adresse: immeuble.adresse, tauxCommissionCAPCO: immeuble.tauxCommissionCapco, proprietaire: immeuble.proprietaireNom ? { nom: immeuble.proprietaireNom } : undefined } },
        locatairesStatus,
        expensesByType
      });
      toast.success('Rapport généré');
    } catch (err) {
      toast.error('Erreur lors de la génération');
    }
  };

  const handleDownloadQuittance = (enc: any) => {
    const lot = lots.find(l => l.id === enc.lotId);
    if (!lot) return;
    generateQuittancePDF({
      type: shouldGenerateQuittance(Number(enc.montantEncaisse), Number(lot.loyerMensuelAttendu)),
      locataire: { nom: lot.locataireNom || 'N/A' },
      proprietaire: { nom: immeuble.proprietaireNom || 'N/A' },
      immeuble: { nom: immeuble.nom, adresse: immeuble.adresse },
      lot: { numero: lot.numero, type: lot.type },
      periode: enc.moisConcerne,
      loyerMensuel: Number(lot.loyerMensuelAttendu),
      montantPaye: Number(enc.montantEncaisse),
      datePaiement: enc.dateEncaissement,
      modePaiement: enc.modePaiement
    });
  };

  return (
    <div className="min-h-screen">
      <Header
        title={immeuble.nom}
        subtitle={immeuble.adresse}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/immobilier/immeubles')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <Button onClick={handleGenerateRapport} className="gap-2">
              <FileBarChart className="h-4 w-4" /> Rapport
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <ImmeubleStats
          {...totals}
          tauxCommission={immeuble.tauxCommissionCapco}
        />

        <ImmeubleFilters
          lots={lots}
          onClear={filters.clearFilters}
          {...filters}
        />

        <Tabs defaultValue="paiements" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="paiements" className="gap-2"><Receipt className="h-4 w-4" /> Paiements</TabsTrigger>
            <TabsTrigger value="depenses" className="gap-2"><TrendingDown className="h-4 w-4" /> Dépenses</TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2"><Percent className="h-4 w-4" /> Commissions</TabsTrigger>
            <TabsTrigger value="rapports" className="gap-2"><FileText className="h-4 w-4" /> Rapports</TabsTrigger>
          </TabsList>

          <TabsContent value="paiements">
            <PaiementsTab
              encaissements={filteredData.encaissements}
              lots={lots}
              immeuble={immeuble}
              onCreateEncaissement={handleCreateEncaissement}
              onDownloadQuittance={handleDownloadQuittance}
              isLoading={createEncaissement.isPending}
            />
          </TabsContent>

          <TabsContent value="depenses">
            <DepensesTab
              depenses={filteredData.depenses}
              onCreateDepense={handleCreateDepense}
              isLoading={createDepense.isPending}
            />
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionsTab
              encaissements={filteredData.encaissements}
              lots={lots}
              tauxCommission={immeuble.tauxCommissionCapco}
            />
          </TabsContent>

          <TabsContent value="rapports">
            <RapportsTab
              rapports={rapports}
              immeuble={immeuble}
              onGenerateRapport={handleGenerateRapport}
              isLoading={createRapport.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Immeuble non trouvé</h2>
        <Button onClick={onBack}>Retour à la liste</Button>
      </div>
    </div>
  );
}
