import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Générer un rapport de gestion</DialogTitle>
                    <DialogDescription>
                        Sélectionnez l'immeuble et la période pour générer le rapport.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Immeuble</Label>
                        <Select value={immeubleId} onValueChange={setImmeubleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un immeuble" />
                            </SelectTrigger>
                            <SelectContent>
                                {immeubles.map(imm => (
                                    <SelectItem key={imm.id} value={imm.id}>{imm.nom}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date début</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateDebut ? format(dateDebut, 'dd/MM/yyyy') : 'Début'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
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
                            <Label>Date fin</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFin ? format(dateFin, 'dd/MM/yyyy') : 'Fin'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
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
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Générer le rapport
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
