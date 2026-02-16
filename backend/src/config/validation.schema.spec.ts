import { validationSchema } from './validation.schema';

describe('validation.schema', () => {
  it('should validate a minimal set of required env vars', () => {
    const env = {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/migration_db',
      JWT_SECRET: 'a'.repeat(32),
    } as any;

    const { error, value } = validationSchema.validate(env, { abortEarly: false, allowUnknown: true });
    expect(error).toBeUndefined();
    expect(value.DATABASE_URL).toBe(env.DATABASE_URL);
    expect(value.JWT_SECRET).toBe(env.JWT_SECRET);
    // defaults applied
    expect(value.DB_MAX_CONNECTIONS).toBeDefined();
    expect(value.DB_CONNECT_RETRIES).toBeDefined();
  });

  it('should fail when required secrets are missing or too short', () => {
    const env = {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/migration_db',
      JWT_SECRET: 'short',
    } as any;

    const { error } = validationSchema.validate(env, { abortEarly: false, allowUnknown: true });
    expect(error).toBeDefined();
    const messages = (error?.details || []).map(d => d.message).join('\n');
    expect(messages).toMatch(/JWT_SECRET/);
  });
});
