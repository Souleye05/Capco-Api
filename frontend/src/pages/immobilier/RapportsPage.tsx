import { useState } from 'react';
import {
  Plus,
  FileText,
  Filter,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { generateRapportPDF } from '@/utils/generateRapportPDF';
import { useRapportsPage } from '@/hooks/useRapportsPage';
import { RapportCard } from '@/components/immobilier/rapports/RapportCard';
import { GenerateRapportDialog } from '@/components/immobilier/rapports/GenerateRapportDialog';
import { RapportPreviewDialog } from '@/components/immobilier/rapports/RapportPreviewDialog';

export default function RapportsPage() {
  const {
    rapports,
    immeubles,
    lots,
    encaissements,
    depenses,
    selectedImmeuble,
    setSelectedImmeuble,
    isLoading,
    handleGenerate,
    isGenerating
  } = useRapportsPage();

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedRapport, setSelectedRapport] = useState<any | null>(null);

  const handlePreview = (rapport: any) => {
    setSelectedRapport(rapport);
    setShowPreviewDialog(true);
  };

  const handleDownload = async (rapport: any) => {
    // PDF generation logic (simplified here as it uses a utility)
    const immeubleLots = lots.filter(l => l.immeubleId === rapport.immeubleId);
    const immeubleEncaissements = encaissements.filter(e => {
      const lot = lots.find(l => l.id === e.lotId);
      return lot?.immeubleId === rapport.immeubleId;
    });
    const immeubleDepenses = depenses.filter(d => d.immeubleId === rapport.immeubleId);

    const paidLotIds = new Set(immeubleEncaissements.map(e => e.lotId));

    const locatairesStatus = immeubleLots.filter(l => l.statut === 'OCCUPE').map(lot => ({
      lot: {
        id: lot.id,
        numero: lot.numero,
        type: lot.type,
        loyerMensuelAttendu: lot.loyerMensuelAttendu,
        locataire: lot.locataireNom ? { nom: lot.locataireNom } : null
      },
      hasPaid: paidLotIds.has(lot.id),
      paiement: immeubleEncaissements.find(e => e.lotId === lot.id) ? {
        montantEncaisse: immeubleEncaissements.find(e => e.lotId === lot.id)!.montantEncaisse
      } : undefined
    }));

    const expensesByType = immeubleDepenses.reduce((acc, dep) => {
      const type = dep.typeDepense;
      if (!acc[type]) {
        acc[type] = { total: 0, items: [] };
      }
      acc[type].total += dep.montant;
      acc[type].items.push(dep);
      return acc;
    }, {} as any);

    await generateRapportPDF({
      rapport,
      locatairesStatus,
      expensesByType
    });
    toast.success('Téléchargement du rapport lancé');
  };

  const handleSend = (rapport: any) => {
    toast.success(`Le rapport a été envoyé au propriétaire de l'immeuble ${rapport.immeubleNom}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Rapports de Gestion"
        subtitle={`${rapports.length} rapports archivés dans le système`}
        actions={
          <Button className="gap-2 rounded-xl h-11 bg-primary font-black px-6 shadow-lg shadow-primary/20" onClick={() => setShowGenerateDialog(true)}>
            <Plus className="h-4 w-4" />
            Générer un rapport
          </Button>
        }
      />

      <div className="p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
        <div className="flex items-center gap-4 bg-background p-4 rounded-2xl border border-border/50 shadow-sm w-fit">
          <div className="flex items-center gap-2 px-2 border-r border-border/50 mr-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Filtrer par</span>
          </div>
          <Select value={selectedImmeuble} onValueChange={setSelectedImmeuble}>
            <SelectTrigger className="w-[280px] h-10 border-none shadow-none font-black text-sm bg-transparent focus:ring-0">
              <SelectValue placeholder="Tous les immeubles" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all" className="font-bold">Tous les immeubles</SelectItem>
              {immeubles.map(imm => (
                <SelectItem key={imm.id} value={imm.id} className="font-bold">{imm.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {rapports.length === 0 ? (
          <Card className="rounded-[32px] border-dashed border-2 border-border/50 bg-muted/20">
            <CardContent className="py-20 text-center space-y-6">
              <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <FileText className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Aucun rapport trouvé</h3>
                <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                  Aucun rapport n'est disponible pour les critères sélectionnés ou la base est vide.
                </p>
              </div>
              <Button onClick={() => setShowGenerateDialog(true)} className="rounded-xl font-bold px-8">
                Générer un premier rapport
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {rapports.map(rapport => (
              <RapportCard
                key={rapport.id}
                rapport={rapport}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onSend={handleSend}
              />
            ))}
          </div>
        )}
      </div>

      <GenerateRapportDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        immeubles={immeubles}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      <RapportPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        rapport={selectedRapport}
        lots={lots}
        encaissements={encaissements}
        depenses={depenses}
        onDownload={handleDownload}
      />
    </div>
  );
}
