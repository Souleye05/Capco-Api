import { useState } from 'react';
import { TemplateService } from '@/services/templateService';
import { toast } from 'sonner';

export function useTemplates() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImportTemplate = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      await TemplateService.downloadImportTemplate();
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement du template');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadEntityTemplate = async (entityType: string) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      await TemplateService.downloadEntityTemplate(entityType);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error(`Erreur lors du téléchargement du template ${entityType}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadImportTemplate,
    downloadEntityTemplate,
    isDownloading
  };
}