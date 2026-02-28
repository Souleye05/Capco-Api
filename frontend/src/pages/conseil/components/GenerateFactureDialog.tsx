import React from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGenerateMonthlyBill, useClientsConseil } from '@/hooks/useConseil';

const generateFactureSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  moisConcerne: z.string().min(1, 'Le mois concerné est requis'),
});

type GenerateFactureFormData = z.infer<typeof generateFactureSchema>;

interface GenerateFactureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GenerateFactureDialog: React.FC<GenerateFactureDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const generateBillMutation = useGenerateMonthlyBill();
  const { data: clientsData } = useClientsConseil({ limit: 100, statut: 'ACTIF' });

  const form = useForm<GenerateFactureFormData>({
    resolver: zodResolver(generateFactureSchema),
    defaultValues: {
      clientId: '',
      moisConcerne: new Date().toISOString().slice(0, 7), // YYYY-MM format
    },
  });

  const onSubmit = async (data: GenerateFactureFormData) => {
    try {
      await generateBillMutation.mutateAsync({
        clientId: data.clientId,
        moisConcerne: data.moisConcerne,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Générer une Facture Mensuelle</DialogTitle>
          <DialogDescription>
            Générer automatiquement une facture basée sur l'honoraire mensuel et les tâches
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Cette fonction génère automatiquement une facture basée sur l'honoraire mensuel du client 
            et les tâches effectuées pour le mois sélectionné.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientsData?.data.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{client.nom}</span>
                            <span className="text-sm text-muted-foreground">
                              {client.reference} - Honoraire: {client.honoraireMensuel}€/mois
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

            <FormField
              control={form.control}
              name="moisConcerne"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mois Concerné *</FormLabel>
                  <FormControl>
                    <input
                      type="month"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                disabled={generateBillMutation.isPending}
              >
                {generateBillMutation.isPending ? 'Génération...' : 'Générer la Facture'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};