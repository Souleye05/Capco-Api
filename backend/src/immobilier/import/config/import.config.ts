import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImportConfig {
  constructor(private readonly configService: ConfigService) {}

  get timeoutMs(): number {
    return this.configService.get<number>('IMPORT_TIMEOUT_MS', 30 * 60 * 1000); // 30 minutes par défaut
  }

  get batchSize(): number {
    return this.configService.get<number>('IMPORT_BATCH_SIZE', 100);
  }

  get progressUpdateInterval(): number {
    return this.configService.get<number>('IMPORT_PROGRESS_UPDATE_INTERVAL', 100);
  }

  get maxFileSize(): number {
    return this.configService.get<number>('IMPORT_MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
  }

  get cacheSize(): number {
    return this.configService.get<number>('IMPORT_CACHE_SIZE', 1000);
  }

  get enableParallelProcessing(): boolean {
    return this.configService.get<boolean>('IMPORT_ENABLE_PARALLEL', false);
  }
}