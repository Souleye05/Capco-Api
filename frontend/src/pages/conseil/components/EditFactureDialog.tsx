import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateFactureConseil } from '@/hooks/useConseil';
import { FactureConseil, UpdateFactureConseilDto } from '@/types/conseil';

const editFactureSchema = z.object({
  moisConcerne: z.string().min(1, 'Le mois concerné est requis'),
  montantHt: z.number().min(0, 'Le montant HT doit être positif'),
  tva: z.number().min(0).max(100),
  dateEmission: z.string().min(1, 'La date d\'émission est requise'),
  dateEcheance: z.string().min(1, 'La date d\'échéance est requise'),
  statut: z.enum(['BROUILLON', 'ENVOYEE', 'PAYEE', 'ANNULEE']),
  notes: z.string().optional(),
});

type EditFactureFormData = z.infer<typeof editFactureSchema>;

interface EditFactureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facture: FactureConseil;
}

export const EditFactureDialog: React.FC<EditFactureDialogProps> = ({
  open,
  onOpenChange,
  facture,
}) => {
  const updateFactureMutation = useUpdateFactureConseil();

  const form = useForm<EditFactureFormData>({
    resolver: zodResolver(editFactureSchema),
    defaultValues: {
      moisConcerne: '',
      montantHt: 0,
      tva: 20,
      dateEmission: '',
      dateEcheance: '',
      statut: 'BROUILLON',
      notes: '',
    },
  });

  // Populate form when facture changes
  useEffect(() => {
    if (facture) {
      form.reset({
        moisConcerne: facture.moisConcerne,
        montantHt: facture.montantHt,
        tva: facture.tva,
        dateEmission: facture.dateEmission.split('T')[0],
        dateEcheance: facture.dateEcheance.split('T')[0],
        statut: facture.statut,
        notes: facture.notes || '',
      });
    }
  }, [facture, form]);

  const montantHt = form.watch('montantHt');
  const tva = form.watch('tva');
  const montantTtc = montantHt * (1 + tva / 100);

  const onSubmit = async (data: EditFactureFormData) => {
    try {
      const updateData: UpdateFactureConseilDto = {
        ...data,
        montantTtc,
        notes: data.notes || undefined,
      };

      await updateFactureMutation.mutateAsync({
        id: facture.id,
        data: updateData,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier la Facture - {facture.reference}</DialogTitle>
          <DialogDescription>
            Modifier les informations de la facture
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="moisConcerne"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mois Concerné *</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BROUILLON">Brouillon</SelectItem>
                        <SelectItem value="ENVOYEE">Envoyée</SelectItem>
                        <SelectItem value="PAYEE">Payée</SelectItem>
                        <SelectItem value="ANNULEE">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="montantHt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant HT (€) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TVA (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="20"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateEmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'Émission *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateEcheance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'Échéance *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Montant TTC calculé */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Montant TTC calculé:</span>
                <span className="text-lg font-bold">
                  {montantTtc.toFixed(2)} €
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {montantHt.toFixed(2)} € HT + {(montantTtc - montantHt).toFixed(2)} € TVA ({tva}%)
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notes additionnelles"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={updateFactureMutation.isPending}
              >
                {updateFactureMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};