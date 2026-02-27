import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, Trash2, FileText, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DocumentLocataire {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface DocumentsManagerProps {
  locataireId: string;
  pieceIdentiteUrl?: string | null;
  contratUrl?: string | null;
  documents?: DocumentLocataire[];
  onDocumentUpdate?: () => void;
}

export function DocumentsManager({
  locataireId,
  pieceIdentiteUrl,
  contratUrl,
  documents = [],
  onDocumentUpdate
}: DocumentsManagerProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File, type: 'piece_identite' | 'contrat' | 'document') => {
    setUploading(true);
    try {
      // TODO: Implement file upload to your backend
      // This is a placeholder implementation
      console.log('Uploading file:', file.name, 'for locataire:', locataireId, 'type:', type);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Document téléchargé avec succès');
      onDocumentUpdate?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      // TODO: Implement file download from your backend
      console.log('Downloading:', filePath, fileName);
      toast.success('Téléchargement démarré');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDeleteDocument = async (filePath: string, type: 'piece_identite' | 'contrat' | 'document', docIndex?: number) => {
    try {
      // TODO: Implement file deletion
      console.log('Deleting:', filePath, type, docIndex);
      toast.success('Document supprimé');
      onDocumentUpdate?.();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Pièce d'identité */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Pièce d'identité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {pieceIdentiteUrl ? (
                <p className="text-sm text-muted-foreground">Document disponible</p>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun document</p>
              )}
            </div>
            <div className="flex gap-2">
              {pieceIdentiteUrl ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(pieceIdentiteUrl, 'piece_identite.pdf')}
                    className="rounded-xl"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDocument(pieceIdentiteUrl, 'piece_identite')}
                    className="rounded-xl"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              ) : (
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'piece_identite');
                    }}
                    disabled={uploading}
                  />
                  <Button variant="outline" size="sm" asChild disabled={uploading} className="rounded-xl">
                    <span>
                      {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                      Ajouter
                    </span>
                  </Button>
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contrat de bail */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Contrat de bail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {contratUrl ? (
                <p className="text-sm text-muted-foreground">Document disponible</p>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun document</p>
              )}
            </div>
            <div className="flex gap-2">
              {contratUrl ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(contratUrl, 'contrat.pdf')}
                    className="rounded-xl"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDocument(contratUrl, 'contrat')}
                    className="rounded-xl"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              ) : (
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'contrat');
                    }}
                    disabled={uploading}
                  />
                  <Button variant="outline" size="sm" asChild disabled={uploading} className="rounded-xl">
                    <span>
                      {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                      Ajouter
                    </span>
                  </Button>
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Autres documents */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Autres documents</CardTitle>
            <label>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'document');
                }}
                disabled={uploading}
              />
              <Button variant="outline" size="sm" asChild disabled={uploading} className="rounded-xl">
                <span>
                  {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Ajouter
                </span>
              </Button>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-xl border border-border/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Ajouté le {format(new Date(doc.uploadedAt), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc.url, doc.name)}
                      className="rounded-xl"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.url, 'document', index)}
                      className="rounded-xl"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun autre document</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}