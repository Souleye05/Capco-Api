import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/services/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResponse,
  UserProfile,
  PasswordResetRequestDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valide les credentials d'un utilisateur (incluant les utilisateurs migrés)
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { userRoles: true },
    });

    if (!user) {
      return null;
    }

    // Vérifier si l'utilisateur a un token de reset actif (mot de passe temporaire)
    if (user.resetToken && user.resetExpiry && user.resetExpiry > new Date()) {
      this.logger.warn(`User ${email} attempting login with temporary password`);
      // Pour les utilisateurs migrés avec mot de passe temporaire, 
      // on peut permettre la connexion mais forcer le changement de mot de passe
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Mettre à jour la dernière connexion
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSignIn: new Date() },
    });

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Connexion d'un utilisateur avec support des utilisateurs migrés
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier si l'utilisateur nécessite un reset de mot de passe
    const requiresPasswordReset = !!(user.resetToken && user.resetExpiry && user.resetExpiry > new Date());

    const payload = { 
      email: user.email, 
      sub: user.id,
      roles: user.userRoles.map(role => role.role),
      migrationSource: user.migrationSource,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        roles: user.userRoles.map(role => role.role),
        migrationSource: user.migrationSource,
        requiresPasswordReset,
        lastSignIn: user.lastSignIn,
      },
      requiresPasswordReset,
    };
  }

  /**
   * Inscription d'un nouvel utilisateur (pour les nouveaux utilisateurs non migrés)
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        emailVerified: false,
        migrationSource: null, // Nouvel utilisateur, pas migré
      },
      include: { userRoles: true },
    });

    // Assigner un rôle par défaut si spécifié
    if (registerDto.role) {
      await this.prisma.userRoles.create({
        data: {
          userId: user.id,
          role: registerDto.role,
        },
      });
    }

    const payload = { 
      email: user.email, 
      sub: user.id,
      roles: user.userRoles.map(role => role.role),
      migrationSource: user.migrationSource,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        roles: user.userRoles.map(role => role.role),
        migrationSource: user.migrationSource,
        requiresPasswordReset: false,
        lastSignIn: user.lastSignIn,
      },
      requiresPasswordReset: false,
    };
  }

  /**
   * Demande de reset de mot de passe (spécialement pour les utilisateurs migrés)
   */
  async requestPasswordReset(dto: PasswordResetRequestDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Ne pas révéler si l'utilisateur existe ou non
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Générer un token de reset sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = await bcrypt.hash(resetToken, 10);
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Sauvegarder le token de reset
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedResetToken,
        resetExpiry,
      },
    });

    // Ici, on enverrait un email avec le token de reset
    // Pour l'instant, on log le token (à des fins de développement uniquement)
    this.logger.log(`Password reset token for ${dto.email}: ${resetToken}`);
    
    // TODO: Intégrer avec un service d'email pour envoyer le lien de reset
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset du mot de passe avec token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user || !user.resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Vérifier le token de reset
    const isTokenValid = await bcrypt.compare(dto.token, user.resetToken);
    if (!isTokenValid) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    // Mettre à jour le mot de passe et supprimer le token de reset
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiry: null,
        emailVerified: true, // Considérer que le reset confirme l'email
      },
    });

    this.logger.log(`Password reset successful for user ${user.email}`);

    return { message: 'Password reset successful' };
  }

  /**
   * Changement de mot de passe pour utilisateur connecté
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Vérifier l'ancien mot de passe
    const isOldPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    // Mettre à jour le mot de passe et supprimer les tokens de reset
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiry: null,
      },
    });

    this.logger.log(`Password changed successfully for user ${user.email}`);

    return { message: 'Password changed successfully' };
  }

  /**
   * Obtenir le profil utilisateur
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      roles: user.userRoles.map(role => role.role),
      migrationSource: user.migrationSource,
      requiresPasswordReset: !!(user.resetToken && user.resetExpiry && user.resetExpiry > new Date()),
      lastSignIn: user.lastSignIn,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Vérifier si un utilisateur est migré depuis Supabase
   */
  async isMigratedUser(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { migrationSource: true },
    });

    return user?.migrationSource === 'supabase';
  }

  /**
   * Obtenir les statistiques des utilisateurs migrés
   */
  async getMigrationStats(): Promise<{
    totalUsers: number;
    migratedUsers: number;
    usersRequiringPasswordReset: number;
    lastMigrationDate?: Date;
  }> {
    const totalUsers = await this.prisma.user.count();
    const migratedUsers = await this.prisma.user.count({
      where: { migrationSource: 'supabase' },
    });
    const usersRequiringPasswordReset = await this.prisma.user.count({
      where: {
        resetToken: { not: null },
        resetExpiry: { gt: new Date() },
      },
    });

    // Obtenir la date de la dernière migration (approximative)
    const lastMigratedUser = await this.prisma.user.findFirst({
      where: { migrationSource: 'supabase' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      totalUsers,
      migratedUsers,
      usersRequiringPasswordReset,
      lastMigrationDate: lastMigratedUser?.createdAt,
    };
  }
}