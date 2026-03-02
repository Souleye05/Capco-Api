import { useParams, useNavigate } from 'react-router-dom';
import { useLocataireComplete, useBauxByLocataire } from '@/hooks/useLocataires';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft, Edit, Printer, Loader2, User, Phone, Mail, MapPin,
    Briefcase, Shield, Heart, Calendar, Home, FileText, CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaiementsHistoryTab } from '@/components/immobilier/locataires/PaiementsHistoryTab';
import { DocumentsManager } from '@/components/immobilier/locataires/DocumentsManager';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { EditLocataireDialog } from '@/components/immobilier/LocataireDialogs';

const TYPE_PIECE_OPTIONS = [
    { value: 'CNI', label: "Carte d'Identité Nationale" },
    { value: 'PASSPORT', label: 'Passeport' },
    { value: 'PERMIS', label: 'Permis de conduire' },
    { value: 'CARTE_CONSULAIRE', label: 'Carte Consulaire' },
    { value: 'AUTRE', label: 'Autre' },
];

const SITUATION_FAMILIALE_OPTIONS = [
    { value: 'CELIBATAIRE', label: 'Célibataire' },
    { value: 'MARIE', label: 'Marié(e)' },
    { value: 'DIVORCE', label: 'Divorcé(e)' },
    { value: 'VEUF', label: 'Veuf/Veuve' },
];

export default function LocataireDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const { data: locataire, isLoading: isLoadingLocataire } = useLocataireComplete(id || '');
    const { data: bauxData, isLoading: isLoadingBaux } = useBauxByLocataire(id || '');

    if (isLoadingLocataire) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background/50">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!locataire) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background/50">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-black">Locataire non trouvé</h2>
                    <Button onClick={() => navigate('/immobilier/locataires')}>Retour à la liste</Button>
                </div>
            </div>
        );
    }

    // Calculate Entry Date
    const dateEntree = bauxData && bauxData.length > 0
        ? [...bauxData].sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())[0].dateDebut
        : null;

    const handlePrintInfo = () => {
        // print logic
        console.log('Printing...', locataire);
    };

    const badgeStatus = locataire.nombreBauxActifs > 0 ? "Actif" : "Inactif";
    const badgeColor = locataire.nombreBauxActifs > 0 ? "bg-success/10 text-success hover:bg-success/20" : "bg-muted text-muted-foreground";

    return (
        <div className="w-full min-h-screen pb-20 bg-background/50 backdrop-blur-3xl animate-in fade-in duration-500">
            {/* Hero Header */}
            <Header
                title={
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/immobilier/locataires')} className="h-10 w-10 rounded-xl bg-background shadow-sm border border-border/40 hover:scale-105 transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                                <User className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-2xl tracking-tight leading-none">{locataire.nom}</span>
                                    <Badge variant="outline" className={`ml-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-transparent ${badgeColor}`}>
                                        {badgeStatus}
                                    </Badge>
                                </div>
                                {dateEntree && (
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                        Locataire depuis le {format(new Date(dateEntree), 'dd MMM yyyy', { locale: fr })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                }
                subtitle={undefined}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handlePrintInfo} className="h-11 rounded-xl bg-background/50 backdrop-blur-md border-border/40 font-black text-xs uppercase tracking-widest shadow-sm hover:bg-accent/5 hover:text-accent transition-all">
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimer
                        </Button>
                        <Button onClick={() => setEditDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 rounded-xl shadow-md shadow-accent/10 font-black text-xs uppercase tracking-widest gap-2 pl-4 pr-5 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Edit className="h-4 w-4" />
                            Modifier
                        </Button>
                    </div>
                }
            />

            <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto mt-6 space-y-6">

                {/* Bento Grid Top Section */}
                <div className="flex flex-col lg:flex-row w-full gap-6">

                    {/* Main Info Card - 2/3 width */}
                    <Card className="w-full lg:w-2/3 rounded-[2rem] border-border/40 bg-background/40 backdrop-blur-xl shadow-sm overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <Shield className="h-5 w-5 text-accent" />
                                <h3 className="text-sm font-black tracking-tight uppercase">Informations Personnelles</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-muted-foreground/70">
                                        <Phone className="h-3.5 w-3.5" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Téléphone</p>
                                    </div>
                                    <p className="font-bold text-sm pl-5">{locataire.telephone || '-'}</p>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-muted-foreground/70">
                                        <Mail className="h-3.5 w-3.5" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Email</p>
                                    </div>
                                    <p className="font-bold text-sm pl-5 truncate max-w-[200px]" title={locataire.email || ''}>{locataire.email || '-'}</p>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-muted-foreground/70">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Adresse actuelle</p>
                                    </div>
                                    <p className="font-bold text-sm pl-5 line-clamp-2">{locataire.adresse || '-'}</p>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-muted-foreground/70">
                                        <Briefcase className="h-3.5 w-3.5" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Profession</p>
                                    </div>
                                    <p className="font-bold text-sm pl-5">{locataire.profession || '-'}</p>
                                    {locataire.lieuTravail && <p className="text-xs text-muted-foreground pl-5 mt-0.5">@ {locataire.lieuTravail}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-muted-foreground/70">
                                        <Shield className="h-3.5 w-3.5" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Pièce d'Identité</p>
                                    </div>
                                    <p className="font-bold text-sm pl-5">
                                        {TYPE_PIECE_OPTIONS.find(o => o.value === locataire.typePieceIdentite)?.label || '-'}
                                    </p>
                                    {locataire.numeroPieceIdentite && <p className="text-xs text-muted-foreground pl-5 mt-0.5 font-mono">{locataire.numeroPieceIdentite}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-muted-foreground/70">
                                        <Heart className="h-3.5 w-3.5" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Situation Familiale</p>
                                    </div>
                                    <p className="font-bold text-sm pl-5">
                                        {SITUATION_FAMILIALE_OPTIONS.find(o => o.value === locataire.situationFamiliale)?.label || '-'}
                                    </p>
                                </div>
                            </div>

                            {locataire.notes && (
                                <div className="mt-8 p-4 rounded-2xl bg-accent/5 border border-accent/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-accent/70 mb-2">Notes & Observations</p>
                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{locataire.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Situation Actuelle (Lots) - 1/3 width */}
                    <Card className="w-full lg:w-1/3 rounded-[2rem] border-border/40 bg-zinc-900/5 dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
                        <CardContent className="p-8 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <Home className="h-5 w-5 text-accent" />
                                <h3 className="text-sm font-black tracking-tight uppercase">Situation Actuelle</h3>
                            </div>

                            <div className="flex-1 space-y-4">
                                {locataire.lots && locataire.lots.length > 0 ? (
                                    <div className="space-y-3">
                                        {locataire.lots.map((lot: any) => (
                                            <div key={lot.id} className="p-4 bg-background rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-2 h-full bg-accent/20 group-hover:bg-accent transition-colors"></div>
                                                <div className="pr-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">{lot.immeuble?.nom}</p>
                                                    <p className="font-black text-lg">Lot {lot.numero}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <Badge variant="secondary" className="rounded-md font-bold text-[10px] uppercase tracking-wider">{lot.type}</Badge>
                                                        <span className="text-xs font-bold text-muted-foreground">Étage {lot.etage || 'RDC'}</span>
                                                    </div>

                                                    <Separator className="my-3 opacity-50" />

                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Loyer mensuel</p>
                                                            <p className="font-black text-accent">{formatCurrency(lot.loyerMensuelAttendu)}</p>
                                                        </div>
                                                        <Badge variant={lot.statut === 'OCCUPE' ? 'default' : 'outline'} className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                            {lot.statut}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-background rounded-2xl border border-border/50 border-dashed">
                                        <Home className="h-8 w-8 text-muted-foreground/30 mb-3" />
                                        <p className="text-sm font-bold">Aucun lot assigné</p>
                                        <p className="text-xs text-muted-foreground mt-1">Ce locataire n'occupe actuellement aucun logement.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Lower Section Tabs: Paiements & Documents */}
                <div className="mt-8">
                    <Tabs defaultValue="paiements" className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <TabsList className="bg-background/40 backdrop-blur-md border border-border/40 p-1.5 rounded-2xl h-auto">
                                <TabsTrigger value="paiements" className="rounded-xl font-black text-xs uppercase tracking-widest py-2.5 px-6 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md transition-all">
                                    <CreditCard className="h-4 w-4 mr-2" /> Historique des Paiements
                                </TabsTrigger>
                                <TabsTrigger value="documents" className="rounded-xl font-black text-xs uppercase tracking-widest py-2.5 px-6 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md transition-all">
                                    <FileText className="h-4 w-4 mr-2" /> Documents & Contrats
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="paiements" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PaiementsHistoryTab locataireId={locataire.id} />
                        </TabsContent>

                        <TabsContent value="documents" className="m-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="rounded-[2rem] border-border/40 bg-background/40 backdrop-blur-xl shadow-sm overflow-hidden min-h-[500px]">
                                <CardContent className="p-8">
                                    <DocumentsManager
                                        locataireId={locataire.id}
                                        pieceIdentiteUrl={locataire.pieceIdentiteUrl}
                                        contratUrl={locataire.contratUrl}
                                        documents={locataire.documents || []}
                                        onDocumentUpdate={() => {
                                            console.log('Document updated');
                                            // In a real scenario, invalidate react-query for this locataire
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

            </div>

            {editDialogOpen && (
                <EditLocataireDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    locataire={locataire}
                />
            )}
        </div>
    );
}
