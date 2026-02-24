import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Loader2, User, Building2, Phone, Mail, MapPin, Calculator, Plus } from 'lucide-react';
import { useCreateDossierRecouvrement } from '@/hooks/useRecouvrement';

interface NouveauDossierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouveauDossierDialog({ open, onOpenChange }: NouveauDossierDialogProps) {
  const createDossier = useCreateDossierRecouvrement();

  const [formData, setFormData] = useState({
    creancierNom: '',
    creancierTelephone: '',
    creancierEmail: '',
    debiteurNom: '',
    debiteurTelephone: '',
    debiteurEmail: '',
    debiteurAdresse: '',
    montantPrincipal: '',
    penalitesInterets: '',
    honoraireType: 'FORFAIT' as 'FORFAIT' | 'POURCENTAGE' | 'MIXTE',
    honoraireMontant: '',
    honorairePourcentage: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      creancierNom: '',
      creancierTelephone: '',
      creancierEmail: '',
      debiteurNom: '',
      debiteurTelephone: '',
      debiteurEmail: '',
      debiteurAdresse: '',
      montantPrincipal: '',
      penalitesInterets: '',
      honoraireType: 'FORFAIT',
      honoraireMontant: '',
      honorairePourcentage: '',
      notes: ''
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.creancierNom || !formData.debiteurNom || !formData.montantPrincipal) {
      toast.error('Veuillez remplir les champs obligatoires (*)');
      return;
    }

    try {
      await createDossier.mutateAsync({
        creancierNom: formData.creancierNom,
        creancierTelephone: formData.creancierTelephone || undefined,
        creancierEmail: formData.creancierEmail || undefined,
        debiteurNom: formData.debiteurNom,
        debiteurTelephone: formData.debiteurTelephone || undefined,
        debiteurEmail: formData.debiteurEmail || undefined,
        debiteurAdresse: formData.debiteurAdresse || undefined,
        montantPrincipal: parseFloat(formData.montantPrincipal),
        penalitesInterets: formData.penalitesInterets ? parseFloat(formData.penalitesInterets) : 0,
        notes: formData.notes || undefined,
        honoraire: {
          type: formData.honoraireType,
          montantPrevu: formData.honoraireMontant ? parseFloat(formData.honoraireMontant) : 0,
          pourcentage: formData.honorairePourcentage ? parseFloat(formData.honorairePourcentage) : undefined,
        }
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      // toast.error géré par le hook
    }
  };

  // Calculs dynamiques pour l'UI
  const totalARecouvrer = (parseFloat(formData.montantPrincipal) || 0) + (parseFloat(formData.penalitesInterets) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <DialogHeader className="p-6">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Plus className="h-5 w-5 text-recouvrement" /> Nouveau Dossier de Recouvrement
          </DialogTitle>
          <DialogDescription>
            Initialiser un nouveau dossier de créance pour recouvrement amiable ou judiciaire.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section Créancier */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                <Building2 className="h-4 w-4" /> Créancier
              </h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="creancierNom" className="text-xs font-semibold">Nom complet / Raison sociale *</Label>
                  <Input
                    id="creancierNom"
                    value={formData.creancierNom}
                    onChange={(e) => setFormData({ ...formData, creancierNom: e.target.value })}
                    placeholder="Ex: Société Générale"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="creancierTelephone" className="text-xs font-semibold">Téléphone</Label>
                    <Input
                      id="creancierTelephone"
                      value={formData.creancierTelephone}
                      onChange={(e) => setFormData({ ...formData, creancierTelephone: e.target.value })}
                      placeholder="Ex: 77..."
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="creancierEmail" className="text-xs font-semibold">Email</Label>
                    <Input
                      id="creancierEmail"
                      type="email"
                      value={formData.creancierEmail}
                      onChange={(e) => setFormData({ ...formData, creancierEmail: e.target.value })}
                      placeholder="Ex: contact@..."
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section Débiteur */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                <User className="h-4 w-4" /> Débiteur
              </h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="debiteurNom" className="text-xs font-semibold">Nom complet / Raison sociale *</Label>
                  <Input
                    id="debiteurNom"
                    value={formData.debiteurNom}
                    onChange={(e) => setFormData({ ...formData, debiteurNom: e.target.value })}
                    placeholder="Ex: Jean Dupont"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="debiteurTelephone" className="text-xs font-semibold">Téléphone</Label>
                    <Input
                      id="debiteurTelephone"
                      value={formData.debiteurTelephone}
                      onChange={(e) => setFormData({ ...formData, debiteurTelephone: e.target.value })}
                      placeholder="Ex: 77..."
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="debiteurEmail" className="text-xs font-semibold">Email</Label>
                    <Input
                      id="debiteurEmail"
                      type="email"
                      value={formData.debiteurEmail}
                      onChange={(e) => setFormData({ ...formData, debiteurEmail: e.target.value })}
                      placeholder="Ex: client@..."
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="debiteurAdresse" className="text-xs font-semibold">Adresse physique</Label>
                  <Input
                    id="debiteurAdresse"
                    value={formData.debiteurAdresse}
                    onChange={(e) => setFormData({ ...formData, debiteurAdresse: e.target.value })}
                    placeholder="Ex: Plateau, Dakar"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Section Créance et Honoraires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-recouvrement/5 p-4 rounded-xl border border-recouvrement/10">
              <h4 className="flex items-center gap-2 text-sm font-bold text-recouvrement uppercase tracking-wider">
                <Calculator className="h-4 w-4" /> Créance
              </h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="principal" className="text-xs font-bold text-slate-700">Montant principal (FCFA) *</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={formData.montantPrincipal}
                    onChange={(e) => setFormData({ ...formData, montantPrincipal: e.target.value })}
                    className="bg-white border-slate-200 focus-visible:ring-recouvrement font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="penalites" className="text-xs font-semibold">Pénalités / Intérêts (FCFA)</Label>
                  <Input
                    id="penalites"
                    type="number"
                    value={formData.penalitesInterets}
                    onChange={(e) => setFormData({ ...formData, penalitesInterets: e.target.value })}
                    className="bg-white border-slate-200 focus-visible:ring-recouvrement"
                  />
                </div>
                <div className="pt-2">
                  <div className="flex justify-between items-center bg-recouvrement text-white p-3 rounded-lg shadow-sm">
                    <span className="text-xs font-medium">Total à recouvrer :</span>
                    <span className="text-lg font-black">{formatCurrency(totalARecouvrer)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Convention Honoraires</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Type honoraires</Label>
                  <Select
                    value={formData.honoraireType}
                    onValueChange={(val) => setFormData({ ...formData, honoraireType: val as any })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FORFAIT">Forfait fixe</SelectItem>
                      <SelectItem value="POURCENTAGE">Pourcentage sur recouvrement</SelectItem>
                      <SelectItem value="MIXTE">Mixte (Forfait + Pourcentage)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(formData.honoraireType === 'FORFAIT' || formData.honoraireType === 'MIXTE') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Montant forfait prévisionnel</Label>
                    <Input
                      type="number"
                      value={formData.honoraireMontant}
                      onChange={(e) => setFormData({ ...formData, honoraireMontant: e.target.value })}
                      placeholder="Ex: 500000"
                      className="bg-white"
                    />
                  </div>
                )}
                {(formData.honoraireType === 'POURCENTAGE' || formData.honoraireType === 'MIXTE') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Pourcentage (%)</Label>
                    <Input
                      type="number"
                      value={formData.honorairePourcentage}
                      onChange={(e) => setFormData({ ...formData, honorairePourcentage: e.target.value })}
                      placeholder="Ex: 10"
                      className="bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold">Observations / Notes (Détails de la créance)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Saisissez des détails sur l'origine du litige, les factures concernées, etc."
              className="bg-slate-50 border-slate-200 min-h-[100px]"
            />
          </div>
        </form>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-slate-200">
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createDossier.isPending}
            className="bg-primary hover:bg-primary/90 px-8 text-white shadow-lg transition-all"
          >
            {createDossier.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création en cours...</>
            ) : (
              'Initialiser le dossier'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}