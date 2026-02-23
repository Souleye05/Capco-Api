import { useState } from 'react';
import {
    Check,
    ChevronsUpDown,
    Search,
    Plus,
    Gavel
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { NouvelleAffaireDialog } from '@/components/dialogs/NouvelleAffaireDialog';

interface Affaire {
    id: string;
    reference: string;
    intitule: string;
    demandeurs?: Array<{ nom: string }>;
    defendeurs?: Array<{ nom: string }>;
    statut: string;
}

interface AffaireSelectorProps {
    affaires: Affaire[];
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

export function AffaireSelector({
    affaires,
    value,
    onValueChange,
    disabled,
    isLoading
}: AffaireSelectorProps) {
    const [open, setOpen] = useState(false);
    const [showNouvelleAffaire, setShowNouvelleAffaire] = useState(false);

    const selectedAffaire = affaires.find((a) => a.id === value);

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between h-10 font-normal border-border bg-background hover:bg-muted/50 transition-colors"
                            disabled={disabled || isLoading}
                        >
                            {selectedAffaire ? (
                                <div className="flex flex-col items-start truncate overflow-hidden">
                                    <span className="font-semibold text-xs text-primary truncate">
                                        {selectedAffaire.reference}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                                        {selectedAffaire.intitule}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">
                                    {isLoading ? "Chargement..." : "Rechercher une affaire..."}
                                </span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command className="border-none">
                            <CommandInput placeholder="Rechercher par référence, titre ou parties..." className="h-9" />
                            <CommandList className="max-h-[300px]">
                                <CommandEmpty className="py-6 text-center">
                                    <Gavel className="h-10 w-10 mx-auto mb-2 text-muted-foreground/20" />
                                    <p className="text-sm text-muted-foreground font-medium">Aucune affaire trouvée</p>
                                </CommandEmpty>
                                <CommandGroup>
                                    {affaires
                                        .filter(a => a.statut === 'ACTIVE')
                                        .map((affaire) => {
                                            const demandeurs = affaire.demandeurs || [];
                                            const defendeurs = affaire.defendeurs || [];
                                            const partiesStr = demandeurs.length > 0 && defendeurs.length > 0
                                                ? `${demandeurs.map(d => d.nom).join(', ')} c/ ${defendeurs.map(d => d.nom).join(', ')}`
                                                : `${(demandeurs.length + defendeurs.length) || 0} partie(s)`;

                                            return (
                                                <CommandItem
                                                    key={affaire.id}
                                                    value={`${affaire.reference} ${affaire.intitule} ${partiesStr}`}
                                                    onSelect={() => {
                                                        onValueChange(affaire.id);
                                                        setOpen(false);
                                                    }}
                                                    className="flex flex-col items-start py-3 px-4 border-b border-border/40 last:border-0"
                                                >
                                                    <div className="flex justify-between items-start w-full gap-2">
                                                        <span className="font-bold text-foreground line-clamp-1">
                                                            {affaire.intitule} ({affaire.reference})
                                                        </span>
                                                        {value === affaire.id && (
                                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground line-clamp-1 mt-1 uppercase tracking-tight font-medium">
                                                        {partiesStr}
                                                    </span>
                                                </CommandItem>
                                            );
                                        })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 shrink-0 border border-border shadow-sm hover:bg-muted"
                            onClick={() => setShowNouvelleAffaire(true)}
                            disabled={disabled}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Créer une nouvelle affaire</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <NouvelleAffaireDialog
                open={showNouvelleAffaire}
                onOpenChange={setShowNouvelleAffaire}
                onSuccess={(newAffaire) => {
                    onValueChange(newAffaire.id);
                    setOpen(false);
                }}
            />
        </div>
    );
}
