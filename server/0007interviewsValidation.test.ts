import {
  createInterviewBodySchema,
  interviewOutcomeSchema,
  interviewTypeSchema,
  updateInterviewBodySchema,
} from './interviews/types';

describe('interviewTypeSchema', () => {
  it('accepts all valid types', () => {
    const types = ['phone', 'technical', 'behavioral', 'onsite', 'final'];
    types.forEach((t) => {
      expect(interviewTypeSchema.parse(t)).toBe(t);
    });
  });

  it('rejects invalid type', () => {
    expect(() => interviewTypeSchema.parse('invalid')).toThrow();
    expect(() => interviewTypeSchema.parse('')).toThrow();
  });
});

describe('interviewOutcomeSchema', () => {
  it('accepts all valid outcomes', () => {
    const outcomes = ['pending', 'completed', 'cancelled', 'no_show'];
    outcomes.forEach((o) => {
      expect(interviewOutcomeSchema.parse(o)).toBe(o);
    });
  });

  it('rejects invalid outcome', () => {
    expect(() => interviewOutcomeSchema.parse('invalid')).toThrow();
  });
});

describe('createInterviewBodySchema', () => {
  it('accepts minimal valid body (interviewType only)', () => {
    const result = createInterviewBodySchema.parse({ interviewType: 'phone' });
    expect(result.interviewType).toBe('phone');
    expect(result.outcome).toBeUndefined();
  });

  it('accepts full valid body', () => {
    const body = {
      interviewType: 'technical' as const,
      scheduledAt: '2025-02-15T14:00:00Z',
      interviewerName: 'Jane Smith',
      interviewerTitle: 'Engineering Manager',
      outcome: 'completed' as const,
    };
    const result = createInterviewBodySchema.parse(body);
    expect(result.interviewType).toBe('technical');
    expect(result.scheduledAt).toBe(body.scheduledAt);
    expect(result.interviewerName).toBe(body.interviewerName);
    expect(result.outcome).toBe('completed');
  });

  it('rejects missing interviewType', () => {
    expect(() => createInterviewBodySchema.parse({})).toThrow();
  });

  it('rejects invalid scheduledAt', () => {
    expect(() =>
      createInterviewBodySchema.parse({
        interviewType: 'phone',
        scheduledAt: 'not-a-datetime',
      })
    ).toThrow();
  });
});

describe('updateInterviewBodySchema', () => {
  it('accepts partial body', () => {
    const result = updateInterviewBodySchema.parse({
      outcome: 'cancelled',
    });
    expect(result.outcome).toBe('cancelled');
    expect(result.interviewType).toBeUndefined();
  });

  it('accepts nullable scheduledAt', () => {
    const result = updateInterviewBodySchema.parse({
      scheduledAt: null,
    });
    expect(result.scheduledAt).toBeNull();
  });

  it('rejects invalid outcome', () => {
    expect(() =>
      updateInterviewBodySchema.parse({ outcome: 'invalid_outcome' })
    ).toThrow();
  });
});
