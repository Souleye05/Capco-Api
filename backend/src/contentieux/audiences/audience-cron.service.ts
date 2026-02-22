import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/services/prisma.service';
import { StatutAudience } from '@prisma/client';

@Injectable()
export class AudienceCronService {
  private readonly logger = new Logger(AudienceCronService.name);
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async updatePassedAudienceStatuses() {
    if (this.isRunning) {
      this.logger.warn('Audience status update job is already running, skipping execution');
      return;
    }

    this.logger.log('Starting daily audience status update job');

    this.isRunning = true;

    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); 

      // Update all passed audiences to PASSEE_NON_RENSEIGNEE in a single operation
      const updateResult = await this.prisma.audiences.updateMany({
        where: {
          date: {
            lt: today,
          },
          statut: StatutAudience.A_VENIR,
        },
        data: {
          statut: StatutAudience.PASSEE_NON_RENSEIGNEE,
          updated_at: new Date(),
        },
      });

      this.logger.log(
        `Successfully updated ${updateResult.count} audiences to PASSEE_NON_RENSEIGNEE`,
      );
    } catch (error) {
      this.logger.error('Failed to update audience statuses', error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual trigger for testing purposes
   * This method can be called manually to trigger the audience status update
   */
  async triggerManualUpdate() {
    this.logger.log('Manual trigger for audience status update');
    return this.updatePassedAudienceStatuses();
  }
}