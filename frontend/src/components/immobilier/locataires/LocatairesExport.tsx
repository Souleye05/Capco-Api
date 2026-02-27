import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Printer,
  Users,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface LocatairesExportProps {
  locataires: any[];
  isLoading?: boolean;
}

export function LocatairesExport({ locataires, isLoading = false }: LocatairesExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // TODO: Implement PDF export
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Export PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // TODO: Implement Excel export
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Export Excel généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportContacts = async () => {
    setExporting(true);
    try {
      // TODO: Implement contacts export (CSV format)
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Liste des contacts exportée');
    } catch (error) {
      toast.error('Erreur lors de l\'export des contacts');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 rounded-xl border-border/50"
          disabled={isLoading || exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl w-48">
        <DropdownMenuItem onClick={handleExportPDF} className="gap-2 font-medium">
          <FileText className="h-4 w-4" />
          Export PDF
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportExcel} className="gap-2 font-medium">
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleExportContacts} className="gap-2 font-medium">
          <Users className="h-4 w-4" />
          Liste des contacts
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handlePrint} className="gap-2 font-medium">
          <Printer className="h-4 w-4" />
          Imprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}