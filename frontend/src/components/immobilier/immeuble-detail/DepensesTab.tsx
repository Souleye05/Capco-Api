import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, TrendingDown, Wrench, Info, DollarSign, FileText, Layers, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
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
        <div className="bg-background/40 backdrop-blur-xl rounded-[2rem] border border-border/40 overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div className="px-6 py-5 border-b border-border/10 flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20">
                        <TrendingDown className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black tracking-tight text-foreground">Gestion des charges</h3>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Suivi des dépenses immeuble</p>
                    </div>
                </div>
                <Button onClick={() => setOpen(true)} className="h-10 px-6 rounded-2xl bg-foreground hover:bg-foreground/90 text-background shadow-lg shadow-foreground/10 transition-all font-black text-[10px] uppercase tracking-widest gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvelle dépense
                </Button>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/10">
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 pl-6 w-[140px]">Date</TableHead>
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 min-w-[180px]">Type & Nature</TableHead>
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 hidden md:table-cell">Description</TableHead>
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 text-right pr-6 w-[160px]">Montant</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {depenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-16 px-6">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/20 mb-3 border border-border/20">
                                        <Info className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-sm font-black tracking-tight">Aucune dépense trouvée</p>
                                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Les sorties d'argent s'afficheront ici</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            depenses.map(dep => (
                                <TableRow key={dep.id} className="hover:bg-destructive/[0.01] border-b border-border/5 transition-colors group">
                                    <TableCell className="py-5 pl-6">
                                        <div className="flex flex-col">
                                            <p className="font-bold text-sm tracking-tight">
                                                {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(dep.date))}
                                            </p>
                                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter mt-0.5">Enregistré</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <Badge variant="outline" className="w-fit rounded-lg bg-background/50 border-border/40 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 text-muted-foreground/80">
                                                {typeDepenseLabels[dep.typeDepense as TypeDepenseImmeuble] || dep.typeDepense}
                                            </Badge>
                                            <p className="font-black text-sm text-foreground tracking-tight leading-none">{dep.nature}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 hidden md:table-cell">
                                        <p className="text-xs font-medium text-muted-foreground/80 italic line-clamp-2 max-w-[250px]">
                                            {dep.description || '—'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="py-5 text-right pr-6">
                                        <div className="flex flex-col items-end">
                                            <p className="font-black text-sm text-destructive tracking-tighter">-{formatCurrency(Number(dep.montant))}</p>
                                            <Badge className="h-4 px-1.5 rounded-full bg-destructive/5 text-destructive border-none text-[8px] font-black uppercase tracking-tighter mt-1 opacity-60">Sortie</Badge>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {depenses.length > 0 && (
                <div className="px-6 py-6 bg-destructive/[0.02] border-t border-border/10 flex justify-end">
                    <div className="space-y-1 text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total cumulé des dépenses</p>
                        <p className="text-2xl font-black tracking-tighter text-destructive">-{formatCurrency(totalDepenses)}</p>
                    </div>
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                    <div className="px-6 py-6 border-b border-border/10 bg-gradient-to-br from-destructive/[0.03] to-transparent">
                        <DialogHeader>
                            <div className="flex items-center gap-2 text-destructive/60 mb-1">
                                <TrendingDown className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Comptabilité charges</span>
                            </div>
                            <DialogTitle className="text-xl font-black tracking-tight text-foreground">Nouvelle dépense</DialogTitle>
                            <DialogDescription className="text-xs font-medium opacity-60">Enregistrez une sortie d'argent effectuée pour l'immeuble</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-6 space-y-5">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Catégorie de charge</Label>
                            <div className="relative group">
                                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-destructive transition-colors pointer-events-none" />
                                <SearchableSelect
                                    value={type}
                                    onValueChange={v => setType(v as TypeDepenseImmeuble)}
                                    options={Object.entries(typeDepenseLabels).map(([val, label]) => ({
                                        value: val,
                                        label: label
                                    }))}
                                    placeholder="Choisir une catégorie..."
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-destructive/5 shadow-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Nature / Objet de la dépense</Label>
                            <div className="relative group">
                                <Wrench className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-destructive transition-colors pointer-events-none" />
                                <Input
                                    placeholder="Ex: Réparation ascenseur..."
                                    value={nature}
                                    onChange={e => setNature(e.target.value)}
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-black focus:bg-background focus:ring-4 focus:ring-destructive/5 shadow-none placeholder:font-medium placeholder:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Détails complémentaires</Label>
                            <div className="relative group">
                                <FileText className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-destructive transition-colors pointer-events-none" />
                                <Textarea
                                    placeholder="Précisez les détails ici..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="min-h-[100px] pl-10 pt-2.5 rounded-xl bg-muted/20 border-border/40 text-sm font-medium focus:bg-background focus:ring-4 focus:ring-destructive/5 shadow-none placeholder:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Montant décaissé (FCFA)</Label>
                            <div className="relative group">
                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-destructive transition-colors pointer-events-none" />
                                <Input
                                    type="number"
                                    value={montant}
                                    onChange={e => setMontant(e.target.value)}
                                    placeholder="Ex: 75000"
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-black focus:bg-background focus:ring-4 focus:ring-destructive/5 shadow-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-5 border-t border-border/10 bg-muted/5 flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                            Annuler
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="rounded-xl h-10 px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest font-display">
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Enregistrer la charge'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

