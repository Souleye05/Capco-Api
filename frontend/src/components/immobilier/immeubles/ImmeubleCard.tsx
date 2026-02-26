import { useNavigate } from 'react-router-dom';
import {
    Building2, MapPin, MoreHorizontal, Eye, Edit, FileText, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';

interface ImmeubleCardProps {
    immeuble: any;
    lots: any[];
    encaissements: any[];
    currentMonth: string;
    onEdit: (immeuble: any) => void;
    onRapport: (nom: string) => void;
}

export function ImmeubleCard({
    immeuble,
    lots,
    encaissements,
    currentMonth,
    onEdit,
    onRapport
}: ImmeubleCardProps) {
    const navigate = useNavigate();

    const immeubleLots = lots.filter(l => l.immeubleId === immeuble.id);
    const lotsOccupes = immeubleLots.filter(l => l.statut === 'OCCUPE').length;
    const loyerTotal = immeubleLots.reduce((sum, l) => sum + Number(l.loyerMensuelAttendu), 0);

    const immeubleEncaissements = encaissements.filter(e =>
        immeubleLots.some(l => l.id === e.lotId) && e.moisConcerne === currentMonth
    );

    const loyerEncaisse = immeubleEncaissements.reduce((sum, e) => sum + Number(e.montantEncaisse), 0);
    const commissions = immeubleEncaissements.reduce((sum, e) => sum + Number(e.commissionCapco), 0);
    const progress = loyerTotal > 0 ? (loyerEncaisse / loyerTotal) * 100 : 0;

    return (
        <div
            className="bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate(`/immobilier/immeubles/${immeuble.id}`)}
        >
            <div className="bg-gradient-to-r from-immobilier/10 to-immobilier/5 p-6 border-b">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-immobilier/20 group-hover:scale-110 transition-transform">
                            <Building2 className="h-7 w-7 text-immobilier" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{immeuble.nom}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {immeuble.adresse}
                            </p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/immobilier/immeubles/${immeuble.id}`); }}>
                                <Eye className="h-4 w-4" /> Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); onEdit(immeuble); }}>
                                <Edit className="h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); onRapport(immeuble.nom); }}>
                                <FileText className="h-4 w-4" /> Générer rapport
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-4 flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Propriétaire</span>
                    <span className="font-semibold text-sm">{immeuble.proprietaireNom || '-'}</span>
                </div>
            </div>

            <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Home className="h-4 w-4" />
                        <span className="text-sm font-medium">Occupation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold">{immeubleLots.length} lots</Badge>
                        <Badge className="bg-success/10 text-success border-none font-bold">{lotsOccupes} occupés</Badge>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-medium">Collecte loyers</span>
                        <span className="text-sm font-bold">
                            {formatCurrency(loyerEncaisse)} / {formatCurrency(loyerTotal)}
                        </span>
                    </div>
                    <Progress value={progress} className="h-2 rounded-full" />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dashed">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Commission CAPCO ({immeuble.tauxCommissionCapco}%)</p>
                        <p className="text-xl font-black text-immobilier">{formatCurrency(commissions)}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 hover:bg-immobilier/5 hover:text-immobilier font-bold rounded-lg"
                        onClick={(e) => { e.stopPropagation(); onRapport(immeuble.nom); }}
                    >
                        <FileText className="h-4 w-4" />
                        Rapport
                    </Button>
                </div>
            </div>
        </div>
    );
}
