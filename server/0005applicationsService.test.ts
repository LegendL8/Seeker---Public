jest.mock("./dashboard/cache", () => ({
  invalidateDashboardCache: jest.fn().mockResolvedValue(undefined),
}));

import { NotFoundError } from "./errors";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
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
  it("returns updated row when body has changes", async () => {
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
    const updateSpy = jest.spyOn(db, "update").mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([updatedRow]),
        }),
      }),
    } as unknown as ReturnType<typeof db.update>);
    const result = await updateApplication(mockUserId, mockAppId, {
      jobTitle: "Senior Engineer",
      status: "interviewing",
    });
    expect(result.jobTitle).toBe("Senior Engineer");
    expect(result.status).toBe("interviewing");
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
    const deleteSpy = jest.spyOn(db, "delete").mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: mockAppId }]),
      }),
    } as unknown as ReturnType<typeof db.delete>);
    await expect(
      deleteApplication(mockUserId, mockAppId),
    ).resolves.toBeUndefined();
    deleteSpy.mockRestore();
  });

  it("throws NotFoundError when application does not exist", async () => {
    const db = jest.requireActual("./db").db;
    const deleteSpy = jest.spyOn(db, "delete").mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof db.delete>);
    await expect(deleteApplication(mockUserId, mockAppId)).rejects.toThrow(
      NotFoundError,
    );
    await expect(deleteApplication(mockUserId, mockAppId)).rejects.toThrow(
      "Application not found",
    );
    deleteSpy.mockRestore();
  });
});
