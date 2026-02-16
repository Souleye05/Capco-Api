import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { userRoles: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Retourner les informations utilisateur pour la requête
    return {
      userId: user.id,
      email: user.email,
      roles: user.userRoles.map(role => role.role),
      migrationSource: user.migrationSource,
      emailVerified: user.emailVerified,
    };
  }
}