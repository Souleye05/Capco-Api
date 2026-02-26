import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImmeubleCard } from './ImmeubleCard';

interface ImmeublesGridProps {
    immeubles: any[];
    lots: any[];
    encaissements: any[];
    currentMonth: string;
    isLoading: boolean;
    onEdit: (immeuble: any) => void;
    onRapport: (nom: string) => void;
    onNew: () => void;
}

export function ImmeublesGrid({
    immeubles,
    lots,
    encaissements,
    currentMonth,
    isLoading,
    onEdit,
    onRapport,
    onNew
}: ImmeublesGridProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (immeubles.length === 0) {
        return (
            <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-muted/30">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20 text-primary" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucun immeuble trouvé</h3>
                <p className="text-muted-foreground mb-6">Commencez par ajouter votre premier immeuble à gérer.</p>
                <Button onClick={onNew} className="rounded-xl px-8">
                    Créer un nouvel immeuble
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {immeubles.map((immeuble) => (
                <ImmeubleCard
                    key={immeuble.id}
                    immeuble={immeuble}
                    lots={lots}
                    encaissements={encaissements}
                    currentMonth={currentMonth}
                    onEdit={onEdit}
                    onRapport={onRapport}
                />
            ))}
        </div>
    );
}
