import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
    label: string;
    value: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Sélectionner...",
    searchPlaceholder = "Rechercher...",
    emptyText = "Aucun résultat trouvé.",
    className,
    disabled = false,
    id,
    name,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((option) => option.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    name={name}
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-medium transition-all duration-200",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-aria-expanded:rotate-180" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-full p-0 border-border/40 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                align="start"
                style={{ width: "var(--radix-popover-trigger-width)" }}
            >
                <Command className="bg-transparent">
                    <CommandInput
                        placeholder={searchPlaceholder}
                        className="h-10 border-none focus:ring-0 text-sm"
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        <CommandEmpty className="py-6 text-xs text-muted-foreground text-center">
                            {emptyText}
                        </CommandEmpty>
                        <CommandGroup className="p-1.5">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onValueChange(option.value);
                                        setOpen(false);
                                    }}
                                    className="rounded-xl py-2 px-3 text-sm font-medium cursor-pointer transition-all hover:bg-primary/5 data-[selected='true']:bg-primary/10 data-[selected='true']:text-primary flex items-center gap-2"
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-4 h-4 rounded-full border border-primary/20 transition-all",
                                        value === option.value ? "bg-primary border-primary" : "bg-transparent"
                                    )}>
                                        <Check
                                            className={cn(
                                                "h-3 w-3 text-white transition-opacity",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </div>
                                    <span className="flex-1 truncate">{option.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
