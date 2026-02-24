import React, { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useDossiersRecouvrement, useRecouvrementDashboard } from '@/hooks/useRecouvrement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus, Search, Filter,
    TrendingUp, Wallet, Clock, CheckCircle2,
    Phone, Mail, MapPin, MoreHorizontal
} from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const RecouvrementPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const { data: dossiers, isLoading } = useDossiersRecouvrement({ search });
    const { data: stats, isLoading: isLoadingStats } = useRecouvrementDashboard();

    const getStatusVariant = (statut: string) => {
        switch (statut) {
            case 'EN_COURS': return 'default';
            case 'CLOTURE': return 'secondary';
            case 'SUSPENDU': return 'outline';
            case 'ANNULE': return 'destructive';
            default: return 'default';
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <PageHeader
                    title="Recouvrement de Créances"
                    description="Gestion des dossiers de recouvrement amiable et judiciaire"
                    action={
                        <Button onClick={() => { }} className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" /> Nouveau Dossier
                        </Button>
                    }
                />

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total à Recouvrer"
                        value={formatCurrency(stats?.synthese?.totalARecouvrer || 0)}
                        icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
                        loading={isLoadingStats}
                    />
                    <StatCard
                        title="Total Recouvré"
                        value={formatCurrency(stats?.synthese?.totalRecouvre || 0)}
                        icon={<Wallet className="h-4 w-4 text-emerald-500" />}
                        loading={isLoadingStats}
                        subtext={`${stats?.synthese?.tauxRecouvrement || 0}% du total`}
                    />
                    <StatCard
                        title="Dossiers En Cours"
                        value={stats?.dossiers?.enCours || 0}
                        icon={<Clock className="h-4 w-4 text-amber-500" />}
                        loading={isLoadingStats}
                    />
                    <StatCard
                        title="Dossiers Clôturés"
                        value={stats?.dossiers?.clotures || 0}
                        icon={<CheckCircle2 className="h-4 w-4 text-blue-500" />}
                        loading={isLoadingStats}
                    />
                </div>

                {/* Filters and List */}
                <Card className="border-none bg-white/50 backdrop-blur-sm shadow-xl shadow-indigo-100/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold text-slate-800">
                            Dossiers ({dossiers?.pagination?.total || 0})
                        </CardTitle>
                        <div className="flex gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher un dossier..."
                                    className="pl-9 bg-white/70 border-slate-200"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-100 italic text-muted-foreground">
                                    <TableHead>Référence</TableHead>
                                    <TableHead>Créancier / Débiteur</TableHead>
                                    <TableHead>Montant Total</TableHead>
                                    <TableHead>Recouvré</TableHead>
                                    <TableHead>Solde</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    dossiers?.data.map((dossier) => (
                                        <TableRow
                                            key={dossier.id}
                                            className="cursor-pointer hover:bg-slate-50 border-slate-50 transition-colors"
                                            onClick={() => navigate(`/recouvrement/${dossier.id}`)}
                                        >
                                            <TableCell className="font-medium text-slate-700">{dossier.reference}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{dossier.debiteurNom}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Plus className="h-2 w-2" /> Pour: {dossier.creancierNom}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{formatCurrency(dossier.totalARecouvrer)}</TableCell>
                                            <TableCell className="text-emerald-600 font-medium">
                                                {formatCurrency(dossier.totalPaiements)}
                                            </TableCell>
                                            <TableCell className="text-amber-600 font-bold">
                                                {formatCurrency(dossier.soldeRestant)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(dossier.statut)} className="rounded-full px-3">
                                                    {dossier.statut.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="hover:bg-indigo-50">
                                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

const StatCard = ({ title, value, icon, subtext, loading }: any) => (
    <Card className="border-none shadow-sm bg-white/80 transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {loading ? (
                <Skeleton className="h-7 w-24" />
            ) : (
                <>
                    <div className="text-2xl font-bold text-slate-900">{value}</div>
                    {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                </>
            )}
        </CardContent>
    </Card>
);

export default RecouvrementPage;
