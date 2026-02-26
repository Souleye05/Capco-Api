import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingDown } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';
import { TypeDepenseImmeuble } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const typeDepenseLabels: Record<TypeDepenseImmeuble, string> = {
    PLOMBERIE_ASSAINISSEMENT: 'Plomberie – Assainissement',
    ELECTRICITE_ECLAIRAGE: 'Électricité – Éclairage',
    ENTRETIEN_MAINTENANCE: 'Entretien – Maintenance générale',
    SECURITE_GARDIENNAGE_ASSURANCE: 'Sécurité – Gardiennage – Assurance',
    AUTRES_DEPENSES: 'Autres dépenses'
};

interface DepensesTabProps {
    depenses: any[];
    onCreateDepense: (data: any) => Promise<void>;
    isLoading: boolean;
}

export function DepensesTab({ depenses, onCreateDepense, isLoading }: DepensesTabProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<TypeDepenseImmeuble>('AUTRES_DEPENSES');
    const [nature, setNature] = useState('');
    const [description, setDescription] = useState('');
    const [montant, setMontant] = useState('');

    const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant), 0);

    const handleSubmit = async () => {
        if (!nature || !montant) {
            toast.error('Veuillez remplir les champs obligatoires');
            return;
        }

        await onCreateDepense({
            typeDepense: type,
            nature: nature.trim(),
            description: description.trim() || undefined,
            montant: parseFloat(montant)
        });

        setOpen(false);
        setNature('');
        setDescription('');
        setMontant('');
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dépenses</CardTitle>
                <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nouvelle dépense
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Nature</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {depenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Aucune dépense trouvée
                                </TableCell>
                            </TableRow>
                        ) : (
                            depenses.map(dep => (
                                <TableRow key={dep.id}>
                                    <TableCell>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(dep.date))}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{typeDepenseLabels[dep.typeDepense as TypeDepenseImmeuble] || dep.typeDepense}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{dep.nature}</TableCell>
                                    <TableCell className="text-muted-foreground">{dep.description || '-'}</TableCell>
                                    <TableCell className="text-right font-medium text-destructive">
                                        -{formatCurrency(Number(dep.montant))}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {depenses.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-end">
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total dépenses</p>
                            <p className="text-lg font-bold text-destructive">-{formatCurrency(totalDepenses)}</p>
                        </div>
                    </div>
                )}

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nouvelle dépense</DialogTitle>
                            <DialogDescription>Enregistrez une dépense effectuée pour l'immeuble</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Type de dépense</Label>
                                <Select value={type} onValueChange={v => setType(v as TypeDepenseImmeuble)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeDepenseLabels).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Nature / Objet</Label>
                                <Input placeholder="Ex: Réparation fuite eau" value={nature} onChange={e => setNature(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description (optionnel)</Label>
                                <Textarea placeholder="Détails de la dépense..." value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Montant (FCFA)</Label>
                                <Input type="number" value={montant} onChange={e => setMontant(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                            <Button onClick={handleSubmit} disabled={isLoading}>Enregistrer</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
