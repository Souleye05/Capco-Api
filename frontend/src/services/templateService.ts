import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

export class TemplateService {
  /**
   * Télécharge le template d'import depuis l'API backend
   */
  static async downloadImportTemplate(): Promise<void> {
    try {
      const result = await nestjsApi.downloadImportTemplate();
      
      if (!result.success || !result.blob) {
        toast.error(result.message || 'Erreur lors du téléchargement du template');
        return;
      }

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template_import_immobilier.xlsx';
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du template:', error);
      toast.error('Erreur lors du téléchargement du template');
    }
  }

  /**
   * Télécharge un template spécifique pour un type d'entité
   */
  static async downloadEntityTemplate(entityType: string): Promise<void> {
    try {
      const token = nestjsApi.getToken();
      const response = await fetch(`${nestjsApi.baseUrl}/immobilier/import/templates/${entityType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        toast.error('Erreur lors du téléchargement du template');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template_${entityType}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Template ${entityType} téléchargé avec succès`);
    } catch (error) {
      console.error('Erreur lors du téléchargement du template:', error);
      toast.error('Erreur lors du téléchargement du template');
    }
  }
}