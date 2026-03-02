import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, Calendar as CalendarIcon, Building2, LayoutDashboard, FileText } from 'lucide-react';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
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
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <FileText className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Analytique</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight">Générer un rapport</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            Sélectionnez l'immeuble et la période pour générer le rapport.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-5">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Immeuble concerné</Label>
                        <div className="relative group">
                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                            <SearchableSelect
                                options={immeubles.map(imm => ({ label: imm.nom, value: imm.id }))}
                                value={immeubleId}
                                onValueChange={setImmeubleId}
                                placeholder="Sélectionner un immeuble..."
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-medium focus:ring-4 focus:ring-primary/5"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Date début</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left h-11 rounded-xl border-border/40 bg-muted/20 font-medium text-sm hover:bg-background transition-all pl-10 relative">
                                        <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        {dateDebut ? format(dateDebut, 'dd/MM/yyyy') : 'Début'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-border/40 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={dateDebut}
                                        onSelect={setDateDebut}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Date fin</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left h-11 rounded-xl border-border/40 bg-muted/20 font-medium text-sm hover:bg-background transition-all pl-10 relative">
                                        <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        {dateFin ? format(dateFin, 'dd/MM/yyyy') : 'Fin'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-border/40 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={dateFin}
                                        onSelect={setDateFin}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex items-center justify-end gap-3 border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={isGenerating} className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest">
                        {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Générer'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
