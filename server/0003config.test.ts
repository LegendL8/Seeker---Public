import { envSchema } from './config';

const minimalEnv = { REDIS_URL: 'redis://localhost:6379' };

describe('envSchema', () => {
  it('throws when REDIS_URL is missing', () => {
    expect(() => envSchema.parse({})).toThrow();
  });

  it('parses minimal env with REDIS_URL and defaults for DATABASE_URL and PORT', () => {
    const result = envSchema.parse(minimalEnv);
    expect(result.REDIS_URL).toBe('redis://localhost:6379');
    expect(result.DATABASE_URL).toBe('postgresql://ets:etsdev@localhost:5433/ets');
    expect(result.PORT).toBe(3001);
    expect(result.AUTH0_ISSUER_BASE_URL).toBeUndefined();
    expect(result.AUTH0_AUDIENCE).toBeUndefined();
  });

  it('coerces PORT to number', () => {
    const result = envSchema.parse({ ...minimalEnv, PORT: '4000' });
    expect(result.PORT).toBe(4000);
  });

  it('accepts valid AUTH0_ISSUER_BASE_URL', () => {
    const url = 'https://tenant.auth0.com';
    const result = envSchema.parse({ ...minimalEnv, AUTH0_ISSUER_BASE_URL: url });
    expect(result.AUTH0_ISSUER_BASE_URL).toBe(url);
  });

  it('throws for invalid AUTH0_ISSUER_BASE_URL', () => {
    expect(() => envSchema.parse({ ...minimalEnv, AUTH0_ISSUER_BASE_URL: 'not-a-url' })).toThrow();
  });

  it('accepts AUTH0_AUDIENCE', () => {
    const result = envSchema.parse({ ...minimalEnv, AUTH0_AUDIENCE: 'https://api.example.com' });
    expect(result.AUTH0_AUDIENCE).toBe('https://api.example.com');
  });

  it('throws for empty AUTH0_AUDIENCE', () => {
    expect(() => envSchema.parse({ ...minimalEnv, AUTH0_AUDIENCE: '' })).toThrow();
  });
});
