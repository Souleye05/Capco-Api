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
import { useCreateTacheConseil } from '@/hooks/useConseil';
import { CreateTacheConseilDto, TypeTacheConseil } from '@/types/conseil';

const createTacheSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  type: z.enum(['CONSULTATION', 'REDACTION', 'RECHERCHE', 'REUNION', 'AUTRE']),
  description: z.string().min(1, 'La description est requise'),
  dureeMinutes: z.number().min(0).optional(),
  moisConcerne: z.string().min(1, 'Le mois concerné est requis'),
});

type CreateTacheFormData = z.infer<typeof createTacheSchema>;

interface CreateTacheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export const CreateTacheDialog: React.FC<CreateTacheDialogProps> = ({
  open,
  onOpenChange,
  clientId,
}) => {
  const createTacheMutation = useCreateTacheConseil();

  const form = useForm<CreateTacheFormData>({
    resolver: zodResolver(createTacheSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'CONSULTATION',
      description: '',
      dureeMinutes: undefined,
      moisConcerne: new Date().toISOString().slice(0, 7), // YYYY-MM format
    },
  });

  const onSubmit = async (data: CreateTacheFormData) => {
    try {
      const createData: CreateTacheConseilDto = {
        clientId,
        ...data,
        dureeMinutes: data.dureeMinutes || undefined,
      };

      await createTacheMutation.mutateAsync(createData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle Tâche</DialogTitle>
          <DialogDescription>
            Enregistrer une nouvelle tâche pour ce client
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CONSULTATION">Consultation</SelectItem>
                        <SelectItem value="REDACTION">Rédaction</SelectItem>
                        <SelectItem value="RECHERCHE">Recherche</SelectItem>
                        <SelectItem value="REUNION">Réunion</SelectItem>
                        <SelectItem value="AUTRE">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dureeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Durée en minutes"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
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
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description détaillée de la tâche"
                      className="resize-none"
                      rows={4}
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
                disabled={createTacheMutation.isPending}
              >
                {createTacheMutation.isPending ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};