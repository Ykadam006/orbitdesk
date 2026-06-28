import { z } from "zod/v4";
import { sanitizeText } from "./sanitize";

const sanitizedString = (schema: z.ZodString) => schema.transform(sanitizeText);

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  name: sanitizedString(z.string().min(2, "Name must be at least 2 characters")),
  email: z.email("Invalid email address"),
  password: passwordField,
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const workspaceSchema = z.object({
  name: sanitizedString(z.string().min(2, "Workspace name must be at least 2 characters").max(50)),
});

export const boardSchema = z.object({
  title: sanitizedString(z.string().min(1, "Board title is required").max(100)),
});

export const cardSchema = z.object({
  title: sanitizedString(z.string().min(1, "Card title is required").max(200)),
  description: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => (v ? sanitizeText(v) : v)),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const commentSchema = z.object({
  content: sanitizedString(z.string().min(1, "Content is required").max(2000)),
});

export const labelSchema = z.object({
  name: sanitizedString(z.string().min(1, "Name is required").max(50)),
  color: z.string().min(1, "Color is required").max(20),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordField,
});

export const templateCardSchema = z.object({
  title: sanitizedString(z.string().min(1, "Card title is required").max(200)),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

export const moveCardSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  position: z.number().int().min(0, "Position must be a non-negative integer").optional(),
});

export const labelIdsSchema = z.array(z.string().min(1));

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type BoardInput = z.infer<typeof boardSchema>;
export type CardInput = z.infer<typeof cardSchema>;
