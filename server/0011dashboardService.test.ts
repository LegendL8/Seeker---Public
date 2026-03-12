import * as cache from './dashboard/cache';
import { getMetrics } from './dashboard/service';

const mockUserId = '550e8400-e29b-41d4-a716-446655440001';

const mockMetrics = {
  totalApplications: 6,
  applicationsByStatus: {
    saved: 1,
    applied: 2,
    interviewing: 1,
    offer: 1,
    rejected: 1,
  },
  interviewRate: 2 / 6,
  activeApplications: 3,
  offersReceived: 1,
  rejectionsReceived: 1,
};

describe('getMetrics', () => {
  beforeEach(() => {
    jest.spyOn(cache, 'getCachedMetrics').mockResolvedValue(null);
    jest.spyOn(cache, 'setCachedMetrics').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns cached metrics when cache hit', async () => {
    (cache.getCachedMetrics as jest.Mock).mockResolvedValueOnce(mockMetrics);

    const result = await getMetrics(mockUserId);

    expect(cache.getCachedMetrics).toHaveBeenCalledWith(mockUserId);
    expect(cache.setCachedMetrics).not.toHaveBeenCalled();
    expect(result).toEqual(mockMetrics);
  });

  it('queries db and caches when cache miss', async () => {
    const db = jest.requireActual('./db').db;
    let selectCallCount = 0;
    const selectSpy = jest.spyOn(db, 'select').mockImplementation((arg?: unknown) => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockResolvedValue([
                { status: 'saved', count: 1 },
                { status: 'applied', count: 2 },
                { status: 'interviewing', count: 1 },
                { status: 'offer', count: 1 },
                { status: 'rejected', count: 1 },
              ]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>;
      }
      return {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(
            selectCallCount === 2 ? [{ count: 6 }] : [{ count: 4 }]
          ),
        }),
      } as unknown as ReturnType<typeof db.select>;
    });

    const result = await getMetrics(mockUserId);

    expect(cache.getCachedMetrics).toHaveBeenCalledWith(mockUserId);
    expect(cache.setCachedMetrics).toHaveBeenCalledWith(mockUserId, expect.any(Object));
    expect(result.totalApplications).toBe(6);
    expect(result.applicationsByStatus.saved).toBe(1);
    expect(result.applicationsByStatus.applied).toBe(2);
    expect(result.applicationsByStatus.interviewing).toBe(1);
    expect(result.applicationsByStatus.offer).toBe(1);
    expect(result.applicationsByStatus.rejected).toBe(1);
    expect(result.interviewRate).toBeCloseTo(4 / 6);
    expect(result.activeApplications).toBe(3);
    expect(result.offersReceived).toBe(1);
    expect(result.rejectionsReceived).toBe(1);
    selectSpy.mockRestore();
  });

  it('returns all zeros and interview rate 0 when user has no data', async () => {
    const db = jest.requireActual('./db').db;
    let selectCallCount = 0;
    const selectSpy = jest.spyOn(db, 'select').mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockResolvedValue([]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>;
      }
      return {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      } as unknown as ReturnType<typeof db.select>;
    });

    const result = await getMetrics(mockUserId);

    expect(result.totalApplications).toBe(0);
    expect(result.applicationsByStatus).toEqual({
      saved: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    });
    expect(result.interviewRate).toBe(0);
    expect(result.activeApplications).toBe(0);
    expect(result.offersReceived).toBe(0);
    expect(result.rejectionsReceived).toBe(0);
    selectSpy.mockRestore();
  });

  it('ignores unknown status in groupBy rows', async () => {
    const db = jest.requireActual('./db').db;
    let selectCallCount = 0;
    const selectSpy = jest.spyOn(db, 'select').mockImplementation((arg?: unknown) => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockResolvedValue([
                { status: 'applied', count: 2 },
                { status: 'unknown_status', count: 99 },
              ]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>;
      }
      return {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(
            selectCallCount === 2 ? [{ count: 2 }] : [{ count: 0 }]
          ),
        }),
      } as unknown as ReturnType<typeof db.select>;
    });

    const result = await getMetrics(mockUserId);

    expect(result.applicationsByStatus.applied).toBe(2);
    expect(result.applicationsByStatus.saved).toBe(0);
    expect(result.totalApplications).toBe(2);
    selectSpy.mockRestore();
  });
});
