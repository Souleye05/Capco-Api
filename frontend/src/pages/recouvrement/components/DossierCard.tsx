import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal, Eye, Edit, Trash2,
    FileText
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency } from '@/lib/utils';
import { DossierRecouvrement } from '@/hooks/useRecouvrement';
import { useNavigate } from 'react-router-dom';

interface DossierCardProps {
    dossier: DossierRecouvrement;
}

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    EN_COURS: 'default',
    CLOTURE: 'secondary',
    SUSPENDU: 'outline',
    ANNULE: 'destructive',
};

export const DossierCard = ({ dossier }: DossierCardProps) => {
    const navigate = useNavigate();
    const accentColor = dossier.statut === 'EN_COURS' ? "bg-recouvrement" : "bg-slate-300";

    return (
        <Card
            className="group border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white overflow-hidden relative"
            onClick={() => navigate(`/recouvrement/dossiers/${dossier.id}`)}
        >
            <div className={cn("w-1 h-full absolute left-0 top-0", accentColor)} />

            <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-recouvrement bg-recouvrement/10 px-2 py-1 rounded">
                            {dossier.reference}
                        </span>
                        <Badge variant={statusVariants[dossier.statut] || 'default'} className="rounded-full font-normal">
                            {dossier.statut.replace('_', ' ')}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <PartyInfo label="Créancier" name={dossier.creancierNom} />
                        <PartyInfo label="Débiteur" name={dossier.debiteurNom} />
                    </div>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 gap-4 min-w-[180px]">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Solde restant</p>
                        <p className="text-xl font-bold text-warning">{formatCurrency(dossier.soldeRestant)}</p>
                        <p className="text-[10px] text-slate-400">sur {formatCurrency(dossier.totalARecouvrer)}</p>
                    </div>

                    <DossierActions id={dossier.id} />
                </div>
            </CardContent>
        </Card>
    );
};

const PartyInfo = ({ label, name }: { label: string; name: string }) => (
    <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
        <p className="font-semibold text-slate-900">{name}</p>
    </div>
);

const DossierActions = ({ id }: { id: string }) => {
    const navigate = useNavigate();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full h-8 w-8">
                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(`/recouvrement/dossiers/${id}`)}>
                    <Eye className="mr-2 h-4 w-4" /> Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
