import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, Calendar as CalendarIcon, Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';

interface GenerateRapportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    immeubles: any[];
    onGenerate: (data: { immeubleId: string, dateDebut: Date, dateFin: Date }) => Promise<any>;
    isGenerating: boolean;
}

export function GenerateRapportDialog({ open, onOpenChange, immeubles, onGenerate, isGenerating }: GenerateRapportDialogProps) {
    const [immeubleId, setImmeubleId] = useState('');
    const [dateDebut, setDateDebut] = useState<Date | undefined>();
    const [dateFin, setDateFin] = useState<Date | undefined>();

    useEffect(() => {
        if (!open) {
            setImmeubleId('');
            setDateDebut(undefined);
            setDateFin(undefined);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!immeubleId || !dateDebut || !dateFin) {
            toast.error('Veuillez sélectionner un immeuble et une période');
            return;
        }

        if (dateDebut > dateFin) {
            toast.error('La date de début doit être antérieure à la date de fin');
            return;
        }

        try {
            await onGenerate({ immeubleId, dateDebut, dateFin });
            onOpenChange(false);
            toast.success('Rapport généré avec succès');
        } catch (error) { }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-[32px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Générer un rapport</DialogTitle>
                    <DialogDescription className="font-medium">
                        Centralisez les encaissements et dépenses pour une période donnée.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Immeuble cible</Label>
                        <Select value={immeubleId} onValueChange={setImmeubleId}>
                            <SelectTrigger className="h-12 rounded-xl border-border/50 font-bold bg-muted/20">
                                <SelectValue placeholder="Sélectionner un immeuble" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {immeubles.map(imm => (
                                    <SelectItem key={imm.id} value={imm.id} className="font-bold">{imm.nom}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Date de début</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-bold h-12 rounded-xl border-border/50">
                                        <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                                        {dateDebut ? format(dateDebut, 'dd/MM/yyyy') : 'Début'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={dateDebut}
                                        onSelect={setDateDebut}
                                        initialFocus
                                        className="pointer-events-auto"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Date de fin</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-bold h-12 rounded-xl border-border/50">
                                        <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                                        {dateFin ? format(dateFin, 'dd/MM/yyyy') : 'Fin'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={dateFin}
                                        onSelect={setDateFin}
                                        initialFocus
                                        className="pointer-events-auto"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex gap-3 text-xs font-medium text-primary leading-relaxed">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>
                            Le rapport inclura tous les encaissements validés et les dépenses approuvées enregistrés sur cette période.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Annuler</Button>
                    <Button onClick={handleSubmit} disabled={isGenerating} className="rounded-xl font-black px-8 bg-primary shadow-lg shadow-primary/20">
                        {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Lancer la génération
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
