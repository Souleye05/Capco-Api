import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Maps Prisma error codes to NestJS HTTP exceptions with a human-readable message.
 * Use this in service-level catch blocks instead of duplicating try/catch logic.
 *
 * @param error    The caught error (should be a PrismaClientKnownRequestError)
 * @param entity   Human-readable entity name for error messages (e.g. "Propriétaire")
 *
 * @example
 * ```ts
 * try {
 *   return await this.prisma.proprietaires.update({ where: { id }, data, include });
 * } catch (error) {
 *   handlePrismaError(error, 'Propriétaire');
 * }
 * ```
 */
export function handlePrismaError(error: unknown, entity: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2025':
                throw new NotFoundException(`${entity} non trouvé(e)`);
            case 'P2002': {
                const target = (error.meta?.target as string[])?.join(', ') ?? 'champ inconnu';
                throw new ConflictException(`${entity} : une valeur dupliquée existe déjà (${target})`);
            }
            case 'P2003':
                throw new BadRequestException(`${entity} : référence invalide vers un enregistrement lié`);
            case 'P2000':
                throw new BadRequestException(`${entity} : une valeur fournie est trop longue`);
            default:
                break;
        }
    }
    throw error;
}
