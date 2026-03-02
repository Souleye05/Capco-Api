import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Mail, Phone, MapPin, Home, TrendingUp, Users, Calendar,
    Building2, ExternalLink, Edit, Sparkles, ShieldCheck, Receipt, BarChart3, Clock, Plus, X
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProprietaire, useImmeubles } from '@/hooks/useImmobilier';
import { cn } from '@/lib/utils';
import React from 'react';

export default function ProprietaireDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: proprietaire, isLoading: isLoadingProp } = useProprietaire(id!);
    const { data: immeublesResult, isLoading: isLoadingImmeubles } = useImmeubles({
        proprietaireId: id,
        limit: 100
    });

    if (isLoadingProp) return <LoadingState />;
    if (!proprietaire) return <NotFoundState onBack={() => navigate('/immobilier/proprietaires')} />;

    const immeubles = immeublesResult?.data || [];

    return (
        <div className="min-h-screen pb-20 bg-background/50 backdrop-blur-3xl">
            <Header
                title={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-primary/10 h-8 w-8 -ml-1"
                            onClick={() => navigate('/immobilier/proprietaires')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-black text-xl">Fiche Propriétaire</span>
                    </div>
                }
                subtitle={null}
                actions={
                    <Button variant="outline" className="gap-2 rounded-xl h-10 px-4 bg-background/40 backdrop-blur-md hover:bg-background/80 transition-all font-bold text-sm">
                        <Edit className="h-4 w-4" />
                        <span>Modifier</span>
                    </Button>
                }
            />

            <div className="px-4 lg:px-8 space-y-4 animate-in fade-in duration-700 mt-2">
                {/* Hero Profile Section - More Compact */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <Card className="lg:col-span-8 border-border/20 bg-background/40 backdrop-blur-sm shadow-xl rounded-[1.5rem] overflow-hidden group">
                        <CardContent className="p-6 md:p-8 relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                <ShieldCheck className="h-16 w-16 text-primary" />
                            </div>

                            <div className="h-24 w-24 rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/40 p-0.5 shadow-lg flex-shrink-0">
                                <div className="h-full w-full rounded-[1.4rem] bg-background flex items-center justify-center text-primary font-bold text-3xl">
                                    {proprietaire.nom.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-primary">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Partenaire</span>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">{proprietaire.nom}</h1>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <Badge variant="secondary" className="rounded-lg bg-primary/5 text-primary border-primary/10 px-2 py-0.5 font-mono text-[10px]">
                                            ID: {proprietaire.id.split('-')[0].toUpperCase()}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-lg border-success/20 bg-success/5 text-success px-2 py-0.5 text-[10px]">
                                            Certifié
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-6 text-sm">
                                    {proprietaire.email && (
                                        <div className="flex items-center gap-3 text-muted-foreground group/item">
                                            <Mail className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{proprietaire.email}</span>
                                        </div>
                                    )}
                                    {proprietaire.telephone && (
                                        <div className="flex items-center gap-3 text-muted-foreground group/item">
                                            <Phone className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{proprietaire.telephone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-4 border-border/30 bg-primary/5 shadow-xl rounded-[2.5rem] flex flex-col justify-center p-8 text-center space-y-6">
                        <div className="space-y-1">
                            <div className="text-sm font-bold text-primary uppercase tracking-widest opacity-60">Revenue Portfolio</div>
                            <div className="text-5xl font-black tracking-tighter">-- FCFA</div>
                            <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                                <TrendingUp className="h-3 w-3 text-success" />
                                +12% ce trimestre
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="text-center p-4 rounded-2xl bg-background/40">
                                <div className="text-2xl font-bold">{proprietaire.nombreImmeubles}</div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Biens</div>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-background/40">
                                <div className="text-2xl font-bold">--</div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Lots</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="patrimoine" className="space-y-8">
                    <TabsList className="bg-background/40 backdrop-blur-md border border-border/40 p-1.5 rounded-2xl h-auto flex-wrap sm:flex-nowrap gap-2 inline-flex">
                        <TabsTrigger value="patrimoine" className="rounded-xl px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>Patrimoine</span>
                        </TabsTrigger>
                        <TabsTrigger value="finances" className="rounded-xl px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2">
                            <BarChart3 className="h-4 w-4" />
                            <span>Finances</span>
                        </TabsTrigger>
                        <TabsTrigger value="activite" className="rounded-xl px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Activité</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="patrimoine" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoadingImmeubles ? (
                                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-[2rem]" />)
                            ) : immeubles.length === 0 ? (
                                <Card className="col-span-full border-dashed border-2 py-20 bg-transparent rounded-[2.5rem] flex flex-col items-center justify-center text-muted-foreground">
                                    <Home className="h-12 w-12 mb-4 opacity-20" />
                                    <p className="text-lg font-medium">Aucun immeuble enregistré</p>
                                    <Button variant="link" className="text-primary mt-2">Ajouter un premier bien</Button>
                                </Card>
                            ) : (
                                immeubles.map((imm, idx) => (
                                    <ImmeubleCard key={imm.id} imm={imm} idx={idx} onClick={() => navigate(`/immobilier/immeubles/${imm.id}`)} />
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="finances" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FinancialSummaryCard
                                title="Versements Mensuels"
                                value="Calcul en cours..."
                                icon={<Receipt className="text-primary" />}
                            />
                            <FinancialSummaryCard
                                title="Commissions Capco"
                                value="Calcul en cours..."
                                icon={<BarChart3 className="text-accent" />}
                            />
                        </div>
                        <Card className="border-border/30 bg-background/40 rounded-[2.5rem] p-12 text-center text-muted-foreground italic">
                            Les graphiques de performance financière seront disponibles prochainement.
                        </Card>
                    </TabsContent>

                    <TabsContent value="activite" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <Card className="border-border/30 bg-background/40 rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 border-b border-border/20 flex items-center justify-between">
                                <h3 className="text-xl font-bold">Journal d'activité</h3>
                                <Badge variant="secondary" className="rounded-lg">Temps Réel</Badge>
                            </div>
                            <div className="p-8 space-y-8">
                                <ActivityItem
                                    icon={<Plus className="h-4 w-4" />}
                                    title="Compte créé"
                                    date={new Date(proprietaire.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    description="Ouverture du dossier partenaire chez Capco Immobilier."
                                />
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function ImmeubleCard({ imm, idx, onClick }: { imm: any, idx: number, onClick: () => void }) {
    return (
        <div
            className="group relative cursor-pointer"
            style={{ animationDelay: `${idx * 100}ms` }}
            onClick={onClick}
        >
            <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <Card className="relative border-border/30 bg-background/60 backdrop-blur-md hover:bg-background/95 transition-all duration-500 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1">
                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <Home className="h-7 w-7" />
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>

                    <div>
                        <h4 className="text-xl font-black truncate mb-1">{imm.nom}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span>{imm.adresse}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/10 flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="rounded-lg px-2 py-0.5">{imm.nombreLots || 0} Lots</Badge>
                        </div>
                        <span className="text-muted-foreground opacity-50 uppercase tracking-widest">{imm.reference}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function FinancialSummaryCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
    return (
        <Card className="border-border/30 bg-background/40 backdrop-blur-sm rounded-[2rem] p-8 group hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-background shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
                <h4 className="font-bold text-muted-foreground uppercase tracking-widest text-xs">{title}</h4>
            </div>
            <div className="text-3xl font-black">{value}</div>
        </Card>
    );
}

function ActivityItem({ icon, title, date, description }: { icon: React.ReactNode, title: string, date: string, description: string }) {
    return (
        <div className="flex gap-4 relative">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary relative z-10 shrink-0">
                {icon}
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h4 className="font-bold">{title}</h4>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{date}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-3xl">
            <div className="flex flex-col items-center gap-6">
                <div className="relative h-24 w-24">
                    <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-2xl font-black tracking-tighter">Capco Intelligence</p>
                    <p className="text-sm text-muted-foreground animate-pulse">Symphonie des données en cours...</p>
                </div>
            </div>
        </div>
    );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in duration-500">
                <div className="h-40 w-40 bg-destructive/5 rounded-full mx-auto flex items-center justify-center relative">
                    <Users className="h-20 w-20 text-destructive/40" />
                    <div className="absolute bottom-0 right-0 h-10 w-10 bg-background border-4 border-border rounded-full flex items-center justify-center">
                        <X className="h-5 w-5 text-destructive" />
                    </div>
                </div>
                <div className="space-y-3">
                    <h2 className="text-4xl font-black tracking-tighter">Profil Introuvable</h2>
                    <p className="text-muted-foreground">Les données stratégiques de ce partenaire sont inaccessibles ou le dossier a été définitivement archivé.</p>
                </div>
                <Button onClick={onBack} size="lg" className="w-full rounded-2xl h-14 bg-foreground text-background hover:bg-foreground/90 transition-all font-bold shadow-2xl">
                    Retour au catalogue
                </Button>
            </div>
        </div>
    );
}
