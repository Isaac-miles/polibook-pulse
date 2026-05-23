/**
 * Form validators for strict input validation
 * Prevents XSS, injection attacks, and invalid data
 */

import { z, type ZodSchema } from "zod";

// Allowed characters for archive search (username, display name, party, keywords)
const SEARCH_ALLOWED_CHARS = /^[a-zA-Z0-9\s\-_'.àáâãäåèéêëìíîïòóôõöùúûüñç&,()+]+$/;

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters long.")
  .max(50, "Username must be at most 50 characters long.")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens.",
  );

export const displayNameSchema = z
  .string()
  .min(2, "Display name must be at least 2 characters long.")
  .max(100, "Display name must be at most 100 characters long.")
  // Allow letters, numbers, punctuation, marks, symbols (emoji), spaces,
  // and common emoji sequence characters (ZWJ U+200D and VS16 U+FE0F).
  .regex(/^[\p{L}\p{N}\p{P}\p{M}\p{S}\s\u200D\uFE0F]+$/u, "Display name contains invalid characters.");

export const urlSchema = z.string().url("Invalid URL format.");

export const partySchema = z
  .string()
  .regex(/^[a-zA-Z0-9\s\-&.()]+$/, "Party affiliation contains invalid characters.");

export const statementTextSchema = z
  .string()
  .max(10000, "Statement text must be at most 10,000 characters long.");

export const notesSchema = z.string().optional();

export const searchQuerySchema = z
  .string()
  .min(1, "Search query cannot be empty.")
  .max(100, "Search query must be at most 100 characters long.")
  .regex(
    SEARCH_ALLOWED_CHARS,
    "Search can only contain letters, numbers, spaces, and basic punctuation (- _ ' . & , ( )).",
  );

export type ValidationResult = { valid: true } | { valid: false; error: string };

export function validateSchema(schema: ZodSchema, value: unknown): ValidationResult {
  try {
    schema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues[0]?.message ?? "Invalid input.",
      };
    }
    return { valid: false, error: "Invalid input." };
  }
}

export function validateSearchQuery(value: string): ValidationResult {
  return validateSchema(searchQuerySchema, value.trim());
}

export function isValidSearchQuery(value: string): boolean {
  return validateSearchQuery(value).valid;
}

export function isValidUsername(value: string): boolean {
  return validateSchema(usernameSchema, value.trim()).valid;
}
