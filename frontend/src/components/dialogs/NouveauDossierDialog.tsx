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
import { useCreateDossierRecouvrement } from '@/hooks/useDossiersRecouvrement';
import { useCreateHonorairesRecouvrement } from '@/hooks/useHonorairesDepenses';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface NouveauDossierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouveauDossierDialog({ open, onOpenChange }: NouveauDossierDialogProps) {
  const { user } = useAuth();
  const createDossier = useCreateDossierRecouvrement();
  
  const [formData, setFormData] = useState({
    creancierNom: '',
    creancierType: 'morale',
    creancierTelephone: '',
    creancierEmail: '',
    debiteurNom: '',
    debiteurType: 'morale',
    debiteurTelephone: '',
    debiteurEmail: '',
    debiteurAdresse: '',
    montantPrincipal: '',
    penalites: '',
    honorairesType: 'POURCENTAGE',
    honorairesPourcentage: '10',
    honorairesMontant: '',
    notes: ''
  });

  // Calculate total and suggested honoraires
  const montantPrincipal = parseFloat(formData.montantPrincipal) || 0;
  const penalites = parseFloat(formData.penalites) || 0;
  const totalARecouvrer = montantPrincipal + penalites;
  
  const calculatedHonoraires = formData.honorairesType === 'POURCENTAGE'
    ? totalARecouvrer * (parseFloat(formData.honorairesPourcentage) || 0) / 100
    : parseFloat(formData.honorairesMontant) || 0;

  const resetForm = () => {
    setFormData({ 
      creancierNom: '', 
      creancierType: 'morale', 
      creancierTelephone: '',
      creancierEmail: '',
      debiteurNom: '', 
      debiteurType: 'morale',
      debiteurTelephone: '',
      debiteurEmail: '',
      debiteurAdresse: '',
      montantPrincipal: '', 
      penalites: '',
      honorairesType: 'POURCENTAGE',
      honorairesPourcentage: '10',
      honorairesMontant: '',
      notes: '' 
    });
  };

  const createHonoraires = useCreateHonorairesRecouvrement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.creancierNom || !formData.debiteurNom || !formData.montantPrincipal || !user) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // Generate reference
      const { data: refData } = await supabase.rpc('generate_dossier_reference');
      const reference = refData || `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

      const dossier = await createDossier.mutateAsync({
        reference,
        creancier_nom: formData.creancierNom,
        creancier_telephone: formData.creancierTelephone || null,
        creancier_email: formData.creancierEmail || null,
        creancier_id: null,
        debiteur_nom: formData.debiteurNom,
        debiteur_telephone: formData.debiteurTelephone || null,
        debiteur_email: formData.debiteurEmail || null,
        debiteur_adresse: formData.debiteurAdresse || null,
        debiteur_id: null,
        montant_principal: montantPrincipal,
        penalites_interets: penalites || null,
        total_a_recouvrer: totalARecouvrer,
        statut: 'EN_COURS',
        notes: formData.notes || null,
        created_by: user.id
      });

      // Create honoraires record if amount is set
      if (calculatedHonoraires > 0 && dossier?.id) {
        await createHonoraires.mutateAsync({
          dossier_id: dossier.id,
          type: formData.honorairesType === 'POURCENTAGE' ? 'POURCENTAGE' : 'FORFAIT',
          pourcentage: formData.honorairesType === 'POURCENTAGE' ? parseFloat(formData.honorairesPourcentage) : null,
          montant_prevu: calculatedHonoraires,
          montant_paye: 0,
          created_by: user.id
        });
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau dossier de recouvrement</DialogTitle>
          <DialogDescription>
            Ouvrir un nouveau dossier de recouvrement de créance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Créancier */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">Créancier</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="creancierNom">Nom du créancier *</Label>
                <Input
                  id="creancierNom"
                  value={formData.creancierNom}
                  onChange={(e) => setFormData({ ...formData, creancierNom: e.target.value })}
                  placeholder="Nom ou raison sociale"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.creancierType}
                  onValueChange={(value) => setFormData({ ...formData, creancierType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morale">Personne morale</SelectItem>
                    <SelectItem value="physique">Personne physique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Débiteur */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">Débiteur</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="debiteurNom">Nom du débiteur *</Label>
                <Input
                  id="debiteurNom"
                  value={formData.debiteurNom}
                  onChange={(e) => setFormData({ ...formData, debiteurNom: e.target.value })}
                  placeholder="Nom ou raison sociale"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.debiteurType}
                  onValueChange={(value) => setFormData({ ...formData, debiteurType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morale">Personne morale</SelectItem>
                    <SelectItem value="physique">Personne physique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="debiteurTelephone">Téléphone du débiteur</Label>
              <Input
                id="debiteurTelephone"
                value={formData.debiteurTelephone}
                onChange={(e) => setFormData({ ...formData, debiteurTelephone: e.target.value })}
                placeholder="Numéro de téléphone"
              />
            </div>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montantPrincipal">Montant principal (FCFA) *</Label>
              <Input
                id="montantPrincipal"
                type="number"
                value={formData.montantPrincipal}
                onChange={(e) => setFormData({ ...formData, montantPrincipal: e.target.value })}
                placeholder="Ex: 5000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="penalites">Pénalités/intérêts (FCFA)</Label>
              <Input
                id="penalites"
                type="number"
                value={formData.penalites}
                onChange={(e) => setFormData({ ...formData, penalites: e.target.value })}
                placeholder="Ex: 500000"
              />
            </div>
          </div>

          {totalARecouvrer > 0 && (
            <div className="p-3 bg-success/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total à recouvrer</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totalARecouvrer)}</p>
            </div>
          )}

          <Separator />

          {/* Honoraires CAPCO */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-sm text-purple-700">Honoraires CAPCO</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de facturation</Label>
                <Select
                  value={formData.honorairesType}
                  onValueChange={(value) => setFormData({ ...formData, honorairesType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POURCENTAGE">Pourcentage</SelectItem>
                    <SelectItem value="FORFAIT">Forfait</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.honorairesType === 'POURCENTAGE' ? (
                <div className="space-y-2">
                  <Label htmlFor="honorairesPourcentage">Pourcentage (%)</Label>
                  <Input
                    id="honorairesPourcentage"
                    type="number"
                    value={formData.honorairesPourcentage}
                    onChange={(e) => setFormData({ ...formData, honorairesPourcentage: e.target.value })}
                    placeholder="Ex: 10"
                    min="0"
                    max="100"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="honorairesMontant">Montant forfait (FCFA)</Label>
                  <Input
                    id="honorairesMontant"
                    type="number"
                    value={formData.honorairesMontant}
                    onChange={(e) => setFormData({ ...formData, honorairesMontant: e.target.value })}
                    placeholder="Ex: 500000"
                  />
                </div>
              )}
            </div>

            {calculatedHonoraires > 0 && (
              <div className="p-3 bg-purple-100 rounded-lg text-center">
                <p className="text-sm text-purple-600">Honoraires prévus</p>
                <p className="text-lg font-bold text-purple-700">{formatCurrency(calculatedHonoraires)}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Nature de la créance, informations complémentaires..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer le dossier</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}