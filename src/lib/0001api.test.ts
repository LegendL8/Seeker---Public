import { getApiBaseUrl } from './api';

describe('getApiBaseUrl', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  it('returns NEXT_PUBLIC_API_URL when set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('returns /api/proxy when NEXT_PUBLIC_API_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiBaseUrl()).toBe('/api/proxy');
  });

  it('returns empty string when NEXT_PUBLIC_API_URL is set to empty', () => {
    process.env.NEXT_PUBLIC_API_URL = '';
    expect(getApiBaseUrl()).toBe('');
  });
});
