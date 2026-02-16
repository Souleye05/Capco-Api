import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  // Do not provide a default secret in source; enforce via validation
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? process.env.JWT_SECRET + '_refresh' : undefined),
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: process.env.JWT_ISSUER || 'capco-api',
  audience: process.env.JWT_AUDIENCE || 'capco-users',
}));