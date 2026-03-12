jest.mock('./dashboard/cache', () => ({
  invalidateDashboardCache: jest.fn().mockResolvedValue(undefined),
}));

import { NotFoundError } from './errors';
import {
  createInterview,
  deleteInterview,
  getInterviewById,
  listInterviewsByApplicationId,
  updateInterview,
} from './interviews/service';

const mockUserId = '550e8400-e29b-41d4-a716-446655440001';
const mockAppId = '550e8400-e29b-41d4-a716-446655440002';
const mockInterviewId = '550e8400-e29b-41d4-a716-446655440003';

const mockRow = {
  id: mockInterviewId,
  applicationId: mockAppId,
  userId: mockUserId,
  interviewType: 'phone',
  scheduledAt: new Date(),
  interviewerName: 'Jane',
  interviewerTitle: 'Manager',
  outcome: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('listInterviewsByApplicationId', () => {
  it('returns rows for application', async () => {
    const db = jest.requireActual('./db').db;
    const selectSpy = jest.spyOn(db, 'select').mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([mockRow]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    const result = await listInterviewsByApplicationId(mockUserId, mockAppId);
    expect(result).toHaveLength(1);
    expect(result[0].interviewType).toBe('phone');
    selectSpy.mockRestore();
  });

  it('returns empty array when application has no interviews', async () => {
    const db = jest.requireActual('./db').db;
    const selectSpy = jest.spyOn(db, 'select').mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    const result = await listInterviewsByApplicationId(mockUserId, mockAppId);
    expect(result).toHaveLength(0);
    selectSpy.mockRestore();
  });
});

describe('getInterviewById', () => {
  it('throws NotFoundError when no row returned', async () => {
    const db = jest.requireActual('./db').db;
    const selectSpy = jest.spyOn(db, 'select').mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    await expect(getInterviewById(mockUserId, mockInterviewId)).rejects.toThrow(
      NotFoundError
    );
    await expect(getInterviewById(mockUserId, mockInterviewId)).rejects.toThrow(
      'Interview not found'
    );
    selectSpy.mockRestore();
  });
});

describe('createInterview', () => {
  it('returns created row', async () => {
    const db = jest.requireActual('./db').db;
    const insertSpy = jest.spyOn(db, 'insert').mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockRow]),
      }),
    } as unknown as ReturnType<typeof db.insert>);
    const result = await createInterview(mockUserId, mockAppId, {
      interviewType: 'technical',
    });
    expect(result.id).toBe(mockInterviewId);
    expect(result.interviewType).toBe(mockRow.interviewType);
    insertSpy.mockRestore();
  });
});

describe('updateInterview', () => {
  it('throws NotFoundError when interview does not exist', async () => {
    const db = jest.requireActual('./db').db;
    const selectSpy = jest.spyOn(db, 'select').mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    await expect(
      updateInterview(mockUserId, mockInterviewId, { outcome: 'completed' })
    ).rejects.toThrow(NotFoundError);
    selectSpy.mockRestore();
  });
});

describe('deleteInterview', () => {
  it('succeeds when row exists', async () => {
    const db = jest.requireActual('./db').db;
    const deleteSpy = jest.spyOn(db, 'delete').mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: mockInterviewId }]),
      }),
    } as unknown as ReturnType<typeof db.delete>);
    await expect(
      deleteInterview(mockUserId, mockInterviewId)
    ).resolves.toBeUndefined();
    deleteSpy.mockRestore();
  });

  it('throws NotFoundError when interview does not exist', async () => {
    const db = jest.requireActual('./db').db;
    const deleteSpy = jest.spyOn(db, 'delete').mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof db.delete>);
    await expect(
      deleteInterview(mockUserId, mockInterviewId)
    ).rejects.toThrow(NotFoundError);
    deleteSpy.mockRestore();
  });
});
