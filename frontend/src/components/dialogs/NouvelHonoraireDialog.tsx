import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Banknote } from 'lucide-react';
import { useCreateHonoraire } from '@/hooks/useHonoraires';
import { useAffaires } from '@/hooks/useAffaires';
import { CURRENCY_EXAMPLES } from '@/lib/currency';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const honoraireSchema = z.object({
  affaireId: z.string().min(1, 'Veuillez sélectionner une affaire'),
  montantFacture: z.number().min(0, 'Le montant facturé doit être positif'),
  montantEncaisse: z.number().min(0, 'Le montant encaissé doit être positif').optional(),
  dateFacturation: z.string().optional(),
  notes: z.string().optional(),
});

type HonoraireFormData = z.infer<typeof honoraireSchema>;

interface NouvelHonoraireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affaireId?: string; // Pré-sélectionner une affaire si fournie
}

export function NouvelHonoraireDialog({ 
  open, 
  onOpenChange, 
  affaireId 
}: NouvelHonoraireDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createHonoraire = useCreateHonoraire();
  const { data: affairesResponse } = useAffaires({ limit: 100 });
  const affaires = affairesResponse?.data || [];

  const form = useForm<HonoraireFormData>({
    resolver: zodResolver(honoraireSchema),
    defaultValues: {
      affaireId: affaireId || '',
      montantFacture: 0,
      montantEncaisse: 0,
      dateFacturation: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  const onSubmit = async (data: HonoraireFormData) => {
    setIsSubmitting(true);
    try {
      await createHonoraire.mutateAsync({
        affaireId: data.affaireId,
        montantFacture: data.montantFacture,
        montantEncaisse: data.montantEncaisse || 0,
        dateFacturation: data.dateFacturation,
        notes: data.notes,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création de l\'honoraire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Nouvel Honoraire
          </DialogTitle>
          <DialogDescription>
            Créer un nouvel honoraire pour une affaire contentieuse.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Sélection de l'affaire */}
            <FormField
              control={form.control}
              name="affaireId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affaire *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une affaire" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {affaires.map((affaire) => (
                        <SelectItem key={affaire.id} value={affaire.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{affaire.reference}</span>
                            <span className="text-sm text-muted-foreground truncate">
                              {affaire.intitule}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Montant facturé */}
            <FormField
              control={form.control}
              name="montantFacture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant Facturé (F CFA) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder={CURRENCY_EXAMPLES.HONORAIRES.TYPICAL.toString()}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Montant encaissé */}
            <FormField
              control={form.control}
              name="montantEncaisse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant Encaissé (F CFA)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date de facturation */}
            <FormField
              control={form.control}
              name="dateFacturation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de Facturation</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes sur les honoraires (ex: Honoraires de plaidoirie)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Création...' : 'Créer l\'honoraire'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}