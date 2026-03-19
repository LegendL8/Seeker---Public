import { NotFoundError } from "./errors";
import {
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from "./notes/service";

const mockUserId = "550e8400-e29b-41d4-a716-446655440001";
const mockNoteId = "550e8400-e29b-41d4-a716-446655440004";

const mockRow = {
  id: mockNoteId,
  userId: mockUserId,
  content: "Test note",
  typeTag: "general",
  applicationId: null,
  interviewId: null,
  companyId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("listNotes", () => {
  it("returns items, total, page, limit", async () => {
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
    const result = await listNotes(mockUserId, { page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].content).toBe("Test note");
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    selectSpy.mockRestore();
  });

  it("returns empty items and total 0 when user has no notes", async () => {
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
    const result = await listNotes(mockUserId, { page: 1, limit: 20 });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    selectSpy.mockRestore();
  });
});

describe("updateNote", () => {
  it("returns existing row when no changes (no-op PATCH)", async () => {
    const db = jest.requireActual("./db").db;
    const selectSpy = jest.spyOn(db, "select").mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockRow]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    const updateSpy = jest.spyOn(db, "update");

    const result = await updateNote(mockUserId, mockNoteId, {});

    expect(result).toEqual(mockRow);
    expect(updateSpy).not.toHaveBeenCalled();
    selectSpy.mockRestore();
    updateSpy.mockRestore();
  });
});

describe("getNoteById", () => {
  it("throws NotFoundError when no row returned", async () => {
    const db = jest.requireActual("./db").db;
    const selectSpy = jest.spyOn(db, "select").mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
    await expect(getNoteById(mockUserId, mockNoteId)).rejects.toThrow(
      NotFoundError,
    );
    await expect(getNoteById(mockUserId, mockNoteId)).rejects.toThrow(
      "Note not found",
    );
    selectSpy.mockRestore();
  });
});

describe("deleteNote", () => {
  it("succeeds when row exists", async () => {
    const db = jest.requireActual("./db").db;
    const deleteFn = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([
          {
            id: mockNoteId,
            typeTag: mockRow.typeTag,
            applicationId: mockRow.applicationId,
            interviewId: mockRow.interviewId,
            companyId: mockRow.companyId,
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
    await expect(deleteNote(mockUserId, mockNoteId)).resolves.toBeUndefined();
    transactionSpy.mockRestore();
  });

  it("throws NotFoundError when note does not exist", async () => {
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
    await expect(deleteNote(mockUserId, mockNoteId)).rejects.toThrow(
      NotFoundError,
    );
    transactionSpy.mockRestore();
  });
});
