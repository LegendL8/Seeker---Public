import { NotFoundError } from "./errors";
import { setActiveResume } from "./resumes/service";

const mockUserId = "550e8400-e29b-41d4-a716-446655440001";
const mockResumeId = "550e8400-e29b-41d4-a716-446655440010";

const mockRow = {
  id: mockResumeId,
  userId: mockUserId,
  fileName: "resume.pdf",
  fileType: "pdf",
  s3Key: "resumes/uid/key.pdf",
  fileSizeBytes: 1024,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("setActiveResume", () => {
  it("returns updated row when setting active (conditional update)", async () => {
    const db = jest.requireActual("./db").db;
    const updateSpy = jest.spyOn(db, "update").mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockRow]),
        }),
      }),
    } as unknown as ReturnType<typeof db.update>);

    const result = await setActiveResume(mockUserId, mockResumeId, true);

    expect(result.id).toBe(mockResumeId);
    expect(result.isActive).toBe(true);
    updateSpy.mockRestore();
  });

  it("throws NotFoundError when setting active and resume not in user set", async () => {
    const db = jest.requireActual("./db").db;
    const otherRow = {
      ...mockRow,
      id: "550e8400-e29b-41d4-a716-446655440011",
      isActive: false,
    };
    const updateSpy = jest.spyOn(db, "update").mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([otherRow]),
        }),
      }),
    } as unknown as ReturnType<typeof db.update>);

    await expect(
      setActiveResume(mockUserId, mockResumeId, true),
    ).rejects.toThrow(NotFoundError);
    await expect(
      setActiveResume(mockUserId, mockResumeId, true),
    ).rejects.toThrow("Resume not found");

    updateSpy.mockRestore();
  });

  it("returns updated row when setting inactive", async () => {
    const db = jest.requireActual("./db").db;
    const inactiveRow = { ...mockRow, isActive: false };
    const updateSpy = jest.spyOn(db, "update").mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([inactiveRow]),
        }),
      }),
    } as unknown as ReturnType<typeof db.update>);

    const result = await setActiveResume(mockUserId, mockResumeId, false);

    expect(result.id).toBe(mockResumeId);
    expect(result.isActive).toBe(false);
    updateSpy.mockRestore();
  });

  it("throws NotFoundError when setting inactive and resume does not exist", async () => {
    const db = jest.requireActual("./db").db;
    const updateSpy = jest.spyOn(db, "update").mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.update>);

    await expect(
      setActiveResume(mockUserId, mockResumeId, false),
    ).rejects.toThrow(NotFoundError);
    await expect(
      setActiveResume(mockUserId, mockResumeId, false),
    ).rejects.toThrow("Resume not found");

    updateSpy.mockRestore();
  });
});
