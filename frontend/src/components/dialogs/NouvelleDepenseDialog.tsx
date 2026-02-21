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
import { Receipt } from 'lucide-react';
import { useCreateDepense, TYPE_DEPENSES } from '@/hooks/useDepenses';
import { useAffaires } from '@/hooks/useAffaires';
import { CURRENCY_EXAMPLES } from '@/lib/currency';
import { format } from 'date-fns';

const depenseSchema = z.object({
  affaireId: z.string().min(1, 'Veuillez sélectionner une affaire'),
  date: z.string().optional(),
  typeDepense: z.string().min(1, 'Veuillez sélectionner un type de dépense'),
  nature: z.string().min(1, 'Veuillez préciser la nature de la dépense'),
  montant: z.number().min(0, 'Le montant doit être positif'),
  description: z.string().optional(),
  justificatif: z.string().optional(),
});

type DepenseFormData = z.infer<typeof depenseSchema>;

interface NouvelleDepenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affaireId?: string; // Pré-sélectionner une affaire si fournie
}

export function NouvelleDepenseDialog({ 
  open, 
  onOpenChange, 
  affaireId 
}: NouvelleDepenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createDepense = useCreateDepense();
  const { data: affairesResponse } = useAffaires({ limit: 100 });
  const affaires = affairesResponse?.data || [];

  const form = useForm<DepenseFormData>({
    resolver: zodResolver(depenseSchema),
    defaultValues: {
      affaireId: affaireId || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      typeDepense: '',
      nature: '',
      montant: 0,
      description: '',
      justificatif: '',
    },
  });

  const onSubmit = async (data: DepenseFormData) => {
    setIsSubmitting(true);
    try {
      await createDepense.mutateAsync({
        affaireId: data.affaireId,
        date: data.date,
        typeDepense: data.typeDepense,
        nature: data.nature,
        montant: data.montant,
        description: data.description,
        justificatif: data.justificatif,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création de la dépense:', error);
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
            <Receipt className="h-5 w-5" />
            Nouvelle Dépense
          </DialogTitle>
          <DialogDescription>
            Enregistrer une nouvelle dépense pour une affaire contentieuse.
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

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
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

              {/* Montant */}
              <FormField
                control={form.control}
                name="montant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (F CFA) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder={CURRENCY_EXAMPLES.DEPENSES.TYPICAL.toString()}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type de dépense */}
            <FormField
              control={form.control}
              name="typeDepense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de Dépense *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TYPE_DEPENSES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nature */}
            <FormField
              control={form.control}
              name="nature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nature *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Huissier, Enregistrement, Expertise..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description détaillée de la dépense"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Justificatif */}
            <FormField
              control={form.control}
              name="justificatif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificatif</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Facture n°123, Reçu greffe..."
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
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer la dépense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}