jest.mock("./dashboard/cache", () => ({
  invalidateDashboardCache: jest.fn().mockResolvedValue(undefined),
}));

import { NotFoundError, ValidationError } from "./errors";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
  listApplicationsByCursor,
  updateApplication,
} from "./applications/service";

const mockUserId = "550e8400-e29b-41d4-a716-446655440001";
const mockAppId = "550e8400-e29b-41d4-a716-446655440002";

const mockRow = {
  id: mockAppId,
  userId: mockUserId,
  companyId: null,
  jobTitle: "Engineer",
  jobPostingUrl: null,
  postingStatus: "unknown",
  postingStatusCheckedAt: null,
  location: null,
  salaryMin: null,
  salaryMax: null,
  salaryPeriod: "yearly",
  status: "saved",
  appliedAt: null,
  source: null,
  resumeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getApplicationById", () => {
  it("throws NotFoundError when no row returned", async () => {
    const db = jest.requireActual("./db").db;
    const selectSpy = jest.spyOn(db, "select").mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    await expect(getApplicationById(mockUserId, mockAppId)).rejects.toThrow(
      NotFoundError,
    );
    await expect(getApplicationById(mockUserId, mockAppId)).rejects.toThrow(
      "Application not found",
    );
    selectSpy.mockRestore();
  });
});

describe("listApplications", () => {
  it("returns items and total", async () => {
    const db = jest.requireActual("./db").db;
    const selectSpy = jest.spyOn(db, "select").mockImplementation(((
      arg?: unknown,
    ) => {
      if (arg && typeof arg === "object" && "count" in (arg as object)) {
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 1 }]),
          }),
        } as unknown as ReturnType<typeof db.select>;
      }
      return {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockRow]),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>;
    }) as typeof db.select);
    const result = await listApplications(mockUserId, 1, 20);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].jobTitle).toBe("Engineer");
    expect(result.total).toBe(1);
    selectSpy.mockRestore();
  });

  it("returns empty items and total 0 when user has no applications", async () => {
    const db = jest.requireActual("./db").db;
    const selectSpy = jest.spyOn(db, "select").mockImplementation(((
      arg?: unknown,
    ) => {
      if (arg && typeof arg === "object" && "count" in (arg as object)) {
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 0 }]),
          }),
        } as unknown as ReturnType<typeof db.select>;
      }
      return {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>;
    }) as typeof db.select);
    const result = await listApplications(mockUserId, 1, 20);
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    selectSpy.mockRestore();
  });
});

describe("listApplicationsByCursor", () => {
  it("returns items and nextCursor null when limit or fewer rows", async () => {
    const validCursor =
      "v1:" +
      Buffer.from(
        JSON.stringify({
          updatedAt: new Date().toISOString(),
          id: "550e8400-e29b-41d4-a716-446655440099",
        }),
        "utf-8",
      ).toString("base64url");
    const db = jest.requireActual("./db").db;
    const selectSpy = jest.spyOn(db, "select").mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockRow]),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    const result = await listApplicationsByCursor(mockUserId, validCursor, 20);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].jobTitle).toBe("Engineer");
    expect(result.nextCursor).toBeNull();
    selectSpy.mockRestore();
  });

  it("returns items and nextCursor when more than limit rows", async () => {
    const validCursor =
      "v1:" +
      Buffer.from(
        JSON.stringify({
          updatedAt: new Date().toISOString(),
          id: "550e8400-e29b-41d4-a716-446655440099",
        }),
        "utf-8",
      ).toString("base64url");
    const row2 = {
      ...mockRow,
      id: "550e8400-e29b-41d4-a716-446655440003",
      updatedAt: new Date(Date.now() - 1000),
    };
    const row3 = {
      ...mockRow,
      id: "550e8400-e29b-41d4-a716-446655440004",
      updatedAt: new Date(Date.now() - 2000),
    };
    const db = jest.requireActual("./db").db;
    const selectSpy = jest.spyOn(db, "select").mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockRow, row2, row3]),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    const result = await listApplicationsByCursor(mockUserId, validCursor, 2);
    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
    expect(typeof result.nextCursor).toBe("string");
    expect(result.nextCursor).toMatch(/^v1:/);
    selectSpy.mockRestore();
  });

  it("throws ValidationError when cursor is invalid", async () => {
    await expect(
      listApplicationsByCursor(mockUserId, "invalid", 20),
    ).rejects.toThrow(ValidationError);
    await expect(
      listApplicationsByCursor(mockUserId, "invalid", 20),
    ).rejects.toThrow("Invalid cursor");
  });
});

describe("createApplication", () => {
  it("returns created row", async () => {
    const db = jest.requireActual("./db").db;
    const insertSpy = jest.spyOn(db, "insert").mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockRow]),
      }),
    } as unknown as ReturnType<typeof db.insert>);
    const result = await createApplication(mockUserId, {
      jobTitle: "Engineer",
    });
    expect(result.id).toBe(mockAppId);
    expect(result.jobTitle).toBe("Engineer");
    insertSpy.mockRestore();
  });
});

describe("updateApplication", () => {
  it("returns updated row when status changes (transaction + audit)", async () => {
    const updatedRow = {
      ...mockRow,
      jobTitle: "Senior Engineer",
      status: "interviewing",
    };
    const db = jest.requireActual("./db").db;
    const getByIdSpy = jest.spyOn(db, "select").mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockRow]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    const returningFn = jest.fn().mockResolvedValue([updatedRow]);
    const updateFn = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: returningFn,
        }),
      }),
    });
    const insertFn = jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    });
    const transactionSpy = jest
      .spyOn(db, "transaction")
      .mockImplementation(async (...args: unknown[]) => {
        const fn = args[0] as (tx: never) => Promise<void>;
        await fn({ update: updateFn, insert: insertFn } as never);
      });
    const result = await updateApplication(mockUserId, mockAppId, {
      jobTitle: "Senior Engineer",
      status: "interviewing",
    });
    expect(result.jobTitle).toBe("Senior Engineer");
    expect(result.status).toBe("interviewing");
    getByIdSpy.mockRestore();
    transactionSpy.mockRestore();
  });

  it("returns updated row when body has changes without status change", async () => {
    const updatedRow = {
      ...mockRow,
      jobTitle: "Senior Engineer",
    };
    const db = jest.requireActual("./db").db;
    const getByIdSpy = jest.spyOn(db, "select").mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockRow]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    const updateSpy = jest.spyOn(db, "update").mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([updatedRow]),
        }),
      }),
    } as unknown as ReturnType<typeof db.update>);
    const result = await updateApplication(mockUserId, mockAppId, {
      jobTitle: "Senior Engineer",
    });
    expect(result.jobTitle).toBe("Senior Engineer");
    expect(result.status).toBe("saved");
    getByIdSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("throws NotFoundError when application does not exist", async () => {
    const db = jest.requireActual("./db").db;
    const selectSpy = jest.spyOn(db, "select").mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    await expect(
      updateApplication(mockUserId, mockAppId, { jobTitle: "Updated" }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      updateApplication(mockUserId, mockAppId, { jobTitle: "Updated" }),
    ).rejects.toThrow("Application not found");
    selectSpy.mockRestore();
  });
});

describe("deleteApplication", () => {
  it("succeeds when row exists", async () => {
    const db = jest.requireActual("./db").db;
    const deleteFn = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([
          {
            id: mockAppId,
            jobTitle: mockRow.jobTitle,
            status: mockRow.status,
          },
        ]),
      }),
    });
    const insertFn = jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    });
    const transactionSpy = jest
      .spyOn(db, "transaction")
      .mockImplementation(async (...args: unknown[]) => {
        const fn = args[0] as (tx: never) => Promise<void>;
        await fn({ delete: deleteFn, insert: insertFn } as never);
      });
    await expect(
      deleteApplication(mockUserId, mockAppId),
    ).resolves.toBeUndefined();
    transactionSpy.mockRestore();
  });

  it("throws NotFoundError when application does not exist", async () => {
    const db = jest.requireActual("./db").db;
    const deleteFn = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    });
    const insertFn = jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    });
    const transactionSpy = jest
      .spyOn(db, "transaction")
      .mockImplementation(async (...args: unknown[]) => {
        const fn = args[0] as (tx: never) => Promise<void>;
        await fn({ delete: deleteFn, insert: insertFn } as never);
      });
    await expect(deleteApplication(mockUserId, mockAppId)).rejects.toThrow(
      NotFoundError,
    );
    await expect(deleteApplication(mockUserId, mockAppId)).rejects.toThrow(
      "Application not found",
    );
    transactionSpy.mockRestore();
  });
});
