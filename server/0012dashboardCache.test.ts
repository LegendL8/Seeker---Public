import {
  getCachedMetrics,
  invalidateDashboardCache,
  setCachedMetrics,
} from './dashboard/cache';
import type { DashboardMetrics } from './dashboard/types';

const mockUserId = '550e8400-e29b-41d4-a716-446655440001';
const mockMetrics: DashboardMetrics = {
  totalApplications: 2,
  applicationsByStatus: {
    saved: 0,
    applied: 1,
    interviewing: 1,
    offer: 0,
    rejected: 0,
  },
  interviewRate: 0.5,
  activeApplications: 2,
  offersReceived: 0,
  rejectionsReceived: 0,
};

const mockGet = jest.fn();
const mockSetEx = jest.fn();
const mockDel = jest.fn();

jest.mock('./redis', () => ({
  getRedisClient: () => ({
    get: mockGet,
    setEx: mockSetEx,
    del: mockDel,
  }),
}));

beforeEach(() => {
  mockGet.mockReset();
  mockSetEx.mockReset();
  mockDel.mockReset();
});

describe('getCachedMetrics', () => {
  it('returns null when key is missing', async () => {
    mockGet.mockResolvedValue(null);

    const result = await getCachedMetrics(mockUserId);

    expect(result).toBeNull();
    expect(mockGet).toHaveBeenCalledWith('dashboard:metrics:550e8400-e29b-41d4-a716-446655440001');
  });

  it('returns parsed metrics when cache hit', async () => {
    mockGet.mockResolvedValue(JSON.stringify(mockMetrics));

    const result = await getCachedMetrics(mockUserId);

    expect(result).toEqual(mockMetrics);
  });

  it('returns null when stored value is invalid JSON', async () => {
    mockGet.mockResolvedValue('not valid json {');

    const result = await getCachedMetrics(mockUserId);

    expect(result).toBeNull();
  });

  it('returns null when stored value is empty string', async () => {
    mockGet.mockResolvedValue('');

    const result = await getCachedMetrics(mockUserId);

    expect(result).toBeNull();
  });
});

describe('setCachedMetrics', () => {
  it('calls setEx with key, TTL 60, and stringified metrics', async () => {
    mockSetEx.mockResolvedValue(undefined);

    await setCachedMetrics(mockUserId, mockMetrics);

    expect(mockSetEx).toHaveBeenCalledTimes(1);
    expect(mockSetEx).toHaveBeenCalledWith(
      'dashboard:metrics:550e8400-e29b-41d4-a716-446655440001',
      60,
      JSON.stringify(mockMetrics)
    );
  });
});

describe('invalidateDashboardCache', () => {
  it('calls del with cache key for user', async () => {
    mockDel.mockResolvedValue(1);

    await invalidateDashboardCache(mockUserId);

    expect(mockDel).toHaveBeenCalledWith(
      'dashboard:metrics:550e8400-e29b-41d4-a716-446655440001'
    );
  });
});
