import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { nestjsApi } from '@/integrations/nestjs/client';
import { cn } from '@/lib/utils';

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

export function ImportExcelDialog({ open, onOpenChange }: ImportExcelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setStatus('loading');
    setMessage('Import en cours...');
    
    const result = await nestjsApi.importExcelData(file);
    
    setStatus(result.success ? 'success' : 'error');
    setMessage(result.message);
    
    if (result.success) {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['proprietaires'] });
      queryClient.invalidateQueries({ queryKey: ['locataires'] });
      queryClient.invalidateQueries({ queryKey: ['immeubles'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    }
  };

  const handleClose = () => {
    setFile(null);
    setStatus('idle');
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-immobilier" />
            Importer depuis Excel
          </DialogTitle>
          <DialogDescription>
            Importez vos données immobilières depuis un fichier Excel. Le fichier doit contenir les onglets: Propriétaires, Locataires, Immeubles, Lots.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
              isDragging ? "border-immobilier bg-immobilier/5" : "border-muted-foreground/25 hover:border-immobilier/50",
              file && "border-immobilier bg-immobilier/5"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-10 w-10 text-immobilier" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} Ko
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">Glissez votre fichier ici</p>
                <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
              </div>
            )}
          </div>

          {/* Status message */}
          {message && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg text-sm",
              status === 'loading' && "bg-muted",
              status === 'success' && "bg-success/10 text-success",
              status === 'error' && "bg-destructive/10 text-destructive"
            )}>
              {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-4 w-4" />}
              {status === 'error' && <AlertCircle className="h-4 w-4" />}
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              {status === 'success' ? 'Fermer' : 'Annuler'}
            </Button>
            {status !== 'success' && (
              <Button 
                onClick={handleImport} 
                disabled={!file || status === 'loading'}
                className="bg-immobilier hover:bg-immobilier/90"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import...
                  </>
                ) : (
                  'Importer'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
