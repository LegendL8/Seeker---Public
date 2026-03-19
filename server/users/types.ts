import z from "zod";

export const postingCheckFrequencySchema = z.union([
  z.literal("hourly"),
  z.literal("daily"),
  z.literal("weekly"),
]);

export const updateCurrentUserBodySchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "displayName must be at least 1 character")
      .max(255, "displayName must be at most 255 characters")
      .nullable(),
  })
  .strict();

export const updatePreferencesBodySchema = z
  .object({
    postingCheckFrequency: postingCheckFrequencySchema,
  })
  .strict();

export interface CurrentUserResponse {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: string;
}

export interface PreferencesResponse {
  postingCheckFrequency: "hourly" | "daily" | "weekly";
}
