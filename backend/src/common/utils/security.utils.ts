import { SecurityContext } from '../services/base-crud.service';

export class SecurityUtils {
  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  static hasRole(context: SecurityContext, role: string): boolean {
    return context.roles.includes(role);
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  static isAdmin(context: SecurityContext): boolean {
    return this.hasRole(context, 'admin');
  }

  /**
   * Vérifie si l'utilisateur peut accéder aux données d'un cabinet
   */
  static canAccessCabinet(context: SecurityContext, cabinetId: string): boolean {
    return this.isAdmin(context) || context.cabinetId === cabinetId;
  }

  /**
   * Vérifie si l'utilisateur peut modifier une entité
   */
  static canModifyEntity(
    context: SecurityContext,
    entity: { createdBy?: string; cabinetId?: string },
  ): boolean {
    // Admin peut tout modifier
    if (this.isAdmin(context)) return true;
    
    // Propriétaire peut modifier
    if (entity.createdBy === context.userId) return true;
    
    // Même cabinet peut modifier (selon les règles métier)
    if (entity.cabinetId && this.canAccessCabinet(context, entity.cabinetId)) {
      return true;
    }
    
    return false;
  }

  /**
   * Construit les conditions de sécurité par défaut
   */
  static buildDefaultSecurityConditions(context: SecurityContext): any {
    if (this.isAdmin(context)) {
      return {}; // Admin voit tout
    }

    const conditions: any = {};
    
    // Filtrer par cabinet si applicable
    if (context.cabinetId) {
      conditions.cabinetId = context.cabinetId;
    }

    return conditions;
  }

  /**
   * Construit les conditions pour les entités créées par l'utilisateur
   */
  static buildOwnerSecurityConditions(context: SecurityContext): any {
    if (this.isAdmin(context)) {
      return {}; // Admin voit tout
    }

    return {
      OR: [
        { createdBy: context.userId },
        ...(context.cabinetId ? [{ cabinetId: context.cabinetId }] : []),
      ],
    };
  }
}