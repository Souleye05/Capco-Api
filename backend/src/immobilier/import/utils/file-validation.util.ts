import { BadRequestException } from '@nestjs/common';

export class FileValidationUtil {
  private static readonly ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  private static readonly ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  static validateExcelFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier la taille du fichier
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Fichier trop volumineux. Taille maximale autorisée: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Vérifier le type MIME
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé. Types acceptés: ${this.ALLOWED_EXTENSIONS.join(', ')}`
      );
    }

    // Vérifier l'extension du fichier
    const fileExtension = this.getFileExtension(file.originalname);
    if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new BadRequestException(
        `Extension de fichier non autorisée. Extensions acceptées: ${this.ALLOWED_EXTENSIONS.join(', ')}`
      );
    }
  }

  private static getFileExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  }

  static createMulterOptions() {
    return {
      limits: {
        fileSize: this.MAX_FILE_SIZE,
      },
      fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
        try {
          this.validateExcelFile(file);
          callback(null, true);
        } catch (error) {
          callback(error, false);
        }
      },
    };
  }
}