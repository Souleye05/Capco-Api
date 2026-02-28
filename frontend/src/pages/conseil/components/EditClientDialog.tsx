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
import { useUpdateClientConseil } from '@/hooks/useConseil';
import { ClientConseil, UpdateClientConseilDto } from '@/types/conseil';

const editClientSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  type: z.enum(['physique', 'morale']),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().optional(),
  honoraireMensuel: z.number().min(0, 'Le montant doit être positif'),
  jourFacturation: z.number().min(1).max(31),
  statut: z.enum(['ACTIF', 'SUSPENDU', 'RESILIE']),
  notes: z.string().optional(),
});

type EditClientFormData = z.infer<typeof editClientSchema>;

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientConseil;
}

export const EditClientDialog: React.FC<EditClientDialogProps> = ({
  open,
  onOpenChange,
  client,
}) => {
  const updateClientMutation = useUpdateClientConseil();

  const form = useForm<EditClientFormData>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      nom: '',
      type: 'physique',
      telephone: '',
      email: '',
      adresse: '',
      honoraireMensuel: 0,
      jourFacturation: 1,
      statut: 'ACTIF',
      notes: '',
    },
  });

  // Populate form when client changes
  useEffect(() => {
    if (client) {
      form.reset({
        nom: client.nom,
        type: client.type,
        telephone: client.telephone || '',
        email: client.email || '',
        adresse: client.adresse || '',
        honoraireMensuel: client.honoraireMensuel,
        jourFacturation: client.jourFacturation,
        statut: client.statut,
        notes: client.notes || '',
      });
    }
  }, [client, form]);

  const onSubmit = async (data: EditClientFormData) => {
    try {
      const updateData: UpdateClientConseilDto = {
        nom: data.nom,
        type: data.type,
        telephone: data.telephone || undefined,
        email: data.email || undefined,
        adresse: data.adresse || undefined,
        honoraireMensuel: data.honoraireMensuel,
        jourFacturation: data.jourFacturation,
        statut: data.statut,
        notes: data.notes || undefined,
      };

      await updateClientMutation.mutateAsync({
        id: client.id,
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
          <DialogTitle>Modifier le Client - {client.reference}</DialogTitle>
          <DialogDescription>
            Modifier les informations du client conseil
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du client" {...field} />
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
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="physique">Personne physique</SelectItem>
                        <SelectItem value="morale">Personne morale</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro de téléphone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Adresse email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="honoraireMensuel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Honoraire Mensuel (€)</FormLabel>
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
                name="jourFacturation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jour de Facturation</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
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
                        <SelectItem value="ACTIF">Actif</SelectItem>
                        <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                        <SelectItem value="RESILIE">Résilié</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adresse complète"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={updateClientMutation.isPending}
              >
                {updateClientMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};