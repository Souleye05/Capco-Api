import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Banknote } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePaiementsRecouvrementGlobal } from '@/hooks/useRecouvrement';
import { Skeleton } from '@/components/ui/skeleton';
import { PaiementRow } from '@/pages/recouvrement/components/PaiementRow';

const LIMIT = 15;

export default function PaiementsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data: response, isLoading } = usePaiementsRecouvrementGlobal({ search, page, limit: LIMIT });

  const totalPages = response?.total ? Math.ceil(response.total / LIMIT) : 1;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header
        title="Historique des Paiements"
        subtitle="Suivi global de tous les encaissements du module recouvrement"
        actions={<Button variant="outline" className="gap-2 shadow-sm bg-white"><Download className="h-4 w-4" /> Exporter</Button>}
      />

      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-0 pt-6 px-6 flex flex-row items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Chercher reference, débiteur, créancier..."
                className="pl-10 bg-slate-50 border-none h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="border-slate-100 h-10 w-10"><Filter className="h-4 w-4 text-slate-500" /></Button>
          </CardHeader>

          <CardContent className="p-0 mt-6">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400 pl-6">Date</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400">Dossier / Réf</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400">Débiteur / Créancier</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400">Mode</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400">Montant</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase text-slate-400 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6} className="py-4"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : !response?.data?.length ? (
                  <TableRow><TableCell colSpan={6} className="h-64 text-center"><Banknote className="h-12 w-12 opacity-5 mx-auto mb-2" /><p className="text-slate-400">Aucun paiement enregistré</p></TableCell></TableRow>
                ) : (
                  response.data.map(p => <PaiementRow key={p.id} paiement={p} />)
                )}
              </TableBody>
            </Table>
          </CardContent>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
              <span className="text-xs text-slate-400 font-medium">Page {page} sur {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 border-slate-200" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
                <Button variant="outline" size="sm" className="h-8 border-slate-200" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}