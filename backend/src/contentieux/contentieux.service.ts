import { Injectable } from '@nestjs/common';
import { AffairesService } from './affaires/affaires.service';
import { AudiencesService } from './audiences/audiences.service';
import { HonorairesService } from './honoraires/honoraires.service';
import { DepensesService } from './depenses/depenses.service';
import { JuridictionsService } from './juridictions/juridictions.service';
import { dateToUTCDateString } from '../common/utils/date.utils';

/**
 * Service principal du module Contentieux
 * Orchestration des services métier du contentieux
 */
@Injectable()
export class ContentieuxService {
  constructor(
    private readonly affairesService: AffairesService,
    private readonly audiencesService: AudiencesService,
    private readonly honorairesService: HonorairesService,
    private readonly depensesService: DepensesService,
    private readonly juridictionsService: JuridictionsService,
  ) {}

  /**
   * Obtenir le tableau de bord du contentieux
   */
  async getDashboard() {
    const [
      statistiquesAffaires,
      statistiquesAudiences,
      statistiquesHonoraires,
      statistiquesDepenses,
      audiencesRappel,
    ] = await Promise.all([
      this.affairesService.getStatistics(),
      this.audiencesService.getStatistics(),
      this.honorairesService.getStatistics(),
      this.depensesService.getStatistics(),
      this.audiencesService.getAudiencesRappelEnrolement(),
    ]);

    return {
      affaires: statistiquesAffaires,
      audiences: statistiquesAudiences,
      honoraires: statistiquesHonoraires,
      depenses: statistiquesDepenses,
      alertes: {
        audiencesRappelEnrolement: audiencesRappel.length,
        audiencesRappel: audiencesRappel.slice(0, 5), // Les 5 prochaines
      },
    };
  }

  /**
   * Obtenir le résumé financier d'une affaire
   */
  async getResumeFinancierAffaire(affaireId: string) {
    const [honoraires, depenses] = await Promise.all([
      this.honorairesService.findByAffaire(affaireId),
      this.depensesService.findByAffaire(affaireId),
    ]);

    const totalHonoraires = honoraires.reduce((sum, h) => sum + h.montantFacture, 0);
    const totalEncaisse = honoraires.reduce((sum, h) => sum + h.montantEncaisse, 0);
    const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);

    return {
      honoraires: {
        total: totalHonoraires,
        encaisse: totalEncaisse,
        restant: totalHonoraires - totalEncaisse,
        details: honoraires,
      },
      depenses: {
        total: totalDepenses,
        details: depenses,
      },
      resultatNet: totalEncaisse - totalDepenses,
    };
  }

  /**
   * Obtenir le planning des audiences
   */
  async getPlanningAudiences(dateDebut?: Date, dateFin?: Date) {
    const query: any = {};
    
    if (dateDebut || dateFin) {
      if (dateDebut) query.dateDebut = dateToUTCDateString(dateDebut);
      if (dateFin) query.dateFin = dateToUTCDateString(dateFin);
    }

    const audiences = await this.audiencesService.findAll(query);
    
    // Grouper par date
    const planning = audiences.data.reduce((acc, audience) => {
      const dateKey = dateToUTCDateString(new Date(audience.date));
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(audience);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      planning,
      total: audiences.data.length,
      pagination: audiences.pagination,
    };
  }

  /**
   * Recherche globale dans le contentieux
   */
  async rechercheGlobale(terme: string) {
    const [affaires, audiences] = await Promise.all([
      this.affairesService.findAll({ search: terme, limit: 10 }),
      this.audiencesService.findAll({ search: terme, limit: 10 }),
    ]);

    return {
      affaires: affaires.data,
      audiences: audiences.data,
      total: affaires.data.length + audiences.data.length,
    };
  }

  /**
   * Obtenir les indicateurs de performance
   */
  async getIndicateursPerformance() {
    const [
      affairesStats,
      audiencesStats,
      honorairesStats,
      depensesStats,
    ] = await Promise.all([
      this.affairesService.getStatistics(),
      this.audiencesService.getStatistics(),
      this.honorairesService.getStatistics(),
      this.depensesService.getStatistics(),
    ]);

    // Calculs d'indicateurs
    const tauxReussite = affairesStats.total > 0 
      ? (affairesStats.cloturees / affairesStats.total) * 100 
      : 0;

    const tauxAudiencesTenues = audiencesStats.total > 0
      ? (audiencesStats.tenues / audiencesStats.total) * 100
      : 0;

    const tauxEncaissement = honorairesStats.totalFacture > 0
      ? (honorairesStats.totalEncaisse / honorairesStats.totalFacture) * 100
      : 0;

    return {
      affaires: {
        total: affairesStats.total,
        actives: affairesStats.actives,
        tauxReussite: Math.round(tauxReussite * 100) / 100,
      },
      audiences: {
        total: audiencesStats.total,
        tenues: audiencesStats.tenues,
        tauxRealisation: Math.round(tauxAudiencesTenues * 100) / 100,
      },
      finances: {
        chiffreAffaires: honorairesStats.totalFacture,
        encaissements: honorairesStats.totalEncaisse,
        depenses: depensesStats.totalMontant,
        tauxEncaissement: Math.round(tauxEncaissement * 100) / 100,
        benefice: honorairesStats.totalEncaisse - depensesStats.totalMontant,
      },
    };
  }

  /**
   * Exporter les données du contentieux
   */
  async exporterDonnees(options: {
    type: 'affaires' | 'audiences' | 'honoraires' | 'depenses';
    format: 'json' | 'csv';
    dateDebut?: Date;
    dateFin?: Date;
  }) {
    let donnees: any[] = [];

    switch (options.type) {
      case 'affaires':
        const affaires = await this.affairesService.findAll({
          limit: 1000, // Export limité
        });
        donnees = affaires.data;
        break;

      case 'audiences':
        const audiences = await this.audiencesService.findAll({
          dateDebut: options.dateDebut ? dateToUTCDateString(options.dateDebut) : undefined,
          dateFin: options.dateFin ? dateToUTCDateString(options.dateFin) : undefined,
          limit: 1000,
        });
        donnees = audiences.data;
        break;

      case 'honoraires':
        const honoraires = await this.honorairesService.findAll({
          dateDebutFacturation: options.dateDebut ? dateToUTCDateString(options.dateDebut) : undefined,
          dateFinFacturation: options.dateFin ? dateToUTCDateString(options.dateFin) : undefined,
          limit: 1000,
        });
        donnees = honoraires.data;
        break;

      case 'depenses':
        const depenses = await this.depensesService.findAll({
          dateDebut: options.dateDebut ? dateToUTCDateString(options.dateDebut) : undefined,
          dateFin: options.dateFin ? dateToUTCDateString(options.dateFin) : undefined,
          limit: 1000,
        });
        donnees = depenses.data;
        break;
    }

    return {
      type: options.type,
      format: options.format,
      donnees,
      nombreEnregistrements: donnees.length,
      dateExport: new Date(),
    };
  }
}