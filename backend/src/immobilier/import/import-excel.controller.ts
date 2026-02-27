import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImportExcelService } from './import-excel.service';
import { ImportResultDto, ValidationResultDto, EntityType, ImportProgressDto } from './dto';
import { FileValidationUtil } from './utils/file-validation.util';

@ApiTags('Import Excel')
@Controller('immobilier/import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportExcelController {
  constructor(private readonly importService: ImportExcelService) {}

  @Post('proprietaires')
  @UseInterceptors(FileInterceptor('file', FileValidationUtil.createMulterOptions()))
  @ApiOperation({ 
    summary: 'Importer des propriétaires depuis Excel',
    description: 'Importe une liste de propriétaires depuis un fichier Excel'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Import terminé',
    type: ImportResultDto 
  })
  @Roles('admin', 'collaborateur')
  async importProprietaires(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ): Promise<ImportResultDto> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return await this.importService.importProprietaires(file, userId);
  }

  @Post('immeubles')
  @UseInterceptors(FileInterceptor('file', FileValidationUtil.createMulterOptions()))
  @ApiOperation({ 
    summary: 'Importer des immeubles depuis Excel',
    description: 'Importe une liste d\'immeubles depuis un fichier Excel'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Import terminé',
    type: ImportResultDto 
  })
  @Roles('admin', 'collaborateur')
  async importImmeubles(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ): Promise<ImportResultDto> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return await this.importService.importImmeubles(file, userId);
  }

  @Post('locataires')
  @UseInterceptors(FileInterceptor('file', FileValidationUtil.createMulterOptions()))
  @ApiOperation({ 
    summary: 'Importer des locataires depuis Excel',
    description: 'Importe une liste de locataires depuis un fichier Excel'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Import terminé',
    type: ImportResultDto 
  })
  @Roles('admin', 'collaborateur')
  async importLocataires(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ): Promise<ImportResultDto> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return await this.importService.importLocataires(file, userId);
  }

  @Post('lots')
  @UseInterceptors(FileInterceptor('file', FileValidationUtil.createMulterOptions()))
  @ApiOperation({ 
    summary: 'Importer des lots depuis Excel',
    description: 'Importe une liste de lots depuis un fichier Excel'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Import terminé',
    type: ImportResultDto 
  })
  @Roles('admin', 'collaborateur')
  async importLots(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ): Promise<ImportResultDto> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return await this.importService.importLots(file, userId);
  }

  @Post('validate/:entityType')
  @UseInterceptors(FileInterceptor('file', FileValidationUtil.createMulterOptions()))
  @ApiOperation({ 
    summary: 'Valider un fichier Excel avant import',
    description: 'Valide la structure et le contenu d\'un fichier Excel sans effectuer l\'import'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Validation terminée',
    type: ValidationResultDto 
  })
  @Roles('admin', 'collaborateur')
  async validateImport(
    @Param('entityType') entityType: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<ValidationResultDto> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier que le type d'entité est valide
    if (!Object.values(EntityType).includes(entityType as EntityType)) {
      throw new BadRequestException(
        `Type d'entité invalide. Types supportés: ${Object.values(EntityType).join(', ')}`
      );
    }

    // Parser le fichier Excel
    const data = await this.importService.parseExcelFile(file);
    
    // Valider les données
    return await this.importService.validateImportData(data, entityType as EntityType);
  }

  
  @Post('all')
  @UseInterceptors(FileInterceptor('file', FileValidationUtil.createMulterOptions()))
  @ApiOperation({ summary: 'Importer tout via le backend' })
  @ApiConsumes('multipart/form-data')
  @Roles('admin', 'collaborateur')
  async importAll(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ): Promise<ImportResultDto> {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return await this.importService.importAll(file, userId);
  }
  
  @Get('progress/:importId')

  @ApiOperation({ 
    summary: 'Obtenir la progression d\'un import',
    description: 'Récupère le statut et la progression d\'un import en cours'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Progression de l\'import',
    type: ImportProgressDto 
  })
  @Roles('admin', 'collaborateur')
  async getImportProgress(@Param('importId') importId: string): Promise<ImportProgressDto> {
    const progress = this.importService.getImportProgress(importId);
    if (!progress) {
      throw new BadRequestException('Import non trouvé ou terminé');
    }
    return progress;
  }

  @Get('reports')
  @ApiOperation({ 
    summary: 'Obtenir les rapports d\'import récents',
    description: 'Récupère la liste des imports récents avec leurs statistiques détaillées'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des rapports d\'import'
  })
  @Roles('admin', 'collaborateur')
  async getImportReports(): Promise<any[]> {
    // Retourner une liste vide pour l'instant
    // Dans une implémentation complète, ceci devrait être stocké en base
    return [];
  }

  @Get('templates/multi-sheet')
  @ApiOperation({ 
    summary: 'Télécharger un template Excel multi-feuilles',
    description: 'Génère et télécharge un template Excel complet avec toutes les entités (Propriétaires, Immeubles, Locataires, Lots)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template Excel multi-feuilles généré',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' }
      }
    }
  })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Roles('admin', 'collaborateur')
  async downloadMultiSheetTemplate(): Promise<StreamableFile> {
    const buffer = await this.importService.generateMultiSheetTemplate();
    
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="template_import_immobilier.xlsx"'
    });
  }

  @Get('templates/:entityType')
  @ApiOperation({ 
    summary: 'Télécharger un template Excel',
    description: 'Génère et télécharge un template Excel avec les colonnes et exemples pour le type d\'entité spécifié'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template Excel généré',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' }
      }
    }
  })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Roles('admin', 'collaborateur')
  async downloadTemplate(@Param('entityType') entityType: string): Promise<StreamableFile> {
    // Vérifier que le type d'entité est valide
    if (!Object.values(EntityType).includes(entityType as EntityType)) {
      throw new BadRequestException(
        `Type d'entité invalide. Types supportés: ${Object.values(EntityType).join(', ')}`
      );
    }

    const buffer = await this.importService.generateTemplate(entityType as EntityType);
    
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="template-${entityType}.xlsx"`
    });
  }
}