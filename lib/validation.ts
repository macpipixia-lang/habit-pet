import { z } from "zod";

export const authSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or fewer.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, or underscore only."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
